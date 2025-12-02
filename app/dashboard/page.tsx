'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { GitHubRepo } from '@/lib/github';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import { 
  Star, 
  GitFork, 
  Activity, 
  AlertCircle,
  TrendingUp,
  GitBranch,
  Clock,
  Eye
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { client, user } = useAuth();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!client) return;
      
      try {
        const reposData = await client.getRepositories(1, 6);
        setRepos(reposData);
      } catch (err) {
        setError('Failed to fetch repositories');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [client]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
  const totalForks = repos.reduce((acc, repo) => acc + repo.forks_count, 0);
  const privateRepos = repos.filter(repo => repo.private).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome header */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-8 text-primary-foreground shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name || user?.login}! 👋
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              Here's what's happening with your repositories today
            </p>
          </div>
          <img
            src={user?.avatar_url}
            alt={user?.name || user?.login || ''}
            className="w-16 h-16 rounded-full ring-4 ring-primary-foreground/20"
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Repositories"
          value={user?.public_repos || 0}
          icon={<GitBranch className="w-6 h-6" />}
          trend="+12%"
          color="blue"
        />
        <StatCard
          title="Total Stars"
          value={totalStars}
          icon={<Star className="w-6 h-6" />}
          trend="+8%"
          color="yellow"
        />
        <StatCard
          title="Total Forks"
          value={totalForks}
          icon={<GitFork className="w-6 h-6" />}
          trend="+15%"
          color="green"
        />
        <StatCard
          title="Private Repos"
          value={privateRepos}
          icon={<Eye className="w-6 h-6" />}
          trend="0%"
          color="purple"
        />
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Recent repositories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Repositories</h2>
          <Link
            href="/dashboard/repositories"
            className="text-primary hover:text-primary/80 font-medium flex items-center gap-2 transition-colors"
          >
            View all
            <TrendingUp className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard/repositories"
            className="p-4 bg-primary/10 hover:bg-primary/20 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <GitBranch className="w-8 h-8 text-primary mb-2" />
            <h4 className="font-semibold mb-1">Manage Repos</h4>
            <p className="text-sm text-muted-foreground">Create, view, and delete repositories</p>
          </Link>
          <Link
            href="/dashboard/analytics"
            className="p-4 bg-green-500/10 hover:bg-green-500/20 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <Activity className="w-8 h-8 text-green-500 mb-2" />
            <h4 className="font-semibold mb-1">View Analytics</h4>
            <p className="text-sm text-muted-foreground">Insights and metrics for your repos</p>
          </Link>
          <Link
            href="/dashboard/webhooks"
            className="p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <Clock className="w-8 h-8 text-purple-500 mb-2" />
            <h4 className="font-semibold mb-1">Setup Webhooks</h4>
            <p className="text-sm text-muted-foreground">Configure real-time notifications</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: string;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
          {trend}
        </span>
      </div>
      <h3 className="text-2xl font-bold mb-1">{formatNumber(value)}</h3>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

function RepoCard({ repo }: { repo: GitHubRepo }) {
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/50 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg mb-1 truncate group-hover:text-primary transition-colors">
            {repo.name}
          </h3>
          {repo.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {repo.description}
            </p>
          )}
        </div>
        {repo.private && (
          <span className="ml-2 px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-medium rounded-md flex-shrink-0">
            Private
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
        <span className="flex items-center gap-1.5 ml-auto">
          <Clock className="w-4 h-4" />
          {formatRelativeTime(repo.updated_at)}
        </span>
      </div>
    </a>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="bg-card rounded-2xl p-8 h-40"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 h-32"></div>
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-8 bg-card rounded w-48"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-5 h-32"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
