'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { GitHubRepo, GitHubWebhook } from '@/lib/github';
import { Webhook, Plus, Trash2, Power, PowerOff, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function WebhooksPage() {
  const { client } = useAuth();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [webhooks, setWebhooks] = useState<GitHubWebhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRepositories();
  }, [client]);

  useEffect(() => {
    if (selectedRepo) {
      fetchWebhooks();
    }
  }, [selectedRepo]);

  const fetchRepositories = async () => {
    if (!client) return;
    try {
      const reposData = await client.getRepositories(1, 100);
      setRepos(reposData);
      if (reposData.length > 0) {
        setSelectedRepo(reposData[0].full_name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWebhooks = async () => {
    if (!client || !selectedRepo) return;
    try {
      const [owner, repo] = selectedRepo.split('/');
      const webhooksData = await client.getWebhooks(owner, repo);
      setWebhooks(webhooksData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (hookId: number) => {
    if (!client || !selectedRepo) return;
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const [owner, repo] = selectedRepo.split('/');
      await client.deleteWebhook(owner, repo, hookId);
      setWebhooks(webhooks.filter(w => w.id !== hookId));
      alert('Webhook deleted successfully!');
    } catch (err) {
      alert('Failed to delete webhook');
    }
  };

  const handleToggle = async (webhook: GitHubWebhook) => {
    if (!client || !selectedRepo) return;

    try {
      const [owner, repo] = selectedRepo.split('/');
      await client.updateWebhook(owner, repo, webhook.id, { active: !webhook.active });
      setWebhooks(webhooks.map(w => 
        w.id === webhook.id ? { ...w, active: !w.active } : w
      ));
    } catch (err) {
      alert('Failed to update webhook');
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-card rounded-xl"></div>
      {[...Array(3)].map((_, i) => (<div key={i} className="h-24 bg-card rounded-xl"></div>))}
    </div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Webhooks</h1>
            <p className="text-purple-100">Configure real-time event notifications</p>
          </div>
          <Webhook className="w-12 h-12 opacity-50" />
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {repos.map((repo) => (
              <option key={repo.id} value={repo.full_name} className="text-black">
                {repo.full_name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!selectedRepo}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-white/90 transition-colors font-medium shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Add Webhook
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Webhook className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">No Webhooks</h3>
            <p className="text-muted-foreground">Create your first webhook to receive real-time updates</p>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{webhook.name}</h3>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                      webhook.active 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-gray-500/10 text-gray-500'
                    }`}>
                      {webhook.active ? <CheckCircle2 className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                      {webhook.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{webhook.config.url}</p>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map(event => (
                      <span key={event} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggle(webhook)}
                    className={`p-2 rounded-lg transition-colors ${
                      webhook.active 
                        ? 'text-yellow-500 hover:bg-yellow-500/10' 
                        : 'text-green-500 hover:bg-green-500/10'
                    }`}
                    title={webhook.active ? 'Deactivate' : 'Activate'}
                  >
                    {webhook.active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateWebhookModal
          selectedRepo={selectedRepo}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchWebhooks();
          }}
        />
      )}
    </div>
  );
}

function CreateWebhookModal({ selectedRepo, onClose, onSuccess }: any) {
  const { client } = useAuth();
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['push']);
  const [isLoading, setIsLoading] = useState(false);

  const eventOptions = ['push', 'pull_request', 'issues', 'issue_comment', 'commit_comment', 'create', 'delete', 'fork', 'release'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setIsLoading(true);
    try {
      const [owner, repo] = selectedRepo.split('/');
      await client.createWebhook(owner, repo, url, events);
      onSuccess();
    } catch (err) {
      alert('Failed to create webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEvent = (event: string) => {
    setEvents(prev => 
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl animate-slide-up">
        <h2 className="text-2xl font-bold mb-4">Create Webhook</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Payload URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Events</label>
            <div className="grid grid-cols-2 gap-2">
              {eventOptions.map(event => (
                <label key={event} className="flex items-center gap-2 p-2 bg-background rounded-lg cursor-pointer hover:bg-accent">
                  <input
                    type="checkbox"
                    checked={events.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm">{event}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-background hover:bg-accent rounded-lg transition-colors font-medium">
              Cancel
            </button>
            <button type="submit" disabled={isLoading || !url} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
