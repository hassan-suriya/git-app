'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { GitHubRepo } from '@/lib/github';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import {
  Star,
  GitFork,
  AlertCircle,
  Search,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
  Globe,
  Filter
} from 'lucide-react';

export default function RepositoriesPage() {
  const { client } = useAuth();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRepositories();
  }, [client]);

  useEffect(() => {
    let filtered = repos;

    if (searchQuery) {
      filtered = filtered.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filter !== 'all') {
      filtered = filtered.filter(repo =>
        filter === 'private' ? repo.private : !repo.private
      );
    }

    setFilteredRepos(filtered);
  }, [repos, searchQuery, filter]);

  const fetchRepositories = async () => {
    if (!client) return;

    try {
      setIsLoading(true);
      const reposData = await client.getRepositories(1, 100);
      setRepos(reposData);
      setFilteredRepos(reposData);
    } catch (err) {
      setError('Failed to fetch repositories');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRepo = async (owner: string, repo: string) => {
    if (!client) return;
    
    if (!confirm(`Are you sure you want to delete ${repo}? This action cannot be undone.`)) {
      return;
    }

    try {
      await client.deleteRepository(owner, repo);
      setRepos(repos.filter(r => r.name !== repo));
      alert('Repository deleted successfully!');
    } catch (err) {
      alert('Failed to delete repository. Make sure you have the necessary permissions.');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-card rounded-lg"></div>
          <div className="h-24 bg-card rounded-lg"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-40 bg-card rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Repositories</h1>
          <p className="text-muted-foreground">Manage all your GitHub repositories</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg"
        >
          <Plus className="w-5 h-5" />
          New Repository
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('public')}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                filter === 'public'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent'
              }`}
            >
              <Globe className="w-4 h-4" />
              Public
            </button>
            <button
              onClick={() => setFilter('private')}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                filter === 'private'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent'
              }`}
            >
              <Lock className="w-4 h-4" />
              Private
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredRepos.length} of {repos.length} repositories
        </p>
      </div>

      {/* Repository list */}
      <div className="space-y-4">
        {filteredRepos.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No repositories found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Create your first repository to get started'}
            </p>
          </div>
        ) : (
          filteredRepos.map((repo) => (
            <div
              key={repo.id}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xl font-bold hover:text-primary transition-colors flex items-center gap-2 group"
                    >
                      {repo.name}
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    {repo.private ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-medium rounded-md">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-md">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-muted-foreground mb-4">{repo.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {repo.language && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-primary rounded-full"></span>
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4" />
                      {formatNumber(repo.stargazers_count)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <GitFork className="w-4 h-4" />
                      {formatNumber(repo.forks_count)}
                    </span>
                    {repo.open_issues_count > 0 && (
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        {formatNumber(repo.open_issues_count)} issues
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      Updated {formatRelativeTime(repo.updated_at)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRepo(repo.owner.login, repo.name)}
                  className="ml-4 p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Delete repository"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <CreateRepoModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchRepositories();
          }}
        />
      )}
    </div>
  );
}

function CreateRepoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { client } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setIsLoading(true);
    setError('');

    try {
      await client.createRepository(name, description, isPrivate);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create repository');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl animate-slide-up">
        <h2 className="text-2xl font-bold mb-4">Create New Repository</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Repository Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-awesome-project"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your repository"
              rows={3}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="private" className="text-sm font-medium">
              Make this repository private
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-background hover:bg-accent rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Repository'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
