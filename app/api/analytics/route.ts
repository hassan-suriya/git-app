import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const repositoryId = searchParams.get('repositoryId');

    if (!repositoryId) {
      return NextResponse.json({ error: 'Repository ID required' }, { status: 400 });
    }

    // Get repository
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Get commits with aggregation
    const commits = await prisma.commit.findMany({
      where: { repositoryId },
      orderBy: { authorDate: 'desc' },
      take: 500,
    });

    // Get pull requests with aggregation
    const pullRequests = await prisma.pullRequest.findMany({
      where: { repositoryId },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate statistics
    const commitStats = calculateCommitStats(commits);
    const prStats = calculatePRStats(pullRequests);
    const contributorStats = calculateContributorStats(commits);

    return NextResponse.json({
      repository,
      commitStats,
      prStats,
      contributorStats,
      recentCommits: commits.slice(0, 10),
      recentPRs: pullRequests.slice(0, 10),
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function calculateCommitStats(commits: any[]) {
  const totalCommits = commits.length;
  const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
  const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
  const totalFilesChanged = commits.reduce((sum, c) => sum + c.filesChanged, 0);

  // Group by date
  const commitsByDate = commits.reduce((acc: any, commit) => {
    const date = new Date(commit.authorDate).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // Get last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const commitTrend = last30Days.map(date => ({
    date,
    count: commitsByDate[date] || 0,
  }));

  return {
    totalCommits,
    totalAdditions,
    totalDeletions,
    totalFilesChanged,
    avgAdditionsPerCommit: totalCommits > 0 ? Math.round(totalAdditions / totalCommits) : 0,
    avgDeletionsPerCommit: totalCommits > 0 ? Math.round(totalDeletions / totalCommits) : 0,
    commitTrend,
  };
}

function calculatePRStats(pullRequests: any[]) {
  const totalPRs = pullRequests.length;
  const openPRs = pullRequests.filter(pr => pr.state === 'open').length;
  const closedPRs = pullRequests.filter(pr => pr.state === 'closed' && !pr.merged).length;
  const mergedPRs = pullRequests.filter(pr => pr.merged).length;

  const totalAdditions = pullRequests.reduce((sum, pr) => sum + pr.additions, 0);
  const totalDeletions = pullRequests.reduce((sum, pr) => sum + pr.deletions, 0);

  // Calculate average merge time for merged PRs
  const mergedPRsWithTimes = pullRequests.filter(pr => pr.merged && pr.mergedAt);
  const avgMergeTime = mergedPRsWithTimes.length > 0
    ? mergedPRsWithTimes.reduce((sum, pr) => {
        const created = new Date(pr.createdAt).getTime();
        const merged = new Date(pr.mergedAt).getTime();
        return sum + (merged - created);
      }, 0) / mergedPRsWithTimes.length / (1000 * 60 * 60) // Convert to hours
    : 0;

  return {
    totalPRs,
    openPRs,
    closedPRs,
    mergedPRs,
    mergeRate: totalPRs > 0 ? Math.round((mergedPRs / totalPRs) * 100) : 0,
    totalAdditions,
    totalDeletions,
    avgMergeTimeHours: Math.round(avgMergeTime),
  };
}

function calculateContributorStats(commits: any[]) {
  const contributorMap = commits.reduce((acc: any, commit) => {
    const author = commit.author;
    if (!acc[author]) {
      acc[author] = {
        name: author,
        commits: 0,
        additions: 0,
        deletions: 0,
      };
    }
    acc[author].commits++;
    acc[author].additions += commit.additions;
    acc[author].deletions += commit.deletions;
    return acc;
  }, {});

  const contributors = Object.values(contributorMap)
    .sort((a: any, b: any) => b.commits - a.commits)
    .slice(0, 10);

  return {
    totalContributors: Object.keys(contributorMap).length,
    topContributors: contributors,
  };
}
