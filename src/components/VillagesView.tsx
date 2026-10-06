import React, { useState, useMemo } from 'react';
import { Layers, Users, Search, ChevronRight, Phone } from 'lucide-react';
import { Village, Contact } from '../types';
import { BannerAd } from './BannerAd';

interface VillagesViewProps {
  villages: Village[];
  contacts: Contact[];
  onSelectVillage: (villageId: string) => void;
}

export const VillagesView: React.FC<VillagesViewProps> = ({
  villages,
  contacts,
  onSelectVillage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate count of contacts per village
  const villageCountMap = useMemo(() => {
    const map = new Map<string, number>();
    villages.forEach((v) => map.set(v.id, 0));
    contacts.forEach((c) => {
      const cur = map.get(c.villageId) || 0;
      map.set(c.villageId, cur + 1);
    });
    return map;
  }, [villages, contacts]);

  const filteredVillages = useMemo(() => {
    if (!searchTerm.trim()) return villages;
    const query = searchTerm.toLowerCase().trim();
    return villages.filter((v) => v.name.toLowerCase().includes(query));
  }, [villages, searchTerm]);

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-3 sm:px-4 pb-20">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-blue-950/15 border border-blue-800/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-300" />
              <span>गाँव अनुसार सूची (All Villages)</span>
            </h2>
            <p className="text-blue-200 text-xs sm:text-sm font-medium mt-0.5">
              गाँव चुनें और वहाँ के सभी संपर्क नंबर तुरंत देखें
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/20 text-right">
            <span className="text-xs text-blue-200 block">कुल गाँव</span>
            <span className="text-xl font-black text-white">{villages.length}</span>
          </div>
        </div>
      </div>

      {/* Search villages */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          id="search-villages-list-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="गाँव का नाम खोजें (उदा. चितरी, रामपुर)..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-600 outline-none transition-all shadow-2xs"
        />
      </div>

      {/* Grid of Villages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredVillages.map((v) => {
          const count = villageCountMap.get(v.id) || 0;
          return (
            <div
              key={v.id}
              id={`village-card-${v.id}`}
              onClick={() => onSelectVillage(v.id)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 p-4 cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white border border-blue-200 group-hover:border-blue-600 flex items-center justify-center font-bold text-xl transition-colors">
                  🏘️
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                    {v.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{count} पंजीकृत संपर्क</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-blue-700 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                <span className="hidden sm:inline">खोलें</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* AdMob Banner */}
      <BannerAd placement="in-feed" />
    </div>
  );
};
