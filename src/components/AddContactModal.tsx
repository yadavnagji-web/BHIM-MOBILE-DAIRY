import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  MessageCircle,
  KeyRound,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Village } from '../types';
import {
  createContact,
  submitApprovalRequest,
  isValidIndianMobile,
  normalizeIndianMobile,
  getLocalCachedSettings,
  getAppSettings
} from '../services/directoryService';
import { sendWhatsAppOtp, verifyWhatsAppOtp } from '../services/otpService';
import { COMMON_CATEGORIES } from '../services/sampleData';

interface AddContactModalProps {
  villages: Village[];
  defaultVillageId?: string;
  isAdmin?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  villages,
  defaultVillageId,
  isAdmin = false,
  onClose,
  onSuccess,
}) => {
  const currentSettings = getLocalCachedSettings();
  const currentOtpMode = currentSettings.otpMode || 'with_otp';

  const [villageId, setVillageId] = useState(defaultVillageId || (villages[0]?.id || ''));
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [category, setCategory] = useState('');

  // If in 'without_otp' mode, OTP is not mandatory for adding
  const isOtpMandatory = currentOtpMode === 'with_otp' && !isAdmin;

  // Admin bypass toggle (only visible to logged-in admin)
  const [adminBypassOtp, setAdminBypassOtp] = useState(isAdmin || currentOtpMode === 'without_otp');

  // Load latest settings on mount
  useEffect(() => {
    getAppSettings().then((s) => {
      if (s.otpMode === 'without_otp') {
        setAdminBypassOtp(true);
      }
    });
  }, []);

  // WhatsApp OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Form Submission State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const selectedVillage = villages.find((v) => v.id === villageId);

  // Resend Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Clean 10-digit mobile number
  const cleanMobile = normalizeIndianMobile(mobile);
  const isMobileValid = Boolean(cleanMobile && isValidIndianMobile(cleanMobile));

  // Reset OTP state if mobile number changes
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(val);
    if (isOtpVerified || otpSent) {
      setIsOtpVerified(false);
      setOtpSent(false);
      setOtpValue('');
      setOtpError('');
      setOtpSuccessMessage('');
    }
  };

  // 1. Send WhatsApp OTP
  const handleSendOtp = async () => {
    setOtpError('');
    setOtpSuccessMessage('');

    if (!isMobileValid) {
      setOtpError('कृपया पहले 10-अंकों का वैध मोबाइल नंबर दर्ज करें (6, 7, 8 या 9 से शुरू होना चाहिए)।');
      return;
    }

    setOtpSending(true);
    try {
      const res = await sendWhatsAppOtp(cleanMobile);
      if (res.success) {
        setOtpSent(true);
        setResendTimer(30);
        setOtpSuccessMessage(res.message || `+91 ${cleanMobile} पर WhatsApp OTP भेज दिया गया है।`);
      } else {
        setOtpError(res.message || 'WhatsApp OTP भेजने में विफल। कृपया नंबर जांचें।');
      }
    } catch (err: any) {
      setOtpError(err.message || 'OTP भेजने में त्रुटि हुई।');
    } finally {
      setOtpSending(false);
    }
  };

  // 2. Verify WhatsApp OTP
  const handleVerifyOtp = async () => {
    setOtpError('');
    if (!otpValue.trim()) {
      setOtpError('कृपया 4-अंकों का OTP दर्ज करें।');
      return;
    }

    setOtpVerifying(true);
    try {
      const res = await verifyWhatsAppOtp(cleanMobile, otpValue);
      if (res.success) {
        setIsOtpVerified(true);
        setOtpSuccessMessage('✅ WhatsApp OTP सफलतापूर्वक सत्यापित हुआ!');
        setOtpError('');
      } else {
        setOtpError(res.message || 'अमान्य OTP। कृपया पुनः सही OTP दर्ज करें।');
      }
    } catch (err: any) {
      setOtpError(err.message || 'सत्यापन में त्रुटि हुई।');
    } finally {
      setOtpVerifying(false);
    }
  };

  // 3. Final Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!villageId) {
      setFormError('कृपया गाँव चुनें।');
      return;
    }

    if (!name.trim()) {
      setFormError('कृपया व्यक्ति का नाम दर्ज करें।');
      return;
    }

    if (!isMobileValid) {
      setFormError('कृपया 10-अंकों का वैध मोबाइल नंबर दर्ज करें।');
      return;
    }

    // Require OTP verification if in with_otp mode and not bypassed
    if (isOtpMandatory && !isOtpVerified && !adminBypassOtp) {
      setFormError('कृपया पहले अपने मोबाइल नंबर पर WhatsApp OTP भेजकर सत्यापित (Verify) करें।');
      return;
    }

    if (alternateMobile.trim()) {
      const cleanAlt = normalizeIndianMobile(alternateMobile);
      if (!isValidIndianMobile(cleanAlt)) {
        setFormError('अमान्य वैकल्पिक मोबाइल नंबर! कृपया सही 10 अंक दर्ज करें या खाली छोड़ें।');
        return;
      }
    }

    setSubmitting(true);
    try {
      const isDirectNoOtpMode = currentOtpMode === 'without_otp';

      if (isDirectNoOtpMode || isAdmin) {
        // Direct addition: No OTP required to add
        await createContact({
          villageId,
          villageName: selectedVillage ? selectedVillage.name : '',
          name: name.trim(),
          fatherName: fatherName.trim(),
          mobile: cleanMobile,
          alternateMobile: alternateMobile.trim() ? normalizeIndianMobile(alternateMobile) : '',
          category: category.trim() || 'सामान्य',
          address: '',
          remark: isOtpVerified ? 'WhatsApp Verified' : 'बिना OTP (Direct Entry)',
          status: 'approved',
          addedWithOtp: isOtpVerified,
        });
        setFormSuccess('✅ संपर्क डायरेक्टरी में सफलतापूर्वक जोड़ दिया गया!');
      } else {
        // with_otp mode: user verified with WhatsApp OTP
        await createContact({
          villageId,
          villageName: selectedVillage ? selectedVillage.name : '',
          name: name.trim(),
          fatherName: fatherName.trim(),
          mobile: cleanMobile,
          alternateMobile: alternateMobile.trim() ? normalizeIndianMobile(alternateMobile) : '',
          category: category.trim() || 'सामान्य',
          address: '',
          remark: 'WhatsApp Verified (OTP सत्यापित)',
          status: 'approved',
          addedWithOtp: true,
        });
        setFormSuccess('✅ WhatsApp OTP सत्यापित! संपर्क डायरेक्टरी में जुड़ गया!');
      }

      setTimeout(() => {
        onSuccess();
      }, 1400);
    } catch (err: any) {
      setFormError(err.message || 'संपर्क जोड़ने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-sm shadow-blue-700/20">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                नया संपर्क जोड़ें
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366] fill-[#25D366]" />
                <span>WhatsApp OTP सुरक्षित सत्यापन</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            id="close-add-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Security Banner according to OTP Mode */}
            {currentOtpMode === 'without_otp' ? (
              <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                <Sparkles className="w-4.5 h-4.5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-extrabold text-amber-900">⚡ बिना OTP मोड सक्रिय: </span>
                  नया सदस्य बिना OTP के सीधे जुड़ेगा।
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-extrabold text-emerald-900">सुरक्षा व्यवस्था (With OTP Mode): </span>
                  कोई भी फर्जी या गलत नंबर न जोड़ सके, इसलिए नंबर जोड़ने के लिए आपके <strong>WhatsApp</strong> पर OTP भेजा जाएगा।
                </div>
              </div>
            )}

          {/* Admin Bypass Toggle */}
          {isAdmin && (
            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>एडमिन मोड: OTP बाईपास करें</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminBypassOtp}
                  onChange={(e) => setAdminBypassOtp(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-[11px] font-semibold text-slate-700">बिना OTP जोड़ें</span>
              </label>
            </div>
          )}

          {/* Status Messages */}
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Village Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              गाँव चुनें <span className="text-rose-500">*</span>
            </label>
            <select
              id="add-contact-village-select"
              value={villageId}
              onChange={(e) => setVillageId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all cursor-pointer"
              required
            >
              <option value="" disabled>
                -- कृपया गाँव का चयन करें --
              </option>
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  🏘️ {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Person Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              नाम <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="add-contact-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="उदा. नगजी यादव"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
              required
            />
          </div>

          {/* Father's Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              पिता का नाम <span className="text-slate-400 font-normal">(Father's Name - ऐच्छिक)</span>
            </label>
            <input
              type="text"
              id="add-contact-father-name-input"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value)}
              placeholder="उदा. श्री हरिलाल यादव"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
            />
          </div>

          {/* Mobile Number with WhatsApp Verification */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              मोबाइल नंबर <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  id="add-contact-mobile-input"
                  value={mobile}
                  maxLength={10}
                  onChange={handleMobileChange}
                  placeholder="9876543210"
                  disabled={isOtpVerified}
                  className={`w-full pl-12 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm font-mono font-medium focus:bg-white focus:ring-2 outline-none transition-all ${
                    isOtpVerified
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                  }`}
                  required
                />
              </div>

              {/* OTP Trigger Button (if not verified and not bypassed) */}
              {!isOtpVerified && !adminBypassOtp && (
                <button
                  type="button"
                  id="send-whatsapp-otp-btn"
                  onClick={handleSendOtp}
                  disabled={!isMobileValid || otpSending || resendTimer > 0}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex-shrink-0"
                >
                  {otpSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>भेज रहे हैं...</span>
                    </>
                  ) : resendTimer > 0 ? (
                    <span>{resendTimer}s बाद भेजें</span>
                  ) : (
                    <>
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>{otpSent ? 'पुनः OTP भेजें' : 'WhatsApp OTP'}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Mobile Number Verification Status Badges */}
            {isOtpVerified && (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp सत्यापित नंबर (+91 {cleanMobile})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsOtpVerified(false)}
                  className="text-[11px] text-blue-700 underline font-semibold cursor-pointer"
                >
                  नंबर बदलें
                </button>
              </div>
            )}

            {/* WhatsApp OTP Input Form (When OTP is Sent) */}
            {otpSent && !isOtpVerified && !adminBypassOtp && (
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-300 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-700" />
                    <span>WhatsApp पर आया 4-अंकों का OTP दर्ज करें:</span>
                  </span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full font-semibold">
                    Sender: Jalad Printers
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    id="whatsapp-otp-input"
                    value={otpValue}
                    maxLength={6}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    placeholder="उदा. 4-अंक का OTP"
                    className="flex-1 px-3.5 py-2 bg-white border border-emerald-400 rounded-xl text-slate-900 font-mono text-base font-black tracking-widest text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    id="verify-whatsapp-otp-btn"
                    onClick={handleVerifyOtp}
                    disabled={otpVerifying || !otpValue.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {otpVerifying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>सत्यापित करें</span>
                  </button>
                </div>

                {otpSuccessMessage && (
                  <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                    <span>💬 {otpSuccessMessage}</span>
                  </p>
                )}

                {otpError && (
                  <p className="text-[11px] text-rose-700 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{otpError}</span>
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                  <span>OTP नहीं मिला? WhatsApp चैट चेक करें।</span>
                  {resendTimer > 0 ? (
                    <span className="text-slate-400 font-medium">पुनः भेजें ({resendTimer}s)</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending}
                      className="text-emerald-700 font-bold underline hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>पुनः OTP भेजें</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Alternate Mobile */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              वैकल्पिक मोबाइल <span className="text-slate-400 font-normal">(ऐच्छिक)</span>
            </label>
            <input
              type="tel"
              id="add-contact-alt-mobile-input"
              value={alternateMobile}
              maxLength={10}
              onChange={(e) => setAlternateMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="उदा. 9876543211"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
            />
          </div>

          {/* Profession / Vyavsay */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              व्यवसाय <span className="text-slate-400 font-normal">(Profession / Vyavsay)</span>
            </label>
            <input
              type="text"
              id="add-contact-category-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="उदा. किसान, शिक्षक, किराना व्यापारी, ई-मित्र"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all mb-2"
            />
            {/* Quick profession chips */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CATEGORIES.slice(0, 7).map((cat) => {
                const short = cat.split(' ')[0];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(short)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      category === short || category.includes(short)
                        ? 'bg-blue-100 text-blue-800 border-blue-300 font-semibold'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {short}
                  </button>
                );
              })}
            </div>
          </div>
</div>

          {/* Form Actions Footer (Always Visible at Bottom) */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-3xl sm:rounded-b-2xl flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              id="cancel-add-contact-btn"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              id="save-contact-btn"
              disabled={submitting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 active:scale-[0.98] text-white text-base font-black shadow-lg shadow-blue-700/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>सहेजा जा रहा है...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>सहेजें (Save Contact)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
