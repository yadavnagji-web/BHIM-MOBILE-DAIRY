import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import {
  Search,
  Users,
  UserPlus,
  Star,
  ShieldCheck,
  ChevronDown,
  Layers,
  X,
  Phone,
  MessageCircle,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  WifiOff,
  MapPin,
  Share2
} from 'lucide-react';
import { Village, Contact, ActiveTab, ApprovalRequest } from './types';
import {
  getVillages,
  getContacts,
  seedInitialDataIfEmpty,
  subscribeToRealtimeDirectory,
  subscribeToApprovalRequests,
  approveRequest,
  rejectRequest,
  approveAllPendingRequests
} from './services/directoryService';
import { subscribeToAuth, logoutAdmin } from './services/authService';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ContactCard } from './components/ContactCard';
import { AddContactModal } from './components/AddContactModal';
import { EditContactModal } from './components/EditContactModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { RequestCorrectionModal } from './components/RequestCorrectionModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { VillageManager } from './components/VillageManager';
import { CsvImportExport } from './components/CsvImportExport';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { FavoritesView } from './components/FavoritesView';
import { VillagesView } from './components/VillagesView';
import { HelpView } from './components/HelpView';
import { ShareAppModal } from './components/ShareAppModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { InstallAppModal } from './components/InstallAppModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { BannerAd } from './components/BannerAd';
import { InterstitialAdModal } from './components/InterstitialAdModal';
import { adService } from './services/adService';
import { COMMON_CATEGORIES } from './services/sampleData';

