import React from 'react';
import { Share2, Home, Layers, Star, HelpCircle, ShieldCheck, Download } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  isAdmin?: boolean;
  onLogout?: () => void;
  onShare?: () => void;
  onInstallClick?: () => void;
  totalContacts?: number;
  totalVillages?: number;
  pendingApprovalsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isAdmin = false,
  onShare,
  onInstallClick,
  pendingApprovalsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white border-b border-blue-800/80 shadow-md">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* App Logo & Title */}
          <button
            type="button"
            id="brand-logo-btn"
            onClick={() => setActiveTab && setActiveTab('home')}
            className="flex items-center gap-2.5 sm:gap-3 text-left group focus:outline-none min-w-0"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full ring-2 ring-blue-400/60 overflow-hidden shadow-md flex-shrink-0 bg-blue-800">
              <img
                src="/ambedkar_portrait.jpg"
                alt="Dr. B. R. Ambedkar"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-white text-base sm:text-xl tracking-tight leading-tight truncate">
                  MOBILE DIRECTORY
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  मोबाइल डायरेक्टरी
                </span>
              </div>
              <p className="text-2xs sm:text-xs text-amber-300 font-extrabold tracking-wide truncate">
                यादव समाज मोबाइल डायरेक्टरी • वागड़ चौरासी
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          {setActiveTab && (
            <nav className="hidden md:flex items-center gap-1 bg-blue-950/60 p-1 rounded-xl border border-blue-800/60 text-xs font-bold">
              <button
                type="button"
                id="desktop-nav-home"
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'home' ? 'bg-blue-700 text-white' : 'text-blue-200 hover:text-white hover:bg-blue-900/50'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>होम</span>
              </button>

              <button
                type="button"
                id="desktop-nav-villages"
                onClick={() => setActiveTab('villages')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'villages' ? 'bg-blue-700 text-white' : 'text-blue-200 hover:text-white hover:bg-blue-900/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>गाँव</span>
              </button>

              <button
                type="button"
                id="desktop-nav-help"
                onClick={() => setActiveTab('help')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'help' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-300 hover:text-white hover:bg-emerald-950/50'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>हेल्प / सहायता</span>
              </button>

              <button
                type="button"
                id="desktop-nav-favorites"
                onClick={() => setActiveTab('favorites')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'favorites' ? 'bg-amber-500 text-slate-950' : 'text-blue-200 hover:text-white hover:bg-blue-900/50'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>पसंदीदा</span>
              </button>

              <button
                type="button"
                id="desktop-nav-admin"
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors relative cursor-pointer ${
                  activeTab === 'admin' ? 'bg-amber-600 text-white' : 'text-blue-200 hover:text-white hover:bg-blue-900/50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAdmin ? 'एडमिन' : 'लॉगिन'}</span>
                {pendingApprovalsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-black animate-pulse">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            </nav>
          )}

          {/* Right Side Actions: Install App & Share */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onInstallClick && (
              <button
                type="button"
                id="header-install-app-btn"
                onClick={onInstallClick}
                title="यादव समाज मोबाइल डायरेक्टरी ऐप अपने फ़ोन में इनस्टॉल करें"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-blue-700 hover:bg-blue-600 text-white shadow-xs border border-blue-400/50 transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] text-amber-300" />
                <span>इनस्टॉल</span>
              </button>
            )}

            {onShare && (
              <button
                type="button"
                id="header-share-app-btn"
                onClick={onShare}
                title="यादव समाज मोबाइल डायरेक्टरी ऐप शेयर करें"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition-all cursor-pointer active:scale-95 border border-amber-300"
              >
                <Share2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>शेयर करें</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


