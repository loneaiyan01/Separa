'use client';

import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  downlink?: number; // Mbps
  rtt?: number; // Round trip time in ms
  saveData?: boolean;
  isSlow: boolean;
}

/**
 * Hook to monitor network connection status and quality
 */
export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    effectiveType: '4g',
    isSlow: false,
  });

  useEffect(() => {
    // Check if window is available
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      setNetworkStatus(prev => ({ ...prev, isOnline }));
    };

    const updateNetworkInfo = () => {
      // @ts-ignore - NetworkInformation API
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

      if (connection) {
        const effectiveType = connection.effectiveType || '4g';
        const isSlow = effectiveType === '2g' || effectiveType === 'slow-2g';

        setNetworkStatus({
          isOnline: navigator.onLine,
          effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          isSlow,
        });
      } else {
        // Fallback if NetworkInformation API not available
        setNetworkStatus(prev => ({
          ...prev,
          isOnline: navigator.onLine,
          effectiveType: 'unknown',
          isSlow: false,
        }));
      }
    };

    // Initial update
    updateOnlineStatus();
    updateNetworkInfo();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Listen for connection changes
    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return networkStatus;
}
