import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  Copy,
  Check,
  Star,
  User,
  MapPin,
  Briefcase,
  FileText,
  Edit2,
  Trash2,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Contact } from '../types';
import { isFavorite, toggleFavorite } from '../services/favoritesService';

interface ContactCardProps {
  contact: Contact;
  index?: number;
  isAdmin?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  onRequestCorrection?: (contact: Contact) => void;
  onFavoriteChange?: () => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  index,
  isAdmin = false,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onRequestCorrection,
  onFavoriteChange,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [starred, setStarred] = useState(() => isFavorite(contact.id));

  // Determine if this card is currently expanded
  const isCardExpanded = isExpanded !== undefined ? isExpanded : internalExpanded;

  const toggleCard = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

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

  const formattedMobile =
    contact.mobile.length === 10
      ? `${contact.mobile.slice(0, 5)} ${contact.mobile.slice(5)}`
      : contact.mobile;

  return (
    <div
      id={`contact-card-${contact.id}`}
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        isCardExpanded
          ? 'border-blue-500 shadow-md ring-2 ring-blue-500/10'
          : 'border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-sm'
      }`}
    >
      {/* 
        CLICKABLE MASTER ROW (NAME LIST ITEM):
        Shows only the name, avatar/index, father's name, and expand arrow.
        Full data is hidden until the user clicks on this row!
      */}
      <div
        onClick={toggleCard}
        className="p-3 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors hover:bg-blue-50/40 active:bg-blue-50/80"
        title={isCardExpanded ? 'विवरण समेटें (Click to collapse)' : 'पूरा विवरण देखने हेतु क्लिक करें (Click to view full details)'}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {/* Avatar with initial letter or index number */}
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0 transition-colors ${
              isCardExpanded
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}
          >
            {contact.name.charAt(0) || <User className="w-5 h-5" />}
          </div>

          {/* Name & Subtitle Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {typeof index === 'number' && (
                <span className="text-2xs font-extrabold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  #{index + 1}
                </span>
              )}
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug truncate">
                {contact.name}
              </h3>
            </div>

            {/* Subtitle: Father's Name & Village/Category */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 font-medium mt-0.5">
              {contact.fatherName && (
                <span className="truncate">
                  पिता: <strong className="text-slate-700 font-semibold">{contact.fatherName}</strong>
                </span>
              )}
              {contact.fatherName && contact.category && (
                <span className="text-slate-300">•</span>
              )}
              {contact.category && (
                <span className="inline-flex items-center gap-0.5 text-2xs px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                  <Briefcase className="w-2.5 h-2.5 text-slate-400" />
                  <span>{contact.category}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Indicators on Right */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Star Favorite Button */}
          <button
            type="button"
            id={`fav-btn-${contact.id}`}
            onClick={handleToggleFavorite}
            aria-label="पसंदीदा टॉगल करें"
            className={`p-1.5 sm:p-2 rounded-xl border transition-colors flex-shrink-0 cursor-pointer ${
              starred
                ? 'bg-amber-50 text-amber-500 border-amber-300 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-300 hover:text-amber-500 hover:bg-slate-100 border-slate-200'
            }`}
            title={starred ? 'पसंदीदा से हटाएं' : 'पसंदीदा में जोड़ें'}
          >
            <Star className={`w-4 h-4 ${starred ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>

          {/* Expand / Collapse Indicator Pill */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCard();
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isCardExpanded
                ? 'bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs'
                : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300'
            }`}
          >
            {isCardExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 text-blue-700" />
                <span className="hidden sm:inline">समेटें</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-slate-500" />
                <span>विवरण</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 
        EXPANDED FULL DETAILS SECTION:
        Visible ONLY when the user clicks on this name!
      */}
      {isCardExpanded && (
        <div className="p-3.5 sm:p-4 pt-2 sm:pt-2 border-t border-slate-100 bg-gradient-to-b from-blue-50/30 via-white to-white space-y-3 animate-in fade-in duration-200">
          {/* Mobile number display & Copy button */}
          <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">📱</span>
              <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-wide font-mono">
                +91 {formattedMobile}
              </span>
            </div>
            <button
              type="button"
              id={`copy-number-${contact.id}`}
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-white border border-slate-300 hover:border-emerald-300 px-3 py-1.5 rounded-xl transition-colors shadow-2xs cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-extrabold">कॉपी हुआ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>कॉपी करें</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Call & WhatsApp Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              id={`call-btn-${contact.id}`}
              href={`tel:+91${contact.mobile}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-[0.98] text-white font-extrabold text-sm shadow-sm hover:shadow transition-all"
            >
              <Phone className="w-4 h-4 fill-white" />
              <span>कॉल करें</span>
            </a>

            <a
              id={`whatsapp-btn-${contact.id}`}
              href={`https://wa.me/91${contact.mobile}?text=${encodeURIComponent(`नमस्ते ${contact.name} जी,`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white font-extrabold text-sm shadow-sm hover:shadow transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Detailed Info Card */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">🏘️ गाँव:</span>
              <span className="font-bold text-slate-900">{contact.villageName}</span>
            </div>
            {contact.fatherName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">👨‍👦 पिता का नाम:</span>
                <span className="font-bold text-slate-900">{contact.fatherName}</span>
              </div>
            )}
            {contact.category && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">💼 व्यवसाय / श्रेणी:</span>
                <span className="font-bold text-slate-900">{contact.category}</span>
              </div>
            )}
            {contact.alternateMobile && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">📱 वैकल्पिक मोबाइल:</span>
                <span className="font-mono font-bold text-slate-900">+91 {contact.alternateMobile}</span>
              </div>
            )}
            {contact.address && (
              <div className="flex items-start gap-1.5 pt-1.5 border-t border-slate-200/70">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">पता: {contact.address}</span>
              </div>
            )}
            {contact.remark && (
              <div className="flex items-start gap-1.5 pt-1.5 border-t border-slate-200/70 text-slate-600 bg-emerald-50/70 p-2 rounded-lg">
                <FileText className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="italic">{contact.remark}</span>
              </div>
            )}
          </div>

          {/* Admin or Citizen Actions */}
          {isAdmin ? (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-amber-200 bg-amber-50/70 p-2 rounded-xl">
              <button
                type="button"
                id={`admin-edit-btn-${contact.id}`}
                onClick={() => onEdit && onEdit(contact)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                <span>संपादित करें</span>
              </button>
              <button
                type="button"
                id={`admin-delete-btn-${contact.id}`}
                onClick={() => onDelete && onDelete(contact)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>हटाएँ</span>
              </button>
            </div>
          ) : (
            <div className="pt-1 flex items-center justify-between border-t border-slate-100">
              {onDelete && (
                <button
                  type="button"
                  id={`user-otp-delete-btn-${contact.id}`}
                  onClick={() => onDelete(contact)}
                  className="inline-flex items-center gap-1 text-2xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  title="WhatsApp OTP सत्यापन द्वारा यह नंबर हटाएं"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>OTP से हटाएं</span>
                </button>
              )}

              {onRequestCorrection && (
                <button
                  type="button"
                  id={`request-correction-btn-${contact.id}`}
                  onClick={() => onRequestCorrection(contact)}
                  className="inline-flex items-center gap-1.5 text-2xs font-semibold text-slate-500 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ml-auto"
                  title="यह नंबर आपका है या गलत है तो सुधार हेतु एडमिन को अनुरोध भेजें"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                  <span>सुधार अनुरोध</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
