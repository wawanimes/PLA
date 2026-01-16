
import React from 'react';
import { Movie } from '../types';
import { UI_ICONS } from '../constants';

interface HeroProps {
  movie: Movie | null;
  onPlay: (movie: Movie) => void;
  onInfo: (movie: Movie) => void;
}

const Hero: React.FC<HeroProps> = ({ movie, onPlay, onInfo }) => {
  if (!movie) return (
    <div className="w-full h-[60vh] bg-slate-900 animate-pulse rounded-2xl"></div>
  );

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden rounded-2xl group border border-slate-800">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={movie.backdropUrl} 
          alt={movie.title}
          className="w-full h-full object-cover opacity-60 scale-105 group-hover:scale-100 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-8 md:p-16 max-w-4xl space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-blue-600 text-[10px] font-bold uppercase rounded tracking-wider">Featured</span>
          <div className="flex items-center gap-1 text-yellow-500">
            {UI_ICONS.Star}
            <span className="text-sm font-bold">{movie.rating}</span>
          </div>
          <span className="text-slate-400 text-sm">{movie.year} • {movie.duration}</span>
        </div>
        
        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase drop-shadow-2xl">
          {movie.title}
        </h2>
        
        <p className="text-slate-300 text-sm md:text-lg line-clamp-3 max-w-2xl font-medium leading-relaxed">
          {movie.description}
        </p>

        <div className="flex flex-wrap gap-4 pt-4">
          <button 
            onClick={() => onPlay(movie)}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-xl shadow-blue-600/30"
          >
            {UI_ICONS.Play} Watch Now
          </button>
          <button 
            onClick={() => onInfo(movie)}
            className="px-8 py-3 bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-md text-white border border-slate-700 rounded-lg font-bold flex items-center gap-2 transition-all"
          >
            {UI_ICONS.Info} More Info
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
