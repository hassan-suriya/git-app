'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { GitHubRepo } from '@/lib/github';
import { 
  TrendingUp, 
  GitCommit, 
  GitPullRequest, 
  Users,
  Activity,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Download
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function AnalyticsPage() {
  const { client, token } = useAuth();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchRepositories();
  }, [client]);

  const fetchRepositories = async () => {
    if (!client) return;
    try {
      const reposData = await client.getRepositories(1, 100);
      setRepos(reposData);
      if (reposData.length > 0 && !selectedRepo) {
        setSelectedRepo(reposData[0].full_name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedRepo || !token) return;
    
    setIsSyncing(true);
    try {
      const [owner, repo] = selectedRepo.split('/');
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, owner, repo }),
      });

      if (!response.ok) throw new Error('Sync failed');
      
      const data = await response.json();
      alert('Sync started! This may take a few moments.');
      
      // Fetch analytics after a delay
      setTimeout(() => fetchAnalytics(data.repositoryId), 3000);
    } catch (err) {
      alert('Failed to sync repository');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchAnalytics = async (repositoryId: string) => {
    try {
      const response = await fetch(`/api/analytics?repositoryId=${repositoryId}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-card rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-8 text-primary-foreground shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-primary-foreground/80">
              Deep insights into your repository activity
            </p>
          </div>
          <Activity className="w-12 h-12 opacity-50" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="" className="text-black">Select a repository</option>
            {repos.map((repo) => (
              <option key={repo.id} value={repo.full_name} className="text-black">
                {repo.full_name}
              </option>
            ))}
          </select>
          <button
            onClick={handleSync}
            disabled={!selectedRepo || isSyncing}
            className="px-6 py-3 bg-white text-primary rounded-lg hover:bg-white/90 transition-colors font-medium shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      {analytics ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Commits"
              value={analytics.commitStats.totalCommits}
              icon={<GitCommit className="w-6 h-6" />}
              trend="+12%"
              color="blue"
            />
            <StatCard
              title="Pull Requests"
              value={analytics.prStats.totalPRs}
              icon={<GitPullRequest className="w-6 h-6" />}
              trend="+8%"
              color="purple"
            />
            <StatCard
              title="Contributors"
              value={analytics.contributorStats.totalContributors}
              icon={<Users className="w-6 h-6" />}
              trend="+3"
              color="green"
            />
            <StatCard
              title="Merge Rate"
              value={`${analytics.prStats.mergeRate}%`}
              icon={<TrendingUp className="w-6 h-6" />}
              trend="+5%"
              color="yellow"
            />
          </div>

          {/* Code Changes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Code Changes</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ArrowUp className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Additions</span>
                  </div>
                  <span className="text-2xl font-bold text-green-500">
                    +{formatNumber(analytics.commitStats.totalAdditions)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ArrowDown className="w-5 h-5 text-red-500" />
                    <span className="font-medium">Deletions</span>
                  </div>
                  <span className="text-2xl font-bold text-red-500">
                    -{formatNumber(analytics.commitStats.totalDeletions)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                  <span className="font-medium">Files Changed</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatNumber(analytics.commitStats.totalFilesChanged)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Pull Request Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
                  <span className="font-medium">Merged</span>
                  <span className="text-2xl font-bold text-green-500">
                    {analytics.prStats.mergedPRs}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-lg">
                  <span className="font-medium">Open</span>
                  <span className="text-2xl font-bold text-yellow-500">
                    {analytics.prStats.openPRs}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-500/10 rounded-lg">
                  <span className="font-medium">Closed</span>
                  <span className="text-2xl font-bold text-gray-500">
                    {analytics.prStats.closedPRs}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                  <span className="font-medium">Avg Merge Time</span>
                  <span className="text-2xl font-bold text-primary">
                    {analytics.prStats.avgMergeTimeHours}h
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Contributors */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Top Contributors
            </h3>
            <div className="space-y-3">
              {analytics.contributorStats.topContributors.map((contributor: any, index: number) => (
                <div key={contributor.name} className="flex items-center gap-4 p-4 bg-accent rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{contributor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {contributor.commits} commits · +{formatNumber(contributor.additions)} -{formatNumber(contributor.deletions)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{contributor.commits}</div>
                    <div className="text-xs text-muted-foreground">commits</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">No Analytics Data</h3>
          <p className="text-muted-foreground mb-6">
            Select a repository and click "Sync Data" to see detailed analytics
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend: string;
  color: 'blue' | 'purple' | 'green' | 'yellow';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    green: 'bg-green-500/10 text-green-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
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
      <h3 className="text-3xl font-bold mb-1">{value}</h3>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}
