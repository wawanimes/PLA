
import React from 'react';
import { GENRES, UI_ICONS } from '../constants';

interface GenreSidebarProps {
  selectedGenre: string | null;
  onSelect: (genreId: string) => void;
}

const GenreSidebar: React.FC<GenreSidebarProps> = ({ selectedGenre, onSelect }) => {
  return (
    <aside className="space-y-6 w-full md:w-64 shrink-0">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-2">Browse Genres</h3>
        <nav className="space-y-1">
          {GENRES.map((genre) => (
            <button
              key={genre.id}
              onClick={() => onSelect(genre.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                selectedGenre === genre.id 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="opacity-70">
                {(UI_ICONS as any)[genre.icon] || UI_ICONS.Film}
              </span>
              {genre.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-xl border border-blue-800/30">
        <h4 className="text-sm font-bold text-blue-300 mb-2">Unlock Planet Premium</h4>
        <p className="text-xs text-slate-400 leading-relaxed mb-3">
          Get access to exclusive 4K content, ad-free streaming, and early premieres.
        </p>
        <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors">
          Go Pro
        </button>
      </div>
    </aside>
  );
};

export default GenreSidebar;
