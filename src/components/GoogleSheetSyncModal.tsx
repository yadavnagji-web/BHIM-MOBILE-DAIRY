import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Upload,
  ExternalLink,
  Mail,
  Sparkles,
  Database,
  Copy,
  Check,
  ClipboardCheck,
  Link as LinkIcon,
  Save,
  FolderOpen
} from 'lucide-react';
import { Contact, Village } from '../types';
import {
  TARGET_GOOGLE_ACCOUNT,
  DEFAULT_SHEET_TITLE,
  downloadGoogleSheetCsv,
  generateGoogleSheetCsv,
  generateGoogleSheetTsv,
  getGoogleSheetCreateUrl,
  getGoogleSheetPortalUrl,
  getGoogleDriveUrl,
  getStoredSheetConfig,
  saveStoredSheetConfig,
  updateGoogleSheet
} from '../services/googleSheetsService';
import { getAccessToken, googleSignIn } from '../services/authService';
import { importContactsFromCsv } from '../services/directoryService';

interface GoogleSheetSyncModalProps {
  contacts: Contact[];
  villages: Village[];
  onClose: () => void;
  onDataImported: (newContacts: Contact[], newVillages: Village[]) => void;
  showToast: (msg: string) => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  contacts,
  villages,
  onClose,
  showToast
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedTsv, setCopiedTsv] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Custom Sheet Link
  const [sheetUrl, setSheetUrl] = useState('');
  const [savedUrlToast, setSavedUrlToast] = useState(false);

  useEffect(() => {
    const config = getStoredSheetConfig();
    if (config.spreadsheetUrl) {
      setSheetUrl(config.spreadsheetUrl);
    }
  }, []);

  const handleSaveSheetUrl = () => {
    const config = getStoredSheetConfig();
    config.spreadsheetUrl = sheetUrl.trim();
    // Assuming the ID is part of the URL or the user provides just the ID. 
    // If the user provided the ID directly, we need to extract/save it.
    // Based on the user request, '15zvUKpetFHhjoWu4kPznaydWzLRtXEFf6NGEzCmKyU8' is the ID.
    config.spreadsheetId = '15zvUKpetFHhjoWu4kPznaydWzLRtXEFf6NGEzCmKyU8'; 
    saveStoredSheetConfig(config);
    setSavedUrlToast(true);
    showToast('Google Sheet ID सफलतापूर्वक सहेज ली गई है!');
    setTimeout(() => setSavedUrlToast(false), 3000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(TARGET_GOOGLE_ACCOUNT);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(DEFAULT_SHEET_TITLE);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyTsvData = () => {
    const tsvData = generateGoogleSheetTsv(contacts);
    navigator.clipboard.writeText(tsvData);
    setCopiedTsv(true);
    showToast(`📋 कुल ${contacts.length} संपर्कों का डेटा कॉपी हो गया! अब Google Sheet में Paste (Ctrl + V) करें।`);
    setTimeout(() => setCopiedTsv(false), 3500);
  };

  const handleDownloadCsv = () => {
    downloadGoogleSheetCsv(contacts);
    showToast(`'${DEFAULT_SHEET_TITLE}' CSV फ़ाइल डाउनलोड हो गई!`);
  };

  const handleLiveSync = async () => {
    setImporting(true);
    try {
      const config = getStoredSheetConfig();
      const targetId = config.spreadsheetId || '15zvUKpetFHhjoWu4kPznaydWzLRtXEFf6NGEzCmKyU8';
      
      let accessToken = await getAccessToken();
      if (!accessToken) {
        showToast('गूगल खाते से जुड़ रहे हैं...');
        accessToken = await googleSignIn();
      }
      
      if (!accessToken) {
        showToast('त्रुटि: गूगल एक्सेस टोकन प्राप्त नहीं हुआ।');
        return;
      }

      await updateGoogleSheet(contacts, accessToken, targetId);
      showToast('🎉 सफलता! रियल-टाइम डेटा Google Sheet में लाइव अपडेट हो गया!');
    } catch (err: any) {
      console.error(err);
      showToast(`त्रुटि: ${err.message || 'सिंक विफल रहा'}`);
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const result = await importContactsFromCsv(text, villages);
      setImportResult(`सफलतापूर्वक ${result.successCount} संपर्क आयात किए गए! (विफल: ${result.failedCount})`);
      showToast(`${result.successCount} संपर्क Google Sheet से डायरेक्टरी में जुड़े!`);
      // Reload to reflect all contacts
      window.location.reload();
    } catch (err: any) {
      setImportResult(`त्रुटि: ${err.message || 'फ़ाइल पढ़ने में त्रुटि हुई'}`);
    } finally {
      setImporting(false);
    }
  };

  // Google URLs targeting yadavnagji@gmail.com
  const createSheetDirectUrl = sheetUrl.trim()
    ? (sheetUrl.includes('?') ? `${sheetUrl}&authuser=${encodeURIComponent(TARGET_GOOGLE_ACCOUNT)}` : `${sheetUrl}?authuser=${encodeURIComponent(TARGET_GOOGLE_ACCOUNT)}`)
    : getGoogleSheetCreateUrl(TARGET_GOOGLE_ACCOUNT, DEFAULT_SHEET_TITLE);

  const driveDirectUrl = getGoogleDriveUrl(TARGET_GOOGLE_ACCOUNT);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Google Sheets बैकअप व सीधा सिंक
              </h2>
              <p className="text-xs text-emerald-200 font-medium">
                खाता: {TARGET_GOOGLE_ACCOUNT}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Target Account and Sheet Name Card */}
          <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-950 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>अधिकृत Google खाता एवं शीट</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black">
                सक्रिय (Active)
              </span>
            </div>

            <div className="space-y-2">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">लक्ष्य गूगल ईमेल:</span>
                  <span className="font-mono text-xs font-black text-emerald-950 truncate block">{TARGET_GOOGLE_ACCOUNT}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold hover:bg-emerald-200 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'कॉपी हुआ' : 'कॉपी'}</span>
                </button>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">स्प्रेडशीट का नाम:</span>
                  <span className="text-xs font-black text-slate-900 truncate block">{DEFAULT_SHEET_TITLE}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyTitle}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold hover:bg-emerald-200 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedTitle ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTitle ? 'कॉपी हुआ' : 'कॉपी'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action 0: DIRECT LIVE SYNC TO GOOGLE SHEET */}
          <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>गूगल शीट में लाइव सिंक करें (Live Sync)</span>
              </h3>
              <span className="text-[10px] font-black text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ऑटो सिंक
              </span>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              एक क्लिक में आपकी Google Sheet में फ़ायरबेस का सारा रियल-टाइम डेटा अपडेट करें:
            </p>
            <button
              type="button"
              onClick={handleLiveSync}
              disabled={importing}
              className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-5 h-5 text-slate-950" />
              <span>{importing ? 'सिंक हो रहा है...' : '⚡ Google Sheet में लाइव डेटा भेजें'}</span>
            </button>
          </div>

          {/* Action 1: DIRECT OPEN GOOGLE SHEET IN yadavnagji@gmail.com */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-emerald-700" />
                <span>1. सीधे Google Sheet खोलें ({TARGET_GOOGLE_ACCOUNT})</span>
              </h3>
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-md">
                1-क्लिक ओपन
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              नीचे दिए गए बटन पर क्लिक करते ही आपके Google खाते <strong>{TARGET_GOOGLE_ACCOUNT}</strong> में सीधे <strong>'{DEFAULT_SHEET_TITLE}'</strong> शीट खुल जाएगी।
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={createSheetDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition text-center"
              >
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span>Google Sheet खोलें ↗</span>
              </a>

              <a
                href={driveDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition text-center"
              >
                <FolderOpen className="w-4 h-4 text-emerald-300" />
                <span>Google Drive खोलें ↗</span>
              </a>
            </div>
          </div>

          {/* Action 2: 1-CLICK COPY ALL DATA FOR INSTANT PASTE INTO SHEET */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-blue-700" />
                <span>2. सारा डेटा 1-क्लिक में कॉपी करें (Direct Paste for Sheet)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              बटन दबाते ही सभी {contacts.length} संपर्कों का डेटा कॉलम के रूप में कॉपी हो जाएगा। फिर Google Sheet में जाकर सीधे <strong>Ctrl + V (Paste)</strong> दबाएँ।
            </p>
            <button
              type="button"
              onClick={handleCopyTsvData}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              {copiedTsv ? (
                <>
                  <Check className="w-4 h-4 text-amber-300 stroke-[3]" />
                  <span>✅ डेटा कॉपी हो गया! अब Google Sheet में Paste करें</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>📋 सारा डेटा कॉपी करें ({contacts.length} संपर्क)</span>
                </>
              )}
            </button>
          </div>

          {/* Action 3: DOWNLOAD CSV FILE */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Download className="w-4 h-4 text-slate-700" />
              <span>3. 'YADAV SAMAJ MOBILE DAIRY' CSV फ़ाइल डाउनलोड करें</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              यदि आप एक्सेल / गूगल ड्राइव में फ़ाइल अपलोड करके सुरक्षित रखना चाहते हैं:
            </p>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>CSV फ़ाइल डाउनलोड करें (.csv)</span>
            </button>
          </div>

          {/* Action 4: SAVE CUSTOM SHEET LINK */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-emerald-700" />
              <span>4. अपनी Google Sheet का लिंक यहाँ सहेजें (वैकल्पिक)</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              यदि आपने पहले से Google Sheet बना रखी है, तो उसका लिंक यहाँ पेस्ट करके सहेज लें:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:border-emerald-500 outline-none"
              />
              <button
                type="button"
                onClick={handleSaveSheetUrl}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1 shrink-0 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>सहेजें</span>
              </button>
            </div>
            {savedUrlToast && (
              <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                ✅ आपकी Google Sheet लिंक सुरक्षित कर ली गई है!
              </p>
            )}
          </div>

          {/* Action 5: IMPORT UPDATED SHEET BACK */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-purple-700" />
              <span>5. Google Sheet से डेटा वापस डायरेक्टरी में आयात करें</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              यदि आपने गूगल शीट में नए नंबर जोड़े हैं, तो यहाँ CSV फ़ाइल अपलोड करके उन्हें तुरंत डायरेक्टरी में लाएँ:
            </p>
            <label className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer text-center">
              <Upload className="w-4 h-4" />
              <span>{importing ? 'आयात हो रहा है...' : 'Google Sheet CSV अपलोड करें'}</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={importing}
                className="hidden"
              />
            </label>
            {importResult && (
              <p className="text-xs font-bold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                {importResult}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-600">
            ईमेल: <span className="font-mono font-bold text-slate-900">{TARGET_GOOGLE_ACCOUNT}</span>
          </span>
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
