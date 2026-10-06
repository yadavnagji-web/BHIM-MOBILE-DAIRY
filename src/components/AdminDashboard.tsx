import React, { useState, useMemo } from 'react';
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
  BookOpen,
  AlertTriangle,
  Phone,
  MessageCircle,
  Check,
  X,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { Contact, Village, ApprovalRequest } from '../types';
import { ContactCard } from './ContactCard';
import { PrintDiaryModal } from './PrintDiaryModal';

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
  const [activeTab, setActiveTab] = useState<'approvals' | 'contacts'>(
    pendingRequests.length > 0 ? 'approvals' : 'contacts'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [showVillageCountBreakdown, setShowVillageCountBreakdown] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [rejectModalReq, setRejectModalReq] = useState<ApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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

  const handleApprove = async (req: ApprovalRequest) => {
    if (!onApproveRequest) return;
    setProcessingId(req.id);
    try {
      await onApproveRequest(req);
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalReq || !onRejectRequest) return;
    setProcessingId(rejectModalReq.id);
    try {
      await onRejectRequest(rejectModalReq.id, rejectReason.trim());
      setRejectModalReq(null);
      setRejectReason('');
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAll = async () => {
    if (!onApproveAllRequests || pendingRequests.length === 0) return;
    if (!window.confirm(`क्या आप सभी ${pendingRequests.length} लंबित अनुरोधों को एक साथ स्वीकृत करना चाहते हैं?`)) {
      return;
    }
    setIsProcessingAll(true);
    try {
      await onApproveAllRequests();
    } catch (err) {
      console.error('Approve all failed:', err);
    } finally {
      setIsProcessingAll(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto px-3 sm:px-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-700 rounded-3xl p-5 sm:p-7 text-white shadow-lg shadow-amber-900/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                एडमिन डैशबोर्ड (Admin Dashboard)
              </h1>
              <p className="text-amber-100 text-xs sm:text-sm font-medium mt-0.5">
                सुरक्षित प्रशासनिक पैनल - नंबर अनुमोदन, गाँव एवं डाटा प्रबंधन
              </p>
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="admin-add-contact-btn"
              onClick={onAddContact}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-amber-900 hover:bg-amber-50 font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-700" />
              <span>नया संपर्क जोड़ें</span>
            </button>

            <button
              type="button"
              id="admin-manage-villages-btn"
              onClick={onManageVillages}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-800/80 hover:bg-amber-800 text-white font-semibold text-xs sm:text-sm border border-amber-500/40 transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>गाँव प्रबंधन</span>
            </button>

            <button
              type="button"
              id="admin-csv-tools-btn"
              onClick={onOpenCsvManager}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-800/80 hover:bg-amber-800 text-white font-semibold text-xs sm:text-sm border border-amber-500/40 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import / Export</span>
            </button>

            {onOpenGoogleSheets && (
              <button
                type="button"
                id="admin-google-sheets-btn"
                onClick={onOpenGoogleSheets}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                <span>Google Sheets Storage</span>
              </button>
            )}

            <button
              type="button"
              id="admin-print-diary-btn"
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>डायरी प्रिंट व QR</span>
            </button>

            <button
              type="button"
              id="admin-logout-btn"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/20 hover:bg-black/30 text-amber-100 hover:text-white font-medium text-xs sm:text-sm transition-all cursor-pointer"
              title="लॉगआउट"
            >
              <LogOut className="w-4 h-4" />
              <span>लॉगआउट</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast if present */}
      {notificationMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold text-emerald-800 shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notificationMessage}</span>
        </div>
      )}

      {/* Key Metrics / Dashboard Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Approvals Metric */}
        <div
          onClick={() => setActiveTab('approvals')}
          className={`p-4.5 rounded-2xl border transition-all cursor-pointer ${
            pendingRequests.length > 0
              ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-sm hover:border-amber-400'
              : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              लंबित अनुमोदन (Approvals)
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              pendingRequests.length > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 flex items-center gap-2">
            <span>{pendingRequests.length}</span>
            {pendingRequests.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600 text-white font-bold animate-bounce">
                सत्यापन जरूरी
              </span>
            )}
          </p>
          <span className="text-2xs text-slate-500 mt-1 block">
            {pendingRequests.length > 0 ? 'नागरिकों द्वारा भेजे गए अनुरोध' : 'सभी संपर्क सत्यापित हैं'}
          </span>
        </div>

        {/* Total Villages */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              कुल गाँव (Villages)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {villages.length}
          </p>
          <span className="text-2xs text-slate-400 mt-1 block">डायरेक्टरी में पंजीकृत</span>
        </div>

        {/* Total Active Contacts */}
        <div
          onClick={() => setActiveTab('contacts')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              सत्यापित संपर्क (Live)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {contacts.length}
          </p>
          <span className="text-2xs text-slate-400 mt-1 block">डायरेक्टरी में सक्रिय नंबर</span>
        </div>

        {/* Sync Status */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              डेटाबेस स्थिति
            </span>
            <button
              type="button"
              onClick={onRefresh}
              className="p-1 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors"
              title="रिफ्रेश करें"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Firebase लाइव कनेक्टेड
            </span>
          </div>
          <span className="text-2xs text-slate-400 mt-1 block">Firestore रीयल-टाइम</span>
        </div>
      </div>

      {/* Main Admin Section Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>लंबित अनुमोदन (Approvals)</span>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.2 rounded-full text-xs font-black bg-white text-amber-800 shadow-xs">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'contacts'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>सभी संपर्क प्रबंधन ({contacts.length})</span>
          </button>
        </div>

        {activeTab === 'approvals' && pendingRequests.length > 1 && (
          <button
            type="button"
            onClick={handleApproveAll}
            disabled={isProcessingAll}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isProcessingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4 stroke-[3]" />
            )}
            <span>सभी ({pendingRequests.length}) को एक साथ स्वीकृत करें</span>
          </button>
        )}
      </div>

      {/* SECTION 1: APPROVAL REQUESTS VIEW */}
      {activeTab === 'approvals' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-3xl shadow-xs border border-emerald-100">
                🛡️
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                सभी अनुमोदन पूर्ण हैं!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                वर्तमान में कोई भी नया नंबर जोड़ने या सुधारने का अनुरोध लंबित नहीं है। जब भी कोई नागरिक नया नंबर जोड़ेगा या सुधार का अनुरोध भेजेगा, वह यहाँ दिखाई देगा।
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('contacts')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors"
              >
                <span>सभी संपर्क सूची देखें</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-amber-950">
                <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">एडमिन सुरक्षा प्रणाली:</strong>
                  कोई भी व्यक्ति किसी अन्य के नंबर के साथ छेड़छाड़ न कर सके, इसलिए नागरिकों द्वारा भेजे गए नए नंबर या सुधार के अनुरोध नीचे सूचीबद्ध हैं। विवरण जाँचकर <strong>"स्वीकृत"</strong> या <strong>"अस्वीकृत"</strong> करें।
                </div>
              </div>

              {/* Requests List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((req) => {
                  const isBusy = processingId === req.id;
                  const reqDate = req.createdAt ? new Date(req.createdAt).toLocaleDateString('hi-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '';

                  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  let badgeText = '🟢 नया संपर्क पंजीकरण';
                  if (req.type === 'edit_contact') {
                    badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                    badgeText = '🔵 नंबर / विवरण सुधार';
                  } else if (req.type === 'delete_contact') {
                    badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
                    badgeText = '🔴 नंबर हटाने का अनुरोध';
                  }

                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border-2 border-slate-200/90 hover:border-amber-400 p-5 shadow-sm space-y-4 relative flex flex-col justify-between transition-all"
                    >
                      <div className="space-y-3">
                        {/* Request Header */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeColor}`}>
                            {badgeText}
                          </span>
                          {reqDate && (
                            <span className="text-2xs text-slate-400 flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3" />
                              {reqDate}
                            </span>
                          )}
                        </div>

                        {/* Contact Data Details */}
                        <div className="space-y-1.5 text-xs sm:text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-base">
                                {req.contactData.name}
                              </h4>
                              {req.contactData.fatherName && (
                                <p className="text-xs text-slate-500 font-medium">
                                  पिता: <span className="text-slate-800 font-semibold">{req.contactData.fatherName}</span>
                                </p>
                              )}
                            </div>
                            <span className="font-semibold text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              🏘️ {req.contactData.villageName}
                            </span>
                          </div>

                          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            <div className="flex items-center gap-2">
                              <span className="text-base">📱</span>
                              <span className="font-mono font-bold text-slate-900 text-sm">
                                {req.contactData.mobile}
                              </span>
                            </div>
                            <a
                              href={`tel:+91${req.contactData.mobile}`}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 font-bold text-xs flex items-center gap-1 shadow-2xs"
                              title="सत्यापन हेतु कॉल करें"
                            >
                              <Phone className="w-3 h-3" />
                              <span>कॉल</span>
                            </a>
                          </div>

                          {req.contactData.alternateMobile && (
                            <div className="text-slate-600 text-xs px-1">
                              वैकल्पिक नंबर: <span className="font-mono">{req.contactData.alternateMobile}</span>
                            </div>
                          )}

                          <div className="text-slate-600 text-xs px-1">
                            व्यवसाय: <span className="font-semibold text-slate-800">{req.contactData.category}</span>
                            {req.contactData.fatherName && (
                              <span className="ml-2">| पिता: {req.contactData.fatherName}</span>
                            )}
                            {req.contactData.address && (
                              <span className="ml-2">| पता: {req.contactData.address}</span>
                            )}
                          </div>
                        </div>

                        {/* If Edit/Delete: Show Old vs New comparison */}
                        {req.existingContactData && (
                          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                            <span className="text-2xs font-bold text-amber-800 uppercase block">
                              पहले दर्ज विवरण (Original in Directory):
                            </span>
                            <div className="text-slate-700 font-medium">
                              {req.existingContactData.name} ({req.existingContactData.mobile}) - {req.existingContactData.villageName}
                            </div>
                          </div>
                        )}

                        {/* Requester Identity & Reason */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-semibold">अनुरोधकर्ता (Requester):</span>
                            <span className="font-bold text-slate-800">{req.requesterName || 'नागरिक'}</span>
                          </div>
                          {req.requesterPhone && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-semibold">अनुरोधकर्ता का फोन:</span>
                              <a
                                href={`tel:+91${req.requesterPhone}`}
                                className="font-mono font-bold text-blue-700 hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                {req.requesterPhone}
                              </a>
                            </div>
                          )}
                          {req.reason && (
                            <div className="pt-1 border-t border-slate-200/80">
                              <span className="text-slate-500 font-semibold block text-2xs uppercase">कारण / संदेश:</span>
                              <p className="text-slate-700 italic font-medium mt-0.5">"{req.reason}"</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Admin Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleApprove(req)}
                          disabled={isBusy}
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 stroke-[3]" />
                          )}
                          <span>स्वीकृत करें (Approve)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRejectModalReq(req);
                            setRejectReason('');
                          }}
                          disabled={isBusy}
                          className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-4 h-4 stroke-[2.5]" />
                          <span>अस्वीकृत (Reject)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: REGULAR CONTACT MANAGEMENT VIEW */}
      {activeTab === 'contacts' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Village-wise Contact Count Collapse / Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowVillageCountBreakdown(!showVillageCountBreakdown)}
              className="w-full p-4 flex items-center justify-between bg-slate-50/70 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-800">
                  गाँव अनुसार संपर्क संख्या (Village-wise Contact Count)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {villages.length} गाँव
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    showVillageCountBreakdown ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {showVillageCountBreakdown && (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 border-t border-slate-100 bg-white animate-in fade-in duration-150">
                {villages.map((v) => {
                  const count = villageCountMap.get(v.id) || 0;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVillageFilter(v.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedVillageFilter === v.id
                          ? 'bg-emerald-50 border-emerald-400 shadow-2xs'
                          : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800 truncate mr-2">
                        🏘️ {v.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-2xs font-extrabold bg-white border border-slate-200 text-slate-700">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search & Filtering Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  id="admin-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="नाम, मोबाइल, गाँव, पता या श्रेणी से खोजें..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-amber-600 outline-none transition-all"
                />
              </div>

              {/* Filter by Village */}
              <div className="flex items-center gap-2">
                <select
                  id="admin-village-filter-select"
                  value={selectedVillageFilter}
                  onChange={(e) => setSelectedVillageFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-amber-600"
                >
                  <option value="all">सभी गाँव ({villages.length})</option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({villageCountMap.get(v.id) || 0})
                    </option>
                  ))}
                </select>

                {/* Filter by Category */}
                <select
                  id="admin-category-filter-select"
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-amber-600"
                >
                  <option value="all">सभी श्रेणियाँ</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter tags feedback */}
            {(selectedVillageFilter !== 'all' || selectedCategoryFilter !== 'all' || searchTerm) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <span>सक्रिय फिल्टर:</span>
                {selectedVillageFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                    गाँव: {villages.find((v) => v.id === selectedVillageFilter)?.name}
                    <button
                      type="button"
                      onClick={() => setSelectedVillageFilter('all')}
                      className="hover:text-rose-600 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedCategoryFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-semibold">
                    श्रेणी: {selectedCategoryFilter}
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter('all')}
                      className="hover:text-rose-600 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-semibold">
                    खोज: "{searchTerm}"
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="hover:text-rose-600 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVillageFilter('all');
                    setSelectedCategoryFilter('all');
                    setSearchTerm('');
                  }}
                  className="text-xs text-rose-600 hover:underline font-bold ml-auto"
                >
                  सभी फिल्टर हटाएं
                </button>
              </div>
            )}
          </div>

          {/* Contact Cards Section with Admin Controls (Edit & Delete visible!) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>सत्यापित संपर्क प्रबंधन सूची</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800">
                  {filteredContacts.length} परिणाम
                </span>
              </h2>
              <span className="text-xs text-slate-500 italic hidden sm:inline">
                * केवल एडमिन के पास संपादित करने व हटाने का अधिकार है
              </span>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">कोई संपर्क नहीं मिला</p>
                <p className="text-xs text-slate-500">
                  खोज शब्द बदलें या नया संपर्क जोड़ें।
                </p>
                <button
                  type="button"
                  onClick={onAddContact}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors"
                >
                  नया संपर्क जोड़ें
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {filteredContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isAdmin={true}
                    onEdit={onEditContact}
                    onDelete={onDeleteContact}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">अनुरोध अस्वीकृत करें</h3>
                <p className="text-xs text-slate-500">
                  {rejectModalReq.contactData.name} ({rejectModalReq.contactData.mobile})
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                अस्वीकृति का कारण (वैकल्पिक)
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="उदा. गलत मोबाइल नंबर, या असत्यापित अनुरोध"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={processingId === rejectModalReq.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {processingId === rejectModalReq.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                <span>अस्वीकृत करें</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Diary Modal */}
      {showPrintModal && (
        <PrintDiaryModal
          isOpen={showPrintModal}
          contacts={contacts}
          villages={villages}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
