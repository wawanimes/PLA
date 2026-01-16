
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Movie, ViewState, Episode } from './types';
import { fetchMovies, searchMovies, getDetailedMovie } from './services/geminiService';
import Header from './components/Header';
import MovieCard from './components/MovieCard';
import FilmPage from './components/FilmPage';
import CatalogueView from './components/CatalogueView';
import PlanningView from './components/PlanningView';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './components/LoginPage';
import UserAuthPage from './components/UserAuthPage';
import LiveAssistant from './components/LiveAssistant';
import LatestEpisodesSlider from './components/LatestEpisodesSlider';
import MovieModal from './components/MovieModal';
import AdBanner from './components/AdBanner';
import { ArrowUp, TrendingUp, Star, AlertTriangle, X, ChevronRight, ChevronLeft, RefreshCcw, Octagon } from 'lucide-react';

const App: React.FC = () => {
  const [addedContent, setAddedContent] = useState<Movie[]>(() => {
    const saved = localStorage.getItem('planet_streaming_content');
    return saved ? JSON.parse(saved) : [];
  });

  const [state, setState] = useState<AppState>({
    view: 'home',
    selectedGenre: null,
    selectedType: 'Anime', // Default to Anime as per screenshot
    selectedLanguage: null,
    selectedMovie: null,
    searchQuery: '',
    isLoading: true,
    movies: []
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewMovie, setPreviewMovie] = useState<Movie | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [activeTab, setActiveTab] = useState<'top' | 'boxoffice' | 'awaited'>('top');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // AdBlock State
  const [isAdBlockDetected, setIsAdBlockDetected] = useState(false);
  const [adBlockConfig, setAdBlockConfig] = useState(() => {
    const saved = localStorage.getItem('planet_streaming_adblock');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      message: '👮Veuillez désactiver AdBlock pour nous soutenir ! 🥳',
      bgColor: '#1e3a8a',
      sticker: 'Cute Cat'
    };
  });

  useEffect(() => {
    localStorage.setItem('planet_streaming_content', JSON.stringify(addedContent));
  }, [addedContent]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleQuota = () => setShowQuotaWarning(true);
    window.addEventListener('gemini-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gemini-quota-exceeded', handleQuota);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'admin' || params.get('admin') === 'true') {
      setState(prev => ({ ...prev, view: 'admin', isLoading: false }));
    }
  }, []);

  // AdBlock Detection Logic
  useEffect(() => {
    if (adBlockConfig.enabled) {
      const detectAdBlock = () => {
        const bait = document.createElement('div');
        bait.setAttribute('class', 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd ads-box ad-unit ad-search ad-layer ad-label ads-place adsplace');
        bait.setAttribute('style', 'width: 1px !important; height: 1px !important; position: absolute !important; left: -10000px !important; top: -1000px !important;');
        document.body.appendChild(bait);
        
        window.setTimeout(() => {
          const isBlocked = bait.offsetParent === null || bait.offsetHeight === 0 || bait.offsetLeft === 0 || bait.offsetTop === 0 || bait.offsetWidth === 0 || bait.clientHeight === 0 || bait.clientWidth === 0;
          
          let isStyleBlocked = false;
          if (window.getComputedStyle !== undefined) {
            const baitTemp = window.getComputedStyle(bait, null);
            if (baitTemp && (baitTemp.getPropertyValue('display') === 'none' || baitTemp.getPropertyValue('visibility') === 'hidden')) {
              isStyleBlocked = true;
            }
          }
          
          if (isBlocked || isStyleBlocked) {
            setIsAdBlockDetected(true);
          }
          document.body.removeChild(bait);
        }, 100);
      };
      
      detectAdBlock();
    }
  }, [adBlockConfig.enabled]);

  const loadInitialData = useCallback(async (view: ViewState = 'home', page: number = 1) => {
    if (view === 'admin' || view === 'login' || view === 'details') {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      if ((view as string) === 'planning') {
        setState(prev => ({ 
          ...prev, 
          movies: addedContent.filter(m => m.inPlanningPage), 
          isLoading: false 
        }));
        return;
      }

      let mainQuery = state.searchQuery || state.selectedGenre || "trending movies 2024";
      let trendingQuery = "box office hits all time";
      
      if (view === 'home-series') {
        mainQuery = "séries tv populaires 2024 streaming";
        trendingQuery = "top rated tv series tmdb";
      } else if (view === 'home-movies') {
        mainQuery = "films populaires cinema 2024";
        trendingQuery = "trending movie box office";
      } else if (view === 'home-manga') {
        mainQuery = "manga popular scans 2024";
        trendingQuery = "top manga mal";
      } else if (view === 'catalogue') {
        const typeQuery = state.selectedType ? `${state.selectedType} ` : "";
        const genreQuery = state.selectedGenre ? `${state.selectedGenre} ` : "";
        const langQuery = state.selectedLanguage ? `${state.selectedLanguage} ` : "";
        mainQuery = `${typeQuery}${genreQuery}${langQuery}`.trim() || "trending content catalog";
      }

      const latest = (state.searchQuery || state.selectedGenre) 
        ? await searchMovies(mainQuery, page)
        : await fetchMovies(mainQuery, view === 'catalogue' ? 24 : 16, page);
      
      const pinnedItems = addedContent.filter(m => m.isPinned);
      const otherManagedItems = addedContent.filter(m => !m.isPinned);
      
      let processedResults = [...pinnedItems, ...otherManagedItems];
      
      const remoteItems = latest.filter(item => 
        !processedResults.some(p => p.tmdbId === item.tmdbId || p.id === item.id)
      );
      
      processedResults = [...processedResults, ...remoteItems];
      
      const uniqueResults: Movie[] = [];
      const seenIds = new Set();
      processedResults.forEach(m => {
        if (!m) return;
        const id = (m.tmdbId || m.id || '').toString();
        if (id && !seenIds.has(id)) {
          uniqueResults.push(m);
          seenIds.add(id);
        }
      });

      let filteredResults = uniqueResults.filter(m => {
         const localData = addedContent.find(a => a.id === m.id || (a.tmdbId && a.tmdbId === m.tmdbId));
         if (localData) {
            if (localData.inPlanningPage && 
                !localData.isPinned && 
                !localData.showInLatestEpisodes && 
                !localData.isTodayHighlight && 
                !localData.isRecentAddition) {
              return false;
            }
         }
         return true;
      });

      if (state.selectedType) {
        filteredResults = filteredResults.filter(m => {
          if (state.selectedType === 'Anime') return m.type === 'series' || m.type === 'anime';
          if (state.selectedType === 'Scans') return m.type === 'manga';
          if (state.selectedType === 'Film') return m.type === 'movie';
          return true;
        });
      }

      if (state.selectedLanguage) {
        filteredResults = filteredResults.filter(m => 
          m.langue?.includes(state.selectedLanguage!) || (!m.langue && state.selectedLanguage === 'VOSTFR')
        );
      }

      setState(prev => ({ 
        ...prev, 
        movies: filteredResults, 
        isLoading: false 
      }));

      if (view === 'home' && page === 1) {
        const publicPinned = pinnedItems.filter(m => m.isPinned);
        if (publicPinned.length >= 5) {
          setTopMovies(publicPinned.slice(0, 5));
        } else {
          fetchMovies(trendingQuery, 5).then(trending => {
            const combinedTop = [...publicPinned, ...trending].slice(0, 5);
            setTopMovies(combinedTop);
          }).catch(e => console.error("Secondary fetch failed:", e));
        }
      }

    } catch (error) {
      console.error("Failed to load content:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [addedContent, state.searchQuery, state.selectedGenre, state.selectedType, state.selectedLanguage]);

  useEffect(() => {
    if (state.view !== 'admin' && state.view !== 'login' && state.view !== 'details') {
      loadInitialData(state.view, currentPage);
    }
  }, [loadInitialData, state.view, currentPage]);

  const handleSearch = (query: string) => {
    setCurrentPage(1);
    setState(prev => ({ 
      ...prev, 
      searchQuery: query, 
      selectedGenre: null, 
      selectedType: null,
      selectedLanguage: null,
      view: query ? 'search' : 'catalogue' 
    }));
  };

  const handleGenreSelect = (genre: string) => {
    setCurrentPage(1);
    setState(prev => ({ 
      ...prev, 
      selectedGenre: prev.selectedGenre === genre ? null : genre, 
      searchQuery: '',
      view: 'genre' 
    }));
  };

  const handleTypeSelect = (type: string) => {
    setCurrentPage(1);
    setState(prev => ({ 
      ...prev, 
      selectedType: prev.selectedType === type ? null : type,
      view: 'catalogue'
    }));
  };

  const handleLanguageSelect = (lang: string) => {
    setCurrentPage(1);
    setState(prev => ({ 
      ...prev, 
      selectedLanguage: prev.selectedLanguage === lang ? null : lang,
      view: 'catalogue'
    }));
  };

  const navigateTo = (view: ViewState) => {
    setCurrentPage(1);
    setState(prev => ({ 
      ...prev, 
      view, 
      selectedGenre: null, 
      selectedType: view === 'home-movies' ? 'Film' : view === 'home-manga' ? 'Scans' : view === 'home-series' ? 'Anime' : null,
      selectedLanguage: null,
      searchQuery: '', 
      selectedMovie: null,
      isLoading: !['admin', 'login', 'details'].includes(view) 
    }));
    window.scrollTo(0, 0);
  };

  const handleAddContent = (item: Movie) => {
    setAddedContent(prev => {
      const existingIdx = prev.findIndex(m => m.tmdbId === item.tmdbId || m.id === item.id);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], ...item };
        return next;
      }
      return [item, ...prev];
    });
  };

  const handleRemoveContent = (id: string) => {
    setAddedContent(prev => prev.filter(m => m.tmdbId !== id && m.id !== id));
  };

  const openMovieDetails = async (movie: Movie) => {
    if (!movie) return;
    setIsPreviewOpen(false);
    const localMovie = addedContent.find(m => m.tmdbId === movie.tmdbId || m.id === movie.id);
    if (localMovie && localMovie.seasons && localMovie.seasons.some(s => s.episodes.length > 0)) {
      setState(prev => ({ ...prev, view: 'details', selectedMovie: localMovie, isLoading: false }));
      window.scrollTo(0, 0);
      return;
    }
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const detailed = await getDetailedMovie(movie);
      const merged = localMovie ? { ...detailed, ...localMovie, seasons: localMovie.seasons || detailed.seasons } : detailed;
      setState(prev => ({ ...prev, view: 'details', selectedMovie: merged, isLoading: false }));
      window.scrollTo(0, 0);
    } catch (e) {
      console.error("Failed to load details:", e);
      setState(prev => ({ ...prev, view: 'details', selectedMovie: movie, isLoading: false }));
    }
  };

  const openMoviePreview = (movie: Movie) => {
    setPreviewMovie(movie);
    setIsPreviewOpen(true);
  };

  const goBackHome = () => {
    setState(prev => ({ ...prev, view: 'home', selectedMovie: null }));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogin = (user: string, pass: string) => {
    if (user.length > 3 && pass.length > 3) setIsAdminAuthenticated(true);
    else alert("Identifiants incorrects.");
  };

  const handleUserLogin = (userData: any) => {
    setIsUserAuthenticated(true);
    setUserProfile(userData);
    navigateTo('home');
  };

  const renderAdBlockModal = () => {
    if (!isAdBlockDetected) return null;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
        <div className="relative w-full max-w-lg bg-black border-[3px] border-[#ff4d4d] rounded-[24px] p-10 shadow-[0_0_40px_rgba(255,77,77,0.4)] flex flex-col items-center text-center space-y-6">
          <div className="flex items-center gap-4">
             <h2 className="text-[#ff4d4d] font-black text-2xl md:text-3xl uppercase tracking-tighter italic futuristic-font">
               AD BLOCK DETECTED!
             </h2>
             <div className="w-10 h-10 bg-[#ff4d4d] rounded-lg border border-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                <Octagon fill="white" size={24} className="text-[#ff4d4d]" />
             </div>
          </div>

          <p className="text-white text-base md:text-lg font-bold leading-relaxed tracking-tight max-w-sm">
            {adBlockConfig.message}
          </p>

          <div className="animate-bounce">
             <span className="text-red-500 text-2xl drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">❤️✨</span>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full max-w-[280px] bg-gradient-to-r from-[#ff7e7e] to-[#ff4d4d] hover:to-[#ff2d2d] py-5 rounded-full text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 border border-white/20 group"
          >
             <div className="bg-[#00A1FA] p-1.5 rounded-sm">
               <RefreshCcw size={16} className="text-white group-hover:rotate-180 transition-transform duration-500" />
             </div>
             REFRESH PAGE
          </button>
        </div>
      </div>
    );
  };

  const isHomeView = ['home', 'home-movies', 'home-series', 'home-manga'].includes(state.view);
  const isCatalogueHubView = ['catalogue', 'search', 'genre'].includes(state.view);

  if (state.view === 'login') {
    return (
      <div className="min-h-screen bg-[#010103]">
        <UserAuthPage onLoginSuccess={handleUserLogin} onBack={() => navigateTo('home')} />
      </div>
    );
  }

  if (state.view === 'admin') {
    if (!isAdminAuthenticated) return <LoginPage onLogin={handleAdminLogin} onBack={() => navigateTo('home')} />;
    return (
      <div className="min-h-screen bg-[#010103] p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-white font-black text-xl uppercase tracking-tighter italic">Internal Admin Panel</h1>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsAdminAuthenticated(false)} className="text-xs font-bold text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors">Logout</button>
              <button onClick={() => navigateTo('home')} className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Back to Website</button>
            </div>
          </div>
          <AdminDashboard onAddContent={handleAddContent} onRemoveContent={handleRemoveContent} addedContent={addedContent} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header onSearch={handleSearch} onNavigate={navigateTo} onGenreSelect={handleGenreSelect} isLoggedIn={isUserAuthenticated} />
      
      <div className="py-4">
        <AdBanner zone="headerBottom" />
      </div>

      <main className="max-w-[1000px] mx-auto px-4 py-8">
        {state.view === 'details' && state.selectedMovie ? (
          <FilmPage movie={state.selectedMovie} onBack={goBackHome} onSelectMovie={openMovieDetails} />
        ) : isCatalogueHubView ? (
          <CatalogueView 
            movies={state.movies} 
            isLoading={state.isLoading} 
            onSelectMovie={openMovieDetails} 
            onSearch={handleSearch} 
            onFilterChange={handleGenreSelect}
            onTypeChange={handleTypeSelect}
            onLanguageChange={handleLanguageSelect}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            activeFilters={{
              type: state.selectedType || '',
              langue: state.selectedLanguage || '',
              genre: state.selectedGenre || ''
            }}
          />
        ) : (state.view as string) === 'planning' ? (
          <PlanningView movies={state.movies} isLoading={state.isLoading} onSelectMovie={openMovieDetails} />
        ) : (
          <div className="space-y-12 animate-in fade-in duration-700">
            <LiveAssistant onSearchResult={handleSearch} />
            <div className="animate-in slide-in-from-top-6 duration-700">
               <LatestEpisodesSlider movies={addedContent} onSelectEpisode={(m) => openMovieDetails(m)} />
            </div>

            <AdBanner zone="topList" />

            <div className="space-y-0">
              <div className="flex justify-center mb-[-2px] relative z-10">
                <button onClick={() => setActiveTab('top')} className={`tab-btn ${activeTab === 'top' ? 'active' : ''}`}>
                  {state.view === 'home-manga' ? 'LES TOPS SCANS' : 'LES TOPS SÉRIES'}
                </button>
                <button onClick={() => setActiveTab('boxoffice')} className={`tab-btn ${activeTab === 'boxoffice' ? 'active' : ''}`}>
                  {state.view === 'home-manga' ? 'MANGA ATTENDUES' : 'BOX OFFICE'}
                </button>
              </div>
              <div className="bg-[#0c0c0e] p-4 rounded-sm border-2 border-[#00A1FA]/30 shadow-[0_15px_40px_rgba(0,161,250,1)]">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {(state.isLoading || topMovies.length === 0 ? [...Array(5)] : topMovies).map((movie, i) => (
                    movie ? (
                      <MovieCard key={`top-${(movie.tmdbId || movie.id || i).toString()}`} movie={movie} onClick={openMovieDetails} variant="top" />
                    ) : (
                      <div key={i} className="aspect-[2/3] bg-black/40 animate-pulse border border-white/5" />
                    )
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                {state.movies.length > 0 ? (
                  state.movies.map((movie, idx) => (
                    <MovieCard key={(movie.tmdbId || movie.id || idx).toString()} movie={movie} onClick={openMovieDetails} />
                  ))
                ) : !state.isLoading && (
                  <div className="col-span-full py-32 text-center text-slate-600 italic uppercase font-black tracking-[0.4em]">Aucun contenu trouvé.</div>
                )}
              </div>

              <AdBanner zone="bottomList" />
              
              <div className="navigation flex justify-center py-12 gap-3 items-center flex-wrap">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-2 bg-[#121214] border border-white/10 px-5 py-2.5 rounded-lg text-[13px] font-bold text-slate-300 hover:text-white hover:bg-black transition-all group disabled:opacity-20 disabled:cursor-not-allowed"><ChevronLeft size={16} className="text-[#00A1FA]" /> Prev</button>
                <button onClick={() => setCurrentPage(p => p + 1)} className="flex items-center gap-2 bg-[#121214] border border-white/10 px-5 py-2.5 rounded-lg text-[13px] font-bold text-slate-300 hover:text-white hover:bg-black transition-all group">Next <ChevronRight size={16} className="text-[#00A1FA]" /></button>
              </div>
            </div>
          </div>
        )}
      </main>

      <MovieModal movie={previewMovie} isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} onFullDetails={openMovieDetails} />

      {renderAdBlockModal()}

      <footer className="w-full bg-[#080808] border-t-2 border-white/10 pt-20 pb-12 mt-20 relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00A1FA]/50 to-transparent"></div>
        <div className="max-w-[1000px] mx-auto px-4">
          <p className="text-[10px] text-slate-700 uppercase tracking-[0.6em] mb-4">PLANET STREAMING &copy; 2016 - 2025</p>
          <button onClick={scrollToTop} className="group p-3 hover:translate-y-[-5px] transition-transform duration-500">
            <div className="bg-gradient-to-t from-black to-[#222] p-4 rounded-full border-2 border-[#00A1FA]/40">
              <ArrowUp size={24} className="text-[#00A1FA] group-hover:animate-bounce" />
            </div>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
