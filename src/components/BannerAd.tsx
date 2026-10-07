import React, { useEffect, useRef, useState } from 'react';
import { ADMOB_CONFIG, adService, AdSettings } from '../services/adService';
import { X, Sparkles, Phone, MessageCircle } from 'lucide-react';

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
  const [settings, setSettings] = useState<AdSettings>(adService.getSettings());
  const adRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const unsub = adService.subscribeSettings((newSettings) => {
      setSettings(newSettings);
    });
    return () => unsub();
  }, []);

  const isEnabled = settings.adsMasterEnabled && settings.bannerAdEnabled;

  useEffect(() => {
    if (!isEnabled) return;
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
  }, [isEnabled]);

  if (!isEnabled || isDismissed) {
    return null;
  }

  const hasSponsor = Boolean(settings.sponsorTitle && settings.sponsorAdEnabled !== false);

  // BOTTOM STICKY BANNER (Above bottom navigation on mobile, fixed and non-intrusive)
  if (placement === 'bottom-sticky') {
    return (
      <div className={`fixed bottom-16 md:bottom-2 left-0 right-0 z-30 flex justify-center px-2 pointer-events-none ${className}`}>
        <div className="pointer-events-auto max-w-lg w-full bg-white/95 backdrop-blur-md rounded-2xl border border-blue-200/90 shadow-lg p-2 flex items-center justify-between gap-2">
          {settings.bannerImageUrl ? (
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <a
                href={settings.bannerTargetUrl || (settings.sponsorContact ? `tel:+91${settings.sponsorContact.replace(/\D/g, '')}` : '#')}
                target={settings.bannerTargetUrl ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="flex-1 min-w-0 flex items-center justify-center max-h-[50px] overflow-hidden rounded-lg group"
                title={settings.sponsorTitle || 'प्रायोजक विज्ञापन'}
              >
                <img
                  src={settings.bannerImageUrl}
                  alt={settings.sponsorTitle || 'बैनर विज्ञापन'}
                  className="max-h-[50px] w-auto max-w-full object-contain mx-auto group-hover:opacity-95 transition-opacity"
                />
              </a>
              {settings.sponsorContact && (
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={`tel:+91${settings.sponsorContact.replace(/\D/g, '')}`}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition"
                    title="कॉल करें"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/91${settings.sponsorContact.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center transition"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ) : hasSponsor ? (
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2 px-1">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    प्रायोजित विज्ञापन
                  </span>
                  <span className="font-extrabold text-xs text-slate-900 truncate">
                    {settings.sponsorTitle}
                  </span>
                </div>
                {settings.sponsorTagline && (
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {settings.sponsorTagline}
                  </p>
                )}
              </div>

              {settings.sponsorContact && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`tel:+91${settings.sponsorContact.replace(/\D/g, '')}`}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition"
                    title="प्रायोजक को कॉल करें"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/91${settings.sponsorContact.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center transition"
                    title="प्रायोजक को WhatsApp करें"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[48px] overflow-hidden" ref={adRef}>
              <ins
                className="adsbygoogle"
                style={{ display: 'inline-block', width: '320px', height: '48px' }}
                data-ad-client={ADMOB_CONFIG.ADSENSE_CLIENT}
                data-ad-slot={settings.bannerAdUnit || ADMOB_CONFIG.BANNER_SLOT_ID}
                data-ad-format="horizontal"
                data-full-width-responsive="false"
              />
            </div>
          )}

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
      className={`my-3 p-3.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 rounded-2xl border border-blue-200/80 shadow-xs relative overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-blue-100">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 tracking-wider">
            प्रायोजित विज्ञापन (Ad)
          </span>
          <span className="text-blue-900 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {hasSponsor ? settings.sponsorTitle : 'Yadav Samaj Mobile Directory Partner'}
          </span>
        </div>

        {allowClose && (
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="विज्ञापन छिपाएँ"
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {settings.bannerImageUrl ? (
        <div className="py-1">
          <a
            href={settings.bannerTargetUrl || (settings.sponsorContact ? `tel:+91${settings.sponsorContact.replace(/\D/g, '')}` : '#')}
            target={settings.bannerTargetUrl ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-xl group border border-blue-100 bg-white shadow-2xs"
          >
            <img
              src={settings.bannerImageUrl}
              alt={settings.sponsorTitle || 'बैनर विज्ञापन'}
              className="w-full max-h-[140px] object-cover group-hover:scale-[1.01] transition-transform duration-200"
            />
          </a>
          {(settings.sponsorTitle || settings.sponsorContact) && (
            <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-blue-100/60 text-xs">
              <span className="font-extrabold text-slate-900 truncate">
                {settings.sponsorTitle}
              </span>
              {settings.sponsorContact && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`tel:+91${settings.sponsorContact.replace(/\D/g, '')}`}
                    className="px-2.5 py-1 rounded-lg bg-blue-700 text-white font-bold text-2xs flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>कॉल</span>
                  </a>
                  <a
                    href={`https://wa.me/91${settings.sponsorContact.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-[#25D366] text-white font-bold text-2xs flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      ) : hasSponsor ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-1">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-900">
              {settings.sponsorTitle}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {settings.sponsorTagline || 'व्यवसाय एवं सेवाओं के लिए संपर्क करें।'}
            </p>
          </div>

          {settings.sponsorContact && (
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:+91${settings.sponsorContact.replace(/\D/g, '')}`}
                className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>कॉल करें</span>
              </a>
              <a
                href={`https://wa.me/91${settings.sponsorContact.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60px] text-center" ref={adRef}>
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', minHeight: '60px' }}
            data-ad-client={ADMOB_CONFIG.ADSENSE_CLIENT}
            data-ad-slot={settings.bannerAdUnit || ADMOB_CONFIG.BANNER_SLOT_ID}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      )}
    </div>
  );
};
