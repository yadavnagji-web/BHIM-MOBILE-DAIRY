import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, X, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { loginAdmin, MASTER_ADMIN_NAME, ADMIN_MASTER_PASSWORD_CODE } from '../services/authService';

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('NAGJI YADAV');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('कृपया एडमिन यूज़रनेम दर्ज करें।');
      return;
    }

    if (!password) {
      setError('कृपया पासवर्ड दर्ज करें।');
      return;
    }

    setLoading(true);
    try {
      await loginAdmin(username, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'प्रमाणीकरण विफल। कृपया सही पासवर्ड दर्ज करें।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6 stroke-[2.3]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-extrabold bg-amber-100 text-amber-900 mb-1">
                <span>🔒</span>
                <span>केवल 1 मुख्य एडमिन अधिकृत</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                एडमिन लॉगिन ({MASTER_ADMIN_NAME})
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Username / Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              अधिकृत एडमिन नाम (Authorized Admin)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                id="admin-username-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="NAGJI YADAV"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-bold focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none transition-all"
                autoFocus
                required
              />
            </div>
            <span className="text-2xs text-slate-500 mt-1 block">
              * इस डायरेक्टरी सिस्टम में केवल {MASTER_ADMIN_NAME} ही एकमात्र एडमिन हैं।
            </span>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              पासवर्ड (Master Passcode: 12345)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="admin-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="पासवर्ड दर्ज करें"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            id="admin-login-submit-btn"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>प्रमाणीकरण हो रहा है...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>सुरक्षित एडमिन लॉगिन करें</span>
              </>
            )}
          </button>
        </form>

        {/* Single Admin Protection Notice */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <p className="text-2xs text-slate-500 font-medium">
            सुरक्षा निर्देश: संगठन की गोपनीयता बनाए रखने हेतु केवल अधिकृत एडमिन ही लॉगिन कर सकते हैं।
          </p>
        </div>
      </div>
    </div>
  );
};
