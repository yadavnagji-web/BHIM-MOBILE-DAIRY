import React, { useState } from 'react';
import { ShieldCheck, X, CheckCircle, AlertCircle, Loader2, Edit3, Trash2, User, Phone } from 'lucide-react';
import { Contact, Village, ApprovalRequestType } from '../types';
import { submitApprovalRequest, isValidIndianMobile, normalizeIndianMobile } from '../services/directoryService';
import { COMMON_CATEGORIES } from '../services/sampleData';

interface RequestCorrectionModalProps {
  contact: Contact;
  villages: Village[];
  onClose: () => void;
  onSuccess: () => void;
}

export const RequestCorrectionModal: React.FC<RequestCorrectionModalProps> = ({
  contact,
  villages,
  onClose,
  onSuccess,
}) => {
  const [requestType, setRequestType] = useState<ApprovalRequestType>('edit_contact');
  const [name, setName] = useState(contact.name);
  const [villageId, setVillageId] = useState(contact.villageId);
  const [mobile, setMobile] = useState(contact.mobile);
  const [alternateMobile, setAlternateMobile] = useState(contact.alternateMobile || '');
  const [category, setCategory] = useState(contact.category || 'सामान्य');
  const [address, setAddress] = useState(contact.address || '');
  const [reason, setReason] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedVillage = villages.find((v) => v.id === villageId) || { name: contact.villageName, id: contact.villageId };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!requesterName.trim()) {
      setErrorMessage('कृपया अपना (अनुरोधकर्ता का) नाम दर्ज करें।');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('कृपया सुधार या हटाने का कारण लिखें (उदा. नया नंबर, पता सुधार या नंबर बंद)।');
      return;
    }

    let cleanMobile = normalizeIndianMobile(mobile);
    if (requestType === 'edit_contact') {
      if (!name.trim()) {
        setErrorMessage('कृपया व्यक्ति का नाम दर्ज करें।');
        return;
      }
      if (!cleanMobile || !isValidIndianMobile(cleanMobile)) {
        setErrorMessage('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।');
        return;
      }
    } else {
      // For delete, use existing mobile
      cleanMobile = contact.mobile;
    }

    setLoading(true);
    try {
      await submitApprovalRequest({
        type: requestType,
        targetContactId: contact.id,
        existingContactData: {
          name: contact.name,
          mobile: contact.mobile,
          villageName: contact.villageName,
          category: contact.category,
          address: contact.address,
        },
        contactData: {
          villageId,
          villageName: selectedVillage.name,
          name: name.trim(),
          mobile: cleanMobile,
          alternateMobile: alternateMobile.trim() ? normalizeIndianMobile(alternateMobile) : '',
          category: category.trim(),
          address: address.trim(),
          remark: reason.trim(),
        },
        requesterName: requesterName.trim(),
        requesterPhone: requesterPhone.trim() ? normalizeIndianMobile(requesterPhone) : cleanMobile,
        reason: reason.trim(),
      });

      setSuccessMessage('अनुरोध सफलतापूर्वक भेजा गया! संगठन एडमिन द्वारा सत्यापन के बाद यह अपडेट हो जाएगा।');
      setTimeout(() => {
        onSuccess();
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err.message || 'अनुरोध भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                नंबर सुधार / हटाने का अनुरोध
              </h2>
              <p className="text-2xs sm:text-xs text-blue-900 font-medium">
                सुरक्षित एडमिन सत्यापन प्रणाली (Admin Verification)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Security Notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <p className="leading-relaxed">
              <strong>सुरक्षा नियम:</strong> कोई भी अन्य व्यक्ति किसी के नंबर के साथ छेड़छाड़ न कर सके, इसलिए आपका अनुरोध पहले संगठन के एडमिन द्वारा जाँचा और स्वीकृत किया जाएगा।
            </p>
          </div>

          {/* Target Contact Summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-2xs block">वर्तमान दर्ज विवरण:</span>
            <div className="flex items-center justify-between font-bold text-slate-800 text-sm">
              <span>{contact.name}</span>
              <span className="font-mono text-blue-700">{contact.mobile}</span>
            </div>
            <div className="text-slate-600">गाँव: {contact.villageName}</div>
          </div>

          {/* Action Choice Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRequestType('edit_contact')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                requestType === 'edit_contact'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-700" />
              <span>विवरण सुधारें</span>
            </button>
            <button
              type="button"
              onClick={() => setRequestType('delete_contact')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                requestType === 'delete_contact'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>नंबर हटाएँ</span>
            </button>
          </div>

          {/* Edit Fields (shown only if edit_contact) */}
          {requestType === 'edit_contact' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  सही नाम (Correct Name) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="उदा. रमेश कुमार यादव"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    गाँव (Village)
                  </label>
                  <select
                    value={villageId}
                    onChange={(e) => setVillageId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {villages.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    व्यवसाय / पद (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {COMMON_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    सही 10-अंकीय मोबाइल नंबर *
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    placeholder="9829100000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    वैकल्पिक नंबर (वैकल्पिक)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={alternateMobile}
                    onChange={(e) => setAlternateMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    placeholder="वैकल्पिक मोबाइल"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  मोहल्ला / घर का पता
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="उदा. मेन बाजार, स्कूल के पास"
                />
              </div>
            </div>
          )}

          {/* Delete Notice (if delete_contact) */}
          {requestType === 'delete_contact' && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
              <span className="font-bold block">⚠️ नंबर हटाने का अनुरोध:</span>
              <p>कृपया नीचे कारण बताएं कि यह नंबर डायरेक्टरी से क्यों हटाया जाना चाहिए (उदा. व्यक्ति का देहांत, अन्यत्र स्थानांतरण, या नंबर बंद हो जाना)।</p>
            </div>
          )}

          {/* Reason Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              अनुरोध का कारण (Reason for change/removal) *
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder={requestType === 'edit_contact' ? 'उदा. मेरा नया मोबाइल नंबर चालू हुआ है' : 'उदा. यह नंबर स्थायी रूप से बंद हो चुका है'}
              required
            />
          </div>

          {/* Requester Identity */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-700 block">
              आपकी जानकारी (अनुरोधकर्ता का विवरण):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-semibold text-slate-600 mb-1">
                  आपका नाम (Your Name) *
                </label>
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="आपका पूरा नाम"
                  required
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-600 mb-1">
                  आपका मोबाइल नंबर
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={requesterPhone}
                  onChange={(e) => setRequesterPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  placeholder="सत्यापन हेतु आपका नंबर"
                />
              </div>
            </div>
          </div>

          {/* Error & Success alerts */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>भेजा जा रहा है...</span>
                </>
              ) : (
                <span>एडमिन को अनुरोध भेजें</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
