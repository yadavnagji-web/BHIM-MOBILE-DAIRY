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
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalContacts?: number;
  totalVillages?: number;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  totalContacts = 0,
  totalVillages = 15
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (!isOpen) return null;

  // Direct Installable Vercel App URL requested by user
  const liveAppUrl = 'https://bhim-mobile-dairy-lnkm.vercel.app/';

  const shareTitle = 'YADAV SAMAJ MOBILE DIRECTORY - डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी';
  const shareText = `📱 *YADAV SAMAJ MOBILE DIRECTORY (मोबाइल डायरेक्टरी)*
🏛️ *डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी*

अपने गाँव के सभी समाज बंधुओं के सत्यापित मोबाइल नंबर, व्यवसाय व गाँव सूची देखने के लिए नीचे दिए गए लाइव लिंक से सीधे 1-क्लिक में ऐप खोलें व इंस्टॉल करें:

🌐 *लाइव ऐप इंस्टॉल लिंक (App Install Link):*
👉 ${liveAppUrl}

📊 *वर्तमान लाइव रिकॉर्ड:*
• कुल क्षेत्र/गाँव: ${totalVillages} गाँव
• पंजीकृत संपर्क: ${totalContacts} संपर्क
• 100% WhatsApp OTP सत्यापित नंबर

(लिंक खोलते ही सीधे "इनस्टॉल करें / Install App" बटन दबाकर फोन की होम स्क्रीन पर ऐप सेव कर सकते हैं)

जय भीम! 🇮🇳`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: liveAppUrl,
        });
      } catch {}
    } else {
      handleCopyText();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveAppUrl);
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

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(liveAppUrl)}&margin=8`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Share2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                यादव समाज मोबाइल डायरेक्टरी शेयर करें
              </h2>
              <p className="text-2xs sm:text-xs text-blue-200 font-medium">
                लाइव रिकॉर्ड के साथ WhatsApp व अन्य माध्यमों से भेजें
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Live App Info Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-200/80 text-blue-900 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                <span>LIVE WORKING APP</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {totalContacts} लाइव रिकॉर्ड
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">लाइव ऐप लिंक:</span>
              <div className="p-2.5 bg-white border border-blue-200 rounded-xl flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-blue-900 truncate font-semibold">
                  {liveAppUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'कॉपी हुआ' : 'कॉपी'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action: Direct WhatsApp Share */}
          <button
            type="button"
            id="share-whatsapp-btn"
            onClick={handleWhatsAppShare}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-98 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#25D366]/25 transition cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-white stroke-none" />
            <span>WhatsApp पर शेयर करें (Share on WhatsApp)</span>
          </button>

          {/* Native Device Share / Copy Text */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleNativeShare}
              className="py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>अन्य ऐप पर भेजें</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-300"
            >
              {copiedMsg ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copiedMsg ? 'मैसेज कॉपी हुआ!' : 'पूरा मैसेज कॉपी करें'}</span>
            </button>
          </div>

          {/* QR Code Section */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
            <div className="w-20 h-20 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs flex-shrink-0">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                <QrCode className="w-4 h-4 text-blue-700" />
                <span>QR कोड स्कैन करके खोलें</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                कोई भी व्यक्ति अपने मोबाइल कैमरे से इस कोड को स्कैन करके सीधे यादव समाज मोबाइल डायरेक्टरी ऐप खोल और इंस्टॉल कर सकता है।
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500">
            वागड़ चौरासी यादव समाज डिजिटल डायरेक्टरी
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
