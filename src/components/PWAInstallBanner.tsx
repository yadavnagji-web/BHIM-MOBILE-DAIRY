import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallBannerProps {
  onOpenModal: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onOpenModal }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  // If already installed or dismissed, do not show
  if (isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome !== 'accepted') {
        onOpenModal();
      }
    } else {
      onOpenModal();
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 px-3.5 py-2 shadow-sm border-b border-amber-500/50 flex items-center justify-between gap-2.5 text-xs font-bold transition-all animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-xs">
          <Smartphone className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-slate-950 leading-tight truncate text-[11px] sm:text-xs">
            📲 भीम डायरेक्टरी ऐप मोबाइल में इंस्टॉल करें
          </p>
          <p className="text-[10px] text-slate-800 font-semibold truncate hidden sm:block">
            सीधे 1-क्लिक में खोलें, बिना ब्राउज़र और ऑफ़लाइन भी काम करेगा!
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          id="pwa-banner-install-btn"
          onClick={handleInstallClick}
          className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-amber-300 stroke-[2.5]" />
          <span>इनस्टॉल करें</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="w-7 h-7 rounded-lg hover:bg-amber-500/30 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="हटाएं"
          title="हटाएं"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
