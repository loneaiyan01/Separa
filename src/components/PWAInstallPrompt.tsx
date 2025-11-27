'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show again after 7 days
    if (dismissed && daysSinceDismissed < 7) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Delay showing prompt for better UX (show after 30 seconds)
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.removeItem('pwa-install-dismissed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  const handleNotNow = () => {
    setShowPrompt(false);
    // Will show again in current session after some time
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="glass rounded-xl p-5 shadow-2xl border border-emerald-500/20 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/50">
            <Download className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-bold text-white text-lg">Install Separa</h3>
              <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                Get quick access, work offline, and enjoy a native app experience.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <Smartphone className="w-4 h-4" />
                <span>Works on mobile & desktop</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button 
                onClick={handleInstall} 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 shadow-lg shadow-emerald-600/30 transition-all hover:shadow-emerald-600/50"
              >
                Install Now
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
              Don't show again
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
