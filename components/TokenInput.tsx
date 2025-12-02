'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Github, Key, Sparkles, Shield, Database, TrendingUp } from 'lucide-react';

export default function TokenInput() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setToken: saveToken } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await saveToken(token);
    } catch (err) {
      setError('Invalid token. Please check your GitHub Personal Access Token and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left side - Branding and features */}
            <div className="text-white space-y-8 animate-fade-in">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 backdrop-blur-lg rounded-2xl">
                    <Github className="w-8 h-8" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    GitHub Manager
                  </h1>
                </div>
                <p className="text-xl text-purple-100">
                  Your Ultimate Repository Management & Analytics Platform
                </p>
              </div>

              <div className="space-y-4">
                <FeatureItem 
                  icon={<Database className="w-5 h-5" />}
                  title="Smart Data Extraction"
                  description="Automatically extract and analyze commit & PR metadata"
                />
                <FeatureItem 
                  icon={<TrendingUp className="w-5 h-5" />}
                  title="Advanced Analytics"
                  description="Beautiful charts and insights for your repositories"
                />
                <FeatureItem 
                  icon={<Shield className="w-5 h-5" />}
                  title="Webhook Management"
                  description="Create and manage webhooks with real-time updates"
                />
                <FeatureItem 
                  icon={<Sparkles className="w-5 h-5" />}
                  title="Comprehensive Tools"
                  description="Manage repos, gists, notifications, and more"
                />
              </div>
            </div>

            {/* Right side - Token input form */}
            <div className="animate-slide-up">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4">
                      <Key className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
                    <p className="text-purple-200">Enter your GitHub token to get started</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="token" className="block text-sm font-medium text-purple-100">
                        GitHub Personal Access Token
                      </label>
                      <input
                        id="token"
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-lg"
                        required
                      />
                      {error && (
                        <p className="text-sm text-red-300 flex items-center gap-2">
                          <span className="inline-block w-1 h-1 bg-red-300 rounded-full"></span>
                          {error}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !token}
                      className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Connecting...
                        </span>
                      ) : (
                        'Connect to GitHub'
                      )}
                    </button>
                  </form>

                  <div className="pt-6 border-t border-white/10">
                    <div className="space-y-3">
                      <p className="text-sm text-purple-200 font-medium">Need a token?</p>
                      <a
                        href="https://github.com/settings/tokens/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-purple-300 hover:text-white transition-colors"
                      >
                        → Create a Personal Access Token on GitHub
                      </a>
                      <p className="text-xs text-purple-300/70">
                        Your token is stored locally and never sent to our servers
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
      <div className="p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-purple-200">{description}</p>
      </div>
    </div>
  );
}
