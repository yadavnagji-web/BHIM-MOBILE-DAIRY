import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  ExternalLink,
  RefreshCw,
  Upload,
  Download,
  FolderSync,
  HelpCircle,
  Database
} from 'lucide-react';
import { Contact, Village } from '../types';
import {
  getStoredSheetConfig,
  saveStoredSheetConfig,
  clearStoredSheetConfig,
  signInWithGoogleForSheets,
  createDirectoryGoogleSheet,
  fetchDirectoryFromGoogleSheet,
  syncAllContactsToGoogleSheet,
  GoogleSheetConfig,
  getCachedSheetToken
} from '../services/googleSheetsService';

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
  onDataImported,
  showToast
}) => {
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig | null>(getStoredSheetConfig());
  const [manualSheetId, setManualSheetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  useEffect(() => {
    if (sheetConfig?.spreadsheetId) {
      setManualSheetId(sheetConfig.spreadsheetId);
    }
  }, [sheetConfig]);

  // Ensure user has authenticated with Google to get an active access token
  const ensureAccessToken = async (): Promise<string> => {
    let token = getCachedSheetToken();
    if (!token) {
      setStatusMessage('Google खाता प्रमाणीकरण किया जा रहा है...');
      const authResult = await signInWithGoogleForSheets();
      token = authResult.accessToken;
    }
    return token;
  };

  // 1. Create a brand new Google Sheet in the user's Drive
  const handleCreateNewSheet = async () => {
    setLoading(true);
    setError('');
    setStatusMessage('Google Drive पर नई स्प्रेडशीट बनाई जा रही है...');

    try {
      const token = await ensureAccessToken();
      const newConfig = await createDirectoryGoogleSheet(token, villages, contacts);
      setSheetConfig(newConfig);
      setStatusMessage('');
      showToast('🎉 नई Google Sheet सफलतापूर्वक बन गई है और सभी संपर्क सहेज दिए गए हैं!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sheet बनाने में त्रुटि।');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  // 2. Import / Pull contacts from Google Sheet
  const handleImportFromSheet = async () => {
    const targetId = manualSheetId.trim() || sheetConfig?.spreadsheetId;
    if (!targetId) {
      setError('कृपया Google Sheet ID दर्ज करें अथवा ऊपर से नई शीट बनाएँ।');
      return;
    }

    setLoading(true);
    setError('');
    setStatusMessage('Google Sheet से डेटा डाउनलोड किया जा रहा है...');

    try {
      const token = await ensureAccessToken();
      const extracted = await fetchDirectoryFromGoogleSheet(token, targetId);

      if (extracted.contacts.length === 0) {
        setError('इस Google Sheet के "Contacts_Directory" टैब में कोई संपर्क नहीं मिले।');
        setLoading(false);
        return;
      }

      const updatedConfig: GoogleSheetConfig = {
        spreadsheetId: targetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${targetId}/edit`,
        sheetName: 'Contacts_Directory',
        lastSyncedAt: Date.now(),
        autoSyncEnabled: true
      };
      saveStoredSheetConfig(updatedConfig);
      setSheetConfig(updatedConfig);

      onDataImported(extracted.contacts, extracted.villages);
      showToast(`✅ Google Sheet से ${extracted.contacts.length} संपर्क सफलतापूर्वक लोड किए गए!`);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sheet से डेटा पढ़ने में त्रुटि।');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  // 3. Export / Push all local contacts to Google Sheet (requires explicit user confirmation)
  const handlePushToSheet = async () => {
    const targetId = manualSheetId.trim() || sheetConfig?.spreadsheetId;
    if (!targetId) {
      setError('कृपया Google Sheet ID दर्ज करें।');
      return;
    }

    if (!confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }

    setLoading(true);
    setError('');
    setStatusMessage('Google Sheet में सभी संपर्क अपलोड व सिंक किए जा रहे हैं...');

    try {
      const token = await ensureAccessToken();
      await syncAllContactsToGoogleSheet(token, targetId, contacts);

      const updatedConfig: GoogleSheetConfig = {
        spreadsheetId: targetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${targetId}/edit`,
        sheetName: 'Contacts_Directory',
        lastSyncedAt: Date.now(),
        autoSyncEnabled: true
      };
      saveStoredSheetConfig(updatedConfig);
      setSheetConfig(updatedConfig);
      setConfirmOverwrite(false);

      showToast(`✨ Google Sheet में ${contacts.length} संपर्क सफलतापूर्वक अपडेट हो गए!`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sheet सिंक करने में त्रुटि।');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleDisconnect = () => {
    clearStoredSheetConfig();
    setSheetConfig(null);
    setManualSheetId('');
    showToast('Google Sheet लिंक हटा दिया गया है।');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-100 text-emerald-900 mb-0.5">
                <span>Google Drive Storage</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Google Sheets स्टोरेज व सिंक
              </h2>
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Information box */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-950">
              <Database className="w-4 h-4 text-blue-700" />
              <span>Google Sheet स्टोरेज का उपयोग:</span>
            </div>
            <p>
              अब आप अपने सभी गाँव एवं मोबाइल डायरेक्टरी का संपूर्ण डेटा सीधे अपनी निजी <strong>Google Sheet</strong> में स्टोर कर सकते हैं। आप सीधे Google Sheets में भी नंबर जोड़ या सुधार सकते हैं।
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Status / Loading Notification */}
          {loading && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2 font-bold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>{statusMessage || 'प्रक्रिया जारी है...'}</span>
            </div>
          )}

          {/* Current Sheet Connection Status */}
          {sheetConfig ? (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Google Sheet सक्रिय रूप से लिंक है
                </span>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-2xs text-rose-600 hover:underline font-bold"
                >
                  डिस्कनेक्ट करें
                </button>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Sheet ID:</span>
                  <span className="font-mono font-bold text-slate-800 truncate max-w-[240px]">
                    {sheetConfig.spreadsheetId}
                  </span>
                </div>
                {sheetConfig.lastSyncedAt && (
                  <div className="flex justify-between items-center text-2xs text-slate-400">
                    <span>अंतिम सिंक समय:</span>
                    <span>{new Date(sheetConfig.lastSyncedAt).toLocaleString('hi-IN')}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={sheetConfig.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Sheets खोलें</span>
                </a>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleImportFromSheet}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-bold text-slate-700 text-xs shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>शीट से ऐप में लोड करें</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePushToSheet}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-bold text-slate-700 text-xs shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ऐप का डाटा शीट में भेजें</span>
                </button>
              </div>
            </div>
          ) : (
            /* Option A: Create New Sheet */
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      विकल्प 1: स्वतः नई Google Sheet बनाएँ
                    </h4>
                    <p className="text-2xs text-slate-500 mt-0.5">
                      यह आपके Google Drive में सभी वर्तमान {contacts.length} संपर्कों और गाँवों के साथ नई व्यवस्थित स्प्रेडशीट तैयार कर देगा।
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCreateNewSheet}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  <span>Google Drive में नई Sheet बनाएँ और जोड़ें</span>
                </button>
              </div>

              {/* Option B: Link Existing Sheet by ID */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    विकल्प 2: पहले से बनी Google Sheet लिंक करें
                  </h4>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    यदि आपके पास पहले से कोई Google Sheet है तो उसकी ID यहाँ दर्ज करें।
                  </p>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-600 mb-1 uppercase">
                    Google Spreadsheet ID
                  </label>
                  <input
                    type="text"
                    value={manualSheetId}
                    onChange={(e) => setManualSheetId(e.target.value)}
                    placeholder="उदा. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                  />
                  <span className="text-2xs text-slate-400 mt-1 block">
                    (Spreadsheet URL के /d/ और /edit के बीच का भाग)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading || !manualSheetId.trim()}
                    onClick={handleImportFromSheet}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>शीट से डेटा लिंक करें</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overwrite Confirmation Dialog */}
          {confirmOverwrite && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-950 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>पुष्टिकरण आवश्यक (Confirm Sync):</span>
              </div>
              <p>
                क्या आप वर्तमान में मौजूद सभी <strong>{contacts.length} संपर्कों</strong> को इस Google Sheet में अधिलेखित (overwrite) करना चाहते हैं?
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePushToSheet}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  हाँ, सिंक करें
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOverwrite(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg"
                >
                  रद्द करें
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
