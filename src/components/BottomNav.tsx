import React from 'react';
import { Home, Layers, Star, UserPlus, ShieldCheck, HelpCircle } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdmin: boolean;
  pendingApprovalsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  pendingApprovalsCount = 0,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-6 h-16 max-w-lg mx-auto px-1">
        {/* Home */}
        <button
          type="button"
          id="nav-home-btn"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center gap-1 transition-all relative py-1 cursor-pointer active:scale-95 ${
            activeTab === 'home'
              ? 'text-blue-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 shrink-0 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] sm:text-[11px] leading-tight truncate">होम</span>
          {activeTab === 'home' && (
            <span className="absolute top-1 w-5 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        {/* Villages */}
        <button
          type="button"
          id="nav-villages-btn"
          onClick={() => setActiveTab('villages')}
          className={`flex flex-col items-center justify-center gap-1 transition-all relative py-1 cursor-pointer active:scale-95 ${
            activeTab === 'villages'
              ? 'text-blue-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className={`w-5 h-5 shrink-0 ${activeTab === 'villages' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] sm:text-[11px] leading-tight truncate">गाँव</span>
          {activeTab === 'villages' && (
            <span className="absolute top-1 w-5 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        {/* Help */}
        <button
          type="button"
          id="nav-help-btn"
          onClick={() => setActiveTab('help')}
          className={`flex flex-col items-center justify-center gap-1 transition-all relative py-1 cursor-pointer active:scale-95 ${
            activeTab === 'help'
              ? 'text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative shrink-0">
            <HelpCircle className={`w-5 h-5 shrink-0 ${activeTab === 'help' ? 'stroke-[2.5] text-emerald-600' : 'stroke-[1.75]'}`} />
            <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full ring-1 ring-white" />
          </div>
          <span className="text-[10px] sm:text-[11px] leading-tight font-bold text-emerald-700 truncate">हेल्प</span>
          {activeTab === 'help' && (
            <span className="absolute top-1 w-5 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        {/* Favorites */}
        <button
          type="button"
          id="nav-favorites-btn"
          onClick={() => setActiveTab('favorites')}
          className={`flex flex-col items-center justify-center gap-1 transition-all relative py-1 cursor-pointer active:scale-95 ${
            activeTab === 'favorites'
              ? 'text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Star className={`w-5 h-5 shrink-0 ${activeTab === 'favorites' ? 'stroke-[2.5] fill-amber-400' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] sm:text-[11px] leading-tight truncate">पसंदीदा</span>
          {activeTab === 'favorites' && (
            <span className="absolute top-1 w-5 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>

        {/* Add Contact */}
        <button
          type="button"
          id="nav-add-btn"
          onClick={() => setActiveTab('add')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-all relative py-0.5 cursor-pointer active:scale-95 ${
            activeTab === 'add'
              ? 'text-blue-800 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <UserPlus className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
          </div>
          <span className="text-[10px] sm:text-[11px] leading-tight font-semibold truncate">जोड़ें</span>
        </button>

        {/* Admin */}
        <button
          type="button"
          id="nav-admin-btn"
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center justify-center gap-1 transition-all relative py-1 cursor-pointer active:scale-95 ${
            activeTab === 'admin'
              ? 'text-amber-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative shrink-0">
            <ShieldCheck className={`w-5 h-5 shrink-0 ${activeTab === 'admin' ? 'stroke-[2.5] text-amber-600' : 'stroke-[1.75]'}`} />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-black rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center animate-pulse shadow-xs">
                {pendingApprovalsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] leading-tight truncate">{isAdmin ? 'एडमिन' : 'लॉगिन'}</span>
          {activeTab === 'admin' && (
            <span className="absolute top-1 w-5 h-0.5 bg-amber-600 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
