import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, Database, UserCheck, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-blue-50/70 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                गोपनीयता नीति (Privacy Policy)
              </h2>
              <p className="text-2xs sm:text-xs text-blue-700 font-semibold">
                यादव समाज मोबाइल डायरेक्टरी - डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Policy Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Introduction */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm sm:text-base">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>1. परिचय एवं उद्देश्य (Introduction & Purpose)</span>
            </div>
            <p>
              यह <strong>यादव समाज मोबाइल डायरेक्टरी (Mobile Directory)</strong> एप्लिकेशन <strong>डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी</strong> के समाज बंधुओं के आपसी संपर्क, सामाजिक समन्वय एवं आपातकालीन सहयोग के लिए तैयार की गई है। हम आपके व्यक्तिगत डेटा की गोपनीयता एवं सुरक्षा का पूर्ण सम्मान करते हैं।
            </p>
            <p className="text-slate-500 text-2xs">
              अंतिम अद्यतन (Last Updated): 18 सितम्बर 2026
            </p>
          </div>

          {/* Data Collected */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm sm:text-base">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>2. हम क्या जानकारी एकत्र करते हैं (Information We Collect)</span>
            </div>
            <p>
              डायरेक्टरी में केवल वही आवश्यक जानकारी दर्ज की जाती है जो सामाजिक संपर्क हेतु स्वयं सदस्यों द्वारा या उनके अनुरोध पर प्रदान की जाती है:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>नाम एवं गाँव:</strong> सदस्य का नाम तथा वागड़ चौरासी क्षेत्र का संबंधित गाँव।</li>
              <li><strong>मोबाइल नंबर:</strong> प्राथमिक एवं वैकल्पिक संपर्क नंबर (सीधे कॉल या व्हाट्सएप करने के उद्देश्य से)।</li>
              <li><strong>पेशा / कार्य श्रेणी:</strong> जैसे कृषि, सरकारी सेवा, व्यवसाय, ई-मित्र, मिस्त्री आदि (ताकि जरूरतमंद बंधु आसानी से संपर्क कर सकें)।</li>
              <li><strong>वार्ड / पता एवं टिप्पणी:</strong> स्थानीय पते या आवश्यक टिप्पणी का संक्षिप्त विवरण।</li>
            </ul>
          </div>

          {/* Data Usage */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm sm:text-base">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>3. जानकारी का उपयोग (How We Use Your Data)</span>
            </div>
            <p>
              एकत्र की गई जानकारी का उपयोग निम्नलिखित कार्यों के अतिरिक्त किसी भी अन्य उद्देश्य के लिए <strong>नहीं</strong> किया जाता:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>समाज बंधुओं को फोन कॉल या व्हाट्सएप के माध्यम से सीधे संपर्क की सुविधा देना।</li>
              <li>सामाजिक कार्यक्रमों, आपातकालीन आवश्यकताओं (रक्तदान, चिकित्सा सहायता आदि) में शीघ्र संपर्क स्थापित करना।</li>
              <li>गाँव अनुसार समाज की डायरेक्टरी सूची प्रदर्शित करना।</li>
              <li><strong>व्यावसायिक विज्ञापनों, मार्केटिंग कंपनियों या किसी तीसरे पक्ष को डेटा बेचना सख्त वर्जित है।</strong></li>
            </ul>
          </div>

          {/* Google Sheets and Storage */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm sm:text-base">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>4. डेटा भंडारण व सुरक्षा (Data Storage & Security)</span>
            </div>
            <p>
              डेटा को सुरक्षित क्लाउड डेटाबेस एवं संगठन के अधिकृत Google Sheets स्टोरेज में संग्रहीत किया जाता है। डेटाबेस में नए नंबर जोड़ने, संशोधन करने या हटाने का पूर्ण अधिकार केवल अधिकृत एडमिन (Nagji Yadav Sakodara) के पास सुरक्षित है, ताकि किसी भी अनधिकृत छेड़छाड़ को रोका जा सके।
            </p>
          </div>

          {/* User Rights */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm sm:text-base">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>5. आपके अधिकार एवं डेटा हटाने का अनुरोध (Your Rights & Removal)</span>
            </div>
            <p>
              प्रत्येक सदस्य को अपने डेटा पर पूर्ण अधिकार है:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>सुधार अनुरोध:</strong> यदि आपके नाम, नंबर या गाँव में कोई त्रुटि है, तो आप ऐप के <em>'सुधार या हटाने का अनुरोध'</em> बटन द्वारा सीधे सुधार भेज सकते हैं।</li>
              <li><strong>नंबर हटवाना (Opt-out):</strong> यदि आप अपना नंबर डायरेक्टरी से हटाना चाहते हैं, तो तुरंत हटाने का अनुरोध दर्ज कर सकते हैं या संगठन सहायता प्रभारी से संपर्क कर सकते हैं। सत्यापन के पश्चात आपका नंबर तुरंत हटा दिया जाएगा।</li>
            </ul>
          </div>

          {/* Contact Officer */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
            <div className="font-bold text-slate-900 text-xs sm:text-sm">
              गोपनीयता अधिकारी एवं सहायता संपर्क:
            </div>
            <p className="text-slate-600 text-xs">
              <strong>नाम:</strong> NAGJI YADAV (सकोदरा)<br />
              <strong>पद:</strong> संगठन प्रतिनिधि एवं मुख्य एडमिन<br />
              <strong>मोबाइल:</strong> +91 9982151938<br />
              <strong>ईमेल:</strong> yadavnagji@gmail.com
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end bg-slate-50 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm shadow-blue-700/20 cursor-pointer"
          >
            समझ गया / बन्द करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
