
import React from 'react';
import { Movie } from '../types';
import { Pin } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  variant?: 'normal' | 'top';
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, variant = 'normal' }) => {
  if (!movie) return null;

  const isTop = variant === 'top';
  const isSeries = movie.type === 'series' || movie.type === 'anime';
  const isManga = movie.type === 'manga';
  
  const displayGenre = movie.genre && movie.genre.length > 0 ? movie.genre.slice(0, 3).join(' / ') : 'Action';
  const displayCast = movie.cast && movie.cast.length > 0 ? movie.cast.slice(0, 3).join(', ') : 'N/A';
  
  return (
    <div 
      className={`group relative cursor-pointer bg-black/40 border border-white/10 p-1 transition-all overflow-hidden fullstreaming ${
        isTop ? 'border-cyan-500/30' : 'hover:border-cyan-500/60'
      }`}
      onClick={() => onClick(movie)}
    >
      {/* The "Post" content area */}
      <div className="relative aspect-[2/3] overflow-hidden border border-black shadow-inner bg-[#050505]">
        <img 
          src={movie.posterUrl || `https://picsum.photos/seed/${movie.id}/500/750`} 
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Pinned Ribbon */}
        {movie.isPinned && (
          <div className="absolute top-0 right-0 z-40 p-1 bg-indigo-500 text-white rounded-bl shadow-lg">
            <Pin size={10} fill="currentColor" />
          </div>
        )}

        {/* Static Badges (Hidden on hover) */}
        <div className="absolute top-0 left-0 p-1 flex flex-wrap gap-1 z-20 group-hover:opacity-0 transition-opacity">
          {isManga ? (
            <span className="bg-purple-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-sm shadow-md uppercase">
              SCAN
            </span>
          ) : isSeries ? (
            <span className="bg-green-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-sm shadow-md uppercase">
              {movie.episode || `Episode: 1`}
            </span>
          ) : (
            <>
              <span className="bg-green-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-sm shadow-md uppercase">DVDRip</span>
              <span className="bg-cyan-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded-sm shadow-md uppercase">HD</span>
            </>
          )}
        </div>
      </div>
      
      {/* Title at bottom - Hidden when hovering */}
      <div className="p-1.5 mt-1 text-center group-hover:invisible h-10 flex items-center justify-center">
        <h3 className="mov-title text-[9px] font-bold text-[#70ccff] uppercase leading-tight line-clamp-2">
          {movie.title} {isSeries && movie.season ? `- Saison ${movie.season}` : isSeries ? '- Saison 1' : ''}
        </h3>
      </div>

      {/* SPREADER INFORMATION - Hover Frame exactly the same size as the post container */}
      <div className="absolute inset-0 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        {/* Blue Frame matching the screenshot with sharp edges */}
        <div className="w-full h-full border-[5px] border-[#00A1FA] bg-black flex flex-col pointer-events-auto">
          <div className="flex-1 p-3 space-y-2.5 overflow-hidden text-[11px] leading-tight text-left relative font-sans">
            
            {/* Scroll-like accent bar on the right */}
            <div className="absolute top-4 right-1 bottom-12 w-2.5 bg-[#00A1FA]"></div>
            
            <div className="border-b border-white/5 pb-1">
              <span className="text-[#00FF00] font-bold">{isManga ? 'Chapitre :' : isSeries ? 'Episode :' : 'Qualité :'} </span>
              <span className="text-[#70CCFF] font-bold">
                {isManga ? (movie.episode || '1') : isSeries ? (movie.episode || '1') : (movie.videoQuality || 'DVDRip, HD')}
              </span>
            </div>

            <div className="border-b border-white/5 pb-1">
              <span className="text-white font-bold">Année : </span>
              <span className="text-[#70CCFF] font-bold">{movie.year || 2024}</span>
            </div>

            <div className="border-b border-white/5 pb-1">
              <span className="text-white font-bold">{isManga ? 'Status :' : isSeries ? 'Saison :' : 'Réalisateur :'} </span>
              <span className="text-[#70CCFF] font-bold truncate block">
                {isManga ? (movie.status || 'Ongoing') : isSeries ? (movie.season || '1') : (movie.director || 'TMDB')}
              </span>
            </div>

            <div className="border-b border-white/5 pb-1">
              <span className="text-white font-bold">{isManga ? 'Auteur :' : 'Acteur :'} </span>
              <span className="text-[#70CCFF] font-bold line-clamp-2 leading-snug">
                {isManga ? (movie.director || 'N/A') : displayCast}
              </span>
            </div>

            <div className="border-b border-white/5 pb-1">
              <span className="text-white font-bold">Catégorie : </span>
              <span className="text-[#70CCFF] font-bold">{isManga ? 'Manga' : isSeries ? 'Séries' : 'Films'} / {displayGenre}</span>
            </div>

            <div className="pt-1">
              <span className="text-white font-bold">Nombre De Commentaire(s) : </span>
              <span className="text-white font-bold">0</span>
            </div>
          </div>

          {/* Bottom Button matching the signature black-gradient/white-text look */}
          <div className="w-full py-3.5 bg-gradient-to-b from-[#222] to-[#000] text-white font-black text-2xl uppercase tracking-tighter border-t border-white/10 flex items-center justify-center shadow-inner">
            {isManga ? 'LIRE' : 'REGARDER'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
