'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GitHubClient, createGitHubClient, GitHubUser } from '@/lib/github';

interface AuthContextType {
  token: string | null;
  client: GitHubClient | null;
  user: GitHubUser | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [client, setClient] = useState<GitHubClient | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load token from localStorage on mount
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setTokenState(savedToken);
      const githubClient = createGitHubClient(savedToken);
      setClient(githubClient);
      
      // Fetch user data
      githubClient.getUser()
        .then(userData => {
          setUser(userData);
          setIsLoading(false);
        })
        .catch(() => {
          // Token might be invalid
          localStorage.removeItem('github_token');
          setTokenState(null);
          setClient(null);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const setToken = async (newToken: string) => {
    try {
      const githubClient = createGitHubClient(newToken);
      const userData = await githubClient.getUser();
      
      localStorage.setItem('github_token', newToken);
      setTokenState(newToken);
      setClient(githubClient);
      setUser(userData);
    } catch (error) {
      throw new Error('Invalid GitHub token');
    }
  };

  const logout = () => {
    localStorage.removeItem('github_token');
    setTokenState(null);
    setClient(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, client, user, isLoading, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
