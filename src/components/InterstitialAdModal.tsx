import React, { useEffect, useState } from 'react';
import { ADMOB_CONFIG, adService, AdSettings } from '../services/adService';
import { X, ExternalLink, ShieldCheck, Phone, MessageCircle } from 'lucide-react';

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
  const [settings, setSettings] = useState<AdSettings>(adService.getSettings());

  useEffect(() => {
    setSettings(adService.getSettings());
    const unsub = adService.subscribeSettings((s) => setSettings(s));
    return unsub;
  }, []);

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

  if (!isOpen || !adService.isInterstitialEnabled()) return null;

  const handleClose = () => {
    adService.closeInterstitial();
    onClose();
  };

  const hasImage = Boolean(settings.interstitialImageUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 relative flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="bg-slate-950 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-400 text-slate-950 tracking-wider">
              विज्ञापन (Ad)
            </span>
            <span className="text-xs text-slate-300 font-medium truncate">
              {settings.sponsorTitle || 'Google AdMob Interstitial'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!canSkip ? (
              <span className="text-xs font-mono font-bold text-amber-300 px-2.5 py-1 rounded-md bg-slate-800">
                {secondsRemaining}s में छोड़ें
              </span>
            ) : (
              <button
                type="button"
                id="close-interstitial-btn"
                onClick={handleClose}
                className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>छोड़ें (Skip)</span>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Ad Body Area */}
        {hasImage ? (
          <div className="p-3 text-center flex-1 flex flex-col items-center justify-center bg-slate-900 overflow-y-auto">
            <a
              href={settings.interstitialTargetUrl || (settings.sponsorContact ? `tel:+91${settings.sponsorContact.replace(/\D/g, '')}` : '#')}
              target={settings.interstitialTargetUrl ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="block w-full max-h-[380px] overflow-hidden rounded-2xl group relative"
            >
              <img
                src={settings.interstitialImageUrl}
                alt={settings.sponsorTitle || 'इंटरस्टीशियल विज्ञापन'}
                className="w-full max-h-[380px] object-contain mx-auto group-hover:scale-[1.01] transition-transform"
              />
            </a>

            {(settings.sponsorTitle || settings.sponsorContact) && (
              <div className="w-full mt-3 p-3 bg-slate-800/90 rounded-2xl flex items-center justify-between gap-3 text-white">
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold truncate text-white">{settings.sponsorTitle}</p>
                  {settings.sponsorTagline && (
                    <p className="text-2xs text-slate-300 truncate">{settings.sponsorTagline}</p>
                  )}
                </div>
                {settings.sponsorContact && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:+91${settings.sponsorContact.replace(/\D/g, '')}`}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-2xs flex items-center gap-1"
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
        ) : (
          <div className="p-6 text-center flex-1 flex flex-col items-center justify-center space-y-4 bg-gradient-to-b from-blue-50/50 to-white min-h-[300px]">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-200 shadow-xs">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div className="space-y-1 max-w-xs">
              <h3 className="text-lg font-bold text-slate-900">
                {settings.sponsorTitle || 'डॉ. बी. आर. अम्बेडकर यादव युवा संगठन'}
              </h3>
              <p className="text-xs text-slate-600">
                {settings.sponsorTagline || 'वागड़ चौरासी - समाज सेवा, डायरेक्टरी एवं रक्तदाता नेटवर्क'}
              </p>
            </div>

            {/* Ins tag for Google AdSense / AdMob web placement */}
            <div className="w-full my-2">
              <ins
                className="adsbygoogle"
                style={{ display: 'block', minHeight: '100px' }}
                data-ad-client={ADMOB_CONFIG.ADSENSE_CLIENT}
                data-ad-slot={settings.interstitialAdUnit || ADMOB_CONFIG.INTERSTITIAL_SLOT_ID}
                data-ad-format="auto"
              />
            </div>

            {settings.sponsorContact && (
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:+91${settings.sponsorContact.replace(/\D/g, '')}`}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>कॉल करें</span>
                </a>
                <a
                  href={`https://wa.me/91${settings.sponsorContact.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            {triggerReason === 'after_add_contact' ? 'संपर्क जोड़ने के बाद विज्ञापन' : 'प्रायोजित संदेश'}
          </p>

          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            {canSkip ? 'जारी रखें (Continue)' : `प्रतीक्षा करें (${secondsRemaining}s)`}
          </button>
        </div>
      </div>
    </div>
  );
};
