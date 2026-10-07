import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Layers,
  Clock,
  Plus,
  Search,
  Filter,
  LogOut,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle,
  Phone,
  MessageCircle,
  Check,
  X,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Sparkles,
  Megaphone,
  KeyRound,
  Eye,
  EyeOff,
  Zap,
  Radio,
  Image as ImageIcon,
  Trash2,
  Link as LinkIcon
} from 'lucide-react';
import { Contact, Village, ApprovalRequest } from '../types';
import { ContactCard } from './ContactCard';
import { PrintDiaryModal } from './PrintDiaryModal';
import { adService, AdSettings } from '../services/adService';
import {
  getAppSettings,
  updateAppSettings,
  AppSettings,
  bulkVerifyBinaOtpContacts,
  updateContact
} from '../services/directoryService';

interface AdminDashboardProps {
  contacts: Contact[];
  villages: Village[];
  pendingRequests?: ApprovalRequest[];
  onAddContact: () => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contact: Contact) => void;
  onManageVillages: () => void;
  onOpenCsvManager: () => void;
  onOpenGoogleSheets?: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  onApproveRequest?: (req: ApprovalRequest) => Promise<void>;
  onRejectRequest?: (reqId: string, reason?: string) => Promise<void>;
  onApproveAllRequests?: () => Promise<void>;
  notificationMessage?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  contacts,
  villages,
  pendingRequests = [],
  onAddContact,
  onEditContact,
  onDeleteContact,
  onManageVillages,
  onOpenCsvManager,
  onOpenGoogleSheets,
  onLogout,
  onRefresh,
  onApproveRequest,
  onRejectRequest,
  onApproveAllRequests,
  notificationMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'approvals' | 'otp_mode' | 'ad_corner'>('contacts');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [showVillageCountBreakdown, setShowVillageCountBreakdown] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [rejectModalReq, setRejectModalReq] = useState<ApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 1. OTP Mode Settings State
  const [otpMode, setOtpMode] = useState<'with_otp' | 'without_otp'>('with_otp');
  const [showBinaOtpList, setShowBinaOtpList] = useState(false);
  const [savingOtpMode, setSavingOtpMode] = useState(false);
  const [isProcessingBinaOtp, setIsProcessingBinaOtp] = useState(false);
  const [binaOtpSuccessMsg, setBinaOtpSuccessMsg] = useState('');

  // 2. Ad Corner Settings State
  const [adSettings, setAdSettings] = useState<AdSettings>(adService.getSettings());
  const [savingAds, setSavingAds] = useState(false);
  const [adSavedToast, setAdSavedToast] = useState(false);
  const [adImageError, setAdImageError] = useState<string | null>(null);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setAdImageError('बैनर इमेज का साइज़ 1 MB से कम होना चाहिए (अनुशंसित 500 KB)');
      return;
    }
    setAdImageError(null);
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      const dataUrl = uploadEvt.target?.result as string;
      setAdSettings((prev) => ({ ...prev, bannerImageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleInterstitialFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAdImageError('इंटरस्टीशियल इमेज का साइज़ 2 MB से कम होना चाहिए (अनुशंसित 1 MB)');
      return;
    }
    setAdImageError(null);
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      const dataUrl = uploadEvt.target?.result as string;
      setAdSettings((prev) => ({ ...prev, interstitialImageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    // Load app settings
    getAppSettings().then((s) => {
      if (s.otpMode) setOtpMode(s.otpMode);
      setAdSettings((prev) => ({
        ...prev,
        bannerImageUrl: s.bannerImageUrl ?? prev.bannerImageUrl,
        bannerTargetUrl: s.bannerTargetUrl ?? prev.bannerTargetUrl,
        interstitialImageUrl: s.interstitialImageUrl ?? prev.interstitialImageUrl,
        interstitialTargetUrl: s.interstitialTargetUrl ?? prev.interstitialTargetUrl,
      }));
    });
  }, []);

  // Filter contacts added without OTP
  const binaOtpContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (c.addedWithOtp === false) return true;
      if (c.addedWithOtp === true) return false;
      const rem = (c.remark || '').toLowerCase();
      return !rem.includes('whatsapp') && !rem.includes('otp verified') && !rem.includes('सत्यापित');
    });
  }, [contacts]);

  // Bulk Verify all bina OTP contacts
  const handleBulkVerifyBinaOtp = async () => {
    setIsProcessingBinaOtp(true);
    try {
      const count = await bulkVerifyBinaOtpContacts();
      setBinaOtpSuccessMsg(`⚡ सभी ${count || binaOtpContacts.length} बिना OTP संपर्क एक साथ स्वीकृत व सत्यापित कर दिए गए!`);
      onRefresh();
      setTimeout(() => setBinaOtpSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessingBinaOtp(false);
    }
  };

  // Verify single contact
  const handleVerifySingleContact = async (contact: Contact) => {
    try {
      await updateContact(contact.id, {
        addedWithOtp: true,
        remark: 'WhatsApp Verified (एडमिन सत्यापित)',
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Village-wise count calculation
  const villageCountMap = useMemo(() => {
    const map = new Map<string, number>();
    villages.forEach((v) => map.set(v.id, 0));
    contacts.forEach((c) => {
      const current = map.get(c.villageId) || 0;
      map.set(c.villageId, current + 1);
    });
    return map;
  }, [villages, contacts]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (c.category) set.add(c.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'hi'));
  }, [contacts]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (selectedVillageFilter !== 'all' && c.villageId !== selectedVillageFilter) {
        return false;
      }
      if (selectedCategoryFilter !== 'all' && c.category !== selectedCategoryFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(query);
        const matchMobile = c.mobile.includes(query) || (c.alternateMobile && c.alternateMobile.includes(query));
        const matchFather = c.fatherName ? c.fatherName.toLowerCase().includes(query) : false;
        const matchVillage = c.villageName.toLowerCase().includes(query);
        const matchCategory = c.category.toLowerCase().includes(query);
        const matchAddress = c.address ? c.address.toLowerCase().includes(query) : false;
        return matchName || matchFather || matchMobile || matchVillage || matchCategory || matchAddress;
      }
      return true;
    });
  }, [contacts, selectedVillageFilter, selectedCategoryFilter, searchTerm]);

  // Handle OTP Mode Change
  const handleOtpModeChange = async (newMode: 'with_otp' | 'without_otp') => {
    setOtpMode(newMode);
    setSavingOtpMode(true);
    try {
      await updateAppSettings({ otpMode: newMode });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingOtpMode(false);
    }
  };

  // Handle Save Ad Settings
  const handleSaveAdSettings = async () => {
    setSavingAds(true);
    try {
      adService.updateSettings(adSettings);
      await updateAppSettings({
        adsMasterEnabled: adSettings.adsMasterEnabled,
        bannerAdEnabled: adSettings.bannerAdEnabled,
        interstitialAdEnabled: adSettings.interstitialAdEnabled,
        bannerAdUnit: adSettings.bannerAdUnit,
        interstitialAdUnit: adSettings.interstitialAdUnit,
        sponsorTitle: adSettings.sponsorTitle,
        sponsorContact: adSettings.sponsorContact,
        sponsorTagline: adSettings.sponsorTagline,
        sponsorAdEnabled: adSettings.sponsorAdEnabled,
        bannerImageUrl: adSettings.bannerImageUrl,
        bannerTargetUrl: adSettings.bannerTargetUrl,
        interstitialImageUrl: adSettings.interstitialImageUrl,
        interstitialTargetUrl: adSettings.interstitialTargetUrl,
      });
      setAdSavedToast(true);
      setTimeout(() => setAdSavedToast(false), 3000);
    } finally {
      setSavingAds(false);
    }
  };

  const handleApprove = async (req: ApprovalRequest) => {
    if (!onApproveRequest) return;
    setProcessingId(req.id);
    try {
      await onApproveRequest(req);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkApprove = async () => {
    if (!onApproveAllRequests) return;
    setIsProcessingAll(true);
    try {
      await onApproveAllRequests();
    } finally {
      setIsProcessingAll(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalReq || !onRejectRequest) return;
    setProcessingId(rejectModalReq.id);
    try {
      await onRejectRequest(rejectModalReq.id, rejectReason.trim());
      setRejectModalReq(null);
      setRejectReason('');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Admin Header Bar */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-blue-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-400/20">
            <ShieldCheck className="w-7 h-7 stroke-[2.3]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-black tracking-wide border border-amber-400/30">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>संगठन मुख्य एडमिन डैशबोर्ड</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              NAGJI YADAV (SAKODARA)
            </h1>
            <p className="text-xs text-blue-200 font-medium">
              डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenGoogleSheets && (
            <button
              type="button"
              onClick={onOpenGoogleSheets}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Google Sheet (yadavnagji@gmail.com)</span>
            </button>
          )}

          <a
            href="https://bhim-dairy-default-rtdb.firebaseio.com/contacts.json"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Realtime Database का लाइव JSON देखें"
          >
            <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>लाइव RTDB डेटा</span>
          </a>

          <button
            type="button"
            onClick={onOpenCsvManager}
            className="px-3 py-2 rounded-xl bg-blue-800 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 border border-blue-600/40 transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>CSV आयात/निर्यात</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-extrabold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>लॉगआउट</span>
          </button>
        </div>
      </div>

      {/* 5 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Contacts */}
        <div
          onClick={() => setActiveTab('contacts')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'contacts'
              ? 'bg-blue-50 border-blue-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>कुल संपर्क</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{contacts.length}</div>
          <span className="text-[10px] text-blue-700 font-semibold">डायरेक्टरी रिकॉर्ड</span>
        </div>

        {/* Total Villages */}
        <div
          onClick={onManageVillages}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>कुल गाँव</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{villages.length}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">गाँव सूची ➔</span>
        </div>

        {/* Pending Requests */}
        <div
          onClick={() => setActiveTab('approvals')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-amber-50 border-amber-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>स्वीकृति प्रतीक्षा</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{pendingRequests.length}</div>
          <span className="text-[10px] text-amber-700 font-semibold">
            {pendingRequests.length > 0 ? 'समीक्षा हेतु लंबित' : 'कोई अनुरोध नहीं'}
          </span>
        </div>

        {/* Bina OTP Count Card - Shows only Quantity */}
        <div
          onClick={() => {
            setShowBinaOtpList(true);
            setActiveTab('contacts');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            binaOtpContacts.length > 0
              ? 'bg-orange-50 border-orange-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-orange-200'
          }`}
          title="बिना OTP जोड़े गए नंबरों की संपादित सूची देखने के लिए क्लिक करें"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>बिना OTP संख्या</span>
            <ShieldAlert className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-600 font-mono">
            {binaOtpContacts.length}
          </div>
          <span className="text-[10px] text-orange-700 font-semibold">
            सूची देखने हेतु क्लिक करें ➔
          </span>
        </div>

        {/* OTP Mode Status Indicator */}
        <div
          onClick={() => setActiveTab('otp_mode')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'otp_mode'
              ? 'bg-indigo-50 border-indigo-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>OTP सुरक्षा मोड</span>
            <KeyRound className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-black text-indigo-900 mt-1">
            {otpMode === 'with_otp' ? '🔐 OTP अनिवार्य' : '⚡ बिना OTP जोड़ें'}
          </div>
          <span className="text-[10px] text-indigo-700 font-semibold">मोड बदलें ➔</span>
        </div>
      </div>

      {/* Main Admin Tab Navigation Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'contacts'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>सभी संपर्क ({contacts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer relative ${
            activeTab === 'approvals'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>अनुरोध समीक्षा ({pendingRequests.length})</span>
          {pendingRequests.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('otp_mode')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'otp_mode'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>OTP मोड नियंत्रण</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ad_corner')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'ad_corner'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Ad Corner (विज्ञापन नियंत्रण)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL CONTACTS */}
      {/* ========================================================================= */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          {/* Action Row */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="नाम, मोबाइल या गाँव से खोजें..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-blue-700" />
                <span>डायरी प्रिंट</span>
              </button>

              <button
                type="button"
                onClick={onAddContact}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md shadow-blue-700/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>नया संपर्क जोड़ें</span>
              </button>
            </div>
          </div>

          {/* BINA OTP QUANTITY BANNER IN CONTACTS TAB - SHOWS ONLY QUANTITY INITIALLY */}
          <div className="bg-white rounded-2xl border border-orange-200/90 shadow-2xs overflow-hidden">
            <div
              onClick={() => setShowBinaOtpList(!showBinaOtpList)}
              className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-orange-50/40 transition bg-gradient-to-r from-orange-50/60 via-amber-50/20 to-white"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                  <ShieldAlert className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">
                      बिना OTP जोड़े गए नंबरों की संपादित सूची
                    </h4>
                    <span className="px-2 py-0.2 rounded-full bg-orange-100 text-orange-900 text-[10px] font-black">
                      संख्या देखें
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {showBinaOtpList ? 'सूची बंद करने के लिए क्लिक करें' : 'पूरी सूची देखने व बल्क अप्रूव करने के लिए यहाँ क्लिक करें ⬇️'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">कुल संख्या:</span>
                  <span className="text-base sm:text-lg font-black text-orange-600 font-mono">
                    {binaOtpContacts.length} संपर्क
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                  {showBinaOtpList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* EXPANDABLE LIST IN TAB 1 */}
            {showBinaOtpList && (
              <div className="p-4 border-t border-orange-200 bg-slate-50/70 space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-black text-slate-800">
                      बिना OTP जोड़े गए संपर्क विवरण ({binaOtpContacts.length} कुल संख्या):
                    </span>
                    <p className="text-[11px] text-slate-500">
                      एडमिन इन नंबरों को जांचकर एक-एक करके या 'बल्क अप्रूव' बटन से एक साथ सत्यापित कर सकते हैं।
                    </p>
                  </div>

                  {binaOtpContacts.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkVerifyBinaOtp}
                      disabled={isProcessingBinaOtp}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isProcessingBinaOtp ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>⚡ एक साथ सभी स्वीकृत करें (Bulk Approve All)</span>
                    </button>
                  )}
                </div>

                {binaOtpSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{binaOtpSuccessMsg}</span>
                  </div>
                )}

                {binaOtpContacts.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-xl border border-slate-200 space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">कोई बिना OTP संपर्क शेष नहीं है।</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {binaOtpContacts.map((c, index) => (
                      <div
                        key={c.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4.5 h-4.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <p className="font-extrabold text-xs text-slate-900 truncate">{c.name}</p>
                          </div>
                          <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                            📱 +91 {c.mobile} {c.fatherName ? `• पिता: ${c.fatherName}` : ''}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            🏘️ {c.villageName} | {c.category || 'सामान्य'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleVerifySingleContact(c)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-2xs font-extrabold transition cursor-pointer"
                          >
                            सत्यापित करें
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteContact(c)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-2xs font-extrabold transition cursor-pointer"
                          >
                            हटाएं
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contact Cards List */}
          {filteredContacts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800">
                {searchTerm ? 'कोई संपर्क नहीं मिला' : 'डायरेक्टरी में अभी कोई संपर्क नहीं है'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm
                  ? 'कृपया दूसरा शब्द या मोबाइल नंबर लिखकर खोजें।'
                  : 'फर्जी डेटा हटा दिया गया है। आप "नया संपर्क जोड़ें" या "Google Sheet बैकअप" से असली नंबर जोड़ सकते हैं।'}
              </p>
              {!searchTerm && (
                <button
                  type="button"
                  onClick={onAddContact}
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs shadow-md transition"
                >
                  पहला संपर्क जोड़ें
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredContacts.map((contact, idx) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  index={idx}
                  isAdmin={true}
                  onEdit={onEditContact}
                  onDelete={onDeleteContact}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: APPROVALS & BULK APPROVE */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {/* Bulk Approve Header Action Card */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/60 text-amber-900 text-[11px] font-black mb-1">
                <Clock className="w-3 h-3 text-amber-700" />
                <span>लंबित अनुरोध: {pendingRequests.length} संख्या</span>
              </span>
              <h3 className="text-base font-black text-slate-900">
                उपयोगकर्ताओं द्वारा भेजे गए नंबर व संशोधन अनुरोध
              </h3>
              <p className="text-xs text-slate-600">
                जांचकर एक-एक करके या नीचे दिए बटन से एक ही क्लिक में सभी को स्वीकृत करें।
              </p>
            </div>

            {pendingRequests.length > 0 && (
              <button
                type="button"
                onClick={handleBulkApprove}
                disabled={isProcessingAll}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isProcessingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>⚡ एक साथ सभी स्वीकृत करें (Bulk Approve All)</span>
              </button>
            )}
          </div>

          {/* List of Approval Requests */}
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800">
                कोई भी अनुरोध लंबित नहीं है
              </h3>
              <p className="text-xs text-slate-500">
                सभी उपयोगकर्ताओं के अनुरोध स्वीकृत हैं या अभी कोई नया अनुरोध नहीं आया है।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-xs font-black">
                        {req.type === 'new_contact' ? 'नया संपर्क' : req.type === 'delete_contact' ? 'नंबर हटाना' : 'संशोधन'}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 truncate">
                        {req.contactData?.name || req.requesterName}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 font-mono">
                      📱 +91 {req.contactData?.mobile || req.requesterPhone} • 🏘️ {req.contactData?.villageName || ''}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      अनुरोधकर्ता: <strong>{req.requesterName}</strong> | कारण: {req.reason || 'नया नंबर'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectModalReq(req);
                        setRejectReason('');
                      }}
                      disabled={processingId === req.id}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                    >
                      अस्वीकृत करें
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(req)}
                      disabled={processingId === req.id}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      {processingId === req.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>स्वीकृत करें</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OTP MODE RULES & UNVERIFIED / BINA OTP QUANTITY DISPLAY */}
      {/* ========================================================================= */}
      {activeTab === 'otp_mode' && (
        <div className="space-y-5">
          {/* Explanation Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-5 text-white space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-xs font-black">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>OTP सुरक्षा नियम विन्यास (OTP Mode Control)</span>
            </div>
            <h2 className="text-lg font-black text-white">
              सदस्य जोड़ने एवं हटाने के लिए सुरक्षा मोड चुनें
            </h2>
            <p className="text-xs text-indigo-200 leading-relaxed">
              यहाँ आप चुन सकते हैं कि सामान्य उपयोगकर्ताओं के लिए WhatsApp OTP अनिवार्य रखना है या नहीं।
            </p>
          </div>

          {/* Mode Option 1: WITH OTP */}
          <div
            onClick={() => handleOtpModeChange('with_otp')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative ${
              otpMode === 'with_otp'
                ? 'bg-blue-50/70 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black flex-shrink-0 ${
                  otpMode === 'with_otp' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      विकल्प 1: OTP के साथ सदस्य जोड़ें (With OTP System)
                    </h3>
                    {otpMode === 'with_otp' && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                        सक्रिय (Active)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    <strong>नियम:</strong> नया सदस्य जोड़ते समय और हटाते समय दोनों में <strong>WhatsApp OTP अनिवार्य</strong> रहेगा। इससे कोई भी फर्जी नंबर नहीं जुड़ पाएगा।
                  </p>
                </div>
              </div>

              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 border-blue-600">
                {otpMode === 'with_otp' && <div className="w-3 h-3 rounded-full bg-blue-600" />}
              </div>
            </div>
          </div>

          {/* Mode Option 2: WITHOUT OTP */}
          <div
            onClick={() => handleOtpModeChange('without_otp')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative ${
              otpMode === 'without_otp'
                ? 'bg-amber-50/70 border-amber-600 shadow-md ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black flex-shrink-0 ${
                  otpMode === 'without_otp' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      विकल्प 2: बिना OTP सदस्य जोड़ें (Without OTP System)
                    </h3>
                    {otpMode === 'without_otp' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-black">
                        सक्रिय (Active)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    <strong>नियम:</strong> केवल नया नंबर जोड़ना बिना OTP होगा (तुरंत जुड़ेगा)।<br />
                    <span className="text-rose-700 font-bold">
                      ⚠️ लेकिन नंबर हटाना बिना OTP कभी नहीं होगा! नंबर हटाना बिना OTP केवल और केवल एडमिन ही कर सकेगा।
                    </span>
                  </p>
                </div>
              </div>

              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 border-amber-600">
                {otpMode === 'without_otp' && <div className="w-3 h-3 rounded-full bg-amber-600" />}
              </div>
            </div>
          </div>

          {/* UNVERIFIED / BINA OTP CONTACTS: COLLAPSED QUANTITY SHOW FIRST */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div
              onClick={() => setShowBinaOtpList(!showBinaOtpList)}
              className="p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-black">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    बिना OTP जोड़े गए नंबरों की संपादित सूची
                  </h4>
                  <p className="text-xs text-slate-500">
                    क्लिक करने पर ही पूरी सूची दिखाई देगी।
                  </p>
                </div>
              </div>

              {/* Quantity Counter Badge */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">कुल संख्या:</span>
                  <span className="text-lg font-black text-orange-600">{binaOtpContacts.length} संपर्क</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  {showBinaOtpList ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {/* EXPANDABLE LIST: ONLY VISIBLE WHEN CLICKED */}
            {showBinaOtpList && (
              <div className="p-5 border-t border-slate-100 bg-slate-50/70 space-y-3.5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
                  <div>
                    <span className="text-xs sm:text-sm font-black text-slate-800">
                      बिना OTP जोड़े गए सदस्यों की सूची ({binaOtpContacts.length} कुल संख्या):
                    </span>
                    <p className="text-[11px] text-slate-500">
                      एडमिन इन नंबरों को जांचकर एक-एक करके या 'बल्क अप्रूव' बटन से एक साथ सत्यापित कर सकते हैं।
                    </p>
                  </div>

                  {binaOtpContacts.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkVerifyBinaOtp}
                      disabled={isProcessingBinaOtp}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isProcessingBinaOtp ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>⚡ एक साथ सभी स्वीकृत करें (Bulk Approve All)</span>
                    </button>
                  )}
                </div>

                {binaOtpSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{binaOtpSuccessMsg}</span>
                  </div>
                )}

                {binaOtpContacts.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">कोई बिना OTP संपर्क शेष नहीं है।</p>
                    <p className="text-[11px] text-slate-400">सभी संपर्क WhatsApp OTP अथवा एडमिन द्वारा सत्यापित हैं।</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {binaOtpContacts.map((c, index) => (
                      <div
                        key={c.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <p className="font-extrabold text-xs text-slate-900 truncate">{c.name}</p>
                          </div>
                          <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                            📱 +91 {c.mobile} {c.fatherName ? `• पिता: ${c.fatherName}` : ''}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            🏘️ {c.villageName} | {c.category || 'सामान्य'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleVerifySingleContact(c)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-2xs font-extrabold transition cursor-pointer"
                            title="सत्यापित चिह्नित करें"
                          >
                            सत्यापित करें
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteContact(c)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-2xs font-extrabold transition cursor-pointer shrink-0"
                            title="हटाएं"
                          >
                            हटाएं
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AD CORNER (विज्ञापन नियंत्रण) */}
      {/* ========================================================================= */}
      {activeTab === 'ad_corner' && (
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-5 text-white space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-black">
              <Megaphone className="w-3.5 h-3.5 text-emerald-300" />
              <span>एडमिन विज्ञापन कॉर्नर (Ad Corner Management)</span>
            </div>
            <h2 className="text-lg font-black text-white">
              बैनर व इंटरस्टीशियल ऐड्स नियंत्रण एवं स्थानीय प्रायोजक
            </h2>
            <p className="text-xs text-emerald-200 leading-relaxed">
              यहाँ से आप पूरे ऐप में विज्ञापनों को एक क्लिक में चालू या बंद कर सकते हैं और स्थानीय प्रायोजक जोड़ सकते हैं।
            </p>
          </div>

          {/* 1. MASTER ADS TOGGLE (ON / OFF) */}
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  मास्टर विज्ञापन स्विच (Master Ads ON / OFF)
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  adSettings.adsMasterEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {adSettings.adsMasterEnabled ? 'चालू (ACTIVE)' : 'बंद (DISABLED)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                यदि इसे बंद कर दिया जाए, तो ऐप में कोई भी बैनर या इंटरस्टीशियल विज्ञापन नहीं दिखेगा।
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adSettings.adsMasterEnabled}
                onChange={(e) => setAdSettings({ ...adSettings, adsMasterEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* 2. BANNER AD CONFIGURATION */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                  1
                </span>
                <h4 className="font-black text-slate-900 text-sm">
                  बैनर विज्ञापन सेटिंग्स (Banner Ads)
                </h4>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adSettings.bannerAdEnabled}
                  onChange={(e) => setAdSettings({ ...adSettings, bannerAdEnabled: e.target.checked })}
                  className="rounded text-blue-600 w-4 h-4"
                />
                <span>बैनर सक्रिय रखें</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Google AdMob Banner Unit ID
                </label>
                <input
                  type="text"
                  value={adSettings.bannerAdUnit}
                  onChange={(e) => setAdSettings({ ...adSettings, bannerAdUnit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  स्थानीय प्रायोजक / व्यापार का नाम
                </label>
                <input
                  type="text"
                  value={adSettings.sponsorTitle || ''}
                  onChange={(e) => setAdSettings({ ...adSettings, sponsorTitle: e.target.value })}
                  placeholder="उदा. जलद प्रिंटर्स, सकोदरा"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  प्रायोजक मोबाइल / WhatsApp नंबर
                </label>
                <input
                  type="text"
                  value={adSettings.sponsorContact || ''}
                  onChange={(e) => setAdSettings({ ...adSettings, sponsorContact: e.target.value })}
                  placeholder="उदा. 9530482812"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  विज्ञापन संदेश / टैगलाइन (Tagline)
                </label>
                <input
                  type="text"
                  value={adSettings.sponsorTagline || ''}
                  onChange={(e) => setAdSettings({ ...adSettings, sponsorTagline: e.target.value })}
                  placeholder="उदा. शादी कार्ड, फ्लेक्स बैनर छपाई हेतु संपर्क करें"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 sm:col-span-2">
                <input
                  type="checkbox"
                  id="sponsor-ad-active-toggle"
                  checked={adSettings.sponsorAdEnabled !== false}
                  onChange={(e) => setAdSettings({ ...adSettings, sponsorAdEnabled: e.target.checked })}
                  className="rounded text-emerald-600 w-4 h-4"
                />
                <label htmlFor="sponsor-ad-active-toggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  स्थानीय प्रायोजक बैनर ऐप में प्रदर्शित करें
                </label>
              </div>

              {/* Optional Banner Image Upload & Size Guidelines */}
              <div className="sm:col-span-2 p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-blue-950">
                    <ImageIcon className="w-4 h-4 text-blue-700" />
                    <span>बैनर फोटो / इमेज अपलोड (वैकल्पिक / Optional)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold">
                    ऐच्छिक (Optional)
                  </span>
                </div>

                {/* Size guidelines box */}
                <div className="p-3 bg-white rounded-xl border border-blue-200/80 text-xs text-slate-700 space-y-1">
                  <p className="font-black text-blue-900 text-[11px] flex items-center gap-1">
                    📐 अनुशंसित इमेज साइज़ (Recommended Dimensions & Size):
                  </p>
                  <ul className="text-2xs text-slate-600 space-y-0.5 list-disc list-inside">
                    <li><strong>मोबाइल स्टिकी बैनर:</strong> 320 × 50 px (या 300 × 100 px, 3:1 अनुपात)</li>
                    <li><strong>इन-फ़ीड / डेस्कटॉप बैनर:</strong> 728 × 90 px (Leaderboard) या 300 × 250 px (Medium Rectangle)</li>
                    <li><strong>अधिकतम फ़ाइल साइज़:</strong> 500 KB (JPG, PNG, WEBP, GIF)</li>
                    <li><strong>महत्वपूर्ण:</strong> इमेज अपलोड करना पूरी तरह <em>ऐच्छिक (Optional)</em> है। यदि कोई फोटो अपलोड नहीं करेंगे, तो ऑटोमैटिक प्रायोजक टेक्स्ट एवं कॉल/WhatsApp बटन दिखाई देंगे।</li>
                  </ul>
                </div>

                {/* Upload & Link Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-2xs font-bold text-slate-600 mb-1">
                      डिवाइस से फ़ाइल चुनें (File Upload)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-700 file:text-white hover:file:bg-blue-800 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-600 mb-1">
                      अथवा इमेज URL लिंक पेस्ट करें (Image URL)
                    </label>
                    <input
                      type="url"
                      value={adSettings.bannerImageUrl || ''}
                      onChange={(e) => setAdSettings({ ...adSettings, bannerImageUrl: e.target.value })}
                      placeholder="https://... (वैकल्पिक)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:border-blue-400 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-2xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3 text-slate-500" />
                      <span>विज्ञापन पर क्लिक करने पर खुलने वाली लिंक / वेबसाइट (Target Link - वैकल्पिक)</span>
                    </label>
                    <input
                      type="url"
                      value={adSettings.bannerTargetUrl || ''}
                      onChange={(e) => setAdSettings({ ...adSettings, bannerTargetUrl: e.target.value })}
                      placeholder="https://... (यदि खाली छोड़ेंगे तो कॉल/WhatsApp नंबर पर जाएगा)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:border-blue-400 outline-none"
                    />
                  </div>
                </div>

                {/* Banner Image Preview */}
                {adSettings.bannerImageUrl && (
                  <div className="p-2.5 bg-white rounded-xl border border-blue-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 shrink-0">प्रीव्यू:</span>
                      <img
                        src={adSettings.bannerImageUrl}
                        alt="Banner Preview"
                        className="max-h-12 max-w-[200px] object-contain rounded-lg border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdSettings({ ...adSettings, bannerImageUrl: '' })}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-2xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>इमेज हटाएं</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. INTERSTITIAL AD CONFIGURATION */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
                  2
                </span>
                <h4 className="font-black text-slate-900 text-sm">
                  फुल स्क्रीन इंटरस्टीशियल विज्ञापन (Interstitial Ads)
                </h4>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adSettings.interstitialAdEnabled}
                  onChange={(e) => setAdSettings({ ...adSettings, interstitialAdEnabled: e.target.checked })}
                  className="rounded text-purple-600 w-4 h-4"
                />
                <span>इंटरस्टीशियल सक्रिय रखें</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Google AdMob Interstitial Unit ID
                </label>
                <input
                  type="text"
                  value={adSettings.interstitialAdUnit}
                  onChange={(e) => setAdSettings({ ...adSettings, interstitialAdUnit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  प्रायोजक मोबाइल / WhatsApp नंबर
                </label>
                <input
                  type="text"
                  value={adSettings.sponsorContact || ''}
                  onChange={(e) => setAdSettings({ ...adSettings, sponsorContact: e.target.value })}
                  placeholder="उदा. 9982151938"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white outline-none"
                />
              </div>

              {/* Optional Interstitial Image Upload & Size Guidelines */}
              <div className="sm:col-span-2 p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-purple-950">
                    <ImageIcon className="w-4 h-4 text-purple-700" />
                    <span>इंटरस्टीशियल फोटो / इमेज अपलोड (वैकल्पिक / Optional)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-extrabold">
                    ऐच्छिक (Optional)
                  </span>
                </div>

                {/* Size guidelines box */}
                <div className="p-3 bg-white rounded-xl border border-purple-200/80 text-xs text-slate-700 space-y-1">
                  <p className="font-black text-purple-900 text-[11px] flex items-center gap-1">
                    📐 अनुशंसित इमेज साइज़ (Recommended Dimensions & Size):
                  </p>
                  <ul className="text-2xs text-slate-600 space-y-0.5 list-disc list-inside">
                    <li><strong>फुल स्क्रीन पोर्ट्रेट:</strong> 1080 × 1920 px (9:16 आस्पेक्ट रेशियो) या 320 × 480 px</li>
                    <li><strong>हाफ-स्क्रीन वर्टिकल:</strong> 300 × 600 px (Half Page / Large Skyscraper)</li>
                    <li><strong>अधिकतम फ़ाइल साइज़:</strong> 1 MB (JPG, PNG, WEBP, GIF)</li>
                    <li><strong>महत्वपूर्ण:</strong> इमेज अपलोड करना पूरी तरह <em>ऐच्छिक (Optional)</em> है। यदि कोई फोटो अपलोड नहीं करेंगे, तो संगठन/प्रायोजक विवरण कार्ड एवं AdMob ins यूनिट स्वतः प्रदर्शित होगी।</li>
                  </ul>
                </div>

                {/* Upload & Link Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-2xs font-bold text-slate-600 mb-1">
                      डिवाइस से फ़ाइल चुनें (File Upload)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleInterstitialFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-purple-700 file:text-white hover:file:bg-purple-800 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-600 mb-1">
                      अथवा इमेज URL लिंक पेस्ट करें (Image URL)
                    </label>
                    <input
                      type="url"
                      value={adSettings.interstitialImageUrl || ''}
                      onChange={(e) => setAdSettings({ ...adSettings, interstitialImageUrl: e.target.value })}
                      placeholder="https://... (वैकल्पिक)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:border-purple-400 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-2xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3 text-slate-500" />
                      <span>विज्ञापन पर क्लिक करने पर खुलने वाली लिंक / वेबसाइट (Target Link - वैकल्पिक)</span>
                    </label>
                    <input
                      type="url"
                      value={adSettings.interstitialTargetUrl || ''}
                      onChange={(e) => setAdSettings({ ...adSettings, interstitialTargetUrl: e.target.value })}
                      placeholder="https://... (यदि खाली छोड़ेंगे तो कॉल/WhatsApp नंबर पर जाएगा)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:border-purple-400 outline-none"
                    />
                  </div>
                </div>

                {/* Interstitial Image Preview */}
                {adSettings.interstitialImageUrl && (
                  <div className="p-2.5 bg-white rounded-xl border border-purple-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 shrink-0">प्रीव्यू:</span>
                      <img
                        src={adSettings.interstitialImageUrl}
                        alt="Interstitial Preview"
                        className="max-h-16 max-w-[200px] object-contain rounded-lg border border-slate-200 bg-slate-50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdSettings({ ...adSettings, interstitialImageUrl: '' })}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-2xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>इमेज हटाएं</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => adService.triggerInterstitial('admin_test_preview')}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                👁️ विज्ञापन प्रीव्यू टेस्ट करें (Test Preview)
              </button>
            </div>
          </div>

          {/* Error message for file size if any */}
          {adImageError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-800 flex items-center justify-between">
              <span>⚠️ {adImageError}</span>
              <button
                type="button"
                onClick={() => setAdImageError(null)}
                className="text-rose-600 hover:text-rose-800 text-xs font-black ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Save Ad Settings Button */}
          <div className="flex items-center justify-between pt-2">
            {adSavedToast && (
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                ✅ विज्ञापन सेटिंग्स सफलतापूर्वक सहेज ली गईं!
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveAdSettings}
              disabled={savingAds}
              className="ml-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              {savingAds ? 'सहेजा जा रहा है...' : 'विज्ञापन सेटिंग्स सहेजें (Save Ad Settings)'}
            </button>
          </div>
        </div>
      )}

      {/* Print Diary Modal */}
      {showPrintModal && (
        <PrintDiaryModal
          contacts={contacts}
          villages={villages}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
