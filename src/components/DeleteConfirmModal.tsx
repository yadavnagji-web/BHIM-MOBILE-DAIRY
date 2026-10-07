import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  MessageCircle,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { Contact } from '../types';
import { deleteContact } from '../services/directoryService';
import { sendWhatsAppOtp, verifyWhatsAppOtp } from '../services/otpService';

interface DeleteConfirmModalProps {
  contact: Contact;
  isAdmin?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  contact,
  isAdmin = false,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // WhatsApp OTP State for Delete Verification
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

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

  const cleanMobile = contact.mobile.replace(/\D/g, '').slice(-10);

  // 1. Send OTP to contact's WhatsApp
  const handleSendDeleteOtp = async () => {
    setOtpError('');
    setOtpSuccessMessage('');
    setOtpSending(true);

    try {
      const res = await sendWhatsAppOtp(cleanMobile);
      if (res.success) {
        setOtpSent(true);
        setResendTimer(30);
        setOtpSuccessMessage(res.message || `+91 ${cleanMobile} पर WhatsApp OTP भेज दिया गया है।`);
      } else {
        setOtpError(res.message || 'WhatsApp OTP भेजने में विफल। कृपया पुनः प्रयास करें।');
      }
    } catch (err: any) {
      setOtpError(err.message || 'OTP भेजने में त्रुटि हुई।');
    } finally {
      setOtpSending(false);
    }
  };

  // 2. Verify OTP & Delete
  const handleVerifyAndDelete = async () => {
    setOtpError('');
    if (!otpValue.trim()) {
      setOtpError('कृपया WhatsApp पर आया 4-अंकों का OTP दर्ज करें।');
      return;
    }

    setOtpVerifying(true);
    try {
      const verifyRes = await verifyWhatsAppOtp(cleanMobile, otpValue);
      if (!verifyRes.success) {
        setOtpError(verifyRes.message || 'अमान्य OTP। कृपया सही कोड दर्ज करें।');
        setOtpVerifying(false);
        return;
      }

      setIsOtpVerified(true);
      // Instant UI response (0ms)
      onSuccess();
      deleteContact(contact.id).catch((err) => console.warn('Delete note:', err));
    } catch (err: any) {
      setOtpError(err.message || 'सत्यापन में त्रुटि हुई।');
      setOtpVerifying(false);
    }
  };

  // 3. Direct Admin Delete (Without OTP if Admin is logged in) - Instant 0ms!
  const handleDirectAdminDelete = () => {
    // Instant UI response (0ms)
    onSuccess();
    // Direct Realtime DB delete in background
    deleteContact(contact.id).catch((err: any) => {
      console.warn('Admin delete note:', err);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-5 sm:p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                संपर्क हटाने की पुष्टि (Delete Contact)
              </h3>
              <p className="text-xs text-rose-700 font-semibold">
                WhatsApp OTP सुरक्षा सत्यापन
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {/* Contact Details Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <p className="font-extrabold text-slate-900 text-base">{contact.name}</p>
            <p className="text-slate-700 font-mono font-bold">📱 +91 {contact.mobile}</p>
            <p className="text-slate-500">🏘️ {contact.villageName} | {contact.category}</p>
          </div>

          {/* Admin Direct Mode: Fast delete without OTP */}
          {isAdmin ? (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-950">
              <ShieldCheck className="w-5 h-5 text-rose-700 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-900">एडमिन विशेषाधिकार (Admin Direct Mode)</p>
                <p className="leading-relaxed text-slate-700">
                  आप मुख्य एडमिन हैं। क्या आप इस संपर्क को डायरेक्टरी से तुरंत हटाना चाहते हैं?
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Public User Mode: WhatsApp OTP Security */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <ShieldCheck className="w-4.5 h-4.5 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>सुरक्षा नियम:</strong> कोई दूसरा व्यक्ति किसी का नंबर न हटा सके, इसलिए इस नंबर (<strong>+91 {cleanMobile}</strong>) के WhatsApp पर OTP भेजा जाएगा।
                </p>
              </div>

              {/* OTP Send Trigger */}
              {!otpSent && (
                <div className="pt-1">
                  <button
                    type="button"
                    id="send-delete-whatsapp-otp-btn"
                    onClick={handleSendDeleteOtp}
                    disabled={otpSending}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {otpSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>WhatsApp पर OTP भेज रहे हैं...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 fill-white" />
                        <span>WhatsApp पर OTP भेजें (Send OTP)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* OTP Input and Verification Form */}
              {otpSent && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-emerald-700" />
                      <span>WhatsApp पर आया OTP दर्ज करें:</span>
                    </span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                      WhatsApp OTP
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="delete-whatsapp-otp-input"
                      value={otpValue}
                      maxLength={6}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                      placeholder="4-अंक का OTP"
                      className="flex-1 px-3.5 py-2 bg-white border border-emerald-400 rounded-xl text-slate-900 font-mono text-base font-black tracking-widest text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      id="confirm-delete-with-otp-btn"
                      onClick={handleVerifyAndDelete}
                      disabled={loading || otpVerifying || !otpValue.trim()}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {otpVerifying || loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>सत्यापित कर हटाएं</span>
                    </button>
                  </div>

                  {otpSuccessMessage && (
                    <p className="text-[11px] text-emerald-800 font-semibold">
                      💬 {otpSuccessMessage}
                    </p>
                  )}

                  {otpError && (
                    <p className="text-[11px] text-rose-700 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{otpError}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                    <span>WhatsApp मैसेज नहीं मिला?</span>
                    {resendTimer > 0 ? (
                      <span className="text-slate-400 font-medium">पुनः भेजें ({resendTimer}s)</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendDeleteOtp}
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
            </>
          )}

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {error}
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
          <button
            type="button"
            id="cancel-delete-contact-btn"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            रद्द करें (Cancel)
          </button>

          {/* Admin Direct Delete Action Button */}
          {isAdmin && (
            <button
              type="button"
              id="admin-direct-delete-btn"
              onClick={handleDirectAdminDelete}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>हटाया जा रहा है...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>हाँ, संपर्क तुरंत हटाएं</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
