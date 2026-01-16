
import React, { useState, useEffect, useMemo } from 'react';
import { Movie, PlanningEntry } from '../types';
import { Calendar, Clock, Search, X, Tv, Globe, User, ChevronLeft, ChevronRight, Info, CheckCircle, Timer, Monitor, AlertTriangle, Film, ListFilter } from 'lucide-react';

interface PlanningViewProps {
  movies: Movie[]; // Managed items from addedContent
  isLoading: boolean;
  onSelectMovie: (movie: Movie) => void;
}

const PlanningView: React.FC<PlanningViewProps> = ({ movies, isLoading, onSelectMovie }) => {
  const [filter, setFilter] = useState<'TOUS' | 'ANIMES' | 'FILMS' | 'VOSTFR' | 'VF'>('TOUS');
  const [searchQuery, setSearchQuery] = useState('');
  const [weekOffset, setWeekOffset] = useState(0); 

  const days = [
    { name: 'LUNDI', id: 1 },
    { name: 'MARDI', id: 2 },
    { name: 'MERCREDI', id: 3 },
    { name: 'JEUDI', id: 4 },
    { name: 'VENDREDI', id: 5 },
    { name: 'SAMEDI', id: 6 },
    { name: 'DIMANCHE', id: 0 },
  ];

  const monthsList = [
    { name: 'JANVIER', id: 0 }, { name: 'FÉVRIER', id: 1 }, { name: 'MARS', id: 2 },
    { name: 'AVRIL', id: 3 }, { name: 'MAI', id: 4 }, { name: 'JUIN', id: 5 },
    { name: 'JUILLET', id: 6 }, { name: 'AOÛT', id: 7 }, { name: 'SEPTEMBRE', id: 8 },
    { name: 'OCTOBRE', id: 9 }, { name: 'NOVEMBRE', id: 10 }, { name: 'DÉCEMBRE', id: 11 }
  ];

  const isMonthlyMode = filter === 'FILMS';

  const getMondayOfSelectedWeek = (offset: number) => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - (day === 0 ? 6 : day - 1) + (offset * 7);
    return new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
  };

  const currentMonthIdx = new Date().getMonth();
  const currentDayIdx = new Date().getDay();

  const weekDates = useMemo(() => {
    const monday = getMondayOfSelectedWeek(weekOffset);
    return days.map((day) => {
      const d = new Date(monday);
      const dayOffset = day.id === 1 ? 0 : day.id === 2 ? 1 : day.id === 3 ? 2 : day.id === 4 ? 3 : day.id === 5 ? 4 : day.id === 6 ? 5 : 6;
      d.setDate(monday.getDate() + dayOffset);
      return {
        formatted: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        raw: d
      };
    });
  }, [weekOffset]);

  // COMBINED DATA PROJECTION
  const processedItems = useMemo(() => {
    const mondayOfView = getMondayOfSelectedWeek(weekOffset);
    const results: any[] = [];

    movies.filter(m => m.inPlanningPage).forEach(movie => {
      if (!movie.planningEntries) return;

      movie.planningEntries.forEach(entry => {
        if (isMonthlyMode) {
          // Monthly view logic: items with a defined month
          if (entry.month !== undefined) {
             results.push({ movie, entry, monthId: entry.month });
          }
        } else {
          // Weekly view logic: items with a defined day
          if (entry.day !== undefined) {
            // Episode Calculation:
            // Use the provided releaseDate as the start date. 
            // If none provided, we assume the series is active and just show it on the assigned day.
            const releaseDateStr = movie.releaseDate || '2024-01-01';
            const releaseDate = new Date(releaseDateStr);
            
            // Normalize release date to the start of its own week (Monday)
            const rDay = releaseDate.getDay();
            const rDiff = releaseDate.getDate() - (rDay === 0 ? 6 : rDay - 1);
            const normalizedReleaseMonday = new Date(releaseDate.getFullYear(), releaseDate.getMonth(), rDiff, 0, 0, 0, 0);

            const msInWeek = 1000 * 60 * 60 * 24 * 7;
            const weekDiff = Math.floor((mondayOfView.getTime() - normalizedReleaseMonday.getTime()) / msInWeek);
            
            // The episode airing this week is weekDiff + 1
            const episodeNum = weekDiff + 1;
            const totalEps = parseInt(movie.totalEpisodesCount || '100');

            // Visibility criteria for series:
            // Must be within range of total episodes OR the show is marked as "Always visible" (by having no limit set)
            // If the user just added it and didn't set dates, we show it anyway to avoid "Empty" frustration.
            const isWithinRange = episodeNum >= 1 && episodeNum <= totalEps;
            const isManualOverride = !movie.releaseDate; // If no date, show it regardless

            if (isWithinRange || isManualOverride) {
              results.push({ 
                movie, 
                entry, 
                dayId: entry.day, 
                episodeNum: isWithinRange ? episodeNum : (movie.episode ? parseInt(movie.episode) || 1 : 1) 
              });
            }
          }
        }
      });
    });

    return results.filter(item => {
      if (searchQuery && !item.movie.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filter === 'ANIMES' && item.movie.type !== 'anime') return false;
      if (filter === 'FILMS' && item.movie.type !== 'movie') return false;
      if (filter === 'VOSTFR' && !item.entry.language.includes('VO')) return false;
      if (filter === 'VF' && !item.entry.language.includes('VF')) return false;
      return true;
    });
  }, [movies, weekOffset, filter, searchQuery]);

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f);
    setWeekOffset(0);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <style>{`
        .planning-header-tab {
           border-right: 1px solid rgba(255, 255, 255, 0.03);
           background: #05070a;
           transition: all 0.3s;
        }
        .planning-header-tab.active {
           background: rgba(0, 161, 250, 0.05);
        }
        .planning-header-tab.active h3 {
           color: #00A1FA !important;
        }
        .planning-grid {
           display: grid;
           background: #05070a;
           border: 1px solid rgba(255, 255, 255, 0.05);
           border-radius: 12px;
           overflow-x: auto;
        }
        .planning-col {
           min-width: 140px;
           border-right: 1px solid rgba(255, 255, 255, 0.03);
           display: flex;
           flex-direction: column;
           min-height: 500px;
        }
        .filter-btn-planning {
           display: flex;
           align-items: center;
           gap: 8px;
           padding: 8px 20px;
           font-size: 11px;
           font-weight: 900;
           text-transform: uppercase;
           border-radius: 6px;
           border: 1px solid rgba(255, 255, 255, 0.05);
           background: rgba(10, 10, 15, 0.6);
           color: #555;
           transition: all 0.3s;
        }
        .filter-btn-planning.active {
           border-color: #fff;
           color: #fff;
           background: rgba(255, 255, 255, 0.1);
        }
        .filter-btn-planning.active-tous {
           border-color: #00A1FA;
           box-shadow: 0 0 15px rgba(0, 161, 250, 0.2);
        }
        .movie-planning-card {
           background: #090e16;
           border: 1px solid #141c2b;
           border-radius: 8px;
           overflow: hidden;
           margin: 10px;
           transition: all 0.3s;
        }
        .movie-planning-card:hover {
           border-color: #00A1FA;
           transform: translateY(-3px);
           box-shadow: 0 10px 20px rgba(0,0,0,0.5);
        }
      `}</style>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
            <Calendar className="text-cyan-400" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Planning</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Dernières mises à jour de diffusion</p>
          </div>
        </div>

        {!isMonthlyMode && (
          <div className="flex items-center bg-black border border-white/10 p-1.5 rounded-xl">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-2 text-slate-500 hover:text-white transition-colors hover:bg-white/5 rounded-lg"><ChevronLeft size={20} /></button>
            <div className="px-6 text-[10px] font-black text-cyan-400 uppercase tracking-widest border-x border-white/5">Semaine {weekOffset === 0 ? 'Actuelle' : weekOffset > 0 ? `+${weekOffset}` : weekOffset}</div>
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-2 text-slate-500 hover:text-white transition-colors hover:bg-white/5 rounded-lg"><ChevronRight size={20} /></button>
          </div>
        )}
      </div>

      {/* Category Filters */}
      <div className="bg-[#05070a] border border-white/5 p-6 rounded-2xl shadow-2xl space-y-5">
        <h3 className="text-[12px] font-black text-[#70ccff] uppercase tracking-[0.2em] italic flex items-center gap-2">
          <ListFilter size={14} /> FILTRER PAR CATÉGORIE :
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => handleFilterChange('TOUS')} className={`filter-btn-planning ${filter === 'TOUS' ? 'active active-tous' : ''}`}><X size={14} /> TOUS</button>
          <button onClick={() => handleFilterChange('ANIMES')} className={`filter-btn-planning ${filter === 'ANIMES' ? 'active' : ''}`}><Tv size={14} /> ANIMES</button>
          <button onClick={() => handleFilterChange('FILMS')} className={`filter-btn-planning ${filter === 'FILMS' ? 'active' : ''}`}><Film size={14} /> FILMS</button>
          <button onClick={() => handleFilterChange('VOSTFR')} className={`filter-btn-planning ${filter === 'VOSTFR' ? 'active' : ''}`}><Globe size={14} /> VOSTFR</button>
          <button onClick={() => handleFilterChange('VF')} className={`filter-btn-planning ${filter === 'VF' ? 'active' : ''}`}><User size={14} /> VF</button>

          <div className="relative flex-1 min-w-[260px] ml-auto">
            <input 
              type="text"
              placeholder="Rechercher un titre..."
              className="w-full bg-[#0d121b] border border-white/10 rounded-xl p-3 pl-12 text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-all shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-3.5 text-slate-600" size={16} />
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="planning-grid" style={{ gridTemplateColumns: isMonthlyMode ? 'repeat(12, 1fr)' : 'repeat(7, 1fr)' }}>
        {(isMonthlyMode ? monthsList : days).map((tab, idx) => {
          const isActive = isMonthlyMode ? tab.id === currentMonthIdx : (tab.id === currentDayIdx && weekOffset === 0);
          const colDate = !isMonthlyMode ? weekDates[idx] : null;
          const items = isMonthlyMode 
            ? processedItems.filter(i => i.monthId === tab.id)
            : processedItems.filter(i => i.dayId === tab.id);

          return (
            <div key={tab.id} className="planning-col">
              {/* Header Cell */}
              <div className={`py-6 text-center border-b border-white/5 planning-header-tab ${isActive ? 'active' : ''}`}>
                <h3 className={`text-sm md:text-lg font-black italic tracking-tighter uppercase mb-1 ${isActive ? 'text-cyan-400' : 'text-white'}`}>
                  {tab.name}
                </h3>
                <div className="text-[12px] font-bold text-slate-600 uppercase">
                  {isMonthlyMode ? (tab.id + 1) : colDate?.formatted}
                </div>
              </div>

              {/* Items List */}
              <div className={`flex-1 p-2 space-y-4 ${isActive ? 'bg-cyan-500/5' : ''}`}>
                {items.length > 0 ? items.map((item, i) => (
                  <div key={i} onClick={() => onSelectMovie(item.movie)} className="movie-planning-card group cursor-pointer">
                    <div className="aspect-[4/3] relative">
                      <img src={item.movie.posterUrl} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-[9px] font-black text-white uppercase truncate text-center drop-shadow-lg">{item.movie.title}</p>
                      </div>
                      <div className="absolute top-2 right-2 flex items-center bg-black/60 backdrop-blur-md px-1 py-0.5 rounded border border-white/10">
                         <img src={`https://raw.githubusercontent.com/Anime-Sama/IMG/img/autres/flag_${item.entry.language.includes('VO') ? 'jp' : 'fr'}.png`} className="w-3.5 h-2 rounded-sm" />
                      </div>
                    </div>
                    <div className="p-2 border-t border-white/5 flex flex-col items-center gap-1">
                       <div className="flex items-center gap-1.5">
                          <Clock size={10} className="text-cyan-500" />
                          <span className="text-[10px] font-black text-slate-300">{item.entry.time}</span>
                       </div>
                       {!isMonthlyMode && (
                         <span className="text-[8px] font-black text-slate-500 uppercase">EP. {item.episodeNum}</span>
                       )}
                    </div>
                  </div>
                )) : (
                  <div className="h-40 flex flex-col items-center justify-center opacity-10">
                    <Info size={20} />
                    <span className="text-[8px] font-black uppercase mt-2">Aucune sortie</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlanningView;
