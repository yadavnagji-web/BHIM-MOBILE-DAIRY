import React, { useState, useRef } from 'react';
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Loader2, Info } from 'lucide-react';
import { Contact, Village, CsvImportResult } from '../types';
import { exportContactsToCsv, importContactsFromCsv } from '../services/directoryService';

interface CsvImportExportProps {
  contacts: Contact[];
  villages: Village[];
  onClose: () => void;
  onImportComplete: () => void;
}

export const CsvImportExport: React.FC<CsvImportExportProps> = ({
  contacts,
  villages,
  onClose,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const csvData = exportContactsToCsv(contacts);
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvData], {
      type: 'text/csv;charset=utf-8;',
    }); // Add UTF-8 BOM so Hindi opens cleanly in Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Village_Mobile_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSampleCsv = () => {
    const sample = `Village,Name,Mobile,Alternate Mobile,Category,Address,Remark
चितरी,रामलाल यादव,9876543210,9876543211,किसान,वार्ड 2,जैविक खेती
रामपुर,मुकेश कुमार,9829012345,,कृषि मिस्त्री,बस स्टैंड,ट्रैक्टर रिपेयर
सुंदरपुर,गोपाल दास,9512345678,,ई-मित्र,पंचायत भवन,सरकारी योजनाएं`;

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), sample], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sample_Village_Directory.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError('');
    setImportResult(null);

    try {
      const text = await file.text();
      const result = await importContactsFromCsv(text, villages);
      setImportResult(result);
      if (result.successCount > 0) {
        onImportComplete();
      }
    } catch (err: any) {
      setImportError(err.message || 'फ़ाइल पढ़ने या इम्पोर्ट करने में त्रुटि।');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                संपर्क एक्सपोर्ट एवं इम्पोर्ट (CSV)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Excel एवं CSV फ़ाइल बैकअप व डाटा ट्रांसफर
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

        {/* Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 mx-4 sm:mx-6 mt-4 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>एक्सपोर्ट (Export CSV)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>इम्पोर्ट (Import CSV)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Excel / CSV फ़ाइल डाउनलोड के लिए तैयार
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  डायरेक्टरी में उपलब्ध कुल <strong>{contacts.length}</strong> संपर्कों का सम्पूर्ण विवरण
                  (गाँव, नाम, मोबाइल, पता, श्रेणी आदि) एक ही क्लिक में UTF-8 समर्थित CSV फ़ाइल में एक्सपोर्ट करें।
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">शामिल कॉलम:</p>
                <code className="text-2xs bg-white px-2 py-1 rounded border border-slate-200 block text-slate-700">
                  Village, Name, Mobile, Alternate Mobile, Category, Address, Remark
                </code>
              </div>

              <button
                type="button"
                id="download-contacts-csv-btn"
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>सभी {contacts.length} संपर्क एक्सपोर्ट करें (.CSV)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">CSV फ़ाइल प्रारूप आवश्यकता:</p>
                  <p className="text-slate-600 mt-0.5">
                    फ़ाइल के कॉलम इस क्रम में होने चाहिए: <code>Village, Name, Mobile, Alternate Mobile, Category, Address, Remark</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">नमूना फ़ाइल चाहिए?</span>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="text-xs text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  नमूना CSV डाउनलोड करें
                </button>
              </div>

              {/* Upload Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs mb-2">
                  {importing ? (
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  ) : (
                    <Upload className="w-6 h-6 text-emerald-600" />
                  )}
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {importing ? 'फ़ाइल इम्पोर्ट की जा रही है...' : 'यहाँ क्लिक करके CSV फ़ाइल चुनें'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  केवल .csv फ़ाइलें मान्य हैं (स्वचालित सत्यापन व डुप्लीकेट जांच)
                </p>
              </div>

              {/* Import Error Message */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Import Result Summary */}
              {importResult && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    इम्पोर्ट परिणाम विवरण:
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-500 block">कुल पंक्तियाँ</span>
                      <span className="text-base font-bold text-slate-800">{importResult.total}</span>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-xs text-emerald-800 block">सफल (जोड़े गए)</span>
                      <span className="text-base font-bold text-emerald-700">
                        {importResult.successCount}
                      </span>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                      <span className="text-xs text-rose-800 block">विफल (अमान्य/डुप्लीकेट)</span>
                      <span className="text-base font-bold text-rose-700">
                        {importResult.failedCount}
                      </span>
                    </div>
                  </div>

                  {importResult.failedRows.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto text-xs border border-rose-200 rounded-lg p-2 bg-rose-50/50">
                      <p className="font-bold text-rose-900 mb-1">अस्वीकृत पंक्तियों का कारण:</p>
                      {importResult.failedRows.map((f, i) => (
                        <p key={i} className="text-rose-800 text-2xs">
                          पंक्ति {f.rowNumber}: {f.reason} ({f.data.name || ''} - {f.data.mobile || ''})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
