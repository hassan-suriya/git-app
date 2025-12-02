import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGitHubClient } from '@/lib/github';

export async function POST(req: NextRequest) {
  try {
    const { token, owner, repo } = await req.json();

    if (!token || !owner || !repo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = createGitHubClient(token);

    // Get repository info
    const repoData = await client.getRepository(owner, repo);

    // Save or update repository
    const repository = await prisma.repository.upsert({
      where: { githubId: repoData.id },
      update: {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        private: repoData.private,
        htmlUrl: repoData.html_url,
        cloneUrl: repoData.clone_url,
        language: repoData.language,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        updatedAt: new Date(repoData.updated_at),
        syncedAt: new Date(),
      },
      create: {
        githubId: repoData.id,
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        private: repoData.private,
        htmlUrl: repoData.html_url,
        cloneUrl: repoData.clone_url,
        language: repoData.language,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        createdAt: new Date(repoData.created_at),
        updatedAt: new Date(repoData.updated_at),
        syncedAt: new Date(),
      },
    });

    // Create sync job
    const syncJob = await prisma.syncJob.create({
      data: {
        type: 'full',
        repositoryId: repository.id,
        status: 'running',
        startedAt: new Date(),
      },
    });

    // Start syncing commits in background
    syncCommitsBackground(client, owner, repo, repository.id, syncJob.id);

    // Start syncing PRs in background
    syncPRsBackground(client, owner, repo, repository.id);

    return NextResponse.json({
      message: 'Sync started',
      repositoryId: repository.id,
      syncJobId: syncJob.id,
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync repository' },
      { status: 500 }
    );
  }
}

async function syncCommitsBackground(
  client: any,
  owner: string,
  repo: string,
  repositoryId: string,
  syncJobId: string
) {
  try {
    let page = 1;
    let hasMore = true;
    let totalProcessed = 0;

    while (hasMore) {
      const commits = await client.getCommits(owner, repo, page, 100);
      
      if (commits.length === 0) {
        hasMore = false;
        break;
      }

      // Process commits in batches
      for (const commit of commits) {
        try {
          // Get detailed commit info
          const detailedCommit = await client.getCommit(owner, repo, commit.sha);

          await prisma.commit.upsert({
            where: { sha: commit.sha },
            update: {
              message: commit.commit.message,
              author: commit.commit.author.name,
              authorEmail: commit.commit.author.email,
              authorDate: new Date(commit.commit.author.date),
              committer: commit.commit.committer.name,
              committerEmail: commit.commit.committer.email,
              committerDate: new Date(commit.commit.committer.date),
              additions: detailedCommit.stats?.additions || 0,
              deletions: detailedCommit.stats?.deletions || 0,
              totalChanges: detailedCommit.stats?.total || 0,
              filesChanged: detailedCommit.files?.length || 0,
              htmlUrl: commit.html_url,
            },
            create: {
              sha: commit.sha,
              message: commit.commit.message,
              author: commit.commit.author.name,
              authorEmail: commit.commit.author.email,
              authorDate: new Date(commit.commit.author.date),
              committer: commit.commit.committer.name,
              committerEmail: commit.commit.committer.email,
              committerDate: new Date(commit.commit.committer.date),
              additions: detailedCommit.stats?.additions || 0,
              deletions: detailedCommit.stats?.deletions || 0,
              totalChanges: detailedCommit.stats?.total || 0,
              filesChanged: detailedCommit.files?.length || 0,
              htmlUrl: commit.html_url,
              repositoryId,
            },
          });

          totalProcessed++;
        } catch (err) {
          console.error(`Failed to process commit ${commit.sha}:`, err);
        }
      }

      // Update sync job progress
      await prisma.syncJob.update({
        where: { id: syncJobId },
        data: { itemsProcessed: totalProcessed },
      });

      page++;
      
      // Limit to 5 pages (500 commits) to avoid rate limiting
      if (page > 5) {
        hasMore = false;
      }
    }

    // Mark sync job as completed
    await prisma.syncJob.update({
      where: { id: syncJobId },
      data: {
        status: 'completed',
        itemsProcessed: totalProcessed,
        completedAt: new Date(),
      },
    });
  } catch (error: any) {
    await prisma.syncJob.update({
      where: { id: syncJobId },
      data: {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      },
    });
  }
}

async function syncPRsBackground(
  client: any,
  owner: string,
  repo: string,
  repositoryId: string
) {
  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const prs = await client.getPullRequests(owner, repo, 'all', page, 100);
      
      if (prs.length === 0) {
        hasMore = false;
        break;
      }

      for (const pr of prs) {
        try {
          await prisma.pullRequest.upsert({
            where: { githubId: pr.id },
            update: {
              number: pr.number,
              title: pr.title,
              body: pr.body,
              state: pr.state,
              author: pr.user.login,
              htmlUrl: pr.html_url,
              updatedAt: new Date(pr.updated_at),
              closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
              mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
              merged: pr.merged,
              draft: pr.draft,
              additions: pr.additions,
              deletions: pr.deletions,
              changedFiles: pr.changed_files,
              comments: pr.comments,
              reviewComments: pr.review_comments,
              commits: pr.commits,
              syncedAt: new Date(),
            },
            create: {
              githubId: pr.id,
              number: pr.number,
              title: pr.title,
              body: pr.body,
              state: pr.state,
              author: pr.user.login,
              htmlUrl: pr.html_url,
              createdAt: new Date(pr.created_at),
              updatedAt: new Date(pr.updated_at),
              closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
              mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
              merged: pr.merged,
              draft: pr.draft,
              additions: pr.additions,
              deletions: pr.deletions,
              changedFiles: pr.changed_files,
              comments: pr.comments,
              reviewComments: pr.review_comments,
              commits: pr.commits,
              repositoryId,
              syncedAt: new Date(),
            },
          });
        } catch (err) {
          console.error(`Failed to process PR ${pr.number}:`, err);
        }
      }

      page++;
      
      // Limit to 3 pages (300 PRs)
      if (page > 3) {
        hasMore = false;
      }
    }
  } catch (error) {
    console.error('Failed to sync PRs:', error);
  }
}
