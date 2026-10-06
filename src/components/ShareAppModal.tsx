import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  MessageCircle,
  QrCode,
  Download,
  Send,
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [activeTab, setActiveTab] = useState<'share' | 'playstore'>('share');

  if (!isOpen) return null;

  // Direct app URL
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bhim-directory.web.app';
  
  // Play Store target link (Configured for Google Play Store)
  const defaultPackage = 'com.bhimdirectory.app';
  const [playStorePackage, setPlayStorePackage] = useState(() => {
    return localStorage.getItem('bhim_playstore_package') || defaultPackage;
  });

  const playStoreUrl = `https://play.google.com/store/apps/details?id=${playStorePackage}`;
  
  // Primary Share Text emphasizing Google Play Store download
  const shareTitle = 'BHIM DIRECTORY - डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी';
  const shareText = `📱 *BHIM DIRECTORY* - डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी\n\nअपने गाँव के सभी नागरिकों के मोबाइल नंबर, पते व आवश्यक संपर्क देखने के लिए नीचे दिए गए Google Play Store लिंक से ऐप डाउनलोड व इंस्टॉल करें:\n\n📥 *Play Store Download Link:*\n👉 ${playStoreUrl}\n\n(🌐 वेब डायरेक्टरी: ${appUrl})\n\nजय भीम! 🇮🇳`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: playStoreUrl,
        });
      } catch {
        // User cancelled or fallback
      }
    } else {
      handleCopyText();
    }
  };

  const handleCopyPlayStoreLink = () => {
    navigator.clipboard.writeText(playStoreUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(playStoreUrl)}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                भीम डायरेक्टरी ऐप शेयर करें
              </h2>
              <p className="text-2xs sm:text-xs text-blue-200">
                व्हाट्सएप व अन्य माध्यमों से सभी भाइयों को भेजें
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'share'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>व्हाट्सएप / डायरेक्ट शेयर</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('playstore')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'playstore'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>प्ले स्टोर ऐप जानकारी</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {activeTab === 'share' ? (
            <div className="space-y-4">
              {/* Direct Play Store Install Button */}
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="modal-direct-playstore-btn"
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-900 active:scale-[0.98] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer border border-slate-700"
              >
                <Smartphone className="w-5 h-5 text-amber-400" />
                <span>Google Play Store से ऐप इंस्टॉल करें</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>

              {/* WhatsApp Big Share Button with Play Store link */}
              <button
                type="button"
                id="share-whatsapp-btn"
                onClick={handleWhatsAppShare}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>व्हाट्सएप पर शेयर करें (Play Store Link सहित)</span>
              </button>

              {/* Native Mobile Share Button */}
              <button
                type="button"
                id="share-native-mobile-btn"
                onClick={handleNativeShare}
                className="w-full py-3 px-4 rounded-2xl bg-blue-700 hover:bg-blue-800 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>अन्य ऐप्स पर शेयर करें (SMS, Telegram, Facebook)</span>
              </button>

              {/* Copy Share Message Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">शेयर मैसेज (Play Store Link):</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyPlayStoreLink}
                      className="inline-flex items-center gap-1 text-2xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'लिंक कॉपी हुआ!' : 'प्ले स्टोर लिंक कॉपी'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="inline-flex items-center gap-1 text-2xs font-bold text-slate-700 hover:text-slate-900 bg-slate-200 px-2 py-1 rounded-lg"
                    >
                      {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedMsg ? 'कॉपी हुआ!' : 'पूरा मैसेज'}</span>
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 font-sans whitespace-pre-line leading-relaxed max-h-28 overflow-y-auto">
                  {shareText}
                </div>
              </div>

              {/* QR Code and Direct Play Store Link */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-4">
                <div className="bg-white p-2 rounded-xl shadow-xs border border-blue-100 flex-shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="App QR Code"
                    className="w-20 h-20 rounded-md"
                  />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-black text-blue-950">
                    <QrCode className="w-4 h-4 text-blue-700" />
                    <span>Play Store QR कोड स्कैन करें</span>
                  </div>
                  <p className="text-2xs text-slate-600 leading-snug">
                    सामने वाले के फोन कैमरा से स्कैन कराते ही सीधे Google Play Store डाउनलोड पेज खुल जाएगा।
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyPlayStoreLink}
                    className="inline-flex items-center gap-1 text-2xs font-bold text-blue-800 hover:underline pt-0.5"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Play Store लिंक कॉपी हुआ!' : 'Play Store लिंक कॉपी करें'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-slate-800">
              {/* Play Store Info Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                  <span className="text-base">📲</span>
                  <span>Google Play Store एवं डायरेक्ट मोबाइल ऐप</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  इस शेयर लिंक को खोलते ही मोबाइल पर तुरंत <strong>"Add to Home Screen / ऐप इंस्टॉल करें"</strong> का विकल्प आता है, जिससे यह बिना प्ले स्टोर के भी एक असली Android ऐप की तरह फोन में इंस्टॉल हो जाती है।
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black">1</span>
                    <span>प्ले स्टोर पब्लिशिंग (Google Play Console)</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    यदि आपका संगठन इस ऐप को Google Play Store पर सीधे पब्लिश करना चाहता है, तो यह ऐप पूरी तरह PWA (Progressive Web App) और TWA (Trusted Web Activity) रेडी है। 
                  </p>
                  <div className="mt-1 p-2 bg-slate-50 rounded-lg text-2xs font-mono text-slate-700 border border-slate-200 select-all">
                    पैकेज नाम: {playStorePackage}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black">2</span>
                    <span>1-क्लिक डायरेक्ट फोन इंस्टॉलेशन (बिना किसी शुल्क के)</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    शेयर लिंक पर क्लिक करते ही क्रोम ब्राउज़र में नीचे <strong>"Install BHIM Directory"</strong> का बटन आता है। उस पर क्लिक करते ही यह ऐप मोबाइल की होम स्क्रीन पर बाबासाहेब के फोटो वाले आइकन के साथ हमेशा के लिए सेव हो जाती है।
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>अभी व्हाट्सएप पर भेजें</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
                >
                  बंद करें
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
