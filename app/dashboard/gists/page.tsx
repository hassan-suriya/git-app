'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { GitHubGist } from '@/lib/github';
import { formatRelativeTime } from '@/lib/utils';
import { FileText, Plus, Trash2, ExternalLink, Lock, Globe, Code } from 'lucide-react';

export default function GistsPage() {
  const { client } = useAuth();
  const [gists, setGists] = useState<GitHubGist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchGists();
  }, [client]);

  const fetchGists = async () => {
    if (!client) return;
    try {
      const gistsData = await client.getGists();
      setGists(gistsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (gistId: string) => {
    if (!client) return;
    if (!confirm('Are you sure you want to delete this gist?')) return;

    try {
      await client.deleteGist(gistId);
      setGists(gists.filter(g => g.id !== gistId));
      alert('Gist deleted successfully!');
    } catch (err) {
      alert('Failed to delete gist');
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (<div key={i} className="h-32 bg-card rounded-xl"></div>))}
    </div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gists</h1>
          <p className="text-muted-foreground">Manage your code snippets and gists</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg"
        >
          <Plus className="w-5 h-5" />
          New Gist
        </button>
      </div>

      <div className="space-y-4">
        {gists.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">No Gists</h3>
            <p className="text-muted-foreground">Create your first gist to share code snippets</p>
          </div>
        ) : (
          gists.map((gist) => (
            <div key={gist.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <a
                      href={gist.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xl font-bold hover:text-primary transition-colors flex items-center gap-2 group"
                    >
                      {gist.description || 'Untitled Gist'}
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    {gist.public ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-md">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-medium rounded-md">
                        <Lock className="w-3 h-3" />
                        Secret
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(gist.files).map(([name, file]) => (
                      <span key={name} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm">
                        <Code className="w-3 h-3" />
                        {name}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Updated {formatRelativeTime(gist.updated_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(gist.id)}
                  className="ml-4 p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Delete gist"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateGistModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchGists();
          }}
        />
      )}
    </div>
  );
}

function CreateGistModal({ onClose, onSuccess }: any) {
  const { client } = useAuth();
  const [description, setDescription] = useState('');
  const [filename, setFilename] = useState('example.txt');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setIsLoading(true);
    try {
      await client.createGist(description, { [filename]: { content } }, isPublic);
      onSuccess();
    } catch (err) {
      alert('Failed to create gist');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create New Gist</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this gist"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Filename</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="example.txt"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your code or text here..."
              rows={10}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-primary"
            />
            <label htmlFor="public" className="text-sm font-medium">
              Make this gist public
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-background hover:bg-accent rounded-lg transition-colors font-medium">
              Cancel
            </button>
            <button type="submit" disabled={isLoading || !filename || !content} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
              {isLoading ? 'Creating...' : 'Create Gist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
