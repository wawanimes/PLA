
import React, { useRef, useMemo } from 'react';
import { Movie, Episode, Season } from '../types';
import { Zap, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface LatestEpisodesSliderProps {
  movies: Movie[];
  onSelectEpisode: (movie: Movie, episode: Episode) => void;
}

interface ProcessedRecentEpisode extends Episode {
  seriesTitle: string;
  series: Movie;
  timeAgo: string;
  language: string;
  seasonNum: number;
  releaseTimestamp: number;
  isNew?: boolean;
  lastUpdated?: number;
}

const LatestEpisodesSlider: React.FC<LatestEpisodesSliderProps> = ({ movies, onSelectEpisode }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const recentEpisodes = useMemo(() => {
    let discoveredList: ProcessedRecentEpisode[] = [];
    const now = new Date();
    const currentDay = now.getDay();
    
    const activeSeries = movies.filter(m => 
      (m.type === 'series' || m.type === 'anime') && 
      (m.showInLatestEpisodes || m.isRecentAddition)
    );

    activeSeries.forEach(series => {
      if (!series.seasons || series.seasons.length === 0) return;

      series.seasons.forEach(season => {
        if (!season.episodes || season.episodes.length === 0) return;

        season.episodes.forEach(ep => {
          let releaseTimestamp = (ep as any).lastUpdated || 0;
          let timeAgoStr = "Récemment";
          let isNew = false;

          if (releaseTimestamp) {
            const diffMs = now.getTime() - releaseTimestamp;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);

            if (diffHours < 1) {
              timeAgoStr = "À l'instant";
              isNew = true;
            } else if (diffHours < 24) {
              timeAgoStr = `Il y a ${diffHours} h`;
              isNew = diffHours < 6;
            } else if (diffDays < 7) {
              timeAgoStr = `Il y a ${diffDays} j`;
            } else {
              timeAgoStr = new Date(releaseTimestamp).toLocaleDateString('fr-FR');
            }
          }

          const isRecentlyAdded = series.isRecentAddition || (releaseTimestamp && (now.getTime() - releaseTimestamp < 10 * 24 * 60 * 60 * 1000));

          if (isRecentlyAdded) {
            discoveredList.push({
              ...ep,
              seriesTitle: series.title,
              series: series,
              timeAgo: timeAgoStr,
              language: ep.langue?.[0] || series.langue?.[0] || 'VOSTFR',
              seasonNum: season.number,
              releaseTimestamp: releaseTimestamp,
              isNew: isNew
            });
          }
        });
      });
    });

    return discoveredList
      .sort((a, b) => (b.releaseTimestamp || 0) - (a.releaseTimestamp || 0))
      .slice(0, 12);
  }, [movies]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (recentEpisodes.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="text-red-600 fill-red-600" size={18} />
            <div className="absolute inset-0 bg-red-600 blur-sm opacity-50"></div>
          </div>
          <h2 className="text-white font-black text-lg uppercase tracking-tight relative">
            Derniers épisodes ajoutés
            <div className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-red-600"></div>
          </h2>
        </div>
      </div>

      <div className="relative group">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-[-15px] top-1/2 -translate-y-1/2 z-30 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 shadow-xl"
        >
          <ChevronLeft size={24} />
        </button>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 px-2 scroll-smooth">
          {recentEpisodes.map((ep, i) => (
            <div 
              key={`${ep.id}-${i}`}
              onClick={() => onSelectEpisode(ep.series, ep)}
              className="flex-shrink-0 w-[240px] md:w-[260px] cursor-pointer group/card relative"
            >
              <div className="relative aspect-video rounded-sm overflow-hidden border border-white/10 shadow-2xl transition-all">
                <img src={ep.thumbnailUrl || ep.series.backdropUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" alt={ep.seriesTitle} />
                
                <div className="absolute inset-x-0 top-0 p-2 flex justify-between items-start z-10 group-hover/card:opacity-0 transition-opacity">
                   <div className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-sm text-[10px] font-black text-white uppercase truncate max-w-[140px] border border-white/5">
                      {ep.seriesTitle}
                   </div>
                   {ep.isNew && <div className="bg-red-600 px-1.5 py-0.5 rounded-sm text-[8px] font-black text-white uppercase animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]">NEW</div>}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 group-hover/card:opacity-0 transition-opacity"></div>

                <div className="absolute inset-x-0 bottom-0 p-2 flex justify-between items-end z-10 group-hover/card:opacity-0 transition-opacity">
                  <div className="flex gap-1">
                    <div className="bg-black/80 border border-white/10 px-2 py-0.5 rounded-sm text-[9px] font-black text-white uppercase">S.{ep.seasonNum || 1} EP.{ep.number}</div>
                  </div>
                  <div className={`px-3 py-0.5 rounded-sm text-[10px] font-black text-white shadow-lg ${ep.language.includes('VO') ? 'bg-red-600' : 'bg-blue-600'}`}>{ep.language}</div>
                </div>

                {/* SPREADER INFORMATION - Slider version aligned to video aspect ratio */}
                <div className="absolute inset-0 z-50 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="w-full h-full border-[4px] border-[#00A1FA] bg-black flex flex-col pointer-events-auto">
                    <div className="flex-1 p-2 space-y-1.5 overflow-hidden text-[9px] leading-tight text-left relative font-sans">
                      <div className="absolute top-2 right-1 bottom-10 w-2 bg-[#00A1FA]"></div>
                      <div className="border-b border-white/5 pb-0.5">
                        <span className="text-[#00FF00] font-bold">Episode : </span>
                        <span className="text-[#70CCFF] font-bold">{ep.number} ({ep.language})</span>
                      </div>
                      <div className="border-b border-white/5 pb-0.5">
                        <span className="text-white font-bold">Série : </span>
                        <span className="text-[#70CCFF] font-bold truncate inline-block max-w-[150px]">{ep.seriesTitle}</span>
                      </div>
                      <div className="border-b border-white/5 pb-0.5">
                        <span className="text-white font-bold">Sortie : </span>
                        <span className="text-[#70CCFF] font-bold">{ep.timeAgo}</span>
                      </div>
                      <div className="pt-0.5">
                        <span className="text-white font-bold italic opacity-60">PLANET STREAM LATEST</span>
                      </div>
                    </div>
                    <div className="w-full py-2 bg-gradient-to-b from-[#222] to-[#000] text-white font-black text-lg uppercase tracking-tighter border-t border-white/10 flex items-center justify-center">
                      REGARDER
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-[-15px] top-1/2 -translate-y-1/2 z-30 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 shadow-xl"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default LatestEpisodesSlider;
