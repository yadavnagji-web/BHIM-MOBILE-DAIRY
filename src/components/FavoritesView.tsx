import React, { useState, useMemo } from 'react';
import { Star, Search, Users, ArrowLeft } from 'lucide-react';
import { Contact } from '../types';
import { getFavoriteIds } from '../services/favoritesService';
import { ContactCard } from './ContactCard';

interface FavoritesViewProps {
  contacts: Contact[];
  onBackToHome: () => void;
  isAdmin?: boolean;
  onEditContact?: (c: Contact) => void;
  onDeleteContact?: (c: Contact) => void;
  onRequestCorrection?: (c: Contact) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  contacts,
  onBackToHome,
  isAdmin = false,
  onEditContact,
  onDeleteContact,
  onRequestCorrection,
}) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getFavoriteIds());
  const [searchTerm, setSearchTerm] = useState('');

  const handleFavoriteChange = () => {
    setFavoriteIds(getFavoriteIds());
  };

  const favoriteContacts = useMemo(() => {
    const idSet = new Set(favoriteIds);
    return contacts.filter((c) => idSet.has(c.id));
  }, [contacts, favoriteIds]);

  const filteredFavorites = useMemo(() => {
    if (!searchTerm.trim()) return favoriteContacts;
    const query = searchTerm.toLowerCase().trim();
    return favoriteContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.fatherName ? c.fatherName.toLowerCase().includes(query) : false) ||
        c.mobile.includes(query) ||
        c.villageName.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        (c.address ? c.address.toLowerCase().includes(query) : false)
    );
  }, [favoriteContacts, searchTerm]);

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-3 sm:px-4 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-600 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-amber-900/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="मुख्य पृष्ठ पर जाएं"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
                <Star className="w-6 h-6 fill-white" />
                <span>पसंदीदा संपर्क (Favorites)</span>
              </h2>
              <p className="text-amber-100 text-xs sm:text-sm font-medium mt-0.5">
                त्वरित संपर्क के लिए आपके द्वारा सहेजे गए नंबर
              </p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/30 text-right flex-shrink-0">
            <span className="text-xs text-amber-100 block">कुल पसंदीदा</span>
            <span className="text-lg sm:text-xl font-black text-white">
              {favoriteContacts.length}
            </span>
          </div>
        </div>
      </div>

      {/* Search within favorites */}
      {favoriteContacts.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            id="search-favorites-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="पसंदीदा संपर्कों में खोजें..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-amber-500 outline-none transition-all shadow-2xs"
          />
        </div>
      )}

      {/* List */}
      {filteredFavorites.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 mx-auto flex items-center justify-center">
            <Star className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {favoriteContacts.length === 0
              ? 'कोई पसंदीदा संपर्क नहीं है'
              : 'खोज के अनुसार कोई पसंदीदा नहीं मिला'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {favoriteContacts.length === 0
              ? 'किसी भी संपर्क कार्ड पर दिए गए ⭐ स्टार आइकन पर क्लिक करके उसे अपनी पसंदीदा सूची में जोड़ें।'
              : 'कृपया अलग नाम या नंबर खोजें।'}
          </p>
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 text-white font-bold text-xs shadow-sm hover:bg-blue-800 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>मुख्य पृष्ठ पर जाएँ</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredFavorites.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              isAdmin={isAdmin}
              onEdit={onEditContact}
              onDelete={onDeleteContact}
              onRequestCorrection={onRequestCorrection}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
