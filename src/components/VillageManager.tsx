import React, { useState } from 'react';
import { Layers, Plus, Edit2, Trash2, X, Check, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Village } from '../types';
import { createVillage, updateVillage, deleteVillage, bulkDeleteVillages, getVillageContactsCount } from '../services/directoryService';
import {
  validateHindiField,
  hasEnglishLetters,
  transliterateEnglishToHindi
} from '../utils/hindiValidator';

interface VillageManagerProps {
  villages: Village[];
  onClose: () => void;
  onRefresh: () => void;
}

export const VillageManager: React.FC<VillageManagerProps> = ({
  villages,
  onClose,
  onRefresh,
}) => {
  const [newVillageName, setNewVillageName] = useState('');
  const [editingVillageId, setEditingVillageId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingVillage, setDeletingVillage] = useState<Village | null>(null);
  const [deleteCount, setDeleteCount] = useState<number | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddVillage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const val = validateHindiField(newVillageName, 'गाँव का नाम', true);
    if (!val.valid) {
      setError(val.error || 'गाँव का नाम केवल हिंदी (देवनागरी लिपि) में मान्य है!');
      return;
    }

    setLoading(true);
    try {
      await createVillage(newVillageName.trim());
      setSuccess(`गाँव "${newVillageName.trim()}" सफलतापूर्वक जोड़ा गया।`);
      setNewVillageName('');
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'गाँव जोड़ने में त्रुटि हुई।');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (v: Village) => {
    setEditingVillageId(v.id);
    setEditName(v.name);
    setError('');
    setSuccess('');
  };

  const handleSaveRename = async (id: string) => {
    if (!editName.trim()) return;

    const val = validateHindiField(editName, 'गाँव का नाम', true);
    if (!val.valid) {
      setError(val.error || 'गाँव का नाम केवल हिंदी (देवनागरी लिपि) में मान्य है!');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateVillage(id, editName.trim());
      setSuccess(`गाँव का नाम बदलकर "${editName.trim()}" किया गया।`);
      setEditingVillageId(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'गाँव का नाम बदलने में त्रुटि हुई।');
    } finally {
      setLoading(false);
    }
  };

  const promptDeleteVillage = async (v: Village) => {
    setError('');
    setSuccess('');
    setDeletingVillage(v);
    setLoading(true);
    try {
      const count = await getVillageContactsCount(v.id);
      setDeleteCount(count);
    } catch (err: any) {
      setError('संपर्क संख्या जांचने में त्रुटि।');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeleteVillage = async () => {
    if (!deletingVillage) return;
    setLoading(true);
    setError('');
    try {
      await deleteVillage(deletingVillage.id);
      setSuccess(`गाँव "${deletingVillage.name}" सफलतापूर्वक हटाया गया।`);
      setDeletingVillage(null);
      setDeleteCount(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'गाँव हटाने में त्रुटि।');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    setLoading(true);
    setError('');
    try {
      const count = await bulkDeleteVillages();
      setSuccess(`सभी ${count} गाँव और उनसे जुड़े संपर्क सफलतापूर्वक हटा दिए गए।`);
      setShowBulkDeleteConfirm(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'गाँव हटाने में त्रुटि।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                गाँव प्रबंधन (Manage Villages)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                कुल गाँव: {villages.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 font-medium">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Add New Village Form */}
          <form onSubmit={handleAddVillage} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              नया गाँव जोड़ें
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="new-village-name-input"
                value={newVillageName}
                onChange={(e) => setNewVillageName(e.target.value)}
                placeholder="गाँव का नाम दर्ज करें..."
                className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:border-emerald-600 outline-none"
              />
              <button
                type="submit"
                id="add-village-submit-btn"
                disabled={loading || !newVillageName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>जोड़ें</span>
              </button>
            </div>
          </form>

          {/* Village List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                विद्यमान गाँव सूची ({villages.length})
              </h3>
              {villages.length > 0 && (
                <button
                  type="button"
                  id="bulk-delete-villages-btn"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>सभी गाँव हटाएँ (Bulk Delete)</span>
                </button>
              )}
            </div>
            {villages.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">कोई गाँव नहीं मिला। नया गाँव जोड़ने के लिए ऊपर फॉर्म का उपयोग करें।</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {villages.map((v) => {
                  const isEditing = editingVillageId === v.id;
                  return (
                    <div
                      key={v.id}
                      className="p-3 flex items-center justify-between gap-2 bg-white hover:bg-slate-50 transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-amber-400 rounded-lg text-sm font-medium outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(v.id)}
                            disabled={loading || !editName.trim()}
                            className="p-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                            title="सहेजें"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingVillageId(null)}
                            className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                            title="रद्द करें"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-base">🏘️</span>
                            <span className="text-sm font-bold text-slate-800">{v.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(v)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="नाम बदलें (Rename)"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => promptDeleteVillage(v)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="गाँव हटाएँ (Delete)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
          <div className="p-4 bg-rose-50 border-t border-rose-300 rounded-b-2xl animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-950">
                  ⚠️ सभी {villages.length} गाँव एक साथ हटाने की पुष्टि
                </h4>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  क्या आप निश्चित हैं? सभी गाँव और उनसे जुड़े संपर्क डेटाबेस से पूरी तरह हटा दिए जाएँगे। इसके बाद कोई भी गाँव अपने आप वापस नहीं आएगा।
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 mt-3.5">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={loading}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                id="confirm-bulk-delete-btn"
                onClick={handleConfirmBulkDelete}
                disabled={loading}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>हटा रहे हैं...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>हाँ, सभी गाँव हटाएँ (Bulk Delete)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal for Single Village */}
        {deletingVillage && (
          <div className="p-4 bg-rose-50 border-t border-rose-200 rounded-b-2xl">
            <h4 className="text-sm font-bold text-rose-900">
              गाँव हटाने की पुष्टि: "{deletingVillage.name}"
            </h4>
            {deleteCount !== null && deleteCount > 0 ? (
              <p className="text-xs text-rose-700 mt-1">
                ⚠️ ध्यान दें: इस गाँव में <strong>{deleteCount}</strong> संपर्क दर्ज हैं। गाँव हटाने पर इसके सभी {deleteCount} संपर्क भी डेटाबेस से हट जाएँगे।
              </p>
            ) : (
              <p className="text-xs text-slate-600 mt-1">
                क्या आप निश्चित हैं कि आप इस गाँव को हटाना चाहते हैं?
              </p>
            )}
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setDeletingVillage(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteVillage}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'पुष्टि करें व हटाएँ (Delete)'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
