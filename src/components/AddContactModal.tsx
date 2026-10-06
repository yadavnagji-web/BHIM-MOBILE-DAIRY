import React, { useState } from 'react';
import { UserPlus, X, CheckCircle, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Village } from '../types';
import { createContact, submitApprovalRequest, isValidIndianMobile, normalizeIndianMobile } from '../services/directoryService';
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
  const [villageId, setVillageId] = useState(defaultVillageId || (villages[0]?.id || ''));
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [category, setCategory] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedVillage = villages.find((v) => v.id === villageId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!villageId) {
      setErrorMessage('कृपया गाँव चुनें।');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('कृपया व्यक्ति का नाम दर्ज करें।');
      return;
    }

    const cleanMobile = normalizeIndianMobile(mobile);
    if (!cleanMobile) {
      setErrorMessage('कृपया मोबाइल नंबर दर्ज करें।');
      return;
    }

    if (!isValidIndianMobile(cleanMobile)) {
      setErrorMessage('अमान्य मोबाइल नंबर! कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर दर्ज करें (6, 7, 8 या 9 से शुरू होना चाहिए)।');
      return;
    }

    if (alternateMobile.trim()) {
      const cleanAlt = normalizeIndianMobile(alternateMobile);
      if (!isValidIndianMobile(cleanAlt)) {
        setErrorMessage('अमान्य वैकल्पिक मोबाइल नंबर! कृपया सही 10 अंक दर्ज करें या खाली छोड़ें।');
        return;
      }
    }

    setLoading(true);
    try {
      if (isAdmin) {
        // Direct entry for logged-in Admin
        await createContact({
          villageId,
          villageName: selectedVillage ? selectedVillage.name : '',
          name: name.trim(),
          fatherName: fatherName.trim(),
          mobile: cleanMobile,
          alternateMobile: alternateMobile.trim() ? normalizeIndianMobile(alternateMobile) : '',
          category: category.trim() || 'सामान्य',
          address: '',
          remark: '',
          status: 'approved',
        });
        setSuccessMessage('संपर्क सफलतापूर्वक तुरंत डायरेक्टरी में जोड़ दिया गया!');
      } else {
        // Normal user -> goes to Admin Approval queue
        await submitApprovalRequest({
          type: 'new_contact',
          contactData: {
            villageId,
            villageName: selectedVillage ? selectedVillage.name : '',
            name: name.trim(),
            fatherName: fatherName.trim(),
            mobile: cleanMobile,
            alternateMobile: alternateMobile.trim() ? normalizeIndianMobile(alternateMobile) : '',
            category: category.trim() || 'सामान्य',
            address: '',
            remark: '',
          },
          requesterName: name.trim(),
          requesterPhone: cleanMobile,
          reason: 'नया संपर्क जोड़ने का अनुरोध',
        });
        setSuccessMessage('✅ अनुरोध सफलतापूर्वक भेजा गया! सुरक्षा कारणों से, संगठन के एडमिन द्वारा सत्यापन (Approval) के बाद यह डायरेक्टरी में दिखाई देगा।');
      }

      setTimeout(() => {
        onSuccess();
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err.message || 'संपर्क जोड़ने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-600/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                नया संपर्क जोड़ें
              </h2>
              <p className="text-xs text-blue-800 font-medium">
                गाँव की मोबाइल डायरेक्टरी में नाम दर्ज करें
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-add-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Admin Approval Notice for public users vs direct admin notice */}
          {!isAdmin ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>सुरक्षा व्यवस्था (Admin Approval):</strong> कोई भी अन्य व्यक्ति किसी का गलत नंबर न जोड़ सके, इसलिए आपका नंबर संगठन के एडमिन द्वारा पुष्टि (सत्यापन) के बाद ही डायरेक्टरी में जुड़ेगा।
              </p>
            </div>
          ) : (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900 font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>एडमिन डायरेक्ट एंट्री: यह संपर्क तुरंत डायरेक्टरी में सेव हो जाएगा।</span>
            </div>
          )}

          {/* Status Messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all"
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
              placeholder="उदा. रामलाल यादव"
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

          {/* Mobile Number & Alternate Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                मोबाइल नंबर <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  id="add-contact-mobile-input"
                  value={mobile}
                  maxLength={13}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                वैकल्पिक मोबाइल <span className="text-slate-400 font-normal">(ऐच्छिक)</span>
              </label>
              <input
                type="tel"
                id="add-contact-alt-mobile-input"
                value={alternateMobile}
                maxLength={13}
                onChange={(e) => setAlternateMobile(e.target.value)}
                placeholder="उदा. 9876543211"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
              />
            </div>
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
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

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              id="cancel-add-contact-btn"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              id="save-contact-btn"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-blue-700/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>सहेजा जा रहा है...</span>
                </>
              ) : (
                <span>सहेजें (Save)</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
