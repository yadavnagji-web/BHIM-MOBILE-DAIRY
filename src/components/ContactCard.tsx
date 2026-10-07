import React, { useState } from 'react';
import { Phone, MessageCircle, Copy, Check, Star, User, MapPin, Briefcase, FileText, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { Contact } from '../types';
import { isFavorite, toggleFavorite } from '../services/favoritesService';

interface ContactCardProps {
  contact: Contact;
  isAdmin?: boolean;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  onRequestCorrection?: (contact: Contact) => void;
  onFavoriteChange?: () => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  isAdmin = false,
  onEdit,
  onDelete,
  onRequestCorrection,
  onFavoriteChange,
}) => {
  const [copied, setCopied] = useState(false);
  const [starred, setStarred] = useState(() => isFavorite(contact.id));

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(contact.mobile);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy mobile number', err);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = toggleFavorite(contact.id);
    setStarred(newStatus);
    if (onFavoriteChange) {
      onFavoriteChange();
    }
  };

  const formattedMobile = contact.mobile.length === 10
    ? `${contact.mobile.slice(0, 5)} ${contact.mobile.slice(5)}`
    : contact.mobile;

  return (
    <div
      id={`contact-card-${contact.id}`}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 p-4.5 flex flex-col justify-between relative overflow-hidden"
    >
      {/* Top section: Name & Star */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
              {contact.name.charAt(0) || <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg leading-snug flex items-center gap-1.5">
                <span>{contact.name}</span>
              </h3>
              {contact.fatherName && (
                <p className="text-xs text-slate-500 font-medium">
                  पिता: <span className="text-slate-800 font-semibold">{contact.fatherName}</span>
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200">
                  🏘️ {contact.villageName}
                </span>
                {contact.category && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <Briefcase className="w-3 h-3 text-slate-500" />
                    {contact.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Star Favorite Button */}
          <button
            type="button"
            id={`fav-btn-${contact.id}`}
            onClick={handleToggleFavorite}
            aria-label="पसंदीदा टॉगल करें"
            className={`p-2 rounded-xl border transition-colors flex-shrink-0 ${
              starred
                ? 'bg-amber-50 text-amber-500 border-amber-300 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-amber-500 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-5 h-5 ${starred ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>
        </div>

        {/* Details section */}
        <div className="mt-3.5 space-y-1.5 text-sm">
          {/* Mobile number display */}
          <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-base">📱</span>
              <span className="font-bold text-slate-800 text-base tracking-wide font-mono">
                {formattedMobile}
              </span>
            </div>
            <button
              type="button"
              id={`copy-number-${contact.id}`}
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">कॉपी हुआ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>कॉपी करें</span>
                </>
              )}
            </button>
          </div>

          {/* Alternate mobile if present */}
          {contact.alternateMobile && (
            <div className="flex items-center gap-2 text-xs text-slate-600 px-1">
              <span className="text-slate-400">वैकल्पिक:</span>
              <span className="font-mono font-medium">{contact.alternateMobile}</span>
            </div>
          )}

          {/* Address / Mohalla */}
          {contact.address && (
            <div className="flex items-start gap-1.5 text-xs text-slate-600 px-1 pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{contact.address}</span>
            </div>
          )}

          {/* Remark if present */}
          {contact.remark && (
            <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/60 mt-1">
              <FileText className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span className="italic">{contact.remark}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
        {/* Primary User Actions: Call & WhatsApp */}
        <div className="grid grid-cols-2 gap-2">
          {/* Call button */}
          <a
            id={`call-btn-${contact.id}`}
            href={`tel:+91${contact.mobile}`}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-[0.98] text-white font-bold text-sm shadow-sm hover:shadow transition-all"
          >
            <Phone className="w-4 h-4 fill-white" />
            <span>कॉल करें</span>
          </a>

          {/* WhatsApp button */}
          <a
            id={`whatsapp-btn-${contact.id}`}
            href={`https://wa.me/91${contact.mobile}?text=${encodeURIComponent(`नमस्ते ${contact.name} जी,`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white font-bold text-sm shadow-sm hover:shadow transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>WhatsApp</span>
          </a>
        </div>

        {/* ADMIN ONLY BUTTONS: strictly hidden for normal users */}
        {isAdmin ? (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-amber-200 bg-amber-50/70 p-2 rounded-xl">
            <button
              type="button"
              id={`admin-edit-btn-${contact.id}`}
              onClick={() => onEdit && onEdit(contact)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs shadow-2xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
              <span>संपादित करें</span>
            </button>
            <button
              type="button"
              id={`admin-delete-btn-${contact.id}`}
              onClick={() => onDelete && onDelete(contact)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold text-xs shadow-2xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>हटाएँ</span>
            </button>
          </div>
        ) : (
          <div className="pt-1 flex items-center justify-between">
            {onDelete && (
              <button
                type="button"
                id={`user-otp-delete-btn-${contact.id}`}
                onClick={() => onDelete(contact)}
                className="inline-flex items-center gap-1 text-2xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                title="WhatsApp OTP सत्यापन द्वारा यह नंबर हटाएं"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>OTP से हटाएं</span>
              </button>
            )}

            <button
              type="button"
              id={`request-correction-btn-${contact.id}`}
              onClick={() => onRequestCorrection && onRequestCorrection(contact)}
              className="inline-flex items-center gap-1.5 text-2xs font-semibold text-slate-500 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors cursor-pointer ml-auto"
              title="यह नंबर आपका है या गलत है तो सुधार हेतु एडमिन को अनुरोध भेजें"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span>सुधार अनुरोध</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
