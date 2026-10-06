import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:right-auto sm:left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 text-white px-3.5 py-2 text-xs font-bold shadow-xl border border-amber-500 animate-in fade-in slide-in-from-bottom-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
      </span>
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>ऑफलाइन मोड: डायरेक्टरी का सहेजा गया डेटा इस्तेमाल हो रहा है।</span>
    </div>
  );
};
