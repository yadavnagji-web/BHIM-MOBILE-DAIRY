import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  BookOpen,
  Share2,
  Check,
  ChevronDown
} from 'lucide-react';
import { Contact, Village } from '../types';

interface PrintDiaryModalProps {
  isOpen?: boolean;
  onClose: () => void;
  contacts: Contact[];
  villages: Village[];
}

export const PrintDiaryModal: React.FC<PrintDiaryModalProps> = ({
  isOpen = true,
  onClose,
  contacts,
  villages,
}) => {
  const [selectedVillageId, setSelectedVillageId] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'guide' | 'preview' | 'cover'>('preview');
  const [copied, setCopied] = useState(false);

  // App URL for QR Code
  const appUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : 'https://yadav-samaj-directory.web.app';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(appUrl)}&margin=10`;

  // Filter contacts by village for print
  const printContacts = useMemo(() => {
    let list = contacts;
    if (selectedVillageId !== 'all') {
      list = list.filter((c) => c.villageId === selectedVillageId);
    }
    // Sort alphabetically by Hindi/English name
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'hi'));
  }, [contacts, selectedVillageId]);

  // Group contacts by village for the "all villages" diary print layout
  const contactsByVillage = useMemo(() => {
    const map = new Map<string, Contact[]>();
    villages.forEach((v) => map.set(v.id, []));
    contacts.forEach((c) => {
      const list = map.get(c.villageId) || [];
      list.push(c);
      map.set(c.villageId, list);
    });
    return map;
  }, [villages, contacts]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full">
        {/* Header - Hidden during print */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between border-b border-blue-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                मोबाइल डायरेक्टरी डायरी प्रिंटिंग व QR कनेक्ट
              </h2>
              <p className="text-2xs sm:text-xs text-blue-200 font-medium">
                छपाई (Offset Press) हेतु रेडी-टू-प्रिंट फॉर्मेट एवं डिजिटल ऐप कनेक्शन
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

        {/* Tab Controls - Hidden during print */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveSubTab('preview')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeSubTab === 'preview'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              📄 डायरी पेज पूर्वावलोकन (Pages)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('cover')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeSubTab === 'cover'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              📖 डायरी कवर व QR कोड (Cover)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('guide')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeSubTab === 'guide'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              💡 डायरी को ऐप से जोड़ने का तरीका
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट / PDF सेव करें</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 print:p-0 print:overflow-visible">
          {/* TAB 1: GUIDE (HOW TO CONNECT) */}
          {activeSubTab === 'guide' && (
            <div className="space-y-4 text-slate-800">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <span>छपी हुई डायरी (Printed Diary) को इस ऐप से कैसे जोड़ें?</span>
                </h3>
                <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">
                  कागज़ की डायरी छपवाने के बाद भी समय के साथ लोगों के मोबाइल नंबर बदलते रहते हैं या नए लोगों के नंबर जोड़ने होते हैं। इस डिजिटल ऐप और क्यूआर कोड (QR Code) के माध्यम से आपकी छपी हुई डायरी हमेशा <strong>लाइव और अपडेटेड</strong> रहेगी!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 font-black flex items-center justify-center text-sm">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    डायरी के मुख्य कवर और पहले पेज पर QR कोड छपवाएं
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    डायरी के मुख्य कवर या अनुक्रमणिका (Index) पेज पर ऐप का क्यूआर कोड लगवाएं और नीचे लिखें:
                    <br />
                    <span className="inline-block mt-1 font-semibold text-blue-800 bg-blue-50 px-2 py-1 rounded">
                      "लाइव एवं नए संपर्क नंबर देखने हेतु मोबाइल कैमरा से स्कैन करें"
                    </span>
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 font-black flex items-center justify-center text-sm">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    प्रत्येक गाँव के शीर्षक पर निर्देश दें
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    डायरी में हर गाँव के पन्ने के नीचे एक पंक्ति छपवाएं:
                    <br />
                    <span className="inline-block mt-1 font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                      "यदि आपका नाम या नंबर छूट गया है, तो QR स्कैन कर 'नया जोड़ें' पर भेजें।"
                    </span>
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 font-black flex items-center justify-center text-sm">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    प्रिंटिंग प्रेस को सीधे डेटा कैसे दें?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    प्रिंटिंग प्रेस वाले को टाइपिंग का झंझट न हो, इसके लिए आप हमारे <strong>"Import / Export"</strong> बटन से 1 क्लिक में पूरी Excel/CSV फाइल डाउनलोड करके प्रेस वाले को पेनड्राइव या व्हाट्सएप पर भेज सकते हैं।
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 font-black flex items-center justify-center text-sm">
                    4
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    एडमिन द्वारा रीयल-टाइम अपडेट
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    गाँव का कोई भी व्यक्ति जब ऐप में अपना नया नंबर दर्ज करेगा, तो एडमिन पैनल में वह तुरंत सुरक्षित हो जाएगा। डायरी हाथ में रखने वाला व्यक्ति जब भी QR स्कैन करेगा, उसे तुरंत नया नंबर मिल जाएगा!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COVER PAGE & QR CODE PREVIEW */}
          {activeSubTab === 'cover' && (
            <div className="space-y-4">
              <div className="max-w-md mx-auto bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 text-center border-4 border-amber-400 shadow-xl space-y-4">
                <div className="w-28 h-28 rounded-full ring-4 ring-amber-400 overflow-hidden mx-auto bg-white shadow-md">
                  <img
                    src="/ambedkar_portrait.jpg"
                    alt="डॉ. बी. आर. अम्बेडकर"
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-amber-300">
                    YADAV SAMAJ MOBILE DIRECTORY
                  </h3>
                  <h4 className="text-sm font-extrabold text-white">
                    डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी
                  </h4>
                  <p className="text-xs text-blue-200">
                    ग्राम मोबाइल संपर्क डायरेक्टरी (वर्ष 2026-27)
                  </p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mx-auto">
                  <img
                    src={qrCodeUrl}
                    alt="Yadav Samaj Mobile Directory App QR Code"
                    className="w-44 h-44 mx-auto rounded-lg"
                  />
                  <span className="block text-2xs font-bold text-slate-800 mt-1">
                    कैमरा से स्कैन करें
                  </span>
                </div>

                <div className="bg-white/10 p-3 rounded-xl border border-white/20 text-xs font-semibold text-blue-100">
                  📱 ऑनलाइन डायरेक्टरी लिंक:
                  <div className="text-2xs text-amber-300 break-all select-all font-mono mt-0.5">
                    {appUrl}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  <span>{copied ? 'लिंक कॉपी हो गया!' : 'डायरेक्टरी लिंक कॉपी करें'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRINTABLE PAGES LAYOUT */}
          {activeSubTab === 'preview' && (
            <div className="space-y-6">
              {/* Filter bar - hidden during print */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">गाँव चुनें:</span>
                  <div className="relative">
                    <select
                      value={selectedVillageId}
                      onChange={(e) => setSelectedVillageId(e.target.value)}
                      className="pl-3 pr-8 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 appearance-none"
                    >
                      <option value="all">🌐 सभी गाँव एक साथ (All Villages)</option>
                      {villages.map((v) => (
                        <option key={v.id} value={v.id}>
                          🏘️ {v.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-2 pointer-events-none" />
                  </div>
                </div>

                <span className="text-xs font-semibold text-slate-500">
                  कुल {printContacts.length} संपर्क प्रिंट हेतु तैयार
                </span>
              </div>

              {/* PRINTABLE DOCUMENT AREA */}
              <div className="print-area bg-white text-slate-900 font-sans">
                {selectedVillageId !== 'all' ? (
                  /* Single Village Print */
                  <div>
                    {/* Header for single village */}
                    <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                      <h2 className="text-xl font-black text-slate-900">
                        डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी
                      </h2>
                      <h3 className="text-base font-extrabold text-blue-900 mt-0.5">
                        ग्राम: {villages.find((v) => v.id === selectedVillageId)?.name || ''} - मोबाइल डायरेक्टरी
                      </h3>
                      <p className="text-xs text-slate-600">
                        कुल संपर्क: {printContacts.length} | ऑनलाइन डायरेक्टरी QR स्कैन करें
                      </p>
                    </div>

                    <table className="w-full border-collapse border border-slate-400 text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-black">
                          <th className="border border-slate-400 px-2 py-1.5 text-center w-10">क्र.</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-left">नाम</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-left">श्रेणी / व्यवसाय</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-center font-mono">मोबाइल नंबर</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-center font-mono">अन्य नंबर</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-left">मोहल्ला / पता</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printContacts.map((c, index) => (
                          <tr key={c.id} className="even:bg-slate-50">
                            <td className="border border-slate-300 px-2 py-1 text-center font-bold">{index + 1}</td>
                            <td className="border border-slate-300 px-3 py-1 font-bold">{c.name}</td>
                            <td className="border border-slate-300 px-3 py-1 text-slate-700">{c.category || '-'}</td>
                            <td className="border border-slate-300 px-3 py-1 text-center font-mono font-bold">{c.mobile}</td>
                            <td className="border border-slate-300 px-3 py-1 text-center font-mono text-slate-600">{c.alternateMobile || '-'}</td>
                            <td className="border border-slate-300 px-3 py-1 text-slate-600">{c.address || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* All Villages Print (Village by Village with Page Breaks) */
                  <div className="space-y-8">
                    {villages.map((village) => {
                      const vContacts = contactsByVillage.get(village.id) || [];
                      if (vContacts.length === 0) return null;
                      return (
                        <div key={village.id} className="break-after-page page-break pt-2">
                          <div className="text-center border-b-2 border-slate-800 pb-2 mb-3">
                            <h2 className="text-lg font-black text-slate-900">
                              डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी
                            </h2>
                            <h3 className="text-base font-extrabold text-blue-900">
                              गाँव: {village.name} (कुल: {vContacts.length})
                            </h3>
                          </div>

                          <table className="w-full border-collapse border border-slate-400 text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-slate-900 font-black">
                                <th className="border border-slate-400 px-2 py-1.5 text-center w-10">क्र.</th>
                                <th className="border border-slate-400 px-3 py-1.5 text-left">नाम</th>
                                <th className="border border-slate-400 px-3 py-1.5 text-left">श्रेणी / व्यवसाय</th>
                                <th className="border border-slate-400 px-3 py-1.5 text-center font-mono">मोबाइल नंबर</th>
                                <th className="border border-slate-400 px-3 py-1.5 text-center font-mono">अन्य नंबर</th>
                                <th className="border border-slate-400 px-3 py-1.5 text-left">मोहल्ला / पता</th>
                              </tr>
                            </thead>
                            <tbody>
                              {vContacts.map((c, index) => (
                                <tr key={c.id} className="even:bg-slate-50">
                                  <td className="border border-slate-300 px-2 py-1 text-center font-bold">{index + 1}</td>
                                  <td className="border border-slate-300 px-3 py-1 font-bold">{c.name}</td>
                                  <td className="border border-slate-300 px-3 py-1 text-slate-700">{c.category || '-'}</td>
                                  <td className="border border-slate-300 px-3 py-1 text-center font-mono font-bold">{c.mobile}</td>
                                  <td className="border border-slate-300 px-3 py-1 text-center font-mono text-slate-600">{c.alternateMobile || '-'}</td>
                                  <td className="border border-slate-300 px-3 py-1 text-slate-600">{c.address || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
