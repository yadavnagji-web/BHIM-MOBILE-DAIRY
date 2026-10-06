import React, { useEffect, useState } from 'react';
import { ADMOB_CONFIG, adService } from '../services/adService';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';

interface InterstitialAdModalProps {
  isOpen: boolean;
  triggerReason?: string;
  onClose: () => void;
}

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  isOpen,
  triggerReason,
  onClose,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(5);
      setCanSkip(false);
      return;
    }

    setSecondsRemaining(5);
    setCanSkip(false);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    adService.closeInterstitial();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 relative flex flex-col">
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-400 text-slate-950 tracking-wider">
              विज्ञापन (Ad)
            </span>
            <span className="text-xs text-slate-300 font-medium truncate">
              Google AdMob Interstitial
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!canSkip ? (
              <span className="text-xs font-mono font-bold text-amber-300 px-2 py-1 rounded-md bg-slate-800">
                {secondsRemaining}s में छोड़ें
              </span>
            ) : (
              <button
                type="button"
                id="close-interstitial-btn"
                onClick={handleClose}
                className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>छोड़ें (Skip)</span>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Ad Body Area */}
        <div className="p-6 text-center flex-1 flex flex-col items-center justify-center space-y-4 bg-gradient-to-b from-blue-50/50 to-white min-h-[300px]">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-200 shadow-xs">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <div className="space-y-1 max-w-xs">
            <h3 className="text-lg font-bold text-slate-900">
              डॉ. बी. आर. अम्बेडकर यादव युवा संगठन
            </h3>
            <p className="text-xs text-slate-600">
              वागड़ चौरासी - समाज सेवा, डायरेक्टरी एवं रक्तदाता नेटवर्क
            </p>
          </div>

          {/* Ins tag for Google AdSense / AdMob web placement */}
          <div className="w-full my-2">
            <ins
              className="adsbygoogle"
              style={{ display: 'block', minHeight: '100px' }}
              data-ad-client={ADMOB_CONFIG.ADSENSE_CLIENT}
              data-ad-slot={ADMOB_CONFIG.INTERSTITIAL_SLOT_ID}
              data-ad-format="auto"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-mono w-full">
            <p className="text-slate-700 font-semibold mb-0.5">Ad Unit ID:</p>
            <p className="break-all select-all">{ADMOB_CONFIG.INTERSTITIAL_AD_ID}</p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            {triggerReason === 'after_add_contact' ? 'संपर्क जोड़ने के बाद विज्ञापन' : 'प्रायोजित संदेश'}
          </p>

          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
          >
            {canSkip ? 'जारी रखें (Continue)' : `प्रतीक्षा करें (${secondsRemaining}s)`}
          </button>
        </div>
      </div>
    </div>
  );
};
