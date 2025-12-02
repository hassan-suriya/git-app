import axios, { AxiosInstance, AxiosError } from 'axios';

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
  }>;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  user: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merged: boolean;
  draft: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  comments: number;
  review_comments: number;
  commits: number;
}

export interface GitHubWebhook {
  id: number;
  name: string;
  active: boolean;
  events: string[];
  config: {
    url: string;
    content_type: string;
    insecure_ssl: string;
  };
  created_at: string;
  updated_at: string;
}

export interface GitHubNotification {
  id: string;
  unread: boolean;
  reason: string;
  subject: {
    title: string;
    url: string;
    type: string;
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
  };
  updated_at: string;
}

export interface GitHubGist {
  id: string;
  description: string | null;
  public: boolean;
  html_url: string;
  created_at: string;
  updated_at: string;
  files: {
    [key: string]: {
      filename: string;
      type: string;
      language: string;
      size: number;
      content?: string;
    };
  };
}

export class GitHubClient {
  private client: AxiosInstance;
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    // Add response interceptor for rate limiting
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 403) {
          const resetTime = error.response.headers['x-ratelimit-reset'];
          if (resetTime) {
            console.warn('Rate limit exceeded. Resets at:', new Date(parseInt(resetTime) * 1000));
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // User Methods
  async getUser(): Promise<GitHubUser> {
    const { data } = await this.client.get('/user');
    return data;
  }

  // Repository Methods
  async getRepositories(page = 1, perPage = 30): Promise<GitHubRepo[]> {
    const { data } = await this.client.get('/user/repos', {
      params: {
        page,
        per_page: perPage,
        sort: 'updated',
        affiliation: 'owner,collaborator',
      },
    });
    return data;
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepo> {
    const { data } = await this.client.get(`/repos/${owner}/${repo}`);
    return data;
  }

  async createRepository(name: string, description?: string, isPrivate = false): Promise<GitHubRepo> {
    const { data } = await this.client.post('/user/repos', {
      name,
      description,
      private: isPrivate,
      auto_init: true,
    });
    return data;
  }

  async deleteRepository(owner: string, repo: string): Promise<void> {
    await this.client.delete(`/repos/${owner}/${repo}`);
  }

  // Commit Methods
  async getCommits(owner: string, repo: string, page = 1, perPage = 100): Promise<GitHubCommit[]> {
    const { data } = await this.client.get(`/repos/${owner}/${repo}/commits`, {
      params: {
        page,
        per_page: perPage,
      },
    });
    return data;
  }

  async getCommit(owner: string, repo: string, sha: string): Promise<GitHubCommit> {
    const { data } = await this.client.get(`/repos/${owner}/${repo}/commits/${sha}`);
    return data;
  }

  // Pull Request Methods
  async getPullRequests(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'all',
    page = 1,
    perPage = 100
  ): Promise<GitHubPullRequest[]> {
    const { data } = await this.client.get(`/repos/${owner}/${repo}/pulls`, {
      params: {
        state,
        page,
        per_page: perPage,
        sort: 'updated',
        direction: 'desc',
      },
    });
    return data;
  }

  async getPullRequest(owner: string, repo: string, number: number): Promise<GitHubPullRequest> {
    const { data } = await this.client.get(`/repos/${owner}/${repo}/pulls/${number}`);
    return data;
  }

  // Webhook Methods
  async getWebhooks(owner: string, repo: string): Promise<GitHubWebhook[]> {
    const { data } = await this.client.get(`/repos/${owner}/${repo}/hooks`);
    return data;
  }

  async createWebhook(
    owner: string,
    repo: string,
    url: string,
    events: string[] = ['push', 'pull_request']
  ): Promise<GitHubWebhook> {
    const { data } = await this.client.post(`/repos/${owner}/${repo}/hooks`, {
      name: 'web',
      active: true,
      events,
      config: {
        url,
        content_type: 'json',
        insecure_ssl: '0',
      },
    });
    return data;
  }

  async deleteWebhook(owner: string, repo: string, hookId: number): Promise<void> {
    await this.client.delete(`/repos/${owner}/${repo}/hooks/${hookId}`);
  }

  async updateWebhook(
    owner: string,
    repo: string,
    hookId: number,
    updates: Partial<{ active: boolean; events: string[]; config: any }>
  ): Promise<GitHubWebhook> {
    const { data } = await this.client.patch(`/repos/${owner}/${repo}/hooks/${hookId}`, updates);
    return data;
  }

  // Notification Methods
  async getNotifications(page = 1, perPage = 50): Promise<GitHubNotification[]> {
    const { data } = await this.client.get('/notifications', {
      params: {
        page,
        per_page: perPage,
      },
    });
    return data;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.client.patch(`/notifications/threads/${notificationId}`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.client.put('/notifications');
  }

  // Gist Methods
  async getGists(page = 1, perPage = 30): Promise<GitHubGist[]> {
    const { data } = await this.client.get('/gists', {
      params: {
        page,
        per_page: perPage,
      },
    });
    return data;
  }

  async createGist(
    description: string,
    files: { [filename: string]: { content: string } },
    isPublic = true
  ): Promise<GitHubGist> {
    const { data } = await this.client.post('/gists', {
      description,
      public: isPublic,
      files,
    });
    return data;
  }

  async deleteGist(gistId: string): Promise<void> {
    await this.client.delete(`/gists/${gistId}`);
  }

  // Rate Limit
  async getRateLimit() {
    const { data } = await this.client.get('/rate_limit');
    return data;
  }
}

export function createGitHubClient(token: string): GitHubClient {
  return new GitHubClient(token);
}