export default function App() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isAdmin, setIsAdmin] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [correctionContact, setCorrectionContact] = useState<Contact | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVillageManager, setShowVillageManager] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showGoogleSheetsModal, setShowGoogleSheetsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [appUpdateAvailable, setAppUpdateAvailable] = useState(false);
  const [realtimeUpdateAlert, setRealtimeUpdateAlert] = useState<string | null>(null);

  // AdMob Interstitial State
  const [interstitialAdOpen, setInterstitialAdOpen] = useState(false);
  const [interstitialReason, setInterstitialReason] = useState<string>('');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Listen to AdService for interstitial ad events
  useEffect(() => {
    const unsubscribe = adService.subscribe((isOpen, reason) => {
      setInterstitialAdOpen(isOpen);
      if (reason) setInterstitialReason(reason);
    });
    return () => unsubscribe();
  }, []);

  // Listen for service worker updates (Automatic App Update)
  useEffect(() => {
    const handleAppUpdate = () => {
      setAppUpdateAvailable(true);
    };
    window.addEventListener('app-update-available', handleAppUpdate);
    return () => window.removeEventListener('app-update-available', handleAppUpdate);
  }, []);

  // Auth observer
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setIsAdmin(Boolean(user));
    });
    return () => unsubscribe();
  }, []);

  // Realtime listener for pending approval requests
  useEffect(() => {
    const unsubscribe = subscribeToApprovalRequests((requests) => {
      setPendingRequests(requests);
    });
    return () => unsubscribe();
  }, []);

  // Approval Handlers
  const handleApproveRequest = async (req: ApprovalRequest) => {
    try {
      await approveRequest(req);
      showToast(`'${req.contactData.name}' का अनुरोध स्वीकृत कर दिया गया!`);
    } catch (err: any) {
      showToast('अनुरोध स्वीकृत करने में त्रुटि: ' + (err.message || 'त्रुटि हुई'));
    }
  };

  const handleRejectRequest = async (reqId: string, reason?: string) => {
    try {
      await rejectRequest(reqId, reason);
      showToast('अनुरोध अस्वीकृत कर दिया गया।');
    } catch (err: any) {
      showToast('त्रुटि: ' + (err.message || 'त्रुटि हुई'));
    }
  };

  const handleApproveAllRequests = async () => {
    try {
      const count = await approveAllPendingRequests();
      showToast(`सभी ${count} अनुरोध सफलतापूर्वक स्वीकृत कर दिए गए!`);
    } catch (err: any) {
      showToast('त्रुटि: ' + (err.message || 'त्रुटि हुई'));
    }
  };

  // Initial seed check & Realtime Live Sync for automatic instant updates
  useEffect(() => {
    let unsubscribeRealtime: (() => void) | null = null;
    let initialLoaded = false;

    const setupRealtime = async () => {
      try {
        setLoading(true);
        setNetworkError(null);

        // Attempt non-blocking seed in background without hanging initial render
        seedInitialDataIfEmpty().catch((e) => console.warn('Background seed note:', e));

        unsubscribeRealtime = subscribeToRealtimeDirectory(
          ({ villages: vList, contacts: cList }) => {
            setVillages(vList);
            setContacts((prevContacts) => {
              if (initialLoaded && prevContacts.length > 0 && cList.length > 0) {
                // Show instant update alert to user if new records arrive
                setRealtimeUpdateAlert('✨ डायरेक्टरी स्वतः अपडेट हो गई है! (नया डेटा प्राप्त हुआ)');
                setTimeout(() => setRealtimeUpdateAlert(null), 4500);
              }
              return cList;
            });
            initialLoaded = true;
            setNetworkError(null);
            setLoading(false);
          },
          (err) => {
            console.warn('Realtime sync notice (operating in offline/cached mode):', err);
            // Only show network error banner if there is no data at all to display
            setContacts((current) => {
              if (current.length === 0) {
                setNetworkError('डेटाबेस कनेक्ट नहीं हो सका। कृपया इन्टरनेट कनेक्शन जाँचें।');
              }
              return current;
            });
            setLoading(false);
          }
        );
      } catch (err: any) {
        console.warn('Data load warning:', err);
        setContacts((current) => {
          if (current.length === 0) {
            setNetworkError('डेटाबेस कनेक्ट नहीं हो सका। कृपया इन्टरनेट कनेक्शन जाँचें।');
          }
          return current;
        });
        setLoading(false);
      }
    };

    setupRealtime();

    return () => {
      if (unsubscribeRealtime) unsubscribeRealtime();
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setNetworkError(null);
    try {
      await seedInitialDataIfEmpty();
      const [vList, cList] = await Promise.all([getVillages(), getContacts()]);
      setVillages(vList);
      setContacts(cList);
    } catch (err: any) {
      console.error('Data load error:', err);
      setNetworkError('डेटाबेस कनेक्ट नहीं हो सका। कृपया इन्टरनेट कनेक्शन जाँचें।');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      setIsAdmin(false);
      showToast('एडमिन सत्र सफलतापूर्वक समाप्त हुआ।');
      if (activeTab === 'admin') {
        setActiveTab('home');
      }
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Filtered contacts calculation
  const filteredContacts = useMemo(() => {
    // If no village is chosen at start, do not show numbers yet
    if (!selectedVillageId) {
      return [];
    }

    return contacts.filter((c) => {
      // 1. Village filter (Home selection or dropdown)
      if (selectedVillageId !== 'all' && c.villageId !== selectedVillageId) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all' && !c.category.includes(selectedCategory)) {
        return false;
      }

      // 3. Search query: global and village-specific
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchFather = c.fatherName ? c.fatherName.toLowerCase().includes(q) : false;
        const matchMobile = c.mobile.includes(q) || (c.alternateMobile && c.alternateMobile.includes(q));
        const matchVillage = c.villageName.toLowerCase().includes(q);
        const matchCategory = c.category.toLowerCase().includes(q);
        const matchAddress = c.address ? c.address.toLowerCase().includes(q) : false;
        return matchName || matchFather || matchMobile || matchVillage || matchCategory || matchAddress;
      }

      return true;
    });
  }, [contacts, selectedVillageId, selectedCategory, searchQuery]);

  // Village info for display
  const currentVillage = useMemo(() => {
    return villages.find((v) => v.id === selectedVillageId);
  }, [villages, selectedVillageId]);

  // Contact count for current selection
  const currentVillageContactCount = useMemo(() => {
    if (selectedVillageId === 'all') return contacts.length;
    return contacts.filter((c) => c.villageId === selectedVillageId).length;
  }, [contacts, selectedVillageId]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col antialiased pb-24 md:pb-12">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'add') {
            setShowAddModal(true);
          } else if (tab === 'admin' && !isAdmin) {
            setShowLoginModal(true);
          } else {
            setActiveTab(tab);
            adService.onTabSwitch();
          }
        }}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onShare={() => setShowShareModal(true)}
        onInstallClick={() => setShowInstallModal(true)}
        totalContacts={contacts.length}
        totalVillages={villages.length}
        pendingApprovalsCount={pendingRequests.length}
      />

      {/* Mobile App Install Top Prominent Banner */}
      <PWAInstallBanner onOpenModal={() => setShowInstallModal(true)} />

      {/* PWA / App Version Auto-Update Banner */}
      {appUpdateAvailable && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2.5 text-center text-xs font-black flex items-center justify-center gap-3 sticky top-0 z-40 shadow-md">
          <span>⚡ भीम डायरेक्टरी का नया अपडेट उपलब्ध है!</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            अभी रीफ्रेश करें (Update Now)
          </button>
        </div>
      )}

      {/* Realtime Database Auto-Update Live Banner */}
      {realtimeUpdateAlert && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-40 shadow-md animate-in slide-in-from-top duration-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{realtimeUpdateAlert}</span>
        </div>
      )}

      {/* Network or Error Banner */}
      {networkError && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span>{networkError}</span>
            <button
              type="button"
              onClick={loadData}
              className="ml-auto underline font-bold hover:text-rose-100"
            >
              पुनः प्रयास करें
            </button>
          </div>
        </div>
      )}

      {/* Global Success Notification */}
      {notification && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-sm text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Areas */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* TAB 1: HOME SCREEN (Default User Experience) */}
        {activeTab === 'home' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Top Dr. B. R. Ambedkar & Sangthan Branding Card */}
            <div className="bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl shadow-blue-950/20 border border-blue-800/70 text-center relative overflow-hidden">
              {/* Subtle blue ambient light */}
              <div className="absolute -top-20 -left-20 w-56 h-56 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-xl mx-auto space-y-4">
                {/* Dr. B. R. Ambedkar Photo */}
                <div className="flex flex-col items-center">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-amber-400 shadow-2xl overflow-hidden bg-white mx-auto">
                    <img
                      src="/ambedkar_portrait.jpg"
                      alt="डॉ. बी. आर. अम्बेडकर"
                      className="w-full h-full object-cover object-top"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Organization and App Title */}
                <div className="space-y-1 pt-1">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                    BHIM DIRECTORY
                  </h1>
                  <h2 className="text-base sm:text-lg font-extrabold text-amber-300 leading-snug">
                    डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-200 font-medium">
                    (Dr. B. R. Ambedkar Yadav Yuva Sangthan Vagad Chaurasi)
                  </p>
                </div>

                {/* START ME KEVAL GAV CHUNE DROP DOWN HO */}
                <div className="pt-2 text-left">
                  <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-blue-400/30 space-y-2 shadow-inner">
                    <label
                      htmlFor="home-village-select"
                      className="block text-xs font-bold text-blue-100 uppercase tracking-wider flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span>गाँव चुनें (Select Village):</span>
                      </span>
                      {selectedVillageId && (
                        <span className="text-2xs font-bold text-amber-300">
                          {currentVillageContactCount} संपर्क उपलब्ध
                        </span>
                      )}
                    </label>

                    <div className="relative">
                      <select
                        id="home-village-select"
                        value={selectedVillageId}
                        onChange={(e) => {
                          setSelectedVillageId(e.target.value);
                          setSearchQuery('');
                          setSelectedCategory('all');
                        }}
                        className="w-full pl-4 pr-11 py-3 bg-white text-slate-900 font-bold text-base rounded-xl shadow-md outline-none focus:ring-4 focus:ring-blue-400 transition-all cursor-pointer appearance-none border border-blue-200"
                      >
                        <option value="">
                          -- कृपया अपना गाँव चुनें (Please Select Village) --
                        </option>
                        {villages.map((v) => {
                          const count = contacts.filter((c) => c.villageId === v.id).length;
                          return (
                            <option key={v.id} value={v.id}>
                              🏘️ {v.name} ({count} संपर्क)
                            </option>
                          );
                        })}
                        <option value="all">
                          🌐 सभी गाँव देखें (All Villages - {contacts.length} संपर्क)
                        </option>
                      </select>
                      <ChevronDown className="w-5 h-5 text-slate-600 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOW: BEFORE VILLAGE IS SELECTED vs AFTER VILLAGE IS SELECTED */}
            {!selectedVillageId ? null : (
              /* AFTER VILLAGE IS SELECTED: Numbers are shown systematically */
              <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300">
                {/* Systematic Village Header & Quick Context Actions */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-600/20 font-black">
                      {selectedVillageId === 'all' ? '🌐' : '🏘️'}
                    </div>
                    <div>
                      <span className="text-2xs uppercase tracking-wider text-blue-600 block font-bold">
                        {selectedVillageId === 'all' ? 'संपूर्ण डायरेक्टरी' : 'चयनित गाँव'}
                      </span>
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                        {currentVillage ? currentVillage.name : 'सभी गाँव के संपर्क'}
                      </h3>
                      <span className="text-xs font-semibold text-slate-500">
                        कुल {currentVillageContactCount} संपर्क उपलब्ध
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVillageId('');
                        setSearchQuery('');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      🔄 दूसरा गाँव चुनें
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-sm shadow-blue-700/20 transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>संपर्क जोड़ें</span>
                    </button>
                  </div>
                </div>

                {/* Village Search Bar & Category Filters */}
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      id="home-search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        selectedVillageId === 'all'
                          ? 'नाम, मोबाइल नंबर, गाँव या श्रेणी से खोजें...'
                          : `"${currentVillage?.name}" में नाम या मोबाइल नंबर खोजें...`
                      }
                      className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Category Chips for One-Tap Filtering */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                    <span className="text-slate-500 font-bold flex items-center gap-1 flex-shrink-0 mr-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                      श्रेणी:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1 rounded-lg font-bold flex-shrink-0 transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      सभी ({filteredContacts.length})
                    </button>
                    {['किसान', 'किराना', 'शिक्षक', 'मिस्त्री', 'डेयरी', 'चालक', 'दर्जी'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
                        className={`px-3 py-1 rounded-lg font-medium flex-shrink-0 transition-colors border ${
                          selectedCategory === cat
                            ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contacts Grid */}
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl p-5 border border-slate-200/80 animate-pulse space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-200" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-4 bg-slate-200 rounded w-2/3" />
                            <div className="h-3 bg-slate-100 rounded w-1/2" />
                          </div>
                        </div>
                        <div className="h-9 bg-slate-100 rounded-xl" />
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <div className="h-9 bg-slate-200 rounded-xl" />
                          <div className="h-9 bg-slate-200 rounded-xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-2xs">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 mx-auto flex items-center justify-center text-2xl">
                      🔍
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      कोई संपर्क नहीं मिला
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                      {searchQuery
                        ? `"${searchQuery}" से मेल खाता कोई संपर्क नहीं मिला। कृपया वर्तनी जांचें या गाँव बदलें।`
                        : 'इस गाँव में अभी कोई संपर्क दर्ज नहीं है। पहला संपर्क जोड़ें!'}
                    </p>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('all');
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                        >
                          सर्च रीसेट करें
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold shadow-sm hover:bg-blue-800 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>नया संपर्क जोड़ें</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredContacts.map((contact, index) => (
                      <React.Fragment key={contact.id}>
                        <ContactCard
                          contact={contact}
                          isAdmin={isAdmin}
                          onEdit={(c) => setEditingContact(c)}
                          onDelete={(c) => setDeletingContact(c)}
                          onRequestCorrection={(c) => setCorrectionContact(c)}
                        />
                        {index === 5 && filteredContacts.length > 6 && (
                          <div className="col-span-full">
                            <BannerAd placement="in-feed" />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VILLAGES DIRECTORY TAB */}
        {activeTab === 'villages' && (
          <VillagesView
            villages={villages}
            contacts={contacts}
            onSelectVillage={(vId) => {
              setSelectedVillageId(vId);
              setActiveTab('home');
            }}
          />
        )}

        {/* TAB: HELP & SUPPORT TAB */}
        {activeTab === 'help' && (
          <HelpView
            onOpenAddModal={() => setShowAddModal(true)}
            onGoToHome={() => setActiveTab('home')}
            onGoToVillages={() => setActiveTab('villages')}
            onOpenPrivacyPolicy={() => setShowPrivacyModal(true)}
            onOpenInstallModal={() => setShowInstallModal(true)}
          />
        )}

        {/* TAB 3: FAVORITES TAB */}
        {activeTab === 'favorites' && (
          <FavoritesView
            contacts={contacts}
            onBackToHome={() => setActiveTab('home')}
            isAdmin={false}
            onRequestCorrection={(c) => setCorrectionContact(c)}
          />
        )}

        {/* TAB 4: ADMIN DASHBOARD (Protected) */}
        {activeTab === 'admin' && (
          <>
            {isAdmin ? (
              <AdminDashboard
                contacts={contacts}
                villages={villages}
                pendingRequests={pendingRequests}
                onAddContact={() => setShowAddModal(true)}
                onEditContact={(c) => setEditingContact(c)}
                onDeleteContact={(c) => setDeletingContact(c)}
                onManageVillages={() => setShowVillageManager(true)}
                onOpenCsvManager={() => setShowCsvModal(true)}
                onOpenGoogleSheets={() => setShowGoogleSheetsModal(true)}
                onLogout={handleLogout}
                onRefresh={loadData}
                onApproveRequest={handleApproveRequest}
                onRejectRequest={handleRejectRequest}
                onApproveAllRequests={handleApproveAllRequests}
                notificationMessage={notification || undefined}
              />
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 shadow-sm my-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  एडमिन प्रमाणीकरण आवश्यक
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  एडमिन डैशबोर्ड, संपर्क संशोधन एवं डेटाबेस प्रबंधन के लिए कृपया सुरक्षित लॉगिन करें।
                </p>
                <button
                  type="button"
                  id="open-login-from-tab-btn"
                  onClick={() => setShowLoginModal(true)}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all"
                >
                  एडमिन लॉगिन करें (Login)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Google AdMob Banner Ad (Non-disturbing mobile/desktop placement) */}
      <BannerAd placement="bottom-sticky" />

      {/* Fixed Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'add') {
            setShowAddModal(true);
          } else if (tab === 'admin' && !isAdmin) {
            setShowLoginModal(true);
          } else {
            setActiveTab(tab);
            adService.onTabSwitch();
          }
        }}
        isAdmin={isAdmin}
        pendingApprovalsCount={pendingRequests.length}
      />

      {/* MODAL 1: ADD CONTACT */}
      {showAddModal && (
        <AddContactModal
          villages={villages}
          defaultVillageId={selectedVillageId !== 'all' ? selectedVillageId : undefined}
          isAdmin={isAdmin}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
            setTimeout(() => {
              adService.triggerInterstitial('after_add_contact');
            }, 500);
          }}
        />
      )}

      {/* MODAL: REQUEST CORRECTION / REMOVAL (PUBLIC CITIZEN) */}
      {correctionContact && (
        <RequestCorrectionModal
          contact={correctionContact}
          villages={villages}
          onClose={() => setCorrectionContact(null)}
          onSuccess={() => {
            setCorrectionContact(null);
            showToast('✅ आपका अनुरोध एडमिन को सफलतापूर्वक भेज दिया गया है!');
            setTimeout(() => {
              adService.triggerInterstitial('after_correction_request');
            }, 500);
          }}
        />
      )}

      {/* MODAL 2: EDIT CONTACT (ADMIN ONLY) */}
      {editingContact && (
        <EditContactModal
          contact={editingContact}
          villages={villages}
          onClose={() => setEditingContact(null)}
          onSuccess={() => {
            setEditingContact(null);
            showToast('Contact updated successfully. (संपर्क सफलतापूर्वक अपडेट हुआ)');
            loadData();
          }}
        />
      )}

      {/* MODAL 3: DELETE CONFIRMATION (ADMIN ONLY) */}
      {deletingContact && (
        <DeleteConfirmModal
          contact={deletingContact}
          onClose={() => setDeletingContact(null)}
          onSuccess={() => {
            setDeletingContact(null);
            showToast('Contact deleted successfully. (संपर्क सफलतापूर्वक हटाया गया)');
            loadData();
          }}
        />
      )}

      {/* MODAL 4: ADMIN LOGIN */}
      {showLoginModal && (
        <AdminLoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            setIsAdmin(true);
            setActiveTab('admin');
            showToast('एडमिन लॉगिन सफल!');
          }}
        />
      )}

      {/* MODAL 5: VILLAGE MANAGER (ADMIN ONLY) */}
      {showVillageManager && (
        <VillageManager
          villages={villages}
          onClose={() => setShowVillageManager(false)}
          onRefresh={() => {
            loadData();
          }}
        />
      )}

      {/* MODAL 6: CSV IMPORT & EXPORT (ADMIN ONLY) */}
      {showCsvModal && (
        <CsvImportExport
          contacts={contacts}
          villages={villages}
          onClose={() => setShowCsvModal(false)}
          onImportComplete={() => {
            loadData();
            showToast('CSV से संपर्क सफलतापूर्वक इम्पोर्ट किए गए।');
          }}
        />
      )}

      {/* MODAL 6.5: GOOGLE SHEETS STORAGE & SYNC (ADMIN ONLY) */}
      {showGoogleSheetsModal && (
        <GoogleSheetSyncModal
          contacts={contacts}
          villages={villages}
          onClose={() => setShowGoogleSheetsModal(false)}
          onDataImported={(newContacts, newVillages) => {
            setContacts(newContacts);
            setVillages(newVillages);
            showToast('Google Sheet से डाटा सफलतापूर्वक अपडेट हुआ!');
          }}
          showToast={showToast}
        />
      )}

      {/* MODAL 7: SHARE APP MODAL */}
      <ShareAppModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* MODAL 8: PRIVACY POLICY MODAL */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      {/* MODAL 9: PWA MOBILE APP INSTALL GUIDE & PROMPT */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* Offline Status Indicator Bar */}
      <OfflineIndicator />

      {/* Google AdMob Interstitial Ad (Non-disturbing with frequency capping) */}
      <InterstitialAdModal
        isOpen={interstitialAdOpen}
        triggerReason={interstitialReason}
        onClose={() => setInterstitialAdOpen(false)}
      />

      {/* Vercel Speed Insights */}
      <SpeedInsights />
    </div>
  );
}
