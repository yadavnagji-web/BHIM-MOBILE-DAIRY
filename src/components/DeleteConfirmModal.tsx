import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { Contact } from '../types';
import { deleteContact } from '../services/directoryService';

interface DeleteConfirmModalProps {
  contact: Contact;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  contact,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await deleteContact(contact.id);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'हटाने में त्रुटि हुई।');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-base font-bold text-slate-900">
            Are you sure you want to delete this contact?
          </h3>
          <p className="text-sm text-rose-800 font-semibold mt-0.5">
            क्या आप वाकई इस संपर्क को हटाना चाहते हैं?
          </p>

          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <p className="font-bold text-slate-800 text-sm">{contact.name}</p>
            <p className="text-slate-600">📱 {contact.mobile}</p>
            <p className="text-slate-600">🏘️ {contact.villageName} | {contact.category}</p>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            यह क्रिया वापस नहीं ली जा सकती। यह संपर्क डायरेक्टरी से स्थायी रूप से हटा दिया जाएगा।
          </p>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg mt-2 border border-rose-200">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            id="cancel-delete-contact-btn"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            रद्द करें (Cancel)
          </button>
          <button
            type="button"
            id="confirm-delete-contact-btn"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-sm font-bold shadow-sm shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>हटाएँ (Delete)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
