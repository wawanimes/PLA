
import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Video, 
  Film, 
  Grid, 
  User, 
  PlusSquare, 
  Key, 
  Search as SearchIcon, 
  Tv, 
  Book, 
  Layers, 
  Calendar, 
  CircleHelp, 
  CircleUser,
  ChevronDown,
  Menu,
  X,
  ChevronRight,
  ArrowRight,
  Shield,
  Zap,
  BookOpen
} from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
  onNavigate: (view: any) => void;
  onGenreSelect: (genre: string) => void;
  isLoggedIn?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onNavigate, onGenreSelect, isLoggedIn = false }) => {
  const [searchValue, setSearchValue] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasCustomKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasCustomKey(true);
      window.location.reload(); // Reload to ensure services use the new key
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue);
      setIsMobileMenuOpen(false);
    }
  };

  const handleGenreClick = (e: React.MouseEvent, genre: string) => {
    e.preventDefault();
    onGenreSelect(genre);
    setIsMobileMenuOpen(false);
  };

  const navItemClass = "flex items-center px-3 h-full text-[12px] font-bold uppercase cursor-pointer transition-all";
  const dropdownContainerClass = "absolute top-full left-0 hidden group-hover:block z-[100] bg-[#1a242f]/95 border border-white/10 shadow-2xl min-w-[200px] py-1 animate-in fade-in slide-in-from-top-1 duration-200";
  const dropdownItemClass = "block w-full text-left px-4 py-2.5 text-[11px] font-bold text-[#70ccff] hover:text-white hover:bg-[#253444] border-b border-white/5 last:border-0 transition-colors uppercase tracking-tight";

  const mobileLinkClass = "flex items-center justify-between w-full px-5 py-4 text-[13px] font-bold uppercase text-slate-300 hover:text-cyan-400 hover:bg-white/5 border-b border-white/5 transition-all";

  return (
    <div id="nav" className="w-full relative">
      {/* Top Menu Wrapper */}
      <div className="bg-black border-b border-white/5 min-h-[50px] shadow-2xl relative z-[70] flex items-center">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center px-4 py-2">
          
          {/* Mobile Menu Toggle (Android Style) & Admin Access */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-cyan-400 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            {/* API Key Selection Button - Fixes Quota Issues */}
            <button 
              onClick={handleSelectKey}
              className={`p-2 transition-all flex items-center gap-2 group relative ${hasCustomKey ? 'text-green-500' : 'text-slate-500 hover:text-yellow-400'}`}
              title={hasCustomKey ? "Clé API Personnalisée Activée" : "Utiliser votre propre clé API (GCP Paid Project)"}
            >
              <div className={`p-1 rounded bg-white/5 border ${hasCustomKey ? 'border-green-500/50' : 'border-white/5 group-hover:border-yellow-500/50'}`}>
                <Zap size={14} className={`${hasCustomKey ? 'fill-green-500' : 'group-hover:rotate-12'} transition-transform`} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block opacity-60 group-hover:opacity-100">
                {hasCustomKey ? 'API Active' : 'Quota Bypass'}
              </span>
            </button>
          </div>

          {/* Left Side: Navigation (Hidden on Mobile) */}
          <ul id="top-menu" className="hidden md:flex items-center h-full">
            <li className="h-full border-r border-white/5">
              <button onClick={() => onNavigate('home')} className="flex items-center px-4 h-[40px] text-cyan-400 hover:text-white transition-colors">
                <Home size={18} />
              </button>
            </li>

            {/* SÉRIES TV Dropdown */}
            <li className="relative group h-full border-r border-white/5">
              <a href="#" className={`${navItemClass} text-yellow-400`} onClick={(e) => { e.preventDefault(); onNavigate('home-series'); }}>
                <Video size={14} className="mr-2" />
                <span>Séries TV</span>
                <ChevronDown size={12} className="ml-1 opacity-50" />
              </a>
              <div className={dropdownContainerClass}>
                <button onClick={(e) => handleGenreClick(e, 'Séries VF')} className={dropdownItemClass}>Séries VF</button>
                <button onClick={(e) => handleGenreClick(e, 'Séries VOSTFR')} className={dropdownItemClass}>Séries VOSTFR</button>
                <button onClick={(e) => handleGenreClick(e, 'Top Séries')} className={`${dropdownItemClass} !text-white`}>Top Séries</button>
                <button onClick={(e) => handleGenreClick(e, 'Saisons Complètes')} className={`${dropdownItemClass} !text-white`}>Saisons Complètes</button>
              </div>
            </li>

            {/* MANGA Dropdown */}
            <li className="relative group h-full border-r border-white/5">
              <a href="#" className={`${navItemClass} text-purple-400`} onClick={(e) => { e.preventDefault(); onNavigate('home-manga'); }}>
                <BookOpen size={14} className="mr-2" />
                <span>Manga</span>
                <ChevronDown size={12} className="ml-1 opacity-50" />
              </a>
              <div className={dropdownContainerClass}>
                <button onClick={(e) => handleGenreClick(e, 'Derniers Scans')} className={dropdownItemClass}>Derniers Scans</button>
                <button onClick={(e) => handleGenreClick(e, 'Manga Populaire')} className={dropdownItemClass}>Manga Populaire</button>
                <button onClick={(e) => handleGenreClick(e, 'Anime Scan')} className={dropdownItemClass}>Anime Scan</button>
              </div>
            </li>

            {/* FILMS Dropdown */}
            <li className="relative group h-full border-r border-white/5">
              <a href="#" className={`${navItemClass} text-slate-300`} onClick={(e) => { e.preventDefault(); onNavigate('home-movies'); }}>
                <Film size={14} className="mr-2" />
                <span>Films</span>
                <ChevronDown size={12} className="ml-1 opacity-50" />
              </a>
              <div className={dropdownContainerClass}>
                <button onClick={(e) => handleGenreClick(e, 'Top Films Exclus')} className={dropdownItemClass}>Top Films Exclus</button>
                <button onClick={(e) => handleGenreClick(e, 'Box Office')} className={dropdownItemClass}>Box Office</button>
                <button onClick={(e) => handleGenreClick(e, 'Tous')} className={dropdownItemClass}>Tous</button>
              </div>
            </li>

            {/* CATALOGUE Mega-Menu */}
            <li className="relative group h-full border-r border-white/5">
              <a href="#" className={`${navItemClass} text-cyan-400`} onClick={(e) => { e.preventDefault(); onNavigate('catalogue'); }}>
                <Layers size={14} className="mr-2" />
                <span>Catalogue</span>
                <ChevronDown size={12} className="ml-1 opacity-50" />
              </a>
              <div className="absolute top-full left-0 hidden group-hover:flex z-[100] bg-[#1a242f]/95 border border-white/10 shadow-2xl min-w-[700px] p-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="grid grid-cols-4 w-full divide-x divide-white/5">
                  <div className="flex flex-col">
                    <button className={`${dropdownItemClass} !text-white opacity-50 cursor-default border-b-2 border-cyan-500/30`}>FILM EN HD/HQ</button>
                    <button onClick={(e) => handleGenreClick(e, 'Action')} className={dropdownItemClass}>Action</button>
                    <button onClick={(e) => handleGenreClick(e, 'Aventure')} className={dropdownItemClass}>Aventure</button>
                    <button onClick={(e) => handleGenreClick(e, 'Animation-Jeunesse')} className={dropdownItemClass}>Animation-Jeunesse</button>
                    <button onClick={(e) => handleGenreClick(e, 'Arts Martiaux')} className={dropdownItemClass}>Arts Martiaux</button>
                  </div>
                  <div className="flex flex-col">
                    <button onClick={(e) => handleGenreClick(e, 'Biopic')} className={dropdownItemClass}>Biopic</button>
                    <button onClick={(e) => handleGenreClick(e, 'Comédie')} className={dropdownItemClass}>Comédie</button>
                    <button onClick={(e) => handleGenreClick(e, 'Comédie Dramatique')} className={dropdownItemClass}>Comédie Dramatique</button>
                    <button onClick={(e) => handleGenreClick(e, 'Comédie Musicale')} className={dropdownItemClass}>Comédie Musicale</button>
                    <button onClick={(e) => handleGenreClick(e, 'Drame')} className={dropdownItemClass}>Drame</button>
                    <button onClick={(e) => handleGenreClick(e, 'Documentaire')} className={dropdownItemClass}>Documentaire</button>
                  </div>
                  <div className="flex flex-col">
                    <button onClick={(e) => handleGenreClick(e, 'Epouvante-horreur')} className={dropdownItemClass}>Epouvante-horreur</button>
                    <button onClick={(e) => handleGenreClick(e, 'Famille')} className={dropdownItemClass}>Famille</button>
                    <button onClick={(e) => handleGenreClick(e, 'Fantastique')} className={dropdownItemClass}>Fantastique</button>
                    <button onClick={(e) => handleGenreClick(e, 'Guerre')} className={dropdownItemClass}>Guerre</button>
                    <button onClick={(e) => handleGenreClick(e, 'Policier')} className={dropdownItemClass}>Policier</button>
                  </div>
                  <div className="flex flex-col">
                    <button onClick={(e) => handleGenreClick(e, 'Historique')} className={dropdownItemClass}>Historique</button>
                    <button onClick={(e) => handleGenreClick(e, 'Musical')} className={dropdownItemClass}>Musical</button>
                    <button onClick={(e) => handleGenreClick(e, 'Romance')} className={dropdownItemClass}>Romance</button>
                    <button onClick={(e) => handleGenreClick(e, 'Science fiction')} className={dropdownItemClass}>Science fiction</button>
                    <button onClick={(e) => handleGenreClick(e, 'Thriller')} className={dropdownItemClass}>Thriller</button>
                    <button onClick={(e) => handleGenreClick(e, 'Western')} className={dropdownItemClass}>Western</button>
                  </div>
                </div>
              </div>
            </li>

            {/* ADMIN Link (Requested icon admin pag) */}
            <li className="h-full border-r border-white/5">
              <button onClick={() => onNavigate('admin')} className={`${navItemClass} text-slate-500 hover:text-white`}>
                <Shield size={14} className="mr-2" />
                <span>Admin</span>
              </button>
            </li>
          </ul>

          {/* Right Side: Search & User */}
          <div className="flex items-center gap-4">
            <form onSubmit={handleSubmit} className="relative hidden sm:block">
              <div className="flex items-center bg-[#0d1117] border border-white/10 rounded-lg px-3 py-1.5 w-64 focus-within:border-cyan-500/50 transition-all">
                <SearchIcon size={16} className="text-cyan-600 mr-2" strokeWidth={3} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="bg-transparent border-none text-[13px] text-slate-300 placeholder:text-slate-500 focus:outline-none w-full font-medium"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
            </form>

            <nav className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate('planning')}
                className="hidden lg:flex items-center gap-2 text-white hover:text-cyan-400 transition-colors text-[13px] font-bold"
              >
                <Calendar size={18} />
                Planning
              </button>

              {isLoggedIn ? (
                <button 
                  onClick={() => onNavigate('login')}
                  className="flex items-center gap-2 text-white hover:text-cyan-400 transition-colors text-[13px] font-bold"
                >
                  <CircleUser size={22} className="text-cyan-400" />
                  <span className="hidden md:inline">Profil</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onNavigate('login')}
                    className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    Sign in
                  </button>
                  <button 
                    onClick={() => onNavigate('login')}
                    className="bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-lg shadow-purple-900/10 active:scale-[0.98]"
                  >
                    Sign up <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Android Style Mobile Drawer (DLE Starter Style) */}
      <div className={`fixed inset-0 z-[999] transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
        
        {/* Sidebar Drawer */}
        <div className={`absolute top-0 left-0 h-full w-[280px] bg-[#0d1117] shadow-2xl border-r border-cyan-500/20 transform transition-transform duration-300 ease-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-5 border-b border-white/5 bg-black/40 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-cyan-400 text-[10px] font-black tracking-widest uppercase">Navigation</span>
              <span className="text-white futuristic-font text-lg font-black italic tracking-tighter">PLANET STREAM</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <nav className="flex flex-col">
              <button onClick={() => { onNavigate('home'); setIsMobileMenuOpen(false); }} className={mobileLinkClass}>
                <div className="flex items-center gap-3"><Home size={18} /> Accueil</div>
                <ChevronRight size={14} className="opacity-30" />
              </button>
              
              <button onClick={() => { onNavigate('home-series'); setIsMobileMenuOpen(false); }} className={mobileLinkClass}>
                <div className="flex items-center gap-3"><Video size={18} className="text-yellow-400" /> Séries TV</div>
                <ChevronRight size={14} className="opacity-30" />
              </button>

              <button onClick={() => { onNavigate('home-manga'); setIsMobileMenuOpen(false); }} className={mobileLinkClass}>
                <div className="flex items-center gap-3"><BookOpen size={18} className="text-purple-400" /> Manga Scan</div>
                <ChevronRight size={14} className="opacity-30" />
              </button>

              <button onClick={() => { onNavigate('home-movies'); setIsMobileMenuOpen(false); }} className={mobileLinkClass}>
                <div className="flex items-center gap-3"><Film size={18} className="text-slate-400" /> Films</div>
                <ChevronRight size={14} className="opacity-30" />
              </button>

              <button onClick={() => { onNavigate('catalogue'); setIsMobileMenuOpen(false); }} className={mobileLinkClass}>
                <div className="flex items-center gap-3"><Layers size={18} className="text-cyan-400" /> Catalogue</div>
                <ChevronRight size={14} className="opacity-30" />
              </button>

              <button onClick={() => { onNavigate('planning'); setIsMobileMenuOpen(false); }} className={mobileLinkClass}>
                <div className="flex items-center gap-3"><Calendar size={18} /> Planning</div>
                <ChevronRight size={14} className="opacity-30" />
              </button>

              <button onClick={() => { onNavigate('admin'); setIsMobileMenuOpen(false); }} className={`${mobileLinkClass} bg-slate-900/50`}>
                <div className="flex items-center gap-3 text-cyan-600"><Shield size={18} /> Admin Panel</div>
                <ChevronRight size={14} className="opacity-30" />
              </button>
            </nav>

            <div className="p-5 mt-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Recherche Rapide</h4>
              <form onSubmit={handleSubmit}>
                <div className="flex items-center bg-black border border-white/10 rounded px-3 py-2">
                  <input 
                    type="text" 
                    placeholder="Titre..."
                    className="bg-transparent border-none text-[12px] text-white focus:outline-none w-full font-bold uppercase"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                  <SearchIcon size={14} className="text-cyan-500" />
                </div>
              </form>
            </div>
          </div>

          <div className="p-5 border-t border-white/5 bg-black/20">
            <p className="text-[9px] text-slate-600 font-bold uppercase text-center tracking-widest">
              Planet Streaming &copy; 2016
            </p>
          </div>
        </div>
      </div>

      {/* Main Branding Strip */}
      <div className="w-full relative h-32 flex items-center justify-center metallic-panel shadow-[0_15px_30px_rgba(0,0,0,0.9)] overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]"></div>
        
        <div className="relative flex items-center justify-center gap-16 md:gap-32 w-full max-w-5xl px-4">
          <h1 className="futuristic-font chrome-text text-3xl md:text-5xl italic select-none tracking-tighter">
            STREAMING
          </h1>

          <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
             <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full"></div>
             <div className="relative w-full h-full rounded-full bg-gradient-to-b from-cyan-400 to-blue-800 p-[2px] orb-glow ring-4 ring-black/40">
                <div className="w-full h-full rounded-full bg-black flex flex-col items-center justify-center border border-white/10 overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                   <div className="text-[8px] text-cyan-400 font-bold tracking-[0.2em] -mb-1">PLANET</div>
                   <div className="text-lg text-white font-black italic tracking-tighter futuristic-font">STREAM</div>
                   <div className="absolute bottom-4 w-full h-[1px] bg-cyan-400/50 shadow-[0_0_10px_cyan]"></div>
                </div>
             </div>
          </div>

          <h1 className="futuristic-font chrome-text text-3xl md:text-5xl italic select-none tracking-tighter">
            ILLIMITÉS
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Header;
