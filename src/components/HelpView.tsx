import React, { useState } from 'react';
import { BannerAd } from './BannerAd';
import {
  Phone,
  MessageCircle,
  Copy,
  Check,
  HelpCircle,
  MapPin,
  User,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
  Plus,
  Sparkles,
  Layers,
  Home,
  FileText,
  Download
} from 'lucide-react';

interface HelpViewProps {
  onOpenAddModal: () => void;
  onGoToHome: () => void;
  onGoToVillages: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenInstallModal?: () => void;
}

export const HelpView: React.FC<HelpViewProps> = ({
  onOpenAddModal,
  onGoToHome,
  onGoToVillages,
  onOpenPrivacyPolicy,
  onOpenInstallModal,
}) => {
  const [copied, setCopied] = useState(false);

  const contactName = 'NAGJI YADAV';
  const contactVillage = 'SAKODARA';
  const contactPhone = '9982151938';
  const whatsappUrl = `https://wa.me/91${contactPhone}?text=${encodeURIComponent(
    'Jai Bhim / Hello Nagji Yadav ji, I need assistance regarding the Bhim Directory.'
  )}`;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(contactPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-950/15 relative overflow-hidden text-center sm:text-left">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/20 flex-shrink-0">
            <HeartHandshake className="w-9 h-9 stroke-[2.2]" />
          </div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>सहायता एवं संपर्क केंद्र (Help & Support)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              किसी भी सहायता हेतु संपर्क करें
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 font-medium max-w-xl leading-relaxed">
              भीम डायरेक्टरी में नया नंबर जुड़वाने, किसी गलत नंबर में सुधार करवाने, गाँव जोड़ने या ऐप के उपयोग में किसी भी समस्या के लिए आप नीचे दिए गए नंबर पर निसंकोच संपर्क कर सकते हैं।
            </p>
          </div>
        </div>
      </div>

      {/* Main Official Contact Card: NAGJI YADAV SAKODARA */}
      <div className="bg-white rounded-3xl border-2 border-amber-300/80 p-6 sm:p-7 shadow-md relative overflow-hidden">
        {/* Top Tag */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>संगठन सहायता प्रभारी / एडमिन प्रतिनिधि</span>
          </span>
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
            Direct Helpline
          </span>
        </div>

        {/* Person Identity */}
        <div className="pt-4 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center text-2xl font-black shadow-inner flex-shrink-0 ring-4 ring-blue-50">
              <User className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                NAGJI YADAV
              </h3>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 mt-1">
                <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span className="font-extrabold text-slate-900">SAKODARA</span>
                <span className="text-slate-400 font-normal">(सकोदरा)</span>
                <span className="text-slate-300">•</span>
                <span className="text-blue-700 font-semibold">Vagad Chourasi</span>
              </div>
            </div>
          </div>

          {/* Number Display Pill */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:px-4 sm:py-2.5 flex items-center justify-between sm:justify-end gap-3">
            <div>
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                मोबाइल नंबर
              </span>
              <span className="text-lg sm:text-xl font-mono font-black text-slate-900 tracking-wider">
                99821 51938
              </span>
            </div>
            <button
              type="button"
              id="help-copy-phone-btn"
              onClick={handleCopyPhone}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
              title="नंबर कॉपी करें"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Prominent Action Buttons: Call & WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Direct Phone Call */}
          <a
            href={`tel:+91${contactPhone}`}
            id="help-call-nagji-btn"
            className="flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm sm:text-base shadow-md shadow-emerald-700/20 transition-all text-center"
          >
            <Phone className="w-5 h-5 fill-white stroke-none" />
            <span>सीधे कॉल करें (Call Now)</span>
          </a>

          {/* WhatsApp Chat */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="help-whatsapp-nagji-btn"
            className="flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-black text-sm sm:text-base shadow-md shadow-emerald-600/20 transition-all text-center"
          >
            <MessageCircle className="w-5 h-5 fill-white stroke-none" />
            <span>व्हाट्सएप पर संदेश भेजें</span>
          </a>
        </div>

        {copied && (
          <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 text-center animate-in fade-in duration-150">
            ✅ मोबाइल नंबर (9982151938) क्लिपबोर्ड पर कॉपी हो गया है!
          </div>
        )}
      </div>

      {/* When to contact / किस तरह की सहायता ले सकते हैं? */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-700" />
          <span>आप किस संबंध में सहायता ले सकते हैं?</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">1</span>
              नया नाम / नंबर दर्ज करवाना
            </span>
            <p className="text-xs text-slate-600 leading-relaxed pl-8">
              यदि आप अपना या अपने परिवार के सदस्य का संपर्क नंबर डायरेक्टरी में जोड़ना चाहते हैं।
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black">2</span>
              गलत नंबर या पता सुधारना
            </span>
            <p className="text-xs text-slate-600 leading-relaxed pl-8">
              यदि डायरेक्टरी में किसी नंबर, नाम या गाँव में कोई त्रुटि हो, तो उसे ठीक कराने हेतु।
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">3</span>
              नया गाँव या क्षेत्र जोड़ना
            </span>
            <p className="text-xs text-slate-600 leading-relaxed pl-8">
              यदि आपके गाँव का नाम सूची में उपलब्ध नहीं है, तो उसे तुरंत पंजीकृत करवाने हेतु।
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black">4</span>
              ऐप उपयोग व तकनीकी मदद
            </span>
            <p className="text-xs text-slate-600 leading-relaxed pl-8">
              ऐप को फोन में सेव/इंस्टॉल करने या डायरेक्टरी के उपयोग में किसी भी समस्या के लिए।
            </p>
          </div>
        </div>
      </div>

      {/* Mobile App Install Banner Card */}
      {onOpenInstallModal && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg border border-blue-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-md">
              <Download className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/30 text-amber-300 text-[11px] font-black border border-blue-400/30 mb-1">
                <span>📱 1-CLICK MOBILE APP</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                भीम डायरेक्टरी को मोबाइल में इंस्टॉल करें
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                सीधे फोन स्क्रीन पर आइकन बन जाएगा। बिना ब्राउज़र तुरंत खुलेगा और ऑफ़लाइन भी चलेगा।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer flex-shrink-0"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>ऐप इंस्टॉल करें</span>
          </button>
        </div>
      )}

      {/* Quick Self-Service Options */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-3xl border border-blue-100 p-6 space-y-3">
        <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
          स्वयं भी अनुरोध भेज सकते हैं (Self Service Options)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all shadow-2xs group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-700">
                  नया संपर्क जोड़ें
                </span>
                <span className="text-2xs text-slate-500">অনुरोध फॉर्म भरें</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            type="button"
            onClick={onGoToVillages}
            className="p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all shadow-2xs group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-700">
                  गाँव डायरेक्टरी देखें
                </span>
                <span className="text-2xs text-slate-500">गाँव अनुसार सूची</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            type="button"
            onClick={onGoToHome}
            className="p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all shadow-2xs group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-700">
                  मुख्य पृष्ठ (Home)
                </span>
                <span className="text-2xs text-slate-500">सभी संपर्क खोजें</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* AdMob Banner (Non-disturbing partner placement) */}
      <BannerAd placement="in-feed" />

      {/* Sangthan Footer Note & Privacy Policy */}
      <div className="text-center space-y-2 text-xs text-slate-500 pt-2">
        {onOpenPrivacyPolicy && (
          <div>
            <button
              type="button"
              onClick={onOpenPrivacyPolicy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-700" />
              <span>गोपनीयता नीति (Privacy Policy) पढ़ें</span>
            </button>
          </div>
        )}
        <p className="font-bold text-slate-700">
          डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी
        </p>
        <p className="text-2xs text-slate-400">
          भीम डायरेक्टरी - समाज को जोड़ने और संगठित करने का डिजिटल मंच
        </p>
      </div>
    </div>
  );
};
