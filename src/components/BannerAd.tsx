import React, { useEffect, useRef, useState } from 'react';
import { ADMOB_CONFIG, adService } from '../services/adService';
import { X, Sparkles } from 'lucide-react';

interface BannerAdProps {
  placement?: 'bottom-sticky' | 'in-feed' | 'inline';
  className?: string;
  allowClose?: boolean;
}

export const BannerAd: React.FC<BannerAdProps> = ({
  placement = 'in-feed',
  className = '',
  allowClose = true,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    adService.loadGoogleAdsenseTag();

    if (!isInitialized.current && typeof window !== 'undefined') {
      try {
        if (window.adsbygoogle && adRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isInitialized.current = true;
        }
      } catch (e) {
        // Adsbygoogle initialization catch
      }
    }
  }, []);

  if (isDismissed) {
    return null;
  }

  // BOTTOM STICKY BANNER (Above bottom navigation on mobile, fixed and non-intrusive)
  if (placement === 'bottom-sticky') {
    return (
      <div className={`fixed bottom-16 md:bottom-2 left-0 right-0 z-30 flex justify-center px-2 pointer-events-none ${className}`}>
        <div className="pointer-events-auto max-w-lg w-full bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-md p-1.5 flex items-center justify-between gap-2">
          {/* Ad Label & Content */}
          <div className="flex-1 flex items-center justify-center min-h-[50px] overflow-hidden" ref={adRef}>
            <ins
              className="adsbygoogle"
              style={{ display: 'inline-block', width: '320px', height: '50px' }}
              data-ad-client={ADMOB_CONFIG.ADSENSE_CLIENT}
              data-ad-slot={ADMOB_CONFIG.BANNER_SLOT_ID}
              data-ad-format="horizontal"
              data-full-width-responsive="false"
            />
            {/* Fallback Display if Google Ads hasn't loaded or AdBlock is on */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                Ad
              </span>
              <span className="font-medium text-slate-600 truncate text-[11px]">
                डॉ. बी. आर. अम्बेडकर यादव युवा संगठन
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                {ADMOB_CONFIG.BANNER_SLOT_ID}
              </span>
            </div>
          </div>

          {/* Close button for non-disturbing experience */}
          {allowClose && (
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              aria-label="विज्ञापन छिपाएँ"
              title="विज्ञापन बंद करें"
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // IN-FEED BANNER (Between contact cards, blends naturally)
  return (
    <div
      className={`my-3 p-3 bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 tracking-wider">
            प्रायोजित (Ad)
          </span>
          <span className="text-slate-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Bhim Directory Partner
          </span>
        </div>

        {allowClose && (
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="विज्ञापन छिपाएँ"
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center justify-center min-h-[60px] text-center" ref={adRef}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight: '60px' }}
          data-ad-client={ADMOB_CONFIG.ADSENSE_CLIENT}
          data-ad-slot={ADMOB_CONFIG.BANNER_SLOT_ID}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        {/* Polite fallback note */}
        <div className="py-2 text-xs text-slate-600">
          <p className="font-semibold text-blue-900">
            यादव समाज वागड़ चौरासी डायरेक्टरी
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            सामाजिक सहयोग एवं आपातकालीन संपर्क सेवा
          </p>
        </div>
      </div>
    </div>
  );
};
