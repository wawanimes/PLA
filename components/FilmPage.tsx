
import React, { useEffect, useState, useMemo } from 'react';
import { Movie, Season, Episode } from '../types';
import AdBanner from './AdBanner';
import { 
  PlayCircle, 
  Monitor, 
  Play, 
  ArrowLeft, 
  Plus, 
  Star, 
  Eye, 
  Bookmark, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Download,
  ArrowUp,
  Youtube,
  Loader2,
  Calendar,
  Clock,
  User as UserIcon,
  Server,
  Info,
  Globe,
  Maximize,
  Lightbulb,
  Bug,
  Minimize,
  BookOpen,
  Maximize2,
  X as XIcon
} from 'lucide-react';
import { getMovieRecommendations, fetchSeasonEpisodes } from '../services/geminiService';

interface FilmPageProps {
  movie: Movie;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
}

type LangCode = 'VOSTFR' | 'VF' | 'VA' | 'VAR' | 'VKR' | 'VCN' | 'VQC' | 'VF1' | 'VF2';
type ReaderBg = 'black' | 'white' | 'gray';

const FilmPage: React.FC<FilmPageProps> = ({ movie, onBack, onSelectMovie }) => {
  const [localMovie, setLocalMovie] = useState<Movie>(movie);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'episode' | 'trailer'>('details');
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [activeLang, setActiveLang] = useState<LangCode>('VF');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeServer, setActiveServer] = useState(0);
  const [isLightOff, setIsLightOff] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [readerBg, setReaderBg] = useState<ReaderBg>('black');
  
  // Report State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Other');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const TEST_VIDEO_URL = "https://video.sibnet.ru/shell.php?videoid=5949655";

  useEffect(() => {
    setLocalMovie(movie);
    if (movie && (movie.type === 'series' || movie.type === 'anime' || movie.type === 'manga') && movie.seasons && Array.isArray(movie.seasons) && movie.seasons.length > 0) {
      const s1 = movie.seasons.find(s => s && s.number === 1) || movie.seasons[0];
      setSelectedSeason(s1 || null);
    } else if (movie && movie.type === 'manga') {
       setSelectedSeason({ id: 'manga-1', number: 1, title: 'Chapitres', episodes: [] });
    } else {
      setSelectedSeason(null);
    }
    
    if (movie && movie.langue && movie.langue.length > 0) {
      setActiveLang(movie.langue[0] as LangCode);
    }
  }, [movie]);

  useEffect(() => {
    if (movie && (movie.tmdbId || movie.id) && movie.type !== 'manga') {
      setLoadingRecs(true);
      const movieId = (movie.tmdbId || movie.id || '').toString();
      getMovieRecommendations(movieId, movie.type === 'series').then(recs => {
        setRecommendations(recs || []);
        setLoadingRecs(false);
      }).catch(err => {
        console.error("Recs failed:", err);
        setLoadingRecs(false);
      });
    }
    window.scrollTo(0, 0);
  }, [movie]);

  useEffect(() => {
    const fetchEps = async () => {
      const isManga = localMovie.type === 'manga';
      if ((localMovie.type === 'series' || isManga) && selectedSeason && (!selectedSeason.episodes || selectedSeason.episodes.length === 0)) {
        setLoadingEpisodes(true);
        try {
          const episodes = await fetchSeasonEpisodes(localMovie.tmdbId || localMovie.id, selectedSeason.number);
          const updatedSeason = { ...selectedSeason, episodes };
          setSelectedSeason(updatedSeason);
          setLocalMovie(prev => {
             const newSeasons = prev.seasons?.map(s => 
               s.number === selectedSeason.number ? updatedSeason : s
             ) || [updatedSeason];
             return { ...prev, seasons: newSeasons };
          });
        } catch (e) {
          console.error("Episode discovery failed:", e);
        } finally {
          setLoadingEpisodes(false);
        }
      }
    };
    fetchEps();
  }, [selectedSeason?.number, localMovie.id]);

  useEffect(() => {
    setActiveServer(0);
    setIsPlaying(false);
    setIsLightOff(false);
    setIsExpanded(false);
  }, [activeLang, movie.id, selectedEpisode?.id]);

  const filteredVideos = useMemo(() => {
    const content = selectedEpisode || localMovie;
    const allVideos = (content as any).videos || [];
    return allVideos.filter((v: any) => v.langue === activeLang);
  }, [selectedEpisode, localMovie, activeLang]);

  const handleSendReport = () => {
    setIsReporting(true);
    // Simulate API call
    setTimeout(() => {
      setIsReporting(false);
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setIsReportModalOpen(false);
      }, 2000);
    }, 1500);
  };

  if (!movie) return null;

  const isManga = movie.type === 'manga';

  const handleEpisodeClick = (episode: Episode) => {
    if (!episode) return;
    setSelectedEpisode(episode);
    setActiveTab('episode');
    setIsPlaying(false);
    setActiveServer(0);
    setIsExpanded(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToSeries = () => {
    setActiveTab('details');
    setSelectedEpisode(null);
    setIsPlaying(false);
    setIsExpanded(false);
  };

  const handleWatchTrailer = () => {
    setActiveTab('trailer');
    setIsPlaying(false);
    setIsExpanded(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const renderLanguageSwitcher = () => {
    const allLangs: { id: LangCode; label: string; flag: string }[] = [
      { id: 'VOSTFR', label: 'VO', flag: 'jp' },
      { id: 'VF', label: 'VF', flag: 'fr' },
      { id: 'VA', label: 'VA', flag: 'en' },
      { id: 'VAR', label: 'VAR', flag: 'ar' },
      { id: 'VKR', label: 'VKR', flag: 'kr' },
      { id: 'VCN', label: 'VCN', flag: 'cn' },
      { id: 'VQC', label: 'VQC', flag: 'qc' },
    ];

    const availableLangs = localMovie.langue && localMovie.langue.length > 0 
      ? allLangs.filter(l => localMovie.langue?.includes(l.id))
      : allLangs.filter(l => l.id === 'VF' || l.id === 'VOSTFR');

    return (
      <div className="flex flex-wrap justify-start">
        {availableLangs.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setActiveLang(lang.id)}
            className={`flex relative bg-white rounded uppercase font-bold text-base items-center justify-center border border-gray-500 mr-2 my-1 transition-all duration-200 ${
              activeLang === lang.id ? 'opacity-100 ring-2 ring-[#00A1FA] scale-105 shadow-lg' : 'opacity-30 hover:opacity-100'
            }`}
          >
            <img 
              className="object-cover rounded h-8 w-11" 
              src={`https://raw.githubusercontent.com/Anime-Sama/IMG/img/autres/flag_${lang.flag}.png`} 
              alt={lang.id}
            />
            <p className="absolute text-black text-[10px] font-black drop-shadow-sm pointer-events-none">
              {lang.label}
            </p>
          </button>
        ))}
      </div>
    );
  };

  const renderReportModal = () => {
    if (!isReportModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-[#000] rounded-lg overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(255,0,0,0.2)]">
          {/* Header with Red Gradient */}
          <div className="bg-gradient-to-r from-[#3a0a0a] to-[#000] p-4 border-b border-white/5">
            <h2 className="text-white font-bold text-lg uppercase tracking-tight">REPORT</h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="h-px bg-white/10 w-full mb-6"></div>
            
            <div className="relative">
              <select 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-[#0d0d0f] border border-white/20 rounded p-3 text-sm text-white font-medium appearance-none focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
              >
                <option value="The video not working">The video not working</option>
                <option value="Subtitle error">Subtitle error</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
            </div>

            {reportSuccess ? (
              <div className="bg-green-500/20 text-green-400 p-3 rounded text-center text-xs font-bold animate-pulse">
                Report sent successfully!
              </div>
            ) : (
              <div className="flex gap-4">
                <button 
                  onClick={handleSendReport}
                  disabled={isReporting}
                  className="flex-1 py-3 bg-gradient-to-b from-[#3b4b8a] to-[#1a1a2e] hover:from-[#4b5ba3] hover:to-[#2a2a43] text-white font-bold text-sm uppercase rounded shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isReporting && <Loader2 size={14} className="animate-spin" />}
                  Report
                </button>
                <button 
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 py-3 bg-gradient-to-b from-[#1a1a1a] to-[#000] hover:from-[#2a2a2a] hover:to-[#0a0a0a] text-white font-bold text-sm uppercase rounded shadow-lg transition-all active:scale-95 border border-white/5"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPlayerActions = () => (
    <div className="flex items-center justify-end gap-5 py-2 px-4 bg-[#0a0a0a] border-t border-white/5 rounded-b-lg select-none">
      <button 
        onClick={toggleExpand}
        className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-white transition-all group"
      >
        {isExpanded ? <Minimize size={13} className="text-cyan-500" /> : <Maximize size={13} className="text-cyan-500" />}
        <span className="uppercase tracking-tight">{isExpanded ? 'Shrink' : 'Expand'}</span>
      </button>

      <button 
        onClick={() => setIsLightOff(!isLightOff)}
        className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-white transition-all group"
      >
        <Lightbulb size={13} className={`text-yellow-500 ${isLightOff ? 'fill-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : ''}`} />
        <span className="uppercase tracking-tight">{isLightOff ? 'Turn On Light' : 'Turn Off Light'}</span>
      </button>

      <button 
        onClick={() => setIsReportModalOpen(true)}
        className="flex items-center gap-2.5 px-4 py-1 bg-black border border-[#521c1c] hover:border-[#821c1c] rounded text-[11px] font-bold text-white transition-all active:scale-95 group shadow-inner"
      >
        <Bug size={12} className="text-[#ff4d4d]" />
        <span>Report</span>
      </button>

      <button className="ml-1 flex items-center gap-1.5 px-3 py-1 bg-[#cc3333] hover:bg-red-700 text-white rounded border border-white/10 text-[10px] font-black uppercase transition-all shadow-xl active:scale-95 group">
        <Download size={13} strokeWidth={4} />
        Download
      </button>
    </div>
  );

  const renderVideoPlayer = () => {
    let videoUrl = TEST_VIDEO_URL;
    
    if (activeTab === 'trailer' && movie.trailerUrl) {
      videoUrl = movie.trailerUrl;
    } else if (filteredVideos.length > 0) {
      const server = filteredVideos[activeServer] || filteredVideos[0];
      videoUrl = server.url || TEST_VIDEO_URL;
    }

    if (isPlaying) {
      return (
        <div className={`aspect-video w-full bg-black rounded-t border-x border-t border-white/5 shadow-2xl overflow-hidden relative transition-all duration-500 ${isExpanded ? 'scale-105 z-50' : ''}`}>
          <iframe
            src={videoUrl}
            className="w-full h-full"
            frameBorder="0"
            scrolling="no"
            allowFullScreen
            title="Video Player"
          />
        </div>
      );
    }

    return (
      <div 
        className={`aspect-video w-full bg-black rounded-t border-x border-t border-white/10 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden group cursor-pointer transition-all duration-500 ${isExpanded ? 'scale-105 z-50' : ''}`}
        onClick={() => setIsPlaying(true)}
      >
        <img 
          src={movie.backdropUrl || movie.posterUrl} 
          className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000" 
          alt="Video Preview"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="bg-[#00A1FA] p-6 rounded-full text-white shadow-[0_0_40px_rgba(0,161,250,0.5)] transform transition-transform group-hover:scale-110">
            <Play fill="currentColor" size={40} />
          </div>
          <p className="text-white text-sm uppercase font-black tracking-[0.2em] drop-shadow-lg text-center px-4">
            Lancer la lecture {selectedEpisode ? `- Épisode ${selectedEpisode.number}` : ''}
            <br />
            <span className="text-cyan-400 text-xs opacity-80">VERSION : {activeLang}</span>
          </p>
        </div>
      </div>
    );
  };

  const isSeries = movie.type === 'series' || movie.type === 'anime' || isManga;

  if (activeTab === 'episode' && selectedEpisode && selectedSeason) {
    if (isManga) {
       const scanImages = selectedEpisode.images && selectedEpisode.images.length > 0 
         ? selectedEpisode.images 
         : [
             `https://picsum.photos/seed/${selectedEpisode?.id}-p1/800/1200`,
             `https://picsum.photos/seed/${selectedEpisode?.id}-p2/800/1200`,
             `https://picsum.photos/seed/${selectedEpisode?.id}-p3/800/1200`
           ];

       return (
         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            {renderReportModal()}
            <AdBanner zone="singleEpisodeTop" />

            {/* Manga Reader Header Controls (2016 Style) */}
            <div className="mod-box border-t-2 border-[#00A1FA] p-5 shadow-2xl space-y-4">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-white font-black text-2xl uppercase tracking-tighter leading-tight italic futuristic-font">
                       {movie.title} <span className="text-[#70ccff]">— Chapitre {selectedEpisode.number}</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PLANET SCANNER v1.0</span>
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                     <button 
                       onClick={() => setIsReportModalOpen(true)}
                       className="flex items-center gap-2 px-4 py-2 bg-black border border-[#521c1c] hover:border-[#821c1c] rounded text-[10px] font-black text-white transition-all active:scale-95"
                     >
                       <Bug size={14} className="text-[#ff4d4d]" /> REPORT ISSUE
                     </button>
                     <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2 rounded">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FOND :</span>
                        <div className="flex gap-2">
                           <button onClick={() => setReaderBg('black')} className={`w-5 h-5 rounded border ${readerBg === 'black' ? 'border-[#00A1FA] ring-2 ring-[#00A1FA]/30' : 'border-white/10'} bg-black transition-all`}></button>
                           <button onClick={() => setReaderBg('white')} className={`w-5 h-5 rounded border ${readerBg === 'white' ? 'border-[#00A1FA] ring-2 ring-[#00A1FA]/30' : 'border-white/10'} bg-white transition-all`}></button>
                           <button onClick={() => setReaderBg('gray')} className={`w-5 h-5 rounded border ${readerBg === 'gray' ? 'border-[#00A1FA] ring-2 ring-[#00A1FA]/30' : 'border-white/10'} bg-[#1a1a1a] transition-all`}></button>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-t border-white/5 pt-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">SÉLECTION DU CHAPITRE :</label>
                    <div className="relative">
                       <select 
                         className="w-full bg-[#0d1117] border border-white/10 rounded p-3 text-[11px] text-[#70ccff] font-black uppercase focus:outline-none focus:border-[#00A1FA] appearance-none cursor-pointer"
                         value={selectedEpisode.id}
                         onChange={(e) => {
                           const ep = selectedSeason.episodes?.find(ep => (ep.id || ep.number.toString()) === e.target.value);
                           if (ep) handleEpisodeClick(ep);
                         }}
                       >
                         {selectedSeason.episodes?.map((ep, i) => (
                           <option key={ep.id || i} value={ep.id || ep.number.toString()}>PAGE {i+1} : CHAPITRE {ep.number}</option>
                         ))}
                       </select>
                       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00A1FA] pointer-events-none" size={16} strokeWidth={3} />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                     <button 
                       disabled={selectedEpisode.number === 1}
                       onClick={() => {
                         const prevEp = selectedSeason.episodes?.find(ep => ep.number === (selectedEpisode.number - 1));
                         if (prevEp) handleEpisodeClick(prevEp);
                       }}
                       className="flex-1 max-w-[140px] flex items-center justify-center gap-2 bg-[#0d1117] hover:bg-black disabled:opacity-30 border border-white/10 rounded py-3 text-[10px] font-black text-white uppercase transition-all shadow-md active:scale-95 group"
                     >
                        <ChevronLeft size={16} className="text-[#00A1FA]" strokeWidth={3} /> PRÉCÉDENT
                     </button>
                     
                     <button 
                       disabled={selectedEpisode.number === (selectedSeason.episodes?.length || 0)}
                       onClick={() => {
                         const nextEp = selectedSeason.episodes?.find(ep => ep.number === (selectedEpisode.number + 1));
                         if (nextEp) handleEpisodeClick(nextEp);
                       }}
                       className="flex-1 max-w-[140px] flex items-center justify-center gap-2 bg-[#00A1FA] hover:bg-cyan-500 disabled:opacity-30 border border-white/10 rounded py-3 text-[10px] font-black text-white uppercase transition-all shadow-lg active:scale-95 group"
                     >
                       SUIVANT <ChevronRight size={16} className="text-white" strokeWidth={3} />
                     </button>
                  </div>
               </div>
            </div>

            {/* Scan Image Display Area */}
            <div 
              className={`w-full transition-all duration-700 min-h-[800px] flex flex-col items-center py-10 gap-0 shadow-2xl rounded-xl border border-white/5 overflow-hidden`}
              style={{ backgroundColor: readerBg === 'black' ? '#000' : readerBg === 'white' ? '#fff' : '#1a1a1a' }}
            >
               {/* Vertical Pages List */}
               <div className="max-w-[1000px] w-full flex flex-col items-center">
                  {scanImages.map((src, i) => (
                    <div key={i} className="relative w-full flex flex-col items-center group/page">
                       <img 
                          src={src} 
                          className="w-full h-auto shadow-[0_20px_40px_rgba(0,0,0,0.5)] border-b border-black/10" 
                          alt={`page ${i + 1}`} 
                          loading="lazy" 
                        />
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-white border border-white/10 opacity-0 group-hover/page:opacity-100 transition-opacity">
                           PAGE {i + 1} / {scanImages.length}
                        </div>
                    </div>
                  ))}
               </div>

               {/* Reader End Controls (2016 Style) */}
               <div className="mt-20 w-full max-w-[600px] px-6 text-center space-y-8 pb-10">
                  <div className="flex flex-col items-center gap-4">
                     <p className="text-[12px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: readerBg === 'white' ? '#555' : '#70ccff' }}>
                        Fin du chapitre {selectedEpisode.number}
                     </p>
                     <div className="flex items-center gap-4 w-full">
                        <button 
                           disabled={selectedEpisode.number === 1}
                           onClick={() => {
                             const prevEp = selectedSeason.episodes?.find(ep => ep.number === (selectedEpisode.number - 1));
                             if (prevEp) handleEpisodeClick(prevEp);
                           }}
                           className="flex-1 bg-black/80 hover:bg-black border border-white/10 rounded py-5 text-[12px] font-black text-white uppercase transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-20"
                        >
                           <ChevronLeft size={20} /> CHAPITRE PRÉCÉDENT
                        </button>
                        <button 
                           disabled={selectedEpisode.number === (selectedSeason.episodes?.length || 0)}
                           onClick={() => {
                             const nextEp = selectedSeason.episodes?.find(ep => ep.number === (selectedEpisode.number + 1));
                             if (nextEp) handleEpisodeClick(nextEp);
                           }}
                           className="flex-1 bg-[#00A1FA] hover:bg-cyan-500 rounded py-5 text-[12px] font-black text-white uppercase transition-all shadow-[0_0_30px_rgba(0,161,250,0.3)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-20"
                        >
                           CHAPITRE SUIVANT <ChevronRight size={20} />
                        </button>
                     </div>
                  </div>
                  
                  <button 
                    onClick={handleBackToSeries}
                    className="inline-flex items-center gap-3 text-[11px] font-black text-[#70CCFF] hover:text-white uppercase tracking-[0.4em] transition-all bg-black border-2 border-[#00A1FA]/20 px-10 py-4 rounded-full hover:border-[#00A1FA]/60 shadow-2xl active:scale-95"
                  >
                    <ArrowLeft size={18} strokeWidth={3} /> Retourner à la fiche manga
                  </button>
               </div>
            </div>

            <AdBanner zone="singleEpisodeBottom" />
         </div>
       );
    }

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 relative">
        {renderReportModal()}
        <AdBanner zone="singleEpisodeTop" />

        {isLightOff && (
          <div 
            className="fixed inset-0 z-[1500] bg-black/95 backdrop-blur-sm transition-opacity duration-500 cursor-pointer"
            onClick={() => setIsLightOff(false)}
          />
        )}
        
        <div className="bg-[#0b0b0d] border-b-2 border-[#00A1FA]/40 p-5 rounded-t-lg shadow-2xl">
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
             <div className="flex items-center gap-5">
                <div className="w-28 h-16 rounded overflow-hidden border border-white/10 shadow-lg">
                  <img src={selectedEpisode.thumbnailUrl || movie.backdropUrl || movie.posterUrl} className="w-full h-full object-cover opacity-80" />
                </div>
                <div>
                  <h1 className="text-white font-black text-2xl lg:text-3xl uppercase tracking-tighter leading-none">{movie.title}</h1>
                  <p className="text-[#00A1FA] text-[11px] font-black uppercase mt-1 tracking-widest">{selectedSeason.title || `Saison ${selectedSeason.number}`} • Épisode {selectedEpisode.number}</p>
                </div>
             </div>
             {renderLanguageSwitcher()}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
             <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Choix de l'Épisode</label>
             <select 
               className="w-full bg-black border border-white/10 rounded p-3 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#00A1FA] transition-all"
               value={selectedEpisode.id}
               onChange={(e) => {
                 const ep = selectedSeason.episodes?.find(ep => (ep.id || ep.number.toString()) === e.target.value);
                 if (ep) handleEpisodeClick(ep);
               }}
             >
               {selectedSeason.episodes?.map((ep, i) => (
                 <option key={ep.id || i} value={ep.id || ep.number.toString()}>ÉPISODE {ep.number} : {ep.title}</option>
               ))}
             </select>
          </div>
          <div className="space-y-1.5">
             <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Serveur de Streaming ({activeLang})</label>
             <select 
              className="w-full bg-black border border-white/10 rounded p-3 text-xs text-[#00A1FA] font-bold focus:outline-none focus:ring-1 focus:ring-[#00A1FA]"
              value={activeServer}
              onChange={(e) => { setActiveServer(parseInt(e.target.value)); setIsPlaying(false); }}
             >
               {filteredVideos.length > 0 ? filteredVideos.map((v: any, idx: number) => (
                 <option key={idx} value={idx}>{v.label || `LECTEUR ${idx + 1}`}</option>
               )) : (
                 <option value={0}>AUCUN LECTEUR DISPONIBLE EN {activeLang}</option>
               )}
             </select>
          </div>
        </div>

        <div className={`relative transition-all duration-500 ${isLightOff ? 'z-[1600]' : ''} ${isExpanded ? 'md:-mx-20 lg:-mx-40' : ''}`}>
          {(filteredVideos.length > 0) ? (
            <>
              <AdBanner zone="singlePlayerTop" className="mb-2" />
              {renderVideoPlayer()}
              {renderPlayerActions()}
              <AdBanner zone="singlePlayerBottom" className="mt-2" />
            </>
          ) : (
            <div className="aspect-video w-full bg-black rounded border border-white/5 flex flex-col items-center justify-center gap-4">
               <Globe className="text-slate-800" size={64} />
               <p className="text-slate-600 font-black uppercase text-sm tracking-widest">Contenu non disponible pour cette langue</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 py-4">
           <button 
             disabled={selectedEpisode.number === 1}
             onClick={() => {
               const prevEp = selectedSeason.episodes?.find(ep => ep.number === (selectedEpisode.number - 1));
               if (prevEp) handleEpisodeClick(prevEp);
             }}
             className="px-8 py-2.5 bg-[#121821] hover:bg-black disabled:opacity-30 border border-white/10 rounded text-[11px] font-black text-white uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95"
           >
             <ChevronLeft size={16} strokeWidth={3} /> Épisode Précédent
           </button>
           <button className="px-8 py-2.5 bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-500/30 rounded text-[11px] font-black text-cyan-400 uppercase flex items-center gap-2 transition-all shadow-lg">
             <Download size={16} strokeWidth={3} /> Téléchargement
           </button>
           <button 
             disabled={selectedEpisode.number === (selectedSeason.episodes?.length || 0)}
             onClick={() => {
               const nextEp = selectedSeason.episodes?.find(ep => ep.number === (selectedEpisode.number + 1));
               if (nextEp) handleEpisodeClick(nextEp);
             }}
             className="px-8 py-2.5 bg-[#121821] hover:bg-black disabled:opacity-30 border border-white/10 rounded text-[11px] font-black text-white uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95"
           >
             Épisode Suivant <ChevronRight size={16} strokeWidth={3} />
           </button>
        </div>

        {selectedEpisode.overview && (
          <div className="mod-box p-6 bg-black/40 border border-white/5 space-y-3">
            <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
              <Info size={14} className="text-[#00A1FA]" /> Résumé de l'épisode
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed italic">{selectedEpisode.overview}</p>
          </div>
        )}

        <AdBanner zone="singleEpisodeBottom" />

        <div className="pt-12 border-t border-white/5 flex justify-center">
          <button 
            onClick={handleBackToSeries}
            className="flex items-center gap-3 text-[11px] font-black text-[#70CCFF] hover:text-white uppercase tracking-[0.3em] transition-all bg-black border-2 border-[#00A1FA]/20 px-8 py-3 rounded-full hover:border-[#00A1FA]/60"
          >
            <ArrowLeft size={16} strokeWidth={3} /> Retour à la fiche série
          </button>
        </div>
      </div>
    );
  }

  const topZoneKey = isManga ? 'singleMangaTop' : isSeries ? 'singleSeriesTop' : 'singleMovieTop';
  const bottomZoneKey = isManga ? 'singleMangaBottom' : isSeries ? 'singleSeriesBottom' : 'singleMovieBottom';

  return (
    <div className="animate-in fade-in duration-700 space-y-12 pb-20 relative">
      <AdBanner zone={topZoneKey} />
      {renderReportModal()}

      {isLightOff && (
        <div 
          className="fixed inset-0 z-[1500] bg-black/95 backdrop-blur-sm transition-opacity duration-500 cursor-pointer"
          onClick={() => setIsLightOff(false)}
        />
      )}

      <div className="relative w-full h-[400px] md:h-[500px] -mt-12 -mx-4 md:mx-0 rounded-b-[40px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-b-2 border-white/5">
         <img src={movie.backdropUrl || movie.posterUrl} className="w-full h-full object-cover opacity-40 scale-105" alt={movie.title} />
         <div className="absolute inset-0 bg-gradient-to-t from-[#010103] via-[#010103]/60 to-transparent"></div>
         <div className="absolute bottom-16 left-8 right-8 md:left-12 md:right-12 flex flex-col items-start gap-4">
            <div className="flex items-center gap-3">
               <span className="bg-[#00A1FA] text-white text-[10px] font-black px-4 py-1 rounded shadow-lg uppercase tracking-widest">
                  {isManga ? 'Manga Scan' : isSeries ? 'Série TV' : 'Film Complet'}
               </span>
               <div className="flex items-center gap-1.5 text-yellow-500 font-black text-sm">
                  <Star size={16} fill="currentColor" />
                  <span>{movie.rating || 'N/A'} / 10</span>
               </div>
            </div>
            <h1 className="text-white font-black text-4xl md:text-7xl uppercase tracking-tighter drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)] leading-none italic futuristic-font text-left">
               {movie.title}
            </h1>
            <div className="flex flex-wrap gap-3 mt-2">
               {!isManga && (
                 <button 
                   onClick={handleWatchTrailer}
                   className="flex items-center gap-3 bg-red-600/30 hover:bg-red-600 text-white text-[11px] font-black px-8 py-3 rounded-full transition-all border border-red-500/20 shadow-xl"
                 >
                   <Youtube size={18} /> REGARDER LA BANDE-ANNONCE
                 </button>
               )}
               <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black px-6 py-3 rounded-full transition-all border border-white/10">
                 <Bookmark size={16} fill="white" /> Ajouter aux favoris
               </button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
        <div className="lg:col-span-8 space-y-12">
           <section className="space-y-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-6">
                <h2 className="text-white font-black text-2xl uppercase tracking-tighter italic border-l-4 border-[#00A1FA] pl-4">Synopsis détaillé</h2>
                {renderLanguageSwitcher()}
             </div>
             <p className="text-slate-400 text-[15px] leading-relaxed text-justify font-medium">
               {movie.description || 'Aucune description disponible.'}
             </p>
           </section>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
             <section className="space-y-3 bg-black/40 p-6 rounded-xl border border-white/5">
               <div className="flex items-center gap-3 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                  <Calendar size={14} /> {isManga ? 'Auteur & Illustrateur' : 'Réalisation & Création'}
               </div>
               <p className="text-[#70CCFF] text-sm font-black uppercase tracking-wide">{movie.director || 'TMDB Production'}</p>
             </section>
             {!isManga && (
               <section className="space-y-3 bg-black/40 p-6 rounded-xl border border-white/5">
                 <div className="flex items-center gap-3 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                    <UserIcon size={14} /> Acteurs Principaux
                 </div>
                 <p className="text-slate-300 text-sm font-bold line-clamp-2">
                   {movie.cast && Array.isArray(movie.cast) && movie.cast.length > 0 ? movie.cast.join(', ') : 'TMDB casting non disponible'}
                 </p>
               </section>
             )}
           </div>

           <section className="space-y-4">
             <h3 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] mb-4">Catégories & Tags</h3>
             <div className="flex flex-wrap gap-2">
               {movie.genre && Array.isArray(movie.genre) && movie.genre.map(g => (
                 <span key={g} className="text-[#70CCFF] text-[10px] font-black hover:text-white cursor-pointer transition-colors bg-[#00A1FA]/5 px-5 py-2 rounded border border-[#00A1FA]/20 uppercase tracking-[0.1em]">
                   {g}
                 </span>
               ))}
             </div>
           </section>

           {isSeries && localMovie.seasons && Array.isArray(localMovie.seasons) && (
             <section className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                   <h2 className="text-white font-black text-3xl uppercase tracking-tighter italic">{isManga ? 'Chapitres en Scan' : 'Épisodes en Streaming'}</h2>
                   <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      {isManga ? <BookOpen size={16} /> : <Monitor size={16} />}
                      {isManga ? 'Lecteur Manga Planet Scan' : 'Lecteur HD Planet Stream'}
                   </div>
                </div>

                <div className="flex flex-col gap-8">
                  {localMovie.seasons.length > 0 && !isManga && (
                    <div className="bg-[#0b0b0d] p-6 rounded-2xl border border-white/5 shadow-2xl space-y-4">
                      <h3 className="text-white font-black text-xs uppercase tracking-widest opacity-60">Sélectionner une Saison</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                         {localMovie.seasons.map((season, idx) => (
                           <div 
                             key={season?.id || idx} 
                             className={`relative group cursor-pointer aspect-[2/3] rounded border-2 transition-all ${selectedSeason?.number === season?.number ? 'border-[#00A1FA] ring-4 ring-[#00A1FA]/20 scale-105' : 'border-white/5 hover:border-white/20'}`}
                             onClick={() => season && setSelectedSeason(season)}
                           >
                              <img src={season?.posterUrl || movie.posterUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt={season?.title || 'Saison'} />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black p-2 text-center">
                                 <h4 className="text-white font-black text-[10px] uppercase truncate">{season?.title || `Saison ${season?.number}`}</h4>
                              </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  )}

                  {loadingEpisodes ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4 bg-black/20 rounded-xl border border-white/5">
                      <Loader2 size={32} className="animate-spin text-[#00A1FA]" />
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Chargement des {isManga ? 'chapitres' : 'épisodes'}...</span>
                    </div>
                  ) : selectedSeason && selectedSeason.episodes && Array.isArray(selectedSeason.episodes) && selectedSeason.episodes.length > 0 ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 bg-black/40 p-8 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-6 bg-[#00A1FA] rounded-full"></div>
                        <h3 className="text-white font-black text-xl uppercase tracking-tighter">
                          Liste des {isManga ? 'Chapitres' : 'Épisodes'} : {selectedSeason.title || `Saison ${selectedSeason.number}`}
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                         {selectedSeason.episodes.map((episode, idx) => (
                           <button 
                             key={episode?.id || idx}
                             onClick={() => episode && handleEpisodeClick(episode)}
                             className="bg-black/80 hover:bg-[#00A1FA] border border-white/10 hover:border-transparent p-3.5 rounded text-[11px] font-black text-slate-300 hover:text-white transition-all text-center uppercase truncate tracking-tighter group flex flex-col items-center gap-1"
                           >
                             <span className="opacity-50 group-hover:opacity-100">{isManga ? 'Chap.' : 'Épisode'}</span>
                             <span className="text-lg leading-none">{episode?.number || (idx + 1)}</span>
                           </button>
                         ))}
                      </div>
                    </div>
                  ) : isSeries && (
                    <div className="p-10 text-center bg-black/20 rounded-xl border border-white/5 italic text-slate-500 text-sm">
                      Aucun {isManga ? 'chapitre' : 'épisode'} disponible pour cette saison.
                    </div>
                  )}
                </div>
             </section>
           )}

           {!isSeries && (
             <section className="space-y-8">
               <h2 className="text-white font-black text-3xl uppercase tracking-tighter italic border-b border-white/10 pb-4">Lecture du Film</h2>
               <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {renderLanguageSwitcher()}
                    <div className="flex-1">
                      <select 
                        className="w-full bg-black border border-white/10 rounded p-2 text-xs text-[#00A1FA] font-bold"
                        value={activeServer}
                        onChange={(e) => { setActiveServer(parseInt(e.target.value)); setIsPlaying(false); }}
                      >
                         {filteredVideos.length > 0 ? filteredVideos.map((v: any, idx: number) => (
                           <option key={idx} value={idx}>{v.label || `LECTEUR ${idx + 1}`}</option>
                         )) : (
                           <option value={0}>AUCUN LECTEUR DISPONIBLE EN {activeLang}</option>
                         )}
                      </select>
                    </div>
                  </div>
                  
                  <div className={`relative transition-all duration-500 ${isLightOff ? 'z-[1600]' : ''} ${isExpanded ? 'md:-mx-20 lg:-mx-40' : ''}`}>
                    {filteredVideos.length > 0 ? (
                      <>
                        <AdBanner zone="singlePlayerTop" className="mb-2" />
                        {renderVideoPlayer()}
                        {renderPlayerActions()}
                        <AdBanner zone="singlePlayerBottom" className="mt-2" />
                      </>
                    ) : (
                      <div className="aspect-video w-full bg-black rounded border border-white/5 flex flex-col items-center justify-center gap-4">
                         <Globe className="text-slate-800" size={64} />
                         <p className="text-slate-600 font-black uppercase text-sm tracking-widest">Film non disponible en {activeLang}</p>
                      </div>
                    )}
                  </div>
               </div>
               <div className="pt-4">
                  <button className="w-full py-6 bg-gradient-to-r from-[#00A1FA] to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black text-xl uppercase tracking-[0.2em] rounded border border-white/10 flex items-center justify-center gap-4 transition-all shadow-2xl shadow-cyan-900/40">
                    <Download size={28} strokeWidth={3} /> TÉLÉCHARGEMENT DIRECT
                  </button>
               </div>
             </section>
           )}
        </div>

        <div className="lg:col-span-4 space-y-12">
           <AdBanner zone="sidebarLeft" />

           <div className="mod-box p-1 overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-2 border-white/5">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                <img src={movie.posterUrl || `https://picsum.photos/seed/${movie.id}/500/750`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" alt={movie.title} />
                <div className="absolute top-4 left-4 bg-[#00A1FA] text-white text-[9px] font-black px-4 py-1.5 rounded shadow-2xl uppercase tracking-[0.2em]">
                   {isManga ? 'Manga Scan' : isSeries ? 'TV Series' : 'Cinéma'}
                </div>
              </div>
              <div className="p-6 space-y-5">
                 {[
                   { label: 'Qualité', value: movie.videoQuality || (isManga ? 'Scan HD' : 'Ultra HD 4K'), color: 'text-green-500 bg-green-500/10 border-green-500/20' },
                   { label: 'Année', value: (movie.year || 2024).toString() },
                   { label: 'Langues', value: localMovie.langue?.join(' / ') || 'Français' },
                   { label: 'Status', value: movie.status || (isSeries ? 'En Cours' : 'Disponible') },
                   { label: isManga ? 'Format' : 'Durée', value: isManga ? 'Manga' : movie.duration || 'N/A' }
                 ].map((item, i) => (
                   <div key={i} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{item.label}</span>
                      <span className={`text-[11px] font-black uppercase ${item.color ? `px-3 py-1 rounded border ${item.color}` : 'text-white'}`}>
                        {item.value}
                      </span>
                   </div>
                 ))}
              </div>
           </div>

           <AdBanner zone="sidebarRight" />

           <div className="space-y-6">
              <h3 className="text-white font-black text-sm uppercase tracking-[0.2em] border-b-2 border-[#00A1FA]/40 pb-4">Titres Similaires</h3>
              <div className="grid grid-cols-2 gap-4">
                {loadingRecs ? (
                  [...Array(4)].map((_, i) => <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded border border-white/10" />)
                ) : recommendations.length > 0 ? recommendations.map(rec => (
                   <div 
                    key={rec.id} 
                    onClick={() => onSelectMovie(rec)}
                    className="group cursor-pointer rounded overflow-hidden border border-white/5 hover:border-[#00A1FA] transition-all bg-black shadow-xl hover:translate-y-[-4px]"
                  >
                     <img src={rec.posterUrl} className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-700" alt={rec.title} />
                     <div className="p-3 bg-gradient-to-b from-black/80 to-black text-center">
                        <p className="text-[10px] font-black uppercase text-slate-400 group-hover:text-[#00A1FA] truncate tracking-tighter transition-colors">{rec.title}</p>
                     </div>
                  </div>
                )) : !loadingRecs && (
                  <div className="col-span-2 text-center text-slate-600 text-[10px] uppercase font-bold py-4 italic">Aucune recommandation</div>
                )}
              </div>
           </div>
        </div>
      </div>

      <AdBanner zone={bottomZoneKey} />

      <div className="flex justify-center pt-20">
         <button 
           onClick={onBack}
           className="px-12 py-4 bg-gradient-to-t from-black to-[#1a1a1c] hover:to-black border border-white/10 rounded-full text-[12px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-[0.4em] flex items-center gap-4 shadow-2xl active:scale-95"
         >
           <ArrowLeft size={20} strokeWidth={3} /> Revenir à l'accueil
         </button>
      </div>
    </div>
  );
};

export default FilmPage;
