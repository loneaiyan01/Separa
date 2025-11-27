'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from './ui/button';
import { 
  requestNotificationPermission, 
  subscribeUserToPush, 
  getNotificationPermission,
  isNotificationSupported 
} from '@/lib/notifications';

export default function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    // Show prompt if permission is default and user hasn't dismissed
    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show prompt after 1 minute on site, if not dismissed in last 14 days
    if (currentPermission === 'default' && (!dismissed || daysSinceDismissed >= 14)) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 60000); // 1 minute
    }
  }, []);

  const handleEnable = async () => {
    setIsSubscribing(true);

    try {
      const granted = await requestNotificationPermission();
      
      if (granted) {
        // Subscribe to push notifications
        const subscription = await subscribeUserToPush();
        
        if (subscription) {
          setPermission('granted');
          setShowPrompt(false);
          
          // Show success notification
          if (typeof Notification !== 'undefined') {
            new Notification('Notifications Enabled! 🎉', {
              body: 'You\'ll now receive updates about your rooms and meetings.',
              icon: '/icons/icon-192x192.png',
            });
          }
        }
      } else {
        setPermission('denied');
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  const handleNotNow = () => {
    setShowPrompt(false);
    // Will show again in current session or after 14 days
  };

  if (!showPrompt || permission !== 'default') return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-down">
      <div className="glass rounded-xl p-5 shadow-2xl border border-blue-500/20 backdrop-blur-xl max-w-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/50">
            <Bell className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-bold text-white text-lg">Stay Updated</h3>
              <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                Get notified when rooms start, participants join, or you receive messages.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button 
                onClick={handleEnable} 
                disabled={isSubscribing}
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 shadow-lg shadow-blue-600/30 transition-all hover:shadow-blue-600/50 disabled:opacity-50"
              >
                {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
              </Button>
              <Button 
                onClick={handleNotNow} 
                size="sm" 
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                Not Now
              </Button>
            </div>

            <button
              onClick={handleDismiss}
              className="text-xs text-gray-400 hover:text-gray-300 underline transition-colors"
            >
              Don't ask again
            </button>
          </div>

          <button 
            onClick={handleDismiss} 
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
