
import React, { useState, useMemo } from 'react';
import { Movie } from '../types';
import { Search, Filter, Shuffle, List, Globe, X, AlertTriangle, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface CatalogueViewProps {
  movies: Movie[];
  isLoading: boolean;
  onSelectMovie: (movie: Movie) => void;
  onSearch: (query: string) => void;
  onFilterChange: (genre: string) => void;
  onTypeChange: (type: string) => void;
  onLanguageChange: (lang: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  activeFilters: {
    type: string;
    langue: string;
    genre: string;
  };
}

const CatalogueView: React.FC<CatalogueViewProps> = ({ 
  movies, 
  isLoading, 
  onSelectMovie, 
  onSearch, 
  onFilterChange,
  onTypeChange,
  onLanguageChange,
  currentPage,
  onPageChange,
  activeFilters
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [genreSearch, setGenreSearch] = useState('');

  const genres = [
    "Action", "Adolescence", "Aliens / Extra-terrestres", "Amitié", "Amour", 
    "Apocalypse", "Art", "Arts martiaux", "Assassinat", "Autre monde", 
    "Aventure", "Combats", "Comédie", "Crime", "Cyberpunk", "Démons", 
    "Drame", "Ecchi", "Espace", "Fantaisie", "Guerre", "Harem", "Horreur", 
    "Isekai", "Magie", "Mecha", "Mystère", "Psychologique", "Romance", 
    "Samouraï", "Science-fiction", "Seinen", "Shôjo", "Shônen", "Slice of Life", 
    "Sport", "Surnaturel", "Thriller", "Tragédie", "Vampires"
  ];

  const types = [
    { label: "Anime", value: "Anime" },
    { label: "Scans", value: "Scans" },
    { label: "Film", value: "Film" },
    { label: "Autres", value: "Autres" }
  ];

  const langues = [
    { label: "VOSTFR", value: "VOSTFR" },
    { label: "VF", value: "VF" },
    { label: "VASTFR", value: "VASTFR" }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearch);
  };

  const filteredGenresList = useMemo(() => 
    genres.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase())),
    [genreSearch]
  );

  const handleRandom = () => {
    if (movies.length > 0) {
      const randomIdx = Math.floor(Math.random() * movies.length);
      onSelectMovie(movies[randomIdx]);
    }
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    onSearch('');
    // Clearing filters is handled by parents when navigate or specific actions occur
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-700 min-h-screen">
      <style>{`
        .catalogue-sidebar-section {
          background: #050505;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 4px;
          overflow: hidden;
        }
        .catalogue-sidebar-header {
          background: #0a0a0a;
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .catalogue-sidebar-header h3 {
          font-size: 11px;
          font-weight: 900;
          color: #fff;
          letter-spacing: 1px;
        }
        .filter-item-btn {
          width: 100%;
          text-align: left;
          padding: 6px 12px;
          font-size: 10px;
          font-weight: 700;
          color: #555;
          border-bottom: 1px solid rgba(255,255,255,0.02);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .filter-item-btn:hover {
          background: rgba(0, 161, 250, 0.05);
          color: #fff;
        }
        .filter-item-btn.active {
          color: #fff;
          background: rgba(0, 161, 250, 0.1);
        }
        .filter-checkbox {
          width: 16px;
          height: 16px;
          border: 1px solid #222;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
        }
        .filter-item-btn.active .filter-checkbox {
          border-color: #00A1FA;
          color: #00A1FA;
        }
        .genre-search-box {
          padding: 8px;
          background: #080808;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .genre-search-box input {
          width: 100%;
          background: #000;
          border: 1px solid #111;
          border-radius: 3px;
          padding: 4px 10px;
          font-size: 9px;
          color: #70ccff;
          outline: none;
        }
        .catalogue-card {
          background: #0c0c0e;
          border: 1px solid #141416;
          transition: all 0.3s;
          border-radius: 4px;
        }
        .catalogue-card:hover {
          border-color: #00A1FA;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        }
        .catalogue-card-info-label {
          color: #444;
          font-weight: 900;
          font-size: 8px;
          text-transform: uppercase;
          margin-top: 6px;
          display: block;
        }
        .catalogue-card-info-value {
          color: #bbb;
          font-weight: 700;
          font-size: 8.5px;
          line-height: 1.3;
          display: block;
          margin-top: 1px;
        }
      `}</style>

      {/* Sidebar */}
      <aside className="w-full md:w-60 shrink-0 space-y-4">
        {/* Types */}
        <div className="catalogue-sidebar-section">
          <div className="catalogue-sidebar-header">
            <List size={12} className="text-[#00A1FA]" />
            <h3>TYPES</h3>
          </div>
          <div className="flex flex-col">
            {types.map(t => (
              <button 
                key={t.value}
                onClick={() => onTypeChange(t.value)}
                className={`filter-item-btn ${activeFilters.type === t.value ? 'active' : ''}`}
              >
                {t.label}
                <div className="filter-checkbox">
                   {activeFilters.type === t.value && <Check size={10} strokeWidth={4} />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Langues */}
        <div className="catalogue-sidebar-section">
          <div className="catalogue-sidebar-header">
            <Globe size={12} className="text-[#00A1FA]" />
            <h3>LANGUES</h3>
          </div>
          <div className="flex flex-col">
            {langues.map(l => (
              <button 
                key={l.value}
                onClick={() => onLanguageChange(l.value)}
                className={`filter-item-btn ${activeFilters.langue === l.value ? 'active' : ''}`}
              >
                {l.label}
                <div className="filter-checkbox">
                   {activeFilters.langue === l.value && <Check size={10} strokeWidth={4} />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Genres */}
        <div className="catalogue-sidebar-section">
          <div className="catalogue-sidebar-header">
            <Filter size={12} className="text-[#00A1FA]" />
            <h3>GENRES</h3>
          </div>
          <div className="genre-search-box">
             <input 
              type="text" 
              placeholder="Rechercher un genre..." 
              value={genreSearch}
              onChange={(e) => setGenreSearch(e.target.value)}
             />
          </div>
          <div className="flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar">
            {filteredGenresList.map(g => (
              <button 
                key={g}
                onClick={() => onFilterChange(g)}
                className={`filter-item-btn ${activeFilters.genre === g ? 'active' : ''}`}
              >
                {g}
                <div className="filter-checkbox">
                   {activeFilters.genre === g && <Check size={10} strokeWidth={4} />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Search Bar */}
        <div className="bg-[#050505] border border-white/5 p-2 rounded flex flex-col sm:flex-row gap-4">
           <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00A1FA]/60">
                 <Search size={14} strokeWidth={3} />
              </div>
              <input 
                type="text" 
                placeholder="RECHERCHER UN TITRE..." 
                className="w-full bg-[#080808] border border-white/10 rounded px-10 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#70ccff] focus:outline-none focus:border-[#00A1FA] transition-all"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
           </form>
        </div>

        {/* Action Buttons Bar */}
        <div className="bg-[#050505] border border-white/5 p-3 rounded flex items-center justify-center gap-4">
           <button 
            onClick={handleClearFilters}
            className="p-2.5 bg-black border border-white/5 hover:border-red-500/50 text-slate-500 hover:text-red-500 rounded transition-all"
            title="Effacer filtres"
           >
             <X size={14} strokeWidth={3} />
           </button>

           <button 
            onClick={handleRandom}
            className="flex items-center gap-2 px-6 py-2 bg-black border border-white/10 hover:border-[#00A1FA] text-[10px] font-black uppercase text-slate-400 hover:text-white rounded transition-all group"
           >
             <Shuffle size={14} className="group-hover:rotate-180 transition-transform duration-500" /> ALÉATOIRE
           </button>

           <button className="flex items-center gap-2 px-6 py-2 bg-[#0d1520] border border-[#00A1FA]/20 hover:border-[#00A1FA]/60 text-[10px] font-black uppercase text-[#70ccff] hover:text-white rounded transition-all">
             <Filter size={14} /> TRIER
           </button>
        </div>

        {/* Grid Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
           {isLoading ? (
             [...Array(12)].map((_, i) => (
               <div key={i} className="bg-[#0c0c0e] aspect-[2/3.5] animate-pulse rounded border border-white/5" />
             ))
           ) : movies.length > 0 ? (
             movies.map(movie => (
               <CatalogueCard key={movie.id} movie={movie} onClick={() => onSelectMovie(movie)} />
             ))
           ) : (
             <div className="col-span-full py-40 flex flex-col items-center justify-center text-slate-700 opacity-20">
               <AlertTriangle size={64} className="mb-4" />
               <p className="text-xl font-black uppercase tracking-widest italic">Aucun contenu correspondant</p>
             </div>
           )}
        </div>

        {/* Pagination UI */}
        {!isLoading && movies.length > 0 && (
          <div className="flex justify-center items-center gap-1.5 py-10">
             <button 
               onClick={() => onPageChange(Math.max(1, currentPage - 1))}
               className="w-9 h-9 flex items-center justify-center bg-[#080808] border border-white/5 rounded text-slate-500 hover:text-white transition-all disabled:opacity-20"
               disabled={currentPage === 1}
             >
                <ChevronLeft size={16} strokeWidth={3} />
             </button>
             
             {[1, 2, 3, 4, 5, 6].map(p => (
               <button 
                key={p} 
                onClick={() => onPageChange(p)}
                className={`w-9 h-9 flex items-center justify-center text-[11px] font-black border rounded transition-all ${p === currentPage ? 'bg-[#00A1FA] border-[#00A1FA] text-white shadow-[0_0_15px_rgba(0,161,250,0.3)]' : 'bg-[#080808] border-white/5 text-slate-500 hover:text-white hover:border-white/20'}`}
               >
                 {p}
               </button>
             ))}
             <span className="px-2 text-slate-800">...</span>
             {[37, 38, 39, 40, 41].map(p => (
               <button 
                key={p} 
                onClick={() => onPageChange(p)}
                className={`w-9 h-9 flex items-center justify-center text-[11px] font-black border rounded transition-all ${p === currentPage ? 'bg-[#00A1FA] border-[#00A1FA] text-white' : 'bg-[#080808] border-white/5 text-slate-500 hover:text-white'}`}
               >
                 {p}
               </button>
             ))}
             
             <button 
               onClick={() => onPageChange(currentPage + 1)}
               className="w-9 h-9 flex items-center justify-center bg-[#080808] border border-white/5 rounded text-slate-500 hover:text-white transition-all"
             >
                <ChevronRight size={16} strokeWidth={3} />
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CatalogueCard: React.FC<{ movie: Movie; onClick: () => void }> = ({ movie, onClick }) => {
  const isSeries = movie.type === 'series' || movie.type === 'anime';
  const isManga = movie.type === 'manga';

  return (
    <div className="catalogue-card cursor-pointer overflow-hidden p-3 flex flex-col h-full group" onClick={onClick}>
      <div className="aspect-[2/2.4] rounded overflow-hidden relative border border-white/5 group-hover:border-[#00A1FA]/30">
        <img src={movie.posterUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" alt={movie.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
      </div>
      <div className="mt-4 flex-1 flex flex-col">
        <h3 className="text-white font-black uppercase text-[11px] tracking-tight line-clamp-2 leading-none mb-1 group-hover:text-[#00A1FA] transition-colors text-center">{movie.title}</h3>
        {movie.altTitle && <p className="text-[8px] text-slate-600 uppercase font-bold text-center truncate italic opacity-50 mb-3">{movie.altTitle}</p>}
        <div className="space-y-1">
          <div>
            <span className="catalogue-card-info-label">GENRES</span>
            <span className="catalogue-card-info-value">{Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre}</span>
          </div>
          <div className="flex gap-4">
             <div className="flex-1">
               <span className="catalogue-card-info-label">TYPES</span>
               <span className="catalogue-card-info-value text-[#00A1FA]">{isManga ? 'Scans' : isSeries ? 'Anime' : 'Film'}</span>
             </div>
             <div className="flex-1">
               <span className="catalogue-card-info-label">LANGUES</span>
               <span className="catalogue-card-info-value">{movie.langue?.join(', ') || 'VOSTFR'}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogueView;
