
import React from 'react';
import { Movie } from '../types';
import { 
  X, 
  Play, 
  Info, 
  Star, 
  Calendar, 
  Clock, 
  User, 
  Film, 
  ChevronRight,
  Maximize2,
  ExternalLink
} from 'lucide-react';

interface MovieModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  onFullDetails: (movie: Movie) => void;
}

const MovieModal: React.FC<MovieModalProps> = ({ movie, isOpen, onClose, onFullDetails }) => {
  if (!isOpen || !movie) return null;

  const isSeries = movie.type === 'series' || movie.type === 'anime';
  const isManga = movie.type === 'manga';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-[#0d0d0f] rounded-lg border border-white/10 shadow-[0_0_100px_rgba(0,161,250,0.3)] overflow-hidden flex flex-col md:flex-row metallic-panel">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/60 hover:bg-red-600 text-white rounded-full transition-all border border-white/10"
        >
          <X size={20} strokeWidth={3} />
        </button>

        {/* Left: Poster Side */}
        <div className="hidden md:block w-[300px] shrink-0 relative overflow-hidden group">
          <img 
            src={movie.posterUrl} 
            className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000" 
            alt={movie.title} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          
          <div className="absolute bottom-6 left-6 right-6 space-y-3">
             <div className="flex items-center gap-2">
                <span className="bg-[#00A1FA] text-white text-[9px] font-black px-3 py-1 rounded uppercase tracking-widest shadow-lg">
                  {isManga ? 'Manga' : isSeries ? 'Série' : 'Film'}
                </span>
                <div className="flex items-center gap-1 text-yellow-500 font-black text-xs">
                   <Star size={12} fill="currentColor" />
                   <span>{movie.rating}</span>
                </div>
             </div>
             <button 
                onClick={() => onFullDetails(movie)}
                className="w-full py-3 bg-white/5 hover:bg-[#00A1FA] border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded transition-all shadow-xl group/btn"
             >
                <div className="flex items-center justify-center gap-2">
                   Plus d'infos <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </div>
             </button>
          </div>
        </div>

        {/* Right: Info Side */}
        <div className="flex-1 p-8 md:p-12 space-y-8 relative overflow-y-auto custom-scrollbar max-h-[80vh] md:max-h-none">
           <div className="space-y-2">
              <h2 className="text-white text-3xl md:text-5xl font-black italic futuristic-font tracking-tighter uppercase leading-none drop-shadow-2xl">
                {movie.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                 <div className="flex items-center gap-1.5"><Calendar size={14} className="text-[#00A1FA]" /> {movie.year}</div>
                 <div className="flex items-center gap-1.5"><Clock size={14} className="text-[#00A1FA]" /> {isManga ? `${movie.duration}` : movie.duration}</div>
                 <div className="flex items-center gap-1.5"><Film size={14} className="text-[#00A1FA]" /> {movie.genre[0]}</div>
              </div>
           </div>

           <div className="h-[1px] bg-gradient-to-r from-[#00A1FA]/50 via-[#00A1FA]/10 to-transparent"></div>

           <p className="text-slate-400 text-sm md:text-lg leading-relaxed line-clamp-4 italic">
             {movie.description}
           </p>

           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Réalisateur / Auteur</span>
                 <p className="text-[#70CCFF] text-xs font-black uppercase">{movie.director}</p>
              </div>
              <div className="space-y-1">
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Acteurs</span>
                 <p className="text-slate-300 text-xs font-bold line-clamp-1">{movie.cast.join(', ') || 'N/A'}</p>
              </div>
           </div>

           <div className="flex flex-wrap items-center gap-4 pt-4">
              <button 
                onClick={() => onFullDetails(movie)}
                className="flex-1 min-w-[200px] flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-[#00A1FA] to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black text-sm uppercase tracking-[0.3em] rounded border border-white/10 shadow-[0_15px_30px_rgba(0,161,250,0.3)] transition-all active:scale-95 group"
              >
                <Play fill="currentColor" size={24} /> 
                {isManga ? 'LIRE LE SCAN' : 'REGARDER MAINTENANT'}
              </button>
              
              <button 
                onClick={() => onFullDetails(movie)}
                className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-slate-400 hover:text-white transition-all shadow-xl"
                title="Plein écran"
              >
                 <Maximize2 size={24} />
              </button>
           </div>

           <div className="flex items-center gap-2 pt-6 opacity-30">
              <div className="h-px flex-1 bg-white/10"></div>
              <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500">Planet Streaming AI Core</span>
              <div className="h-px flex-1 bg-white/10"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;
