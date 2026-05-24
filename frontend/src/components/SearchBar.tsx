'use client';

import { Search, Compass, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  category: string;
  setCategory: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  radius: number;
  setRadius: (val: number) => void;
}

const POPULAR_CATEGORIES = ['Plumber', 'Electrician', 'Cleaner', 'Locksmith', 'HVAC'];

export default function SearchBar({
  category,
  setCategory,
  sortBy,
  setSortBy,
  radius,
  setRadius
}: SearchBarProps) {
  return (
    <div className="w-full flex flex-col gap-4 mb-8">
      {/* Search Input Bar */}
      <div className="relative w-full flex items-center">
        <div className="absolute left-4 text-slate-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="What service do you need? (e.g., Plumber, Electrician...)"
          className="glass-input w-full pl-12 pr-4 py-4 rounded-2xl text-base placeholder-slate-400 focus:ring-2 focus:ring-violet-500/50"
        />
        {category && (
          <button
            onClick={() => setCategory('')}
            className="absolute right-4 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Suggested category badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
          Suggestions:
        </span>
        {POPULAR_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(category === cat ? '' : cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              category.toLowerCase() === cat.toLowerCase()
                ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/10'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter and Sort options panel */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        {/* Radius Filter */}
        <div className="flex items-center gap-3">
          <Compass size={16} className="text-violet-400" />
          <span className="text-sm text-slate-300 min-w-[130px]">
            Search Radius: <span className="font-bold text-white">{radius} km</span>
          </span>
          <input
            type="range"
            min="1"
            max="50"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-32 accent-violet-500 h-1 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-3 md:self-end">
          <SlidersHorizontal size={16} className="text-violet-400" />
          <span className="text-sm text-slate-300 mr-1">Sort by:</span>
          
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
            {[
              { id: 'score', label: 'Composite Score' },
              { id: 'distance', label: 'Proximity' },
              { id: 'rating', label: 'Top Rated' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  sortBy === opt.id
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
