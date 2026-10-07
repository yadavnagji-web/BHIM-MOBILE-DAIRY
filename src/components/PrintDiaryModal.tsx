import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  BookOpen,
  Share2,
  Check,
  ChevronDown,
  QrCode
} from 'lucide-react';
import QRCode from 'qrcode';
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
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'cover' | 'guide'>('preview');
  const [copied, setCopied] = useState(false);
  const [villageQrMap, setVillageQrMap] = useState<Record<string, string>>({});

  // Base URL for app
  const baseAppUrl = typeof window !== 'undefined'
    ? window.location.origin + window.location.pathname
    : 'https://ais-dev-wnq4hs5kseyfepdlmwvoxr-461049006452.asia-southeast1.run.app';

  const generalQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseAppUrl)}&margin=8`;

  // Pre-generate offline high-resolution vector/data QR codes for each village
  useEffect(() => {
    let isMounted = true;
    const generateAllQrs = async () => {
      const qrs: Record<string, string> = {};
      for (const v of villages) {
        const targetUrl = `${baseAppUrl}?village=${encodeURIComponent(v.id)}`;
        try {
          const qrDataUri = await QRCode.toDataURL(targetUrl, {
            width: 260,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          qrs[v.id] = qrDataUri;
        } catch {
          qrs[v.id] = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(targetUrl)}&margin=4`;
        }
      }
      if (isMounted) {
        setVillageQrMap(qrs);
      }
    };

    generateAllQrs();
    return () => {
      isMounted = false;
    };
  }, [villages, baseAppUrl]);

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
    // Sort contacts inside each village alphabetically
    map.forEach((list, vId) => {
      list.sort((a, b) => a.name.localeCompare(b.name, 'hi'));
      map.set(vId, list);
    });
    return map;
  }, [villages, contacts]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(baseAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Print Specific CSS Rules for Page Breaks & Clean Table Typography */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 12mm 10mm;
          }
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Segoe UI', Nirmala UI, Mangal, Arial, sans-serif !important;
          }
          .print-hidden, nav, header, footer {
            display: none !important;
          }
          .print-village-page {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: auto !important;
            display: block !important;
            clear: both !important;
            padding-top: 4mm !important;
          }
          .print-village-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          th {
            background-color: #0f172a !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          td {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-qr-box {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none">
        {/* Header - Hidden during print */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between border-b border-blue-800 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md font-bold shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black tracking-tight text-white">
                मोबाइल डायरी प्रिंटिंग व गाँव QR कोड
              </h2>
              <p className="text-2xs sm:text-xs text-blue-200 font-medium">
                छपाई (Offset Press) हेतु रेडी-टू-प्रिंट 5-कॉलम फॉर्मेट एवं अलग-अलग पृष्ठ पर गाँव का डेटा
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

        {/* Tab Controls - Hidden during print */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 print:hidden shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveSubTab('preview')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'preview'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              📄 डायरी पेज (Print Preview)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('cover')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'cover'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              📖 डायरी कवर (Cover Page)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('guide')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'guide'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              💡 छपाई निर्देश (Guide)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-98 text-white text-xs font-black shadow-md shadow-blue-700/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट / PDF सेव करें</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 print:p-0 print:overflow-visible">
          {/* TAB 1: PRINTABLE PAGES LAYOUT */}
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
                      className="pl-3 pr-8 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 appearance-none cursor-pointer"
                    >
                      <option value="all">🌐 सभी गाँव (प्रत्येक गाँव नए पृष्ठ से शुरू)</option>
                      {villages.map((v) => (
                        <option key={v.id} value={v.id}>
                          🏘️ {v.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-2 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-2xs sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    ✓ 5 कॉलम: क्र.सं., नाम, पिता/पति का नाम, मोबाइल नंबर, व्यवसाय
                  </span>
                  <span className="text-2xs sm:text-xs font-semibold text-slate-500">
                    कुल {printContacts.length} संपर्क
                  </span>
                </div>
              </div>

              {/* PRINTABLE DOCUMENT AREA */}
              <div className="print-area bg-white text-slate-900 font-sans">
                {selectedVillageId !== 'all' ? (
                  /* Single Village Print */
                  (() => {
                    const village = villages.find((v) => v.id === selectedVillageId);
                    const vName = village?.name || 'गाँव';
                    const qrSrc =
                      (village && villageQrMap[village.id]) ||
                      `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                        `${baseAppUrl}?village=${selectedVillageId}`
                      )}&margin=4`;

                    return (
                      <div className="print-village-page">
                        {/* Header Box with Org Name, Village Title, and Village QR Code */}
                        <div className="border-2 border-slate-900 rounded-2xl p-3 sm:p-4 mb-3 bg-slate-50/60 print:bg-white flex items-center justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <span className="inline-block text-2xs uppercase tracking-wider font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded print:border print:border-slate-400">
                              यादव समाज मोबाइल डायरेक्टरी • वागड़ चौरासी (2026-27)
                            </span>
                            <h2 className="text-base sm:text-lg font-black text-slate-950">
                              डॉ. बी. आर. अम्बेडकर यादव युवा संगठन
                            </h2>
                            <h3 className="text-lg sm:text-xl font-extrabold text-blue-900 flex items-center gap-2">
                              <span>ग्राम: {vName}</span>
                              <span className="text-xs font-bold text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded-full">
                                कुल संपर्क: {printContacts.length}
                              </span>
                            </h3>
                            <p className="text-2xs text-slate-600">
                              * इस गाँव का लाइव डिजिटल डेटा देखने अथवा नया संपर्क जोड़ने हेतु दाएँ दिए QR कोड को स्कैन करें।
                            </p>
                          </div>

                          {/* Village Specific QR Code */}
                          <div className="print-qr-box text-center shrink-0 p-2 bg-white rounded-xl border-2 border-slate-900 shadow-xs">
                            <img
                              src={qrSrc}
                              alt={`${vName} QR Code`}
                              className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-md object-contain"
                            />
                            <div className="text-2xs font-extrabold text-slate-950 mt-1 leading-tight">
                              📱 {vName} QR
                            </div>
                            <div className="text-3xs text-blue-900 font-bold">
                              लाइव डेटा हेतु स्कैन करें
                            </div>
                          </div>
                        </div>

                        {/* 5 COLUMNS TABLE */}
                        <table className="w-full border-collapse border border-slate-500 text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-slate-900 text-white font-black">
                              <th className="border border-slate-500 px-2 py-2 text-center w-12 sm:w-14">
                                क्र.सं.
                              </th>
                              <th className="border border-slate-500 px-3 py-2 text-left">
                                नाम
                              </th>
                              <th className="border border-slate-500 px-3 py-2 text-left">
                                पिता / पति का नाम
                              </th>
                              <th className="border border-slate-500 px-3 py-2 text-center font-mono w-36 sm:w-40">
                                मोबाइल नंबर
                              </th>
                              <th className="border border-slate-500 px-3 py-2 text-left w-32 sm:w-40">
                                व्यवसाय
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {printContacts.map((c, index) => (
                              <tr key={c.id} className="even:bg-slate-50/80 hover:bg-slate-100/50">
                                <td className="border border-slate-400 px-2 py-1.5 text-center font-bold text-slate-800">
                                  {index + 1}
                                </td>
                                <td className="border border-slate-400 px-3 py-1.5 font-bold text-slate-950">
                                  {c.name}
                                </td>
                                <td className="border border-slate-400 px-3 py-1.5 text-slate-800">
                                  {c.fatherName || '-'}
                                </td>
                                <td className="border border-slate-400 px-3 py-1.5 text-center font-mono font-bold text-slate-900">
                                  {c.mobile}
                                  {c.alternateMobile && (
                                    <span className="block text-2xs font-normal text-slate-500 font-mono">
                                      {c.alternateMobile}
                                    </span>
                                  )}
                                </td>
                                <td className="border border-slate-400 px-3 py-1.5 text-slate-800">
                                  {c.category || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()
                ) : (
                  /* ALL VILLAGES PRINT: Each Village Starts on a New Page */
                  <div className="space-y-10 print:space-y-0">
                    {villages.map((village, vIdx) => {
                      const vContacts = contactsByVillage.get(village.id) || [];
                      if (vContacts.length === 0) return null;

                      const qrSrc =
                        villageQrMap[village.id] ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                          `${baseAppUrl}?village=${village.id}`
                        )}&margin=4`;

                      return (
                        <div key={village.id} className="print-village-page">
                          {/* Header Box with Org Name, Village Title, and Village Specific QR Code */}
                          <div className="border-2 border-slate-900 rounded-2xl p-3 sm:p-4 mb-3 bg-slate-50/60 print:bg-white flex items-center justify-between gap-4">
                            <div className="space-y-1 flex-1">
                              <span className="inline-block text-2xs uppercase tracking-wider font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded print:border print:border-slate-400">
                                यादव समाज मोबाइल डायरेक्टरी • वागड़ चौरासी (2026-27)
                              </span>
                              <h2 className="text-base sm:text-lg font-black text-slate-950">
                                डॉ. बी. आर. अम्बेडकर यादव युवा संगठन
                              </h2>
                              <h3 className="text-lg sm:text-xl font-extrabold text-blue-900 flex items-center gap-2">
                                <span>ग्राम: {village.name}</span>
                                <span className="text-xs font-bold text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded-full">
                                  कुल संपर्क: {vContacts.length}
                                </span>
                              </h3>
                              <p className="text-2xs text-slate-600">
                                * इस गाँव का लाइव डिजिटल डेटा देखने अथवा नया संपर्क जोड़ने हेतु दाएँ दिए QR कोड को स्कैन करें।
                              </p>
                            </div>

                            {/* Village Specific QR Code */}
                            <div className="print-qr-box text-center shrink-0 p-2 bg-white rounded-xl border-2 border-slate-900 shadow-xs">
                              <img
                                src={qrSrc}
                                alt={`${village.name} QR Code`}
                                className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-md object-contain"
                              />
                              <div className="text-2xs font-extrabold text-slate-950 mt-1 leading-tight">
                                📱 {village.name} QR
                              </div>
                              <div className="text-3xs text-blue-900 font-bold">
                                लाइव डेटा हेतु स्कैन करें
                              </div>
                            </div>
                          </div>

                          {/* 5 COLUMNS TABLE */}
                          <table className="w-full border-collapse border border-slate-500 text-xs sm:text-sm">
                            <thead>
                              <tr className="bg-slate-900 text-white font-black">
                                <th className="border border-slate-500 px-2 py-2 text-center w-12 sm:w-14">
                                  क्र.सं.
                                </th>
                                <th className="border border-slate-500 px-3 py-2 text-left">
                                  नाम
                                </th>
                                <th className="border border-slate-500 px-3 py-2 text-left">
                                  पिता / पति का नाम
                                </th>
                                <th className="border border-slate-500 px-3 py-2 text-center font-mono w-36 sm:w-40">
                                  मोबाइल नंबर
                                </th>
                                <th className="border border-slate-500 px-3 py-2 text-left w-32 sm:w-40">
                                  व्यवसाय
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {vContacts.map((c, index) => (
                                <tr key={c.id} className="even:bg-slate-50/80 hover:bg-slate-100/50">
                                <td className="border border-slate-400 px-2 py-1.5 text-center font-bold text-slate-800">
                                  {index + 1}
                                </td>
                                <td className="border border-slate-400 px-3 py-1.5 font-bold text-slate-950">
                                  {c.name}
                                </td>
                                <td className="border border-slate-400 px-3 py-1.5 text-slate-800">
                                  {c.fatherName || '-'}
                                </td>
                                <td className="border border-slate-400 px-3 py-1.5 text-center font-mono font-bold text-slate-900">
                                  {c.mobile}
                                  {c.alternateMobile && (
                                    <span className="block text-2xs font-normal text-slate-500 font-mono">
                                      {c.alternateMobile}
                                    </span>
                                  )}
                                </td>
                                <td className="border border-slate-400 px-3 py-1.5 text-slate-800">
                                  {c.category || '-'}
                                </td>
                              </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Visual Page Break Card for Preview Screen */}
                          {vIdx < villages.length - 1 && (
                            <div className="my-8 border-t-2 border-dashed border-blue-400/80 py-2.5 text-center text-xs font-bold text-blue-800 bg-blue-50/70 rounded-xl print:hidden flex items-center justify-center gap-2">
                              <span>✂️ पृष्ठ समाप्ति (Page Break)</span>
                              <span>— अगला गाँव '{villages[vIdx + 1]?.name}' नए पृष्ठ से प्रारंभ होगा</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COVER PAGE & MASTER QR CODE PREVIEW */}
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
                    src={generalQrUrl}
                    alt="Yadav Samaj Mobile Directory App Master QR Code"
                    className="w-44 h-44 mx-auto rounded-lg"
                  />
                  <span className="block text-2xs font-bold text-slate-800 mt-1">
                    कैमरा से स्कैन करें (सम्पूर्ण डायरेक्टरी)
                  </span>
                </div>

                <div className="bg-white/10 p-3 rounded-xl border border-white/20 text-xs font-semibold text-blue-100">
                  📱 ऑनलाइन डायरेक्टरी लिंक:
                  <div className="text-2xs text-amber-300 break-all select-all font-mono mt-0.5">
                    {baseAppUrl}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  <span>{copied ? 'लिंक कॉपी हो गया!' : 'डायरेक्टरी लिंक कॉपी करें'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GUIDE (HOW TO CONNECT) */}
          {activeSubTab === 'guide' && (
            <div className="space-y-4 text-slate-800">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <span>छपी हुई डायरी (Printed Diary) को इस ऐप से कैसे जोड़ें?</span>
                </h3>
                <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">
                  कागज़ की डायरी छपवाने के बाद भी समय के साथ लोगों के मोबाइल नंबर बदलते रहते हैं या नए लोगों के नंबर जोड़ने होते हैं। इस डिजिटल ऐप और <strong>गाँव-वार क्यूआर कोड (Village QR Codes)</strong> के माध्यम से आपकी छपी हुई डायरी हमेशा <strong>लाइव और अपडेटेड</strong> रहेगी!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 font-black flex items-center justify-center text-sm">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    प्रत्येक गाँव का अलग QR कोड
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    हर गाँव के पृष्ठ के ऊपरी कोने में उस गाँव का विशिष्ट QR कोड दिया गया है। जब कोई व्यक्ति अपने मोबाइल कैमरे से उसे स्कैन करेगा, तो सीधे उसी गाँव की डिजिटल डायरेक्टरी खुल जाएगी।
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 font-black flex items-center justify-center text-sm">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    प्रत्येक गाँव नए पृष्ठ (New Page) से शुरू
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    प्रिंटिंग में पेज-ब्रेक (Page Break) कोड लगा है, जिससे छपाई करते समय एक गाँव खत्म होते ही दूसरा गाँव स्वचालित रूप से अगले नए पन्ने से शुरू होता है।
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 font-black flex items-center justify-center text-sm">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    5 मानक कॉलम फॉर्मेट
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    डायरी तालिका में केवल 5 आवश्यक कॉलम रखे गए हैं: <strong>क्र.सं., नाम, पिता/पति का नाम, मोबाइल नंबर, व्यवसाय</strong>। इससे छपाई में अक्षर बड़े, स्पष्ट और सुंदर दिखते हैं।
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 font-black flex items-center justify-center text-sm">
                    4
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    प्रेस वाले को देने का तरीका
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    ऊपर दिए गए <strong>"प्रिंट / PDF सेव करें"</strong> बटन पर क्लिक करें और "Save as PDF" चुन लें। तैयार PDF आप सीधे प्रिंटिंग प्रेस वाले को दे सकते हैं।
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

