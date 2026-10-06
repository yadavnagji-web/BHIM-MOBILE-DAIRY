import React, { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  CheckCircle2,
  Share2,
  MoreVertical,
  PlusSquare,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Zap,
  WifiOff
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isInAppBrowser, install } = usePWAInstall();
  const [installStatus, setInstallStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    setInstallStatus('प्रक्रिया जारी है...');
    const result = await install();
    if (result === 'accepted') {
      setInstallStatus('सफलतापूर्वक इनस्टॉल हुआ!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else if (result === 'dismissed') {
      setInstallStatus(null);
    } else {
      // Prompt not triggered natively, show guide tab
      setInstallStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-blue-100 flex flex-col max-h-[92vh]">
        {/* Header with App Brand Banner */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 p-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-blue-400/80 shadow-lg flex-shrink-0 bg-blue-800">
              <img
                src="/ambedkar_portrait.jpg"
                alt="Bhim Directory"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black tracking-wide mb-1">
                <Sparkles className="w-3 h-3 text-slate-950" />
                <span>OFFICIAL MOBILE APP</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                BHIM DIRECTORY
              </h2>
              <p className="text-xs text-blue-200 font-medium line-clamp-1">
                डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Status Message if already installed */}
          {isInstalled ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-extrabold text-slate-900 text-base">
                ऐप आपके मोबाइल में पहले से इनस्टॉल है!
              </h3>
              <p className="text-xs text-slate-600">
                आप अपनी होम स्क्रीन पर मौजूद <strong>BHIM DIRECTORY</strong> आइकन से इसे सीधे 1 क्लिक में खोल सकते हैं।
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
              >
                ठीक है (Close)
              </button>
            </div>
          ) : (
            <>
              {/* Native 1-Click Install Button if supported */}
              {isInstallable && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 rounded-2xl p-4 text-center space-y-3">
                  <div className="text-xs font-extrabold text-blue-900">
                    ⚡ 1-क्लिक में मोबाइल पर इनस्टॉल करें
                  </div>
                  <button
                    type="button"
                    onClick={handleDirectInstall}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-700/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-transform"
                  >
                    <Download className="w-5 h-5 stroke-[2.5]" />
                    <span>अभी इंस्टॉल करें (Install Now)</span>
                  </button>
                  {installStatus && (
                    <p className="text-xs font-bold text-blue-700 animate-pulse">
                      {installStatus}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500">
                    Play Store / APK डाउनलोड किए बिना सीधे फ़ोन की होम स्क्रीन पर आ जाएगी।
                  </p>
                </div>
              )}

              {/* In-App Browser Warning (e.g. WhatsApp, Facebook) */}
              {isInAppBrowser && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5 text-amber-800">
                    <ExternalLink className="w-4 h-4" />
                    <span>व्हाट्सएप या इन-ऐप ब्राउज़र में खुला है?</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    ऊपर दाएं कोने में <strong>3 डॉट्स (⋮)</strong> दबाएं और <strong>"Open in Chrome"</strong> (क्रोम में खोलें) या <strong>"Open in Safari"</strong> चुनें, फिर आसानी से इनस्टॉल करें।
                  </p>
                </div>
              )}

              {/* Benefits Cards */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <div className="text-[11px] font-extrabold text-slate-800 leading-tight">1-क्लिक एक्सेस</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">बिना ब्राउज़र के खुले</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <WifiOff className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-[11px] font-extrabold text-slate-800 leading-tight">ऑफलाइन नंबर</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">इंटरनेट न हो तो भी</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <div className="text-[11px] font-extrabold text-slate-800 leading-tight">सुरक्षित व हल्का</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">0 MB स्पेस, नो वायरस</div>
                </div>
              </div>

              {/* Step by Step Manual Guide Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    मोबाइल में लगाने का तरीका (Step by Step):
                  </h3>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveTab('android')}
                      className={`px-3 py-1 rounded-md transition cursor-pointer ${
                        activeTab === 'android' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Android फ़ोन
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ios')}
                      className={`px-3 py-1 rounded-md transition cursor-pointer ${
                        activeTab === 'ios' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      iPhone (iOS)
                    </button>
                  </div>
                </div>

                {activeTab === 'android' ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-700">
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-sm">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>Android (Google Chrome या Samsung Browser)</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          1
                        </span>
                        <div>
                          अपने ब्राउज़र (Chrome) में ऊपर दाएं कोने में मौजूद <strong>तीन बिंदु (⋮)</strong> मेनू आइकन दबाएं।
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          2
                        </span>
                        <div>
                          मेनू लिस्ट में से <strong>"Install app" (ऐप इंस्टॉल करें)</strong> या <strong>"Add to Home screen" (होम स्क्रीन में जोड़ें)</strong> पर टैप करें।
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          3
                        </span>
                        <div>
                          <strong>"Install / Add"</strong> पर क्लिक करें। ऐप तुरंत आपके फोन के होम स्क्रीन पर आ जाएगी!
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-700">
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-sm">
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      <span>iPhone / iPad (Safari Browser)</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          1
                        </span>
                        <div>
                          Safari में नीचे मौजूद <strong>शेयर (Share ⎋)</strong> बटन पर टैप करें।
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          2
                        </span>
                        <div>
                          नीचे स्क्रॉल करें और <strong>"Add to Home Screen" (होम स्क्रीन में जोड़ें)</strong> को चुनें।
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          3
                        </span>
                        <div>
                          ऊपर दाएं कोने में <strong>"Add" (जोड़ें)</strong> दबाएं। अब भीम डायरेक्टरी ऐप आपके आईफोन पर हमेशा मौजूद रहेगी।
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-medium">
            वागड़ चौरासी यादव समाज
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
