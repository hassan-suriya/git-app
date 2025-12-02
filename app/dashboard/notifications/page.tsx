'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { GitHubNotification } from '@/lib/github';
import { formatRelativeTime } from '@/lib/utils';
import { Bell, Check, CheckCheck, GitPullRequest, AlertCircle, MessageSquare, ExternalLink } from 'lucide-react';

export default function NotificationsPage() {
  const { client } = useAuth();
  const [notifications, setNotifications] = useState<GitHubNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [client]);

  const fetchNotifications = async () => {
    if (!client) return;
    try {
      const notificationsData = await client.getNotifications();
      setNotifications(notificationsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!client) return;
    try {
      await client.markNotificationAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, unread: false } : n
      ));
    } catch (err) {
      alert('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!client) return;
    try {
      await client.markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, unread: false })));
      alert('All notifications marked as read!');
    } catch (err) {
      alert('Failed to mark all as read');
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => n.unread)
    : notifications;

  const unreadCount = notifications.filter(n => n.unread).length;

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (<div key={i} className="h-24 bg-card rounded-xl"></div>))}
    </div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-blue-100">Stay updated with your GitHub activity</p>
          </div>
          <div className="relative">
            <Bell className="w-12 h-12 opacity-50" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-sm font-bold">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-6 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-white/90 transition-colors font-medium shadow-lg flex items-center gap-2 ml-auto"
            >
              <CheckCheck className="w-5 h-5" />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">
              {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
            </h3>
            <p className="text-muted-foreground">
              {filter === 'unread' 
                ? 'All caught up! You have no unread notifications.'
                : 'You have no notifications yet.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-card border rounded-xl p-6 hover:shadow-lg transition-all ${
                notification.unread ? 'border-primary' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg flex-shrink-0 ${
                  notification.unread ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  {getNotificationIcon(notification.subject.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                        {notification.subject.title}
                        {notification.unread && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.repository.full_name}
                      </p>
                    </div>
                    {notification.unread && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex-shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="px-2.5 py-1 bg-accent rounded-md font-medium">
                      {notification.reason.replace('_', ' ')}
                    </span>
                    <span className="text-muted-foreground">
                      {formatRelativeTime(notification.updated_at)}
                    </span>
                    <a
                      href={notification.repository.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 flex items-center gap-1.5 ml-auto"
                    >
                      View on GitHub
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'PullRequest':
      return <GitPullRequest className="w-6 h-6 text-purple-500" />;
    case 'Issue':
      return <AlertCircle className="w-6 h-6 text-green-500" />;
    case 'Commit':
      return <MessageSquare className="w-6 h-6 text-blue-500" />;
    default:
      return <Bell className="w-6 h-6 text-gray-500" />;
  }
}
