import React, { useState } from 'react';
import { Edit2, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Contact, Village } from '../types';
import { updateContact, isValidIndianMobile, normalizeIndianMobile } from '../services/directoryService';
import { COMMON_CATEGORIES } from '../services/sampleData';
import {
  validateHindiField,
  hasEnglishLetters,
  transliterateEnglishToHindi,
} from '../utils/hindiValidator';

interface EditContactModalProps {
  contact: Contact;
  villages: Village[];
  onClose: () => void;
  onSuccess: (updatedContact?: Contact) => void;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  contact,
  villages,
  onClose,
  onSuccess,
}) => {
  const [villageId, setVillageId] = useState(contact.villageId);
  const [name, setName] = useState(contact.name);
  const [fatherName, setFatherName] = useState(contact.fatherName || '');
  const [mobile, setMobile] = useState(contact.mobile);
  const [alternateMobile, setAlternateMobile] = useState(contact.alternateMobile || '');
  const [category, setCategory] = useState(contact.category || 'सामान्य');
  const [address, setAddress] = useState(contact.address || '');
  const [remark, setRemark] = useState(contact.remark || '');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedVillage = villages.find((v) => v.id === villageId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Strict Hindi validation for Name
    const nameCheck = validateHindiField(name, 'व्यक्ति का नाम', true);
    if (!nameCheck.valid) {
      setErrorMessage(nameCheck.error || 'कृपया नाम केवल हिंदी (देवनागरी) में दर्ज करें।');
      return;
    }

    // Strict Hindi validation for Father's Name (if provided)
    if (fatherName.trim()) {
      const fatherCheck = validateHindiField(fatherName, 'पिता का नाम', false);
      if (!fatherCheck.valid) {
        setErrorMessage(fatherCheck.error || 'कृपया पिता का नाम केवल हिंदी (देवनागरी) में दर्ज करें।');
        return;
      }
    }

    const cleanMobile = normalizeIndianMobile(mobile);
    if (!isValidIndianMobile(cleanMobile)) {
      setErrorMessage('अमान्य मोबाइल नंबर! कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर दर्ज करें।');
      return;
    }

    const updatedData: Contact = {
      ...contact,
      villageId,
      villageName: selectedVillage ? selectedVillage.name : contact.villageName,
      name: name.trim(),
      fatherName: fatherName.trim(),
      mobile: cleanMobile,
      alternateMobile: alternateMobile.trim() ? normalizeIndianMobile(alternateMobile) : '',
      category: category.trim(),
      address: address.trim(),
      remark: remark.trim(),
      updatedAt: Date.now(),
    };

    // Instant UI update (0ms)
    onSuccess(updatedData);

    // Save directly to Realtime Database in background
    updateContact(contact.id, updatedData).catch((err: any) => {
      console.warn('Update note:', err);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-amber-100 flex items-center justify-between bg-amber-50 rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                संपर्क विवरण संशोधित करें (एडमिन)
              </h2>
              <p className="text-xs text-amber-900 font-medium">
                {contact.name} ({contact.villageName})
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-edit-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
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

          {/* Village */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              गाँव <span className="text-rose-500">*</span>
            </label>
            <select
              id="edit-contact-village-select"
              value={villageId}
              onChange={(e) => setVillageId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none transition-all"
              required
            >
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  🏘️ {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name (Hindi Only) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                नाम <span className="text-rose-500">*</span> <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">केवल हिंदी</span>
              </label>
              {hasEnglishLetters(name) && (
                <button
                  type="button"
                  onClick={() => setName(transliterateEnglishToHindi(name))}
                  className="text-2xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition cursor-pointer"
                >
                  ✨ हिंदी में बदलें
                </button>
              )}
            </div>
            <input
              type="text"
              id="edit-contact-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm font-medium focus:bg-white outline-none transition-all ${
                hasEnglishLetters(name)
                  ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400/20'
                  : 'border-slate-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20'
              }`}
              required
            />
            {hasEnglishLetters(name) && (
              <p className="text-2xs text-rose-600 font-bold mt-1">
                ⚠️ केवल हिंदी (देवनागरी लिपि) मान्य है! अंग्रेज़ी अक्षर स्वीकार्य नहीं हैं।
              </p>
            )}
          </div>

          {/* Father's Name (Hindi Only) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                पिता का नाम <span className="text-slate-400 font-normal">(ऐच्छिक)</span> <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">केवल हिंदी</span>
              </label>
              {hasEnglishLetters(fatherName) && (
                <button
                  type="button"
                  onClick={() => setFatherName(transliterateEnglishToHindi(fatherName))}
                  className="text-2xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition cursor-pointer"
                >
                  ✨ हिंदी में बदलें
                </button>
              )}
            </div>
            <input
              type="text"
              id="edit-contact-father-name-input"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm font-medium focus:bg-white outline-none transition-all ${
                hasEnglishLetters(fatherName)
                  ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400/20'
                  : 'border-slate-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20'
              }`}
            />
            {hasEnglishLetters(fatherName) && (
              <p className="text-2xs text-rose-600 font-bold mt-1">
                ⚠️ पिता का नाम भी केवल हिंदी (देवनागरी) में मान्य है!
              </p>
            )}
          </div>

          {/* Mobile Numbers */}
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
                  id="edit-contact-mobile-input"
                  value={mobile}
                  maxLength={13}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono font-medium focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                वैकल्पिक मोबाइल
              </label>
              <input
                type="tel"
                id="edit-contact-alt-mobile-input"
                value={alternateMobile}
                maxLength={13}
                onChange={(e) => setAlternateMobile(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono font-medium focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              श्रेणी / व्यवसाय
            </label>
            <input
              type="text"
              id="edit-contact-category-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none transition-all mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CATEGORIES.slice(0, 6).map((cat) => {
                const short = cat.split(' ')[0];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(short)}
                    className="px-2 py-0.5 rounded-lg text-xs font-medium border bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 transition-colors"
                  >
                    {short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              पता / मोहल्ला
            </label>
            <input
              type="text"
              id="edit-contact-address-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none transition-all"
            />
          </div>

          {/* Remark */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              टिप्पणी (Remark)
            </label>
            <input
              type="text"
              id="edit-contact-remark-input"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none transition-all"
            />
          </div>
          </div>

          {/* Actions Footer (Pinned at bottom) */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-3xl sm:rounded-b-2xl flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              id="cancel-edit-btn"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              id="update-contact-btn"
              disabled={loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-amber-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>अपडेट हो रहा है...</span>
                </>
              ) : (
                <span>संपादित करें (Update)</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
