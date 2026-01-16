
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Movie, Episode, Season, Link, PlanningEntry, Genre, Page, SliderConfig } from '../types';
import { fetchSeasonEpisodes, getDetailedMovie } from '../services/geminiService';
import { 
  LayoutDashboard, 
  Tv, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Settings, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Upload, 
  X, 
  Shield, 
  Menu as MenuIcon, 
  PlaySquare, 
  Check, 
  Loader2, 
  Eye, 
  Film, 
  Database, 
  PlusSquare, 
  Command, 
  ListFilter, 
  Radio, 
  Settings2, 
  Users, 
  DollarSign, 
  Megaphone, 
  Wrench, 
  Pin, 
  CloudUpload, 
  CheckCircle2, 
  ImageIcon, 
  RefreshCw, 
  Info, 
  Link as LinkIcon, 
  Play as PlayIcon, 
  Layers, 
  ExternalLink, 
  Save,
  Video,
  Globe,
  BarChart3,
  Languages,
  Monitor,
  Download,
  FileVideo,
  Layout,
  LayoutGrid,
  FileText,
  Clock as ClockIcon,
  Calendar,
  Layers as LayersIcon,
  Sparkles,
  ChevronUp,
  BookOpen,
  Image as LucideImage,
  Wand2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Smartphone,
  Tablet,
  Cpu,
  History,
  MousePointer2,
  Star,
  User,
  AppWindow,
  Palette,
  Bell,
  Code,
  FileCode,
  SlidersHorizontal,
  FilePlus,
  ArrowUpDown,
  Settings as GearIcon,
  Zap,
  Globe2,
  Link2,
  PieChart,
  HardDrive,
  MessageSquare,
  Flower2,
  ShieldAlert,
  Copy,
  ToggleLeft,
  ToggleRight,
  Ban,
  Activity as PulseIcon,
  MousePointer,
  Server,
  Navigation
} from 'lucide-react';

type AdminSubView = 'dashboard' | 'movies' | 'tv-shows' | 'episodes' | 'tools' | 'manga' | 'statistics' | 'genres' | 'permalink-settings' | 'settings-general' | 'settings-seo' | 'settings-sitemap' | 'settings-slider' | 'settings-page' | 'ads' | 'adblock';
type EditorMode = 'list' | 'editor';
type EditTab = 'Overview' | 'Season' | 'Episodes' | 'Video' | 'People' | 'Subtitle' | 'Advanced';

const TMDB_API_KEY = '67f72af3decc8346e0493120f89e5988';

const AVAILABLE_LANGUAGES = [
  { id: 'VOSTFR', label: 'VO', flag: 'jp' },
  { id: 'VF', label: 'VF', flag: 'fr' },
  { id: 'VA', label: 'VA', flag: 'en' },
  { id: 'VAR', label: 'VAR', flag: 'ar' },
  { id: 'VKR', label: 'VKR', flag: 'kr' },
  { id: 'VCN', label: 'VCN', flag: 'cn' },
  { id: 'VQC', label: 'VQC', flag: 'qc' },
];

const WEEK_DAYS = [
  { name: "Dimanche", id: 0, label: "Sunday" },
  { name: "Lundi", id: 1, label: "Monday" },
  { name: "Mardi", id: 2, label: "Tuesday" },
  { name: "Mercredi", id: 3, label: "Wednesday" },
  { name: "Jeudi", id: 4, label: "Thursday" },
  { name: "Vendredi", id: 5, label: "Friday" },
  { name: "Samedi", id: 6, label: "Saturday" }
];

const MONTHS = [
  { name: "Janvier", id: 0 },
  { name: "Février", id: 1 },
  { name: "Mars", id: 2 },
  { name: "Avril", id: 3 },
  { name: "Mai", id: 4 },
  { name: "JUIN", id: 5 },
  { name: "JUILLET", id: 6 },
  { name: "AOÛT", id: 7 },
  { name: "SEPTEMBRE", id: 8 },
  { name: "OCTOBRE", id: 9 },
  { name: "NOVEMBRE", id: 10 },
  { name: "DÉCEMBRE", id: 11 }
];

interface AdminDashboardProps {
  onAddContent: (item: Movie) => void;
  addedContent: Movie[];
  onRemoveContent?: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onAddContent, addedContent, onRemoveContent }) => {
  const [subView, setSubView] = useState<AdminSubView>('dashboard');
  const [mode, setMode] = useState<EditorMode>('list');
  const [activeTab, setActiveTab] = useState<EditTab>('Overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tvShowsExpanded, setTvShowsExpanded] = useState(true);
  const [managementExpanded, setManagementExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [importerId, setImporterId] = useState('');
  const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [moviesList, setMoviesList] = useState<Movie[]>([]);
  const [tvShowsList, setTvShowsList] = useState<Movie[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [bulkSaveSuccess, setBulkSaveSuccess] = useState(false);
  
  const [editingEpisode, setEditingEpisode] = useState<any>(null);
  const [discoveryProgress, setDiscoveryProgress] = useState<{current: number, total: number} | null>(null);

  const [isEditingPermalink, setIsEditingPermalink] = useState(false);
  const [tempPermalink, setTempPermalink] = useState('');
  const [editingSeasonSlugId, setEditingSeasonSlugId] = useState<string | null>(null);
  const [tempSeasonSlug, setTempSeasonSlug] = useState('');
  const [expandedSeasons, setExpandedSeasons] = useState<string[]>([]);

  // Ads Config State
  const [adsConfig, setAdsConfig] = useState<Record<string, { desktop: string, mobile: string, enabled: boolean }>>(() => {
    const saved = localStorage.getItem('planet_streaming_ads');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure enabled property exists
      const initialZones = [
        'headerBottom', 'topList', 'bottomList', 'singleMovieTop', 'singleMovieBottom',
        'singleSeriesTop', 'singleSeriesBottom', 'singleSeasonTop', 'singleSeasonBottom',
        'singleEpisodeTop', 'singleEpisodeBottom', 'singlePlayerTop', 'singlePlayerBottom',
        'singlePlayerInside', 'sidebarLeft', 'sidebarRight'
      ];
      initialZones.forEach(z => {
        if (!parsed[z]) parsed[z] = { desktop: '', mobile: '', enabled: true };
        if (parsed[z].enabled === undefined) parsed[z].enabled = true;
      });
      return parsed;
    }
    const initialZones = [
      'headerBottom', 'topList', 'bottomList', 'singleMovieTop', 'singleMovieBottom',
      'singleSeriesTop', 'singleSeriesBottom', 'singleSeasonTop', 'singleSeasonBottom',
      'singleEpisodeTop', 'singleEpisodeBottom', 'singlePlayerTop', 'singlePlayerBottom',
      'singlePlayerInside', 'sidebarLeft', 'sidebarRight'
    ];
    const initial: any = {};
    initialZones.forEach(z => initial[z] = { desktop: '', mobile: '', enabled: true });
    return initial;
  });
  const [activeAdView, setActiveAdView] = useState<Record<string, 'desktop' | 'mobile'>>({});

  useEffect(() => {
    localStorage.setItem('planet_streaming_ads', JSON.stringify(adsConfig));
  }, [adsConfig]);

  // AdBlock Config State
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
    localStorage.setItem('planet_streaming_adblock', JSON.stringify(adBlockConfig));
  }, [adBlockConfig]);

  // Analytics Derived Data
  const statsAnalytics = useMemo(() => {
    const total = addedContent.length || 1;
    const genreCounts: Record<string, number> = {};
    const qualityCounts: Record<string, number> = {};
    const langCounts: Record<string, number> = {};
    let totalViews = 0;
    let publishedCount = 0;

    addedContent.forEach(m => {
      // Genres
      const gs = Array.isArray(m.genre) ? m.genre : [m.genre];
      gs.forEach(g => { if(g) genreCounts[g] = (genreCounts[g] || 0) + 1; });
      // Quality
      const q = m.videoQuality || 'HD';
      qualityCounts[q] = (qualityCounts[q] || 0) + 1;
      // Langs
      (m.langue || []).forEach(l => { langCounts[l] = (langCounts[l] || 0) + 1; });
      // Views & Status
      totalViews += (m.views || 0);
      if (m.status === 'Publish' || !m.status) publishedCount++;
    });

    return {
      genres: Object.entries(genreCounts).sort((a,b) => b[1] - a[1]).slice(0, 6),
      qualities: Object.entries(qualityCounts).sort((a,b) => b[1] - a[1]),
      langs: Object.entries(langCounts).sort((a,b) => b[1] - a[1]).slice(0, 4),
      topViewed: [...addedContent].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
      totalViews,
      health: Math.round((publishedCount / total) * 100)
    };
  }, [addedContent]);

  // Permalink Settings State
  const [permalinkSettings, setPermalinkSettings] = useState(() => {
    const saved = localStorage.getItem('planet_streaming_permalinks');
    return saved ? JSON.parse(saved) : {
      categoryPrefix: '',
      tagPrefix: '',
      moviePath: 'film-vf-vostfr',
      seriesPath: 'anime',
      seasonPath: 'season',
      episodePath: 'episode',
      mangaPath: 'manga',
      scanPath: 'scan',
      structure: 'postname',
      customStructure: '/%postname%/'
    };
  });

  // Genre State
  const [genres, setGenres] = useState<Genre[]>(() => {
    const saved = localStorage.getItem('planet_streaming_genres');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Action', slug: 'action' },
      { id: '2', name: 'Adventure', slug: 'adventure' },
      { id: '3', name: 'Animation', slug: 'animation' },
      { id: '4', name: 'Comedy', slug: 'comedy' },
      { id: '5', name: 'Crime', slug: 'crime' },
      { id: '6', name: 'Documentary', slug: 'documentary' },
      { id: '7', name: 'Drama', slug: 'drama' },
      { id: '8', name: 'Family', slug: 'family' },
      { id: '9', name: 'Fantasy', slug: 'fantasy' },
      { id: '10', name: 'History', slug: 'history' },
      { id: '11', name: 'Horror', slug: 'horror' },
      { id: '12', name: 'Music', slug: 'music' }
    ];
  });
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);

  // Page State
  const [pages, setPages] = useState<Page[]>(() => {
    const saved = localStorage.getItem('planet_streaming_pages');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Accueil', slug: 'home', description: 'Page d\'accueil du site' },
      { id: '2', title: 'Catalogue', slug: 'catalogue', description: 'Catalogue complet des films et séries' },
      { id: '3', title: 'Planning', slug: 'planning', description: 'Planning des sorties hebdomadaires' },
      { id: '4', title: 'Films', slug: 'films', description: 'Liste des films en streaming' },
      { id: '5', title: 'Séries', slug: 'series', description: 'Liste des séries en streaming' },
      { id: '6', title: 'Manga', slug: 'manga', description: 'Liste des scans manga' }
    ];
  });
  const [editingPage, setEditingPage] = useState<Page | null>(null);

  // Slider State
  const [sliderConfigs, setSliderConfigs] = useState<SliderConfig[]>(() => {
    const saved = localStorage.getItem('planet_streaming_sliders');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Slider Derniers épisodes', heading: 'Slider', limit: 6, isActive: true },
      { id: '2', name: 'Slider Episode Calendar', heading: 'Slider', limit: 6, isActive: true },
      { id: '3', name: 'Slider Aujourd\'hui', heading: 'Slider', limit: 6, isActive: true },
      { id: '4', name: 'Slider Movies', heading: 'Slider', limit: 6, isActive: true },
      { id: '5', name: 'Slider MANGA', heading: 'Slider', limit: 6, isActive: true },
      { id: '6', name: 'Slider ANIMES', heading: 'Slider', limit: 6, isActive: true },
      { id: '7', name: 'Slider Les plus aimés', heading: 'Slider', limit: 6, isActive: true },
      { id: '8', name: 'Slider Top de la semaine', heading: 'Slider', limit: 6, isActive: true }
    ];
  });
  const [editingSliderId, setEditingSliderId] = useState<string | null>(null);

  // Advanced Settings State (from reference)
  const [advancedSettings, setAdvancedSettings] = useState(() => {
    const saved = localStorage.getItem('planet_streaming_advanced');
    return saved ? JSON.parse(saved) : {
      topThisWeek: true,
      showFeaturedGenres: true,
      showAltTitle: true
    };
  });

  useEffect(() => {
    localStorage.setItem('planet_streaming_genres', JSON.stringify(genres));
  }, [genres]);

  useEffect(() => {
    localStorage.setItem('planet_streaming_pages', JSON.stringify(pages));
  }, [pages]);

  useEffect(() => {
    localStorage.setItem('planet_streaming_sliders', JSON.stringify(sliderConfigs));
  }, [sliderConfigs]);

  useEffect(() => {
    localStorage.setItem('planet_streaming_advanced', JSON.stringify(advancedSettings));
  }, [advancedSettings]);

  useEffect(() => {
    localStorage.setItem('planet_streaming_permalinks', JSON.stringify(permalinkSettings));
  }, [permalinkSettings]);

  // Site Settings State
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'PLANET STREAM',
    siteTagline: 'Streaming Illimité - Films & Séries en HD',
    siteLogo: '',
    siteFavicon: '',
    maintenanceMode: false,
    allowRegistration: true,
    emailNotifications: true,
    defaultLanguage: 'VF',
    accentColor: '#00A1FA'
  });

  // SEO Settings State
  const [seoSettings, setSeoSettings] = useState({
    site: { title: 'Watch the Best Movies & TV Shows — Watchug', description: 'Watchug offers a wide collection of movies, including drama, comedy, action, sci-fi, a' },
    browse: { title: 'Explore Best Movies & TV Shows — Watchug', description: 'Unleash your cinematic curiosity with watchug extensive movie collection. Browse th' },
    manga: { title: 'MANGA — Watchug', description: 'Watchug offers a wide collection of manga, including drama, comedy, action, sci-fi, a' },
    movies: { title: 'Explore Best Movies — Watchug', description: 'Watchug offers a wide collection of movies, including drama, comedy, action, sci-fi, a' },
    tvShows: { title: 'Explore Best TV Shows — Watchug', description: 'Watchug offers a wide collection of TV Shows, including drama, comedy, action, sci-!' },
    genre: { title: '[genre] [sortable] Best Movies & TV Shows — Watchug', description: '[genre] Best Movies & TV Shows — Watchug' },
    movie: { title: '[title] Free Watch Movie — Watchug', description: '[description]' },
    tvShow: { title: '[title] Watch Movie', description: '[description]' },
    scan: { title: '[title] Watch scan', description: '[description]' },
    episode: { title: '[title] Watch Movie', description: '[description]' },
    tag: { title: '[tag] Movies & TV Shows — Watchug', description: '[tag] Movies & TV Shows — Watchug' },
    search: { title: '[search] Movies & TV Shows — Watchug', description: '[search] Movies & TV Shows — Watchug' },
    trending: { title: 'Explore Trending Best TV Shows — Watchug', description: 'Watchug offers a wide collection of TV Shows, including drama, comedy, action, sci-!' },
    topImdb: { title: 'Explore Top Imdb Best TV Shows — Watchug', description: 'Watchug offers a wide collection of TV Shows, including drama, comedy, action, sci-!' },
    profile: { title: '[username] — Watchug', description: '[username] — Watchug' },
    page: { title: '[title] — Watchug', description: '[title] — Watchug' }
  });

  // Sitemap Settings State
  const [sitemapSettings, setSitemapSettings] = useState({
    series: true,
    seasons: true,
    episodes: true,
    films: false,
    scan: true,
    category: true,
    post_tag: true,
    pages: true,
    maxEntries: 1000
  });

  // Bulk episode management state
  const [bulkEpisodeCounts, setBulkEpisodeCounts] = useState<Record<string, number>>({});
  const [bulkRanges, setBulkRanges] = useState<Record<string, { from: number, to: number }>>({});
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<Record<string, Set<string>>>({});
  const [selectedMainItems, setSelectedMainItems] = useState<Set<string>>(new Set());

  const [quickLinksData, setQuickLinksData] = useState({
    season: 1,
    initialEpisode: 1,
    type: 'Online',
    language: 'VF',
    quality: 'HDLight',
    linksPerEpisode: 5,
    linksText: '',
    isDiscovering: false,
    distributionMode: 'Video' // 'Video' or 'Image'
  });

  const getInitialFormData = (type: 'movie' | 'series' | 'anime' | 'manga' = 'movie') => ({
    id: '',
    tmdbId: '',
    title: '',
    altTitle: '',
    genre: [], 
    langue: ['VF'],
    tagline: '',
    overview: '',
    country: 'United States',
    releaseDate: '2025-01-01',
    voteAverage: '7.5',
    runtime: '',
    videoQuality: 'Choose',
    view: '0',
    trailer: '',
    tags: '',
    status: 'Publish',
    posterUrl: '',
    backdropUrl: '',
    type: type,
    seasons: [],
    isPinned: false,
    videos: [], 
    images: [], // Support for manga scan images
    slug: '',
    broadcastTime: '20h00',
    isAnimeSeries: false,
    showInLatestEpisodes: false,
    isTodayHighlight: false,
    isRecentAddition: false,
    inPlanningPage: false,
    totalEpisodesCount: '1',
    planningEntries: [],
    currentSeasonNum: 1,
    currentEpisodeNum: 1
  });

  const [formData, setFormData] = useState<any>(getInitialFormData());

  useEffect(() => {
    // Sync quickLinksData distributionMode when formData.type changes
    setQuickLinksData(prev => ({
      ...prev,
      distributionMode: formData.type === 'manga' ? 'Image' : 'Video'
    }));
  }, [formData.type]);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/[^\w-]+/g, '')  // Remove all non-word chars
      .replace(/--+/g, '-');    // Replace multiple - with single -
  };

  const combinedMovies = useMemo(() => {
    const local = addedContent.filter(m => m.type === 'movie');
    const remote = moviesList.filter(m => !local.some(l => l.tmdbId === m.tmdbId));
    return [...local, ...remote];
  }, [addedContent, moviesList]);

  const combinedTvShows = useMemo(() => {
    const local = addedContent.filter(m => m.type === 'series' || m.type === 'anime');
    const remote = tvShowsList.filter(m => !local.some(l => l.tmdbId === m.tmdbId));
    return [...local, ...remote];
  }, [addedContent, tvShowsList]);

  const combinedManga = useMemo(() => {
    return addedContent.filter(m => m.type === 'manga');
  }, [addedContent]);

  const allEpisodes = useMemo(() => {
    const list: any[] = [];
    combinedTvShows.concat(combinedManga).forEach(show => {
      if (show.seasons) {
        show.seasons.forEach(season => {
          if (season.episodes && season.episodes.length > 0) {
            season.episodes.forEach(episode => {
              list.push({
                ...episode,
                type: show.type,
                seriesId: show.id || show.tmdbId,
                seriesTitle: show.title,
                seasonNumber: season.number,
                img: episode.thumbnailUrl || show.posterUrl,
                displayTitle: show.type === 'manga' ? `Chapitre : ${episode.number}` : `Saison : ${season.number} Épisode : ${episode.number}`,
                subTitle: episode.title,
                fullSearchText: `${show.title} S${season.number} E${episode.number} ${episode.title}`.toLowerCase()
              });
            });
          }
        });
      }
    });
    return list;
  }, [combinedTvShows, combinedManga]);

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let baseData: any[] = [];
    if (subView === 'movies') baseData = combinedMovies;
    else if (subView === 'tv-shows') baseData = combinedTvShows;
    else if (subView === 'episodes') baseData = allEpisodes;
    else if (subView === 'manga') baseData = combinedManga;
    else if (subView === 'genres') baseData = genres;
    else if (subView === 'settings-page') baseData = pages;

    if (!term) return baseData;
    return baseData.filter(m => {
      const title = m.title || m.name || m.displayTitle || m.fullSearchText || '';
      return title.toLowerCase().includes(term);
    });
  }, [subView, searchTerm, combinedMovies, combinedTvShows, allEpisodes, combinedManga, genres, pages]);

  const fetchInitialData = useCallback(async (page: number = 1) => {
    setIsLoadingList(true);
    try {
      const [movRes, tvRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=fr-FR&page=${page}`),
        fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=fr-FR&page=${page}`)
      ]);
      const movData = await movRes.json();
      const tvData = await tvRes.json();
      if (movData.results) {
        setMoviesList(movData.results.map((m: any) => ({
          id: (m.id || '').toString(),
          tmdbId: (m.id || '').toString(),
          title: m.title || m.name || 'Untitled',
          description: m.overview,
          year: parseInt((m.release_date || '0').split('-')[0]) || 2024,
          rating: (m.vote_average || 0).toFixed(1),
          duration: m.runtime ? `${Math.floor(m.runtime / 60)}h ${m.runtime % 60}m` : '2h 10m',
          genre: [m.genre_ids?.[0]?.toString() || 'Action'],
          posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '',
          backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : '',
          director: 'TMDB',
          cast: [],
          popularity: m.popularity,
          type: 'movie',
          isPinned: addedContent.find(l => l.tmdbId === (m.id || '').toString())?.isPinned || false,
          langue: ['VF'],
          videos: [],
          slug: slugify(m.title || m.name || '')
        })));
      }
      if (tvData.results) {
        setTvShowsList(tvData.results.map((t: any) => ({
          id: (t.id || '').toString(),
          tmdbId: (t.id || '').toString(),
          title: t.name || t.title || 'Untitled',
          description: t.overview,
          year: parseInt((t.first_air_date || '0').split('-')[0]) || 2024,
          rating: (t.vote_average || 0).toFixed(1),
          duration: 'Saison 1',
          genre: [t.genre_ids?.[0]?.toString() || 'Série'],
          posterUrl: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : '',
          backdropUrl: t.backdrop_path ? `https://image.tmdb.org/t/p/original${t.backdrop_path}` : '',
          director: 'TMDB',
          cast: [],
          popularity: t.popularity,
          type: 'series',
          isPinned: addedContent.find(l => l.tmdbId === (t.id || '').toString())?.isPinned || false,
          seasons: [{ id: '1', number: 1, title: 'Saison 1', episodes: [] }],
          langue: ['VF'],
          videos: [],
          slug: slugify(t.name || t.title || '')
        })));
      }
    } catch (e) { console.error(e); } finally { setIsLoadingList(false); }
  }, [addedContent]);

  useEffect(() => { fetchInitialData(currentPage); }, [fetchInitialData, currentPage]);

  const handleSubViewChange = (view: AdminSubView) => {
    setSubView(view);
    setMode('list');
    setSearchTerm('');
    setCurrentPage(1);
    setEditingEpisode(null);
    setEditingGenre(null);
    setEditingPage(null);
    setEditingSliderId(null);
    setExpandedSeasons([]);
    setSelectedMainItems(new Set());
  };

  const handlePinToggle = (item: Movie) => {
    const updated = { ...item, isPinned: !item.isPinned };
    onAddContent(updated);
  };

  const handlePublishToggle = async (item: Movie) => {
    const isAdded = addedContent.some(l => l.tmdbId === item.tmdbId || l.id === item.id);
    if (isAdded && onRemoveContent) {
      onRemoveContent(item.tmdbId || item.id);
    } else {
      setIsLoadingList(true);
      try {
        const detailed = await getDetailedMovie(item);
        onAddContent({ ...detailed, isPinned: true }); 
      } catch (e) {
        console.error("Publish toggle failed:", e);
      } finally {
        setIsLoadingList(false);
      }
    }
  };

  const handleImportTMDB = async () => {
    if (!importerId) return;
    setIsImporting(true);
    const type = subView === 'movies' ? 'movie' : subView === 'manga' ? 'manga' : 'tv';
    
    if (type === 'manga') {
      try {
        const res = await fetch(`https://api.jikan.moe/v4/manga/${importerId}`);
        const data = await res.json();
        if (data && data.data) {
          const item = data.data;
          const mapped: any = {
            id: `manga-${item.mal_id}`,
            tmdbId: `mal-${item.mal_id}`,
            title: item.title,
            overview: item.synopsis || '',
            releaseDate: item.published?.from || '',
            voteAverage: (item.score || 0).toFixed(1),
            runtime: `${item.chapters || '?'} chapters`,
            posterUrl: item.images?.jpg?.large_image_url || '',
            backdropUrl: item.images?.jpg?.large_image_url || '',
            genre: item.genres?.map((g: any) => g.name) || [],
            langue: ['VF'],
            type: 'manga',
            seasons: [{ id: '1', number: 1, title: 'Chapitres', episodes: [], slug: 'chapters' }],
            videos: [],
            images: [],
            slug: slugify(item.title || ''),
            currentSeasonNum: 1,
            currentEpisodeNum: 1
          };
          setFormData({ ...getInitialFormData('manga'), ...mapped });
          setIsImporterOpen(false);
          setMode('editor');
          setActiveTab('Overview');
          setEditingEpisode(null);
        }
      } catch (e) { console.error(e); } finally { setIsImporting(false); }
      return;
    }

    try {
      const res = await fetch(`https://api.themoviedb.org/3/${type === 'tv' ? 'tv' : 'movie'}/${importerId}?api_key=${TMDB_API_KEY}&language=fr-FR`);
      const data = await res.json();
      if (data && data.id) {
        const mapped: any = {
          id: (data.id || '').toString(),
          tmdbId: (data.id || '').toString(),
          title: data.title || data.name || '',
          altTitle: data.original_title || data.original_name || '',
          overview: data.overview || '',
          releaseDate: data.release_date || data.first_air_date || '',
          voteAverage: (data.vote_average || 0).toFixed(1),
          runtime: data.runtime || (data.episode_run_time ? data.episode_run_time[0] : ''),
          posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
          backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '',
          genre: data.genres?.map((g: any) => g.name) || [],
          langue: ['VF'],
          type: type === 'tv' ? 'series' : 'movie',
          seasons: data.seasons?.map((s:any) => ({
            id: (s.id || '').toString(),
            number: s.season_number,
            title: s.name || `Season ${s.season_number}`,
            episodes: [],
            slug: slugify(s.name || `season ${s.season_number}`)
          })),
          videos: [],
          slug: slugify(data.title || data.name || ''),
          currentSeasonNum: 1,
          currentEpisodeNum: 1
        };
        
        // Use clean state + imported data
        setFormData({ ...getInitialFormData(mapped.type), ...mapped });
        setIsImporterOpen(false);
        setMode('editor');
        setActiveTab('Overview');
        setEditingEpisode(null);
      }
    } catch (e) { console.error(e); } finally { setIsImporting(false); }
  };

  const handleUpdateEpisodesAPI = async (seasonNumber: number) => {
    if (!formData.tmdbId) return;
    const seasonIndex = formData.seasons.findIndex((s:any) => s.number === seasonNumber);
    if (seasonIndex === -1) return;

    setDiscoveryProgress({ current: 0, total: 1 });
    
    try {
      const episodes = await fetchSeasonEpisodes(formData.tmdbId, seasonNumber);
      if (episodes && episodes.length > 0) {
        setDiscoveryProgress({ current: 0, total: episodes.length });
        
        const episodesWithLinks = episodes.map(ep => ({
          ...ep,
          videos: [], 
          images: [],
          langue: ['VF'],
          slug: slugify(ep.title || `episode ${ep.number}`)
        }));

        for (let i = 1; i <= episodesWithLinks.length; i++) {
          setDiscoveryProgress({ current: i, total: episodesWithLinks.length });
          await new Promise(r => setTimeout(r, 10)); 
        }

        const updatedSeasons = [...formData.seasons];
        updatedSeasons[seasonIndex] = { ...updatedSeasons[seasonIndex], episodes: episodesWithLinks };
        const updatedData = { ...formData, seasons: updatedSeasons };
        setFormData(updatedData);
        
        if (addedContent.some(m => m.tmdbId === formData.tmdbId)) {
          onAddContent(updatedData);
        }
        return episodesWithLinks;
      }
    } catch (e) {
      console.error("Discovery failed", e);
    } finally {
      setDiscoveryProgress(null);
    }
  };

  const handleToggleLang = (langId: string) => {
    setFormData((prev: any) => {
      const currentLangs = prev.langue || [];
      const newLangs = currentLangs.includes(langId)
        ? currentLangs.filter((l: string) => l !== langId)
        : [...currentLangs, langId];
      return { ...prev, langue: newLangs };
    });
  };

  const handleAddVideoLink = () => {
    const currentVideos = formData.videos || [];
    const nextIdx = currentVideos.length + 1;
    setFormData({
      ...formData,
      videos: [...currentVideos, { type: 'Embed link', label: `LECTEUR ${nextIdx}`, url: '', langue: 'VF' }]
    });
  };

  const handleUpdateVideoLink = (idx: number, field: string, value: string) => {
    const currentVideos = [...(formData.videos || [])];
    currentVideos[idx] = { ...currentVideos[idx], [field]: value };
    setFormData({ ...formData, videos: currentVideos });
  };

  const handleRemoveVideoLink = (idx: number) => {
    const currentVideos = (formData.videos || []).filter((_: any, i: number) => i !== idx);
    setFormData({ ...formData, videos: currentVideos });
  };

  const handleSaveEpisode = () => {
    if (!editingEpisode) return;
    setIsSaving(true);
    
    setTimeout(() => {
      const parentSeries = addedContent.find(m => m.id === editingEpisode.seriesId || m.tmdbId === editingEpisode.seriesId);
      
      if (parentSeries) {
        const updatedSeasons = [...(parentSeries.seasons || [])];
        const seasonIdx = updatedSeasons.findIndex(s => s.number === editingEpisode.seasonNumber);
        
        if (seasonIdx > -1) {
          const updatedEpisodes = [...(updatedSeasons[seasonIdx].episodes || [])];
          const epIdx = updatedEpisodes.findIndex(e => e.id === editingEpisode.id || e.number === editingEpisode.number);
          
          const epData = { 
            ...formData, 
            id: formData.id || editingEpisode.id || Date.now().toString(),
            title: formData.title,
            overview: formData.overview,
            thumbnailUrl: formData.posterUrl,
            number: formData.number,
            langue: formData.langue,
            videos: formData.videos,
            images: formData.images || [], // Ensure images are saved
            slug: formData.slug || slugify(formData.title || ''),
            lastUpdated: Date.now()
          };

          if (epIdx > -1) {
            updatedEpisodes[epIdx] = { ...updatedEpisodes[epIdx], ...epData };
          } else {
            updatedEpisodes.push(epData);
          }
          
          updatedSeasons[seasonIdx] = { ...updatedSeasons[seasonIdx], episodes: updatedEpisodes };
          onAddContent({ ...parentSeries, seasons: updatedSeasons });
        }
      }
      
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setMode('list');
        setEditingEpisode(null);
      }, 1000);
    }, 600);
  };

  const handleSaveContent = () => {
    setIsSaving(true); 
    setTimeout(() => { 
      setIsSaving(false); 
      setSaveSuccess(true); 
      setTimeout(()=>setSaveSuccess(false),2000); 
      onAddContent(formData); 
      setMode('list'); 
    }, 600); 
  };

  const handleSaveGenre = () => {
    if (!editingGenre) return;
    setIsSaving(true);
    setTimeout(() => {
      setGenres(prev => {
        const exists = prev.some(g => g.id === editingGenre.id);
        if (exists) {
          return prev.map(g => g.id === editingGenre.id ? editingGenre : g);
        }
        return [...prev, { ...editingGenre, id: editingGenre.id || Date.now().toString() }];
      });
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setMode('list');
        setEditingGenre(null);
      }, 1000);
    }, 600);
  };

  const handleSavePage = () => {
    if (!editingPage) return;
    setIsSaving(true);
    setTimeout(() => {
      setPages(prev => {
        const exists = prev.some(p => p.id === editingPage.id);
        if (exists) {
          return prev.map(p => p.id === editingPage.id ? editingPage : p);
        }
        return [...prev, { ...editingPage, id: editingPage.id || Date.now().toString() }];
      });
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setMode('list');
        setEditingPage(null);
      }, 1000);
    }, 600);
  };

  const handleQuickLinksSeasonChange = async (seasonNum: number) => {
    if (!seasonNum) return;
    setQuickLinksData(prev => ({ ...prev, season: seasonNum, isDiscovering: true }));
    
    const existingSeason = formData.seasons?.find((s: any) => s.number === seasonNum);
    
    if (!existingSeason?.episodes || existingSeason.episodes.length === 0) {
      if (formData.type !== 'manga') {
        await handleUpdateEpisodesAPI(seasonNum);
      }
    }
    
    setQuickLinksData(prev => ({ ...prev, isDiscovering: false, initialEpisode: 1 }));
  };

  const handleAutoDistributeVisual = () => {
    const rawLinks = quickLinksData.linksText.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (rawLinks.length === 0) {
       alert("Veuillez coller des liens valides d'abord.");
       return;
    }

    const output = [];
    const linksPerEpisode = quickLinksData.linksPerEpisode;
    
    for (let i = 0; i < rawLinks.length; i++) {
        if (i % linksPerEpisode === 0 && i !== 0) {
            output.push(""); 
        }
        output.push(rawLinks[i]);
    }
    
    setQuickLinksData(prev => ({ ...prev, linksText: output.join('\n') }));
  };

  const handleSmartGroupManga = () => {
    const rawLinks = quickLinksData.linksText.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (rawLinks.length === 0) {
       alert("Veuillez coller des liens d'abord.");
       return;
    }

    // Attempt to group by detecting chapter numbers in the URL path
    // Typical pattern: .../title/chapter/page.jpg
    const groups: Record<string, string[]> = {};
    const keys: string[] = [];

    rawLinks.forEach(url => {
      // Look for the last two numeric segments in the path
      const parts = url.split('/');
      const numParts = parts.filter(p => !isNaN(parseInt(p)));
      if (numParts.length >= 2) {
        // Assume second to last is chapter
        const chapter = numParts[numParts.length - 2];
        if (!groups[chapter]) {
          groups[chapter] = [];
          keys.push(chapter);
        }
        groups[chapter].push(url);
      }
    });

    if (keys.length === 0) {
      alert("Impossible de détecter automatiquement les chapitres dans les URLs. Utilisez AUTO DISTRIBUTE manuel.");
      return;
    }

    // Rebuild text with double newlines
    const sortedKeys = keys.sort((a,b) => parseInt(a) - parseInt(b));
    const result = sortedKeys.map(k => groups[k].join('\n')).join('\n\n');
    setQuickLinksData(prev => ({ ...prev, linksText: result }));
  };

  const executeBulkSave = () => {
    const chunks = quickLinksData.linksText.split(/\n\s*\n/).filter(c => c.trim());
    if (chunks.length === 0) {
        alert("Aucun groupe de liens détecté. Utilisez 'AUTO DISTRIBUTE' ou 'SMART GROUP' pour formater votre texte.");
        return;
    }

    const targetSeasonIdx = formData.seasons?.findIndex((s:any) => s.number === quickLinksData.season);
    const targetSeason = formData.seasons?.[targetSeasonIdx];

    if (!targetSeason || !targetSeason.episodes || targetSeason.episodes.length === 0) {
      alert("Erreur: Les épisodes/chapitres réels n'ont pas été trouvés. Sélectionnez une saison valide ou extrayez les épisodes d'abord.");
      return;
    }

    const updatedSeasons = [...formData.seasons];
    const episodes = [...(targetSeason.episodes || [])];
    
    let currentEpisodeNum = quickLinksData.initialEpisode;

    chunks.forEach((chunk) => {
       const linksInChunk = chunk.split('\n').map(l => l.trim()).filter(l => l);
       const epIdx = episodes.findIndex(e => e.number === currentEpisodeNum);
       
       if (epIdx !== -1) {
           if (quickLinksData.distributionMode === 'Image') {
              // Distribution logic for Manga Scan Images
              episodes[epIdx] = {
                  ...episodes[epIdx],
                  images: [...(episodes[epIdx].images || []), ...linksInChunk],
                  lastUpdated: Date.now()
              };
           } else {
              // Distribution logic for Video Links
              const episodeVideoLinks = linksInChunk.map((url, idx) => ({
                 type: quickLinksData.type === 'Online' ? 'Embed link' : 'Download',
                 label: `LECTEUR ${episodes[epIdx].videos?.length ? episodes[epIdx].videos.length + idx + 1 : idx + 1}`,
                 url: url,
                 langue: quickLinksData.language,
                 quality: quickLinksData.quality
              }));

              episodes[epIdx] = {
                  ...episodes[epIdx],
                  videos: [...(episodes[epIdx].videos || []), ...episodeVideoLinks],
                  langue: Array.from(new Set([...(episodes[epIdx].langue || []), quickLinksData.language])),
                  lastUpdated: Date.now()
              };
           }
       } else {
           console.warn(`Episode/Chapitre réel n°${currentEpisodeNum} non trouvé. Chunk ignoré.`);
       }
       currentEpisodeNum++;
    });

    const updatedData = { ...formData, seasons: updatedSeasons };
    updatedSeasons[targetSeasonIdx] = { ...targetSeason, episodes };
    setFormData(updatedData);
    
    if (addedContent.some(m => m.tmdbId === formData.tmdbId || m.id === formData.id)) {
        onAddContent(updatedData);
    }

    setBulkSaveSuccess(true);
    setTimeout(() => setBulkSaveSuccess(false), 3000);
  };

  const addPlanningEntry = () => {
    // Determine default values based on type
    const isMovie = formData.type === 'movie';
    const newEntry: PlanningEntry = {
      day: isMovie ? undefined : 1, // Monday
      month: isMovie ? 0 : undefined, // January
      time: "20h00",
      language: "VF"
    };
    setFormData((prev: any) => ({
      ...prev,
      planningEntries: [...(prev.planningEntries || []), newEntry]
    }));
  };

  const updatePlanningEntry = (idx: number, updates: Partial<PlanningEntry>) => {
    setFormData((prev: any) => {
      const entries = [...(prev.planningEntries || [])];
      entries[idx] = { ...entries[idx], ...updates };
      return { ...prev, planningEntries: entries };
    });
  };

  const removePlanningEntry = (idx: number) => {
    setFormData((prev: any) => ({
      ...prev,
      planningEntries: (prev.planningEntries || []).filter((_: any, i: number) => i !== idx)
    }));
  };

  const handleBulkAddByCount = (seasonIdx: number, count: number) => {
    if (!count || count <= 0) return;
    const newSeasons = [...formData.seasons];
    const currentEpisodes = newSeasons[seasonIdx].episodes || [];
    const startNum = currentEpisodes.length > 0 
      ? Math.max(...currentEpisodes.map((e: any) => e.number)) + 1 
      : 1;

    const added = [];
    for (let i = 0; i < count; i++) {
      const num = startNum + i;
      added.push({
        id: Date.now().toString() + i,
        number: num,
        title: `${formData.type === 'manga' ? 'Chapitre' : 'Episode'} ${num}`,
        videos: [],
        images: [],
        langue: ['VF'],
        slug: slugify(`episode ${num}`),
        lastUpdated: Date.now()
      });
    }

    newSeasons[seasonIdx].episodes = [...currentEpisodes, ...added];
    const updatedData = { ...formData, seasons: newSeasons };
    setFormData(updatedData);
    // Persist if published
    if (addedContent.some(m => m.tmdbId === formData.tmdbId || m.id === formData.id)) {
      onAddContent(updatedData);
    }
  };

  const handleBulkAddByRange = (seasonIdx: number, from: number, to: number) => {
    if (from > to || from < 1) {
      alert("Invalid range");
      return;
    }
    const newSeasons = [...formData.seasons];
    const currentEpisodes = [...(newSeasons[seasonIdx].episodes || [])];
    
    const added = [];
    for (let num = from; num <= to; num++) {
      // Check if already exists
      if (!currentEpisodes.some((e: any) => e.number === num)) {
        added.push({
          id: Date.now().toString() + num,
          number: num,
          title: `${formData.type === 'manga' ? 'Chapitre' : 'Episode'} ${num}`,
          videos: [],
          images: [],
          langue: ['VF'],
          slug: slugify(`episode ${num}`),
          lastUpdated: Date.now()
        });
      }
    }

    newSeasons[seasonIdx].episodes = [...currentEpisodes, ...added].sort((a,b) => a.number - b.number);
    const updatedData = { ...formData, seasons: newSeasons };
    setFormData(updatedData);
    // Persist if published
    if (addedContent.some(m => m.tmdbId === formData.tmdbId || m.id === formData.id)) {
      onAddContent(updatedData);
    }
  };

  const handleDeleteAllPlayersInSeason = (seasonIdx: number) => {
    if (!window.confirm("🗑️ Supprimer tous les lecteurs/images de la saison ? Cette action est irréversible.")) return;
    const newSeasons = [...formData.seasons];
    newSeasons[seasonIdx].episodes = (newSeasons[seasonIdx].episodes || []).map((ep: any) => ({
      ...ep,
      videos: [],
      images: []
    }));
    const updatedData = { ...formData, seasons: newSeasons };
    setFormData(updatedData);
    // Persist if published
    if (addedContent.some(m => m.tmdbId === formData.tmdbId || m.id === formData.id)) {
      onAddContent(updatedData);
    }
  };

  const toggleEpisodeSelection = (seasonId: string, episodeId: string) => {
    const current = new Set(selectedEpisodeIds[seasonId] || []);
    if (current.has(episodeId)) current.delete(episodeId);
    else current.add(episodeId);
    setSelectedEpisodeIds({ ...selectedEpisodeIds, [seasonId]: current });
  };

  const handleSelectAllEpisodes = (seasonId: string, episodes: any[]) => {
    const current = new Set(selectedEpisodeIds[seasonId] || []);
    if (current.size === episodes.length && episodes.length > 0) {
      current.clear();
    } else {
      episodes.forEach(e => current.add(e.id));
    }
    setSelectedEpisodeIds({ ...selectedEpisodeIds, [seasonId]: current });
  };

  const handleApplyBulkAction = (seasonIdx: number, seasonId: string) => {
    const select = document.getElementById(`bulk-action-${seasonId}`) as HTMLSelectElement;
    const action = select?.value;
    const selectedSet = selectedEpisodeIds[seasonId];

    if (!action || !selectedSet || selectedSet.size === 0) {
      alert("Veuillez sélectionner une action et au moins un épisode.");
      return;
    }

    if (action === 'delete') {
      if (!window.confirm(`⚠️ SUPPRESSION : Êtes-vous sûr de vouloir supprimer les ${selectedSet.size} épisodes sélectionnés ?`)) return;
      
      const newSeasons = formData.seasons.map((s: any, idx: number) => {
        if (idx === seasonIdx) {
          return {
            ...s,
            episodes: s.episodes.filter((ep: any) => !selectedSet.has(ep.id))
          };
        }
        return s;
      });
      
      const updatedData = { ...formData, seasons: newSeasons };
      setFormData(updatedData);
      
      // Reset selection for this season
      setSelectedEpisodeIds({ ...selectedEpisodeIds, [seasonId]: new Set() });
      
      // Sync if published
      if (addedContent.some(m => m.tmdbId === formData.tmdbId || m.id === formData.id)) {
        onAddContent(updatedData);
      }
      
      // Reset select
      if (select) select.value = "";
    }
  };

  const toggleMainItemSelection = (id: string) => {
    const next = new Set(selectedMainItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMainItems(next);
  };

  const handleMainBulkAction = () => {
    const select = document.getElementById('main-bulk-action') as HTMLSelectElement;
    const action = select?.value;
    
    if (!action || selectedMainItems.size === 0) {
       alert("Sélectionnez une action et au moins un élément.");
       return;
    }

    if (action === 'delete') {
       if (!window.confirm(`⚠️ SUPPRESSION DÉFINITIVE : Supprimer les ${selectedMainItems.size} éléments sélectionnés de la base de données ?`)) return;
       
       const idsToRemove = Array.from(selectedMainItems);
       idsToRemove.forEach(id => {
          if (subView === 'genres') {
            setGenres(prev => prev.filter(g => g.id !== id));
          } else if (subView === 'settings-page') {
            setPages(prev => prev.filter(p => p.id !== id));
          } else {
            if (onRemoveContent) onRemoveContent(id);
          }
       });
       
       setSelectedMainItems(new Set());
       if (select) select.value = "";
    }
  };

  const renderProgressModal = () => {
    if (!discoveryProgress) return null;
    const percent = Math.round((discoveryProgress.current / discoveryProgress.total) * 100);
    return (
      <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-lg p-10 w-[300px] flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-200">
           <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#00A1FA] border-t-transparent rounded-full animate-spin"></div>
           </div>
           <div className="text-2xl font-black text-black mb-6">
             {discoveryProgress.current} / {discoveryProgress.total}
           </div>
           <div className="w-full h-8 bg-slate-100 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-[#00A1FA] transition-all duration-300 flex items-center justify-center text-[10px] font-black text-white"
                style={{ width: `${percent}%` }}
              >
                {percent}%
              </div>
           </div>
           <p className="mt-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Extraction des épisodes réels...</p>
        </div>
      </div>
    );
  };

  const renderQuickLinksModal = () => {
    if (!isQuickLinksOpen) return null;
    
    const isManga = formData.type === 'manga';
    const labelClass = "text-[10px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest flex items-center gap-1.5";
    const selectClass = "w-full bg-white border border-slate-200 rounded p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#00A1FA]/20 transition-all cursor-pointer shadow-sm appearance-none pr-8 relative";
    const actionBtnClass = "flex-1 py-2.5 bg-gradient-to-r from-[#ff007c] to-[#00e0ff] hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white font-black text-[10px] uppercase tracking-widest rounded shadow-lg border-b-4 border-black/10 relative overflow-hidden flex items-center justify-center gap-2";

    const currentSeason = formData.seasons?.find((s:any) => s.number === quickLinksData.season);

    return (
      <div className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-white/10 rounded-lg w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
               <h3 className="text-slate-800 font-black uppercase tracking-tighter text-lg leading-none">
                 {isManga ? 'Manga Scan Distributor' : 'Quick Link Distribution'}
               </h3>
               <p className="text-[9px] text-[#00A1FA] font-black uppercase tracking-widest mt-1">Real Metadata Sync</p>
            </div>
            <button 
              onClick={() => setIsQuickLinksOpen(false)} 
              className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors shadow-lg"
            >
              <X size={18} strokeWidth={4} />
            </button>
          </div>
          
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              <div>
                <label className={labelClass}><FileText size={12} className="text-green-500" /> {isManga ? 'Volume/Section' : 'Saison Cible'}</label>
                <div className="relative">
                  <select 
                    className={selectClass}
                    value={quickLinksData.season}
                    onChange={e => handleQuickLinksSeasonChange(parseInt(e.target.value))}
                  >
                    <option value="">Sélectionner</option>
                    {formData.seasons?.map((s:any) => (
                      <option key={s.number} value={s.number}>Saison {s.number}</option>
                    )) || <option value={1}>Saison 1</option>}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
              </div>

              <div>
                <label className={labelClass}><Globe size={12} className="text-green-500" /> Démarrer à</label>
                <div className="relative">
                  <select 
                    className={selectClass}
                    value={quickLinksData.initialEpisode}
                    onChange={e => setQuickLinksData({...quickLinksData, initialEpisode: parseInt(e.target.value)})}
                  >
                     {currentSeason?.episodes?.length ? currentSeason.episodes.map((ep: any) => (
                       <option key={ep.number} value={ep.number}>{isManga ? 'Chapitre' : 'Épisode'} {ep.number}</option>
                     )) : <option value={1}>{isManga ? 'Aucun chapitre' : 'Extraction req.'}</option>}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2">
                <div className="flex flex-col">
                   <p className="text-[9px] text-indigo-800 font-black uppercase">Mode Actif: {isManga ? 'IMAGE / SCAN' : 'VIDEO / LINK'}</p>
                   <p className="text-[8px] text-indigo-500 font-bold leading-tight">
                     {isManga ? "Distribution d'images scan par chapitre." : "Distribution de lecteurs vidéo par épisode."}
                   </p>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-slate-100"></div>

            {!isManga && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}><LayoutGrid size={12} className="text-green-500" /> Type</label>
                  <div className="relative">
                    <select className={selectClass} value={quickLinksData.type} onChange={e => setQuickLinksData({...quickLinksData, type: e.target.value})}>
                      <option>Online</option>
                      <option>Download</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}><Globe size={12} className="text-green-500" /> Version</label>
                  <div className="relative">
                    <select className={selectClass} value={quickLinksData.language} onChange={e => setQuickLinksData({...quickLinksData, language: e.target.value})}>
                      {AVAILABLE_LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.id}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}><BarChart3 size={12} className="text-green-500" /> Qualité</label>
                  <div className="relative">
                    <select className={selectClass} value={quickLinksData.quality} onChange={e => setQuickLinksData({...quickLinksData, quality: e.target.value})}>
                       <option>HDLight</option><option>HD</option><option>4K</option><option>DVDRip</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>
              </div>
            )}

            <div className="h-[1px] bg-slate-100"></div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                   {isManga ? 'Pages par chapitre:' : 'Liens par bloc:'}
                </span>
                <div className="relative w-16">
                  <input 
                    type="number"
                    className="bg-white border border-slate-200 rounded p-1 w-full text-center text-xs font-black text-[#00A1FA] focus:outline-none shadow-sm"
                    value={quickLinksData.linksPerEpisode}
                    onChange={e => setQuickLinksData({...quickLinksData, linksPerEpisode: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>

              <textarea 
                rows={10} 
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-[10px] text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A1FA]/20 transition-all resize-none font-bold italic shadow-inner"
                placeholder={isManga ? "Collez ici les URLs des pages images. Un URL par ligne. Utilisez 'SMART GROUP' pour regrouper par chapitre détecté dans l'URL." : "Step 3: Collez votre liste de liens. Un URL valide par ligne."}
                value={quickLinksData.linksText}
                onChange={e => setQuickLinksData({...quickLinksData, linksText: e.target.value})}
              />
            </div>

            {bulkSaveSuccess && (
               <div className="p-2 bg-green-50 border border-green-200 rounded flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Contenu activé avec succès</span>
               </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={executeBulkSave} 
                className={`${actionBtnClass} ${bulkSaveSuccess ? 'ring-2 ring-green-400' : ''}`}
              >
                {bulkSaveSuccess ? <Check size={14} /> : (isManga ? 'DISTRIBUTE IMAGES' : 'SAVE LINKS')}
              </button>
              <button 
                onClick={() => setQuickLinksData(prev => ({...prev, initialEpisode: prev.initialEpisode + 1}))} 
                className={actionBtnClass}
              >
                {isManga ? 'NEXT CHAPTER' : 'NEXT EPISODE'}
              </button>
              {isManga ? (
                <button 
                  onClick={handleSmartGroupManga} 
                  className={actionBtnClass}
                >
                  <Wand2 size={14} /> SMART GROUP
                </button>
              ) : (
                <button 
                  onClick={handleAutoDistributeVisual} 
                  className={actionBtnClass}
                >
                  AUTO DISTRIBUTE
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-end">
            <button 
              onClick={() => setIsQuickLinksOpen(false)}
              className="text-slate-400 hover:text-slate-800 text-[10px] font-black uppercase tracking-widest transition-colors px-3 py-1.5"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSubHeaderActions = () => {
    if (editingEpisode) return null;
    const isManga = formData.type === 'manga';
    if (formData.type !== 'series' && formData.type !== 'anime' && !isManga) return null;
    const buttonClass = "flex items-center gap-2 px-3 py-1.5 border border-slate-700 rounded bg-[#1e1e22] text-[11px] font-bold text-slate-300 hover:bg-[#2a2a2f] transition-all";
    
    return (
      <div className="flex flex-wrap gap-2 mb-8 items-center border-b border-white/5 pb-4">
        <button className={buttonClass} onClick={() => setActiveTab('Season')}><Plus size={14} className="text-blue-500" /> Update {isManga ? 'sections' : 'seasons'}</button>
        
        {!isManga && (
          <div className="relative group">
            <button className={buttonClass}>
              <Plus size={14} className="text-green-500" /> Update episodes (API) <ChevronDown size={12} />
            </button>
            <div className="absolute top-full left-0 hidden group-hover:block z-[100] bg-white text-black min-w-[80px] shadow-2xl py-1 rounded mt-1">
              {formData.seasons.map((s:any) => (
                <button key={s.id} onClick={() => handleUpdateEpisodesAPI(s.number)} className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-[12px] font-black">S{s.number}</button>
              ))}
            </div>
          </div>
        )}

        <button className={buttonClass} onClick={() => setIsQuickLinksOpen(true)}><LucideImage size={14} className="text-yellow-500" /> {isManga ? 'Image Distribution' : 'Quick Links'}</button>
        
        <div className="relative group">
          <button className={buttonClass}>
            <Video size={14} className="text-purple-500" /> View {isManga ? 'Sections' : 'Seasons'} <ChevronDown size={12} />
          </button>
          <div className="absolute top-full left-0 hidden group-hover:block z-[100] bg-white text-black min-w-[80px] shadow-2xl py-1 rounded mt-1">
             {formData.seasons.map((s:any) => (
               <button key={s.id} className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-[12px] font-black">S{s.number}</button>
             ))}
          </div>
        </div>

        <div className="relative group">
          <button className={buttonClass}>
            <PlayIcon size={14} className="text-lime-500" /> View {isManga ? 'Chapters' : 'View Episodes'} <ChevronDown size={12} />
          </button>
          <div className="absolute top-full left-0 hidden group-hover:block z-[100] bg-white text-black min-w-[80px] shadow-2xl py-1 rounded mt-1">
             {formData.seasons.map((s:any) => (
               <button key={s.id} className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-[12px] font-black">S{s.number}</button>
             ))}
          </div>
        </div>
      </div>
    );
  };

  const SidebarItem = ({ icon, label, subItems, active, expanded, onClick, onSubItemClick }: any) => (
    <div className="px-3 mb-1">
      <button onClick={onClick} className={`w-full flex items-center justify-between p-3 rounded-lg transition-all group ${active && !subItems ? 'bg-[#1a1a1c] text-white shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
        <div className="flex items-center gap-3">
          <span className={`${active ? 'text-indigo-500' : 'text-slate-500 group-hover:text-indigo-400'}`}>{icon}</span>
          <span className={`text-[13px] font-medium ${active ? 'text-white' : ''}`}>{label}</span>
        </div>
        {subItems && <ChevronDown size={14} className={`text-slate-600 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />}
      </button>
      {subItems && expanded && (
        <div className="mt-1 space-y-1 ml-9 border-l border-white/5 pl-4 py-1">
          {subItems.map((item: any, i: number) => (
            <button key={i} onClick={() => onSubItemClick?.(item.id)} className={`flex items-center gap-3 w-full text-left text-[12px] font-medium transition-colors py-2 group ${active && (subView === item.id) ? 'text-white' : 'text-slate-500 hover:text-white'}`}>
              <div className={`w-1 h-1 rounded-full ${active && subView === item.id ? 'bg-indigo-500' : 'bg-slate-700 group-hover:bg-indigo-500'}`}></div>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderList = (data: any[], title: string, isEpisodesView: boolean = false) => {
    const isAllSelected = data.length > 0 && selectedMainItems.size === data.length;
    const handleSelectAll = () => {
      if (isAllSelected) setSelectedMainItems(new Set());
      else setSelectedMainItems(new Set(data.map(i => (i.id || i.tmdbId).toString())));
    };

    const isGenres = subView === 'genres';
    const isPages = subView === 'settings-page';

    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="bg-[#121214] p-4 rounded-xl border border-white/5 flex flex-wrap items-center gap-4 shadow-xl">
          <button 
            onClick={() => { 
              if (isGenres) {
                setEditingGenre({ id: '', name: '', slug: '', description: '', color: '', metaTitle: '', metaDescription: '', showFeatured: false });
                setMode('editor');
              } else if (isPages) {
                setEditingPage({ id: '', title: '', slug: '', description: '', color: '', metaTitle: '', metaDescription: '', showFeatured: false });
                setMode('editor');
              } else {
                let initialType: any = 'movie';
                if (subView === 'movies') initialType = 'movie';
                else if (subView === 'manga') initialType = 'manga';
                else initialType = 'series';
                setFormData(getInitialFormData(initialType)); 
                setMode('editor'); 
                setActiveTab('Overview'); 
                setEditingEpisode(null);
              }
            }}
            className="flex items-center gap-2 bg-[#1a1a1c] hover:bg-[#252528] border border-white/10 px-6 py-3 rounded-lg text-white font-bold text-[13px] transition-all whitespace-nowrap"
          >
            <Plus size={18} /> Add new
          </button>
          
          <div className="flex-1 relative group min-w-[200px]">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
               <Search size={18} />
             </div>
             <input 
               type="text" 
               placeholder="Search..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-black/40 border border-white/5 rounded-lg py-3 pl-12 pr-12 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
             />
          </div>

          {!isEpisodesView && (
             <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2 rounded-lg ml-auto">
               <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 bg-black border-white/10 rounded cursor-pointer accent-indigo-500"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                  <span className="text-[10px] font-black text-slate-500 uppercase">Select All</span>
               </div>
               <select 
                 id="main-bulk-action"
                 className="bg-transparent border-none text-[10px] font-black text-slate-400 uppercase focus:outline-none cursor-pointer"
               >
                 <option value="">Bulk Actions</option>
                 <option value="delete">Supprimer</option>
               </select>
               <button 
                 onClick={handleMainBulkAction}
                 className="bg-red-600 hover:bg-red-500 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded transition-all shadow-lg active:scale-95"
               >
                 Apply
               </button>
               {selectedMainItems.size > 0 && (
                 <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{selectedMainItems.size} Selected</span>
               )}
             </div>
          )}
        </div>

        <div className="bg-[#121214] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
           <div className="p-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-tight bg-black/20 border-b border-white/5 flex items-center justify-between">
              <span>{isEpisodesView ? 'Episode' : 'Heading'}</span>
              <span>Action</span>
           </div>

           <div className="divide-y divide-white/5">
             {isLoadingList ? (
               <div className="p-20 flex flex-col items-center justify-center gap-4">
                 <Loader2 size={32} className="animate-spin text-indigo-500" />
                 <span className="text-[12px] font-medium text-slate-500">Loading...</span>
               </div>
             ) : data.length === 0 ? (
               <div className="p-20 flex flex-col items-center justify-center text-center opacity-20">
                 <Search size={48} className="mb-4" />
                 <p className="font-bold">No results found</p>
               </div>
             ) : data.slice((currentPage-1)*12, currentPage*12).map((item, i) => {
               const itemId = (item.id || item.tmdbId).toString();
               const isPublished = !isEpisodesView && !isGenres && !isPages && addedContent.some(l => l.tmdbId === item.tmdbId || l.id === item.id);
               return (
                 <div key={i} className={`flex items-center gap-6 p-4 px-6 hover:bg-white/[0.02] transition-all group ${selectedMainItems.has(itemId) ? 'bg-indigo-500/5' : ''}`}>
                   {!isEpisodesView && (
                     <input 
                       type="checkbox" 
                       className="w-4 h-4 bg-black border-white/10 rounded cursor-pointer accent-indigo-500"
                       checked={selectedMainItems.has(itemId)}
                       onChange={() => toggleMainItemSelection(itemId)}
                     />
                   )}
                   {!isGenres && !isPages && (
                     <div className={`rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-black ${isEpisodesView ? 'w-24 h-14' : 'w-12 h-16'}`}>
                       <img src={item.posterUrl || item.img || item.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                     </div>
                   )}
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="text-[14px] font-bold text-white group-hover:text-indigo-400 transition-colors truncate uppercase tracking-tight">
                          {isEpisodesView ? (
                            <>
                              <span className="text-indigo-400 mr-2">{item.seriesTitle}</span>
                              {item.displayTitle}
                            </>
                          ) : (item.title || item.name)}
                        </h4>
                        {item.isPinned && <Pin size={10} className="text-indigo-500 fill-current" />}
                        {isPublished && !item.isPinned && <span className="px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded text-[9px] font-black uppercase">Published</span>}
                        {isPages && <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[8px] font-black uppercase tracking-tighter">Site Page</span>}
                      </div>
                      <p className="text-[12px] text-slate-500 truncate mt-1">
                        {isEpisodesView ? item.subTitle : (item.description || item.slug || '')}
                      </p>
                   </div>
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {!isEpisodesView && !isGenres && !isPages && (
                        <>
                          <button onClick={() => handlePublishToggle(item)} className={`p-2.5 transition-all ${isPublished ? 'text-green-500' : 'text-slate-400 hover:text-white'}`} title="Publish/Unpublish">
                            {isPublished ? <CheckCircle2 size={18} /> : <CloudUpload size={18} />}
                          </button>
                          <button onClick={() => handlePinToggle(item)} className={`p-2.5 transition-all ${item.isPinned ? 'text-indigo-500' : 'text-slate-400 hover:text-white'}`} title="Pin/Unpin">
                             <Pin size={18} fill={item.isPinned ? 'currentColor' : 'none'} />
                          </button>
                        </>
                      )}
                      <button className="p-2.5 text-slate-400 hover:text-white"><Edit2 onClick={() => {
                        if (isGenres) {
                          setEditingGenre(item);
                          setMode('editor');
                        } else if (isPages) {
                          setEditingPage(item);
                          setMode('editor');
                        } else if (isEpisodesView) {
                          setEditingEpisode(item);
                          setFormData({
                            ...getInitialFormData(item.type || 'series'),
                            ...item,
                            id: item.id,
                            title: item.title,
                            overview: item.overview,
                            number: item.number,
                            runtime: item.runtime || '34',
                            videoQuality: item.videoQuality || 'Choose',
                            view: item.view || '0',
                            videos: item.videos || [], 
                            images: item.images || [],
                            posterUrl: item.img || item.thumbnailUrl,
                            langue: item.langue || ['VF'],
                            slug: item.slug || slugify(item.title || ''),
                            currentSeasonNum: item.seasonNumber || 1,
                            currentEpisodeNum: item.number || 1
                          });
                          setMode('editor'); 
                          setActiveTab('Overview'); 
                        } else {
                          setEditingEpisode(null);
                          setFormData({
                            ...getInitialFormData(item.type || 'movie'), 
                            ...item, 
                            videos: item.videos || [], 
                            currentSeasonNum: item.season || 1, 
                            currentEpisodeNum: item.episode || 1
                          }); 
                          setMode('editor'); 
                          setActiveTab('Overview'); 
                        }
                      }} size={18} /></button>
                      <button onClick={() => { 
                        if(window.confirm('Supprimer définitivement cet élément ?')) {
                          if (isGenres) {
                            setGenres(prev => prev.filter(g => g.id !== item.id));
                          } else if (isPages) {
                            setPages(prev => prev.filter(p => p.id !== item.id));
                          } else {
                            onRemoveContent && onRemoveContent(item.tmdbId || item.id);
                          }
                        } 
                      }} className="p-2.5 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                   </div>
                 </div>
               );
             })}
           </div>
           
           <div className="p-4 px-6 bg-black/20 flex items-center justify-between border-t border-white/5">
             <span className="text-[12px] font-medium text-slate-500">Showing {(currentPage-1)*12 + 1} - {Math.min(currentPage*12, data.length)} of {data.length}</span>
             <div className="flex gap-2">
               <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="flex items-center gap-2 bg-[#1a1a1c] border border-white/5 px-4 py-2 rounded-lg text-[12px] font-bold text-slate-300 disabled:opacity-20 hover:text-white transition-all"><ChevronLeft size={16} /> Prev</button>
               <button onClick={() => setCurrentPage(p => p+1)} disabled={data.length <= currentPage * 12} className="flex items-center gap-2 bg-[#1a1a1c] border border-white/5 px-4 py-2 rounded-lg text-[12px] font-bold text-slate-300 hover:text-white transition-all">Next <ChevronRight size={16} /></button>
             </div>
           </div>
        </div>
        <div className="text-[12px] font-medium text-slate-500">
           Showing 1 - {Math.min(12, data.length)} of {data.length}
        </div>
      </div>
    );
  };

  const renderPermalinkSettings = () => {
    const inputClass = "w-full bg-white border border-slate-300 rounded p-3 text-sm text-black focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-medium";
    const labelClass = "text-[14px] font-black text-white mb-2 block";
    const sectionHeaderClass = "text-lg font-black text-white uppercase tracking-tight mb-4 border-b border-white/5 pb-2";
    const descClass = "text-[12px] text-slate-400 italic mb-6 leading-relaxed max-w-2xl";

    return (
      <div className="max-w-4xl animate-in fade-in duration-500 pb-20 space-y-12">
        <section>
          <h2 className={sectionHeaderClass}>Facultatif</h2>
          <p className={descClass}>
            Si vous le souhaitez, vous pouvez spécifier ici une structure personnalisée pour les URL de vos étiquettes et de vos catégories. Par exemple, en utilisant <span className="text-cyan-400 font-bold">sujets</span> comme préfixe pour vos catégories, vous obtiendrez des adresses web comme <span className="text-cyan-400 font-bold">https://www.example.com/sujets/non-classe/</span> . Si vous laissez ce champ vide, la valeur par défaut sera appliquée.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div>
              <label className={labelClass}>Préfixe des catégories</label>
              <input type="text" className={inputClass} value={permalinkSettings.categoryPrefix} onChange={e => setPermalinkSettings({...permalinkSettings, categoryPrefix: e.target.value})} />
            </div>
            <div>
              <label className={labelClass}>Préfixe des étiquettes</label>
              <input type="text" className={inputClass} value={permalinkSettings.tagPrefix} onChange={e => setPermalinkSettings({...permalinkSettings, tagPrefix: e.target.value})} />
            </div>
          </div>
        </section>

        <section>
          <h2 className={sectionHeaderClass}>TR Grabber - Permalink Settings</h2>
          <div className="space-y-4">
            {[
              { label: 'Movies', key: 'moviePath' },
              { label: 'Series', key: 'seriesPath' },
              { label: 'Season', key: 'seasonPath' },
              { label: 'Episode', key: 'episodePath' },
              { label: 'manga', key: 'mangaPath' },
              { label: 'scan', key: 'scanPath' }
            ].map(item => (
              <div key={item.key} className="flex items-center gap-4">
                 <span className="text-[14px] font-black text-white w-24 shrink-0">{item.label}</span>
                 <span className="text-[12px] text-slate-500 font-bold">https://www.example.com/</span>
                 <input 
                  type="text" 
                  className={`${inputClass} !py-2 !px-4 !w-[300px]`} 
                  value={permalinkSettings[item.key as keyof typeof permalinkSettings]} 
                  onChange={e => setPermalinkSettings({...permalinkSettings, [item.key]: e.target.value})} 
                 />
                 <span className="text-[12px] text-slate-500 font-bold">/name/</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className={sectionHeaderClass}>Réglages les plus courants</h2>
          <p className={descClass}>
            Sélectionnez la structure de permaliens de votre site. L'inclusion de la balise <span className="text-cyan-400 font-bold">%postname%</span> rend les liens plus faciles à lire et peut aider le référencement de vos publications.
          </p>
          <div className="space-y-6 mt-4">
            {[
              { id: 'simple', label: 'Simple', example: 'https://vf.vostanime.fr/?p=123' },
              { id: 'date', label: 'Date et titre', example: 'https://vf.vostanime.fr/2026/01/13/exemple-article/' },
              { id: 'month', label: 'Mois et titre', example: 'https://vf.vostanime.fr/2026/01/exemple-article/' },
              { id: 'numeric', label: 'Numérique', example: 'https://vf.vostanime.fr/archives/123' },
              { id: 'postname', label: 'Titre de la publication', example: 'https://vf.vostanime.fr/exemple-article/' },
              { id: 'custom', label: 'Structure personnalisée', example: 'https://vf.vostanime.fr/' }
            ].map(struct => (
              <div key={struct.id} className="flex flex-col gap-1">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="permalink_struct" 
                      className="w-4 h-4 accent-cyan-500" 
                      checked={permalinkSettings.structure === struct.id}
                      onChange={() => setPermalinkSettings({...permalinkSettings, structure: struct.id})}
                    />
                    <div className="flex flex-col">
                       <span className="text-[14px] font-black text-white group-hover:text-cyan-400 transition-colors">{struct.label}</span>
                       <span className="text-[12px] text-slate-500 font-medium">{struct.example}</span>
                    </div>
                 </label>
                 {struct.id === 'custom' && (
                   <div className="mt-2 ml-7 space-y-4">
                      <input 
                        type="text" 
                        className={inputClass} 
                        value={permalinkSettings.customStructure} 
                        onChange={e => setPermalinkSettings({...permalinkSettings, customStructure: e.target.value})}
                      />
                      <div className="flex flex-wrap gap-2">
                        {['%year%', '%monthnum%', '%day%', '%hour%', '%minute%', '%second%', '%post_id%', '%postname%', '%category%', '%author%'].map(tag => (
                          <button 
                            key={tag} 
                            onClick={() => setPermalinkSettings({...permalinkSettings, customStructure: permalinkSettings.customStructure + tag})}
                            className="bg-[#121821] border border-white/10 hover:border-cyan-500/50 text-[10px] font-black text-[#70ccff] hover:text-white px-3 py-1.5 rounded transition-all"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                   </div>
                 )}
              </div>
            ))}
          </div>
        </section>

        <button 
          onClick={() => {
            setIsSaving(true);
            setTimeout(() => {
              setIsSaving(false);
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 2000);
            }, 800);
          }}
          className={`w-full py-4 bg-[#00A1FA] hover:bg-cyan-500 text-white font-black text-[12px] uppercase tracking-[0.2em] rounded shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${saveSuccess ? 'bg-green-600' : ''}`}
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? 'Enregistrement...' : saveSuccess ? 'Modifications Enregistrées' : 'Enregistrer les modifications'}
        </button>
      </div>
    );
  };

  const renderGenreEditor = () => {
    if (!editingGenre) return null;
    const inputClass = "w-full bg-[#1b1b1f] border border-transparent rounded-lg p-3 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium";
    const labelClass = "text-[13px] font-black text-slate-300 mb-2 block";
    
    return (
      <div className="max-w-2xl animate-in fade-in duration-500 pb-20 space-y-8">
        <div>
          <label className={labelClass}>Title</label>
          <input 
            type="text" 
            className={inputClass} 
            value={editingGenre.name} 
            onChange={e => setEditingGenre({...editingGenre, name: e.target.value, slug: slugify(e.target.value)})}
            placeholder="Title"
          />
          <div className="mt-2 text-[11px] font-medium text-slate-500">
            Permalink <span className="text-indigo-400">https://watchug.codelug.com/ {editingGenre.slug || slugify(editingGenre.name)}</span>
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea 
            rows={5} 
            className={`${inputClass} resize-none`} 
            value={editingGenre.description || ''}
            onChange={e => setEditingGenre({...editingGenre, description: e.target.value})}
            placeholder="Description"
          />
        </div>

        <div>
          <label className={labelClass}>Color</label>
          <input 
            type="text" 
            className={inputClass} 
            value={editingGenre.color || ''}
            onChange={e => setEditingGenre({...editingGenre, color: e.target.value})}
            placeholder="Color"
          />
        </div>

        <div className="h-px bg-white/5 my-8"></div>

        <div>
          <label className={labelClass}>Meta Title</label>
          <input 
            type="text" 
            className={inputClass} 
            value={editingGenre.metaTitle || ''}
            onChange={e => setEditingGenre({...editingGenre, metaTitle: e.target.value})}
            placeholder="Meta Title"
          />
        </div>

        <div>
          <label className={labelClass}>Meta Description</label>
          <textarea 
            rows={4} 
            className={`${inputClass} resize-none`} 
            value={editingGenre.metaDescription || ''}
            onChange={e => setEditingGenre({...editingGenre, metaDescription: e.target.value})}
            placeholder="Meta Description"
          />
        </div>

        <div className="space-y-4">
          <label className={labelClass}>Advanced</label>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setEditingGenre({...editingGenre, showFeatured: !editingGenre.showFeatured})}
               className={`admin-toggle-btn ${editingGenre.showFeatured ? 'on' : 'off'}`}
             >
                <div className="admin-toggle-circle"></div>
             </button>
             <span className="text-[12px] font-medium text-slate-300">Show featured</span>
          </div>
        </div>

        <button 
          onClick={handleSaveGenre}
          className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl ${saveSuccess ? 'bg-green-600' : 'bg-[#5e5ce6] hover:bg-[#4d4acb] text-white'}`}
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
          {isSaving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save change'}
        </button>
      </div>
    );
  };

  const renderPageEditor = () => {
    if (!editingPage) return null;
    const inputClass = "w-full bg-[#1b1b1f] border border-transparent rounded-lg p-3 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium";
    const labelClass = "text-[13px] font-black text-slate-300 mb-2 block";
    
    return (
      <div className="max-w-2xl animate-in fade-in duration-500 pb-20 space-y-8">
        <div className="flex items-center gap-4 mb-6">
           <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
             <FilePlus size={24} />
           </div>
           <div>
             <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Manage Page</h2>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Editing static site structure</p>
           </div>
        </div>

        <div>
          <label className={labelClass}>Title</label>
          <input 
            type="text" 
            className={inputClass} 
            value={editingPage.title} 
            onChange={e => setEditingPage({...editingPage, title: e.target.value, slug: slugify(e.target.value)})}
            placeholder="Title"
          />
          <div className="mt-2 text-[11px] font-medium text-slate-500">
            Permalink <span className="text-indigo-400">https://planet-streaming.com/{editingPage.slug || slugify(editingPage.title)}</span>
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea 
            rows={5} 
            className={`${inputClass} resize-none`} 
            value={editingPage.description || ''}
            onChange={e => setEditingPage({...editingPage, description: e.target.value})}
            placeholder="Page description"
          />
        </div>

        <div>
          <label className={labelClass}>Color</label>
          <input 
            type="text" 
            className={inputClass} 
            value={editingPage.color || ''}
            onChange={e => setEditingPage({...editingPage, color: e.target.value})}
            placeholder="UI Branding Color (e.g. #00A1FA)"
          />
        </div>

        <div className="h-px bg-white/5 my-8"></div>

        <div>
          <label className={labelClass}>Meta Title</label>
          <input 
            type="text" 
            className={inputClass} 
            value={editingPage.metaTitle || ''}
            onChange={e => setEditingPage({...editingPage, metaTitle: e.target.value})}
            placeholder="SEO Meta Title"
          />
        </div>

        <div>
          <label className={labelClass}>Meta Description</label>
          <textarea 
            rows={4} 
            className={`${inputClass} resize-none`} 
            value={editingPage.metaDescription || ''}
            onChange={e => setEditingPage({...editingPage, metaDescription: e.target.value})}
            placeholder="SEO Meta Description"
          />
        </div>

        <div className="space-y-4">
          <label className={labelClass}>Advanced</label>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setEditingPage({...editingPage, showFeatured: !editingPage.showFeatured})}
               className={`admin-toggle-btn ${editingPage.showFeatured ? 'on' : 'off'}`}
             >
                <div className="admin-toggle-circle"></div>
             </button>
             <span className="text-[12px] font-medium text-slate-300">Show featured in navigation</span>
          </div>
        </div>

        <button 
          onClick={handleSavePage}
          className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl ${saveSuccess ? 'bg-green-600' : 'bg-[#5e5ce6] hover:bg-[#4d4acb] text-white'}`}
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? 'Updating...' : saveSuccess ? 'Page Saved' : 'Save change'}
        </button>
      </div>
    );
  };

  const renderSettingsSlider = () => {
    const inputClass = "w-full bg-[#1b1b1f] border border-transparent rounded-lg p-3 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium";
    const labelClass = "text-[13px] font-black text-slate-300 mb-2 block";
    
    // Editor for a specific slider
    if (editingSliderId) {
      const slider = sliderConfigs.find(s => s.id === editingSliderId);
      if (!slider) return null;

      return (
        <div className="max-w-2xl animate-in fade-in duration-500 pb-20 space-y-8">
           <div className="bg-[#121214] border border-white/5 rounded-xl p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                 <ArrowUpDown size={18} className="text-indigo-400" />
                 <h2 className="text-white font-black text-lg uppercase tracking-tight italic">{slider.name}</h2>
              </div>

              <div>
                <label className={labelClass}>Heading</label>
                <input 
                  type="text" 
                  className={inputClass} 
                  value={slider.heading} 
                  onChange={e => {
                    const next = sliderConfigs.map(s => s.id === editingSliderId ? { ...s, heading: e.target.value } : s);
                    setSliderConfigs(next);
                  }}
                  placeholder="Slider"
                />
              </div>

              <div>
                <label className={labelClass}>Limit</label>
                <input 
                  type="number" 
                  className={inputClass} 
                  value={slider.limit} 
                  onChange={e => {
                    const next = sliderConfigs.map(s => s.id === editingSliderId ? { ...s, limit: parseInt(e.target.value) || 0 } : s);
                    setSliderConfigs(next);
                  }}
                  placeholder="6"
                />
              </div>

              <div className="flex items-center gap-4 py-2">
                 <button 
                   onClick={() => {
                     const next = sliderConfigs.map(s => s.id === editingSliderId ? { ...s, isActive: !s.isActive } : s);
                     setSliderConfigs(next);
                   }}
                   className={`admin-toggle-btn ${slider.isActive ? 'on' : 'off'}`}
                 >
                    <div className="admin-toggle-circle"></div>
                 </button>
                 <span className="text-[13px] font-black text-slate-300 uppercase">Active</span>
              </div>
           </div>

           <button 
             onClick={() => {
               setIsSaving(true);
               setTimeout(() => {
                 setIsSaving(false);
                 setSaveSuccess(true);
                 setTimeout(() => {
                   setSaveSuccess(false);
                   setEditingSliderId(null);
                 }, 1000);
               }, 600);
             }}
             className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl ${saveSuccess ? 'bg-green-600' : 'bg-[#5e5ce6] hover:bg-[#4d4acb] text-white'}`}
           >
             {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
             {isSaving ? 'Updating...' : saveSuccess ? 'Saved' : 'Save change'}
           </button>
        </div>
      );
    }

    // Main List View
    return (
      <div className="max-w-4xl space-y-10 animate-in fade-in duration-500 pb-20">
        <section className="space-y-6">
           <h3 className="text-white font-black text-sm uppercase tracking-widest italic border-l-4 border-indigo-500 pl-4">Advanced</h3>
           <div className="space-y-4">
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setAdvancedSettings({...advancedSettings, topThisWeek: !advancedSettings.topThisWeek})}
                   className={`admin-toggle-btn ${advancedSettings.topThisWeek ? 'on' : 'off'}`}
                 >
                    <div className="admin-toggle-circle"></div>
                 </button>
                 <span className="text-[13px] font-bold text-slate-300">Top this week</span>
              </div>

              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setAdvancedSettings({...advancedSettings, showFeaturedGenres: !advancedSettings.showFeaturedGenres})}
                   className={`admin-toggle-btn ${advancedSettings.showFeaturedGenres ? 'on' : 'off'}`}
                 >
                    <div className="admin-toggle-circle"></div>
                 </button>
                 <span className="text-[13px] font-bold text-slate-300">Show featured genres in listing</span>
              </div>

              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setAdvancedSettings({...advancedSettings, showAltTitle: !advancedSettings.showAltTitle})}
                   className={`admin-toggle-btn ${advancedSettings.showAltTitle ? 'on' : 'off'}`}
                 >
                    <div className="admin-toggle-circle"></div>
                 </button>
                 <span className="text-[13px] font-bold text-slate-300">Show alternative title</span>
              </div>
           </div>
        </section>

        <div className="h-px bg-white/5"></div>

        <section className="space-y-3">
           {sliderConfigs.map(slider => (
             <div key={slider.id} className="bg-[#121214] border border-white/5 rounded-xl p-5 flex items-center justify-between group hover:bg-black/40 transition-all shadow-xl">
                <div className="flex items-center gap-4">
                   <ArrowUpDown size={18} className="text-slate-600 group-hover:text-indigo-400 cursor-grab" />
                   <span className="text-[14px] font-bold text-slate-200 uppercase tracking-tight">{slider.name}</span>
                </div>
                <button 
                  onClick={() => setEditingSliderId(slider.id)}
                  className="p-2 text-slate-600 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                   <GearIcon size={18} />
                </button>
             </div>
           ))}
        </section>

        <div className="pt-4">
           <button 
             onClick={() => {
               setIsSaving(true);
               setTimeout(() => {
                 setIsSaving(false);
                 setSaveSuccess(true);
                 setTimeout(() => setSaveSuccess(false), 2000);
               }, 800);
             }}
             className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl ${saveSuccess ? 'bg-green-600' : 'bg-[#5e5ce6] hover:bg-[#4d4acb] text-white'}`}
           >
             {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
             {isSaving ? 'Saving Settings...' : saveSuccess ? 'Settings Saved' : 'Save change'}
           </button>
        </div>
      </div>
    );
  };

  const renderStatistics = () => {
    // Real Calculations from addedContent
    const totalMovies = addedContent.filter(m => m.type === 'movie').length;
    const totalAnimes = addedContent.filter(m => m.type === 'series' || m.type === 'anime').length;
    const totalManga = addedContent.filter(m => m.type === 'manga').length;
    
    let totalEpisodes = 0;
    let totalScans = 0;

    addedContent.forEach(m => {
      if (m.type === 'series' || m.type === 'anime') {
        m.seasons?.forEach(s => {
          totalEpisodes += (s.episodes?.length || 0);
        });
      } else if (m.type === 'manga') {
        m.seasons?.forEach(s => {
          totalScans += (s.episodes?.length || 0);
        });
      }
    });

    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-white font-black text-3xl uppercase tracking-tighter italic futuristic-font flex items-center gap-3">
              GLOBAL ANALYTICS
              <span className="animate-pulse h-2 w-2 rounded-full bg-cyan-500"></span>
            </h1>
            <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em]">REAL-TIME PLATFORM PERFORMANCE MONITORING</p>
          </div>
          <div className="flex bg-[#121214] border border-white/10 rounded-lg p-1">
             {['24H', '7D', '30D'].map((t) => (
               <button key={t} className={`px-5 py-2 text-[10px] font-black uppercase rounded ${t === '7D' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(0,161,250,0.4)]' : 'text-slate-500 hover:text-white transition-colors'}`}>{t}</button>
             ))}
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { label: 'POST ANIME', value: totalAnimes, icon: <Tv size={24} />, color: 'text-cyan-500' },
            { label: 'POST FILMS', value: totalMovies, icon: <Film size={24} />, color: 'text-purple-500' },
            { label: 'POST MANGA', value: totalManga, icon: <BookOpen size={24} />, color: 'text-orange-500' },
            { label: 'EPISODES', value: totalEpisodes, icon: <PlaySquare size={24} />, color: 'text-green-500' },
            { label: 'SCANS', value: totalScans, icon: <LucideImage size={24} />, color: 'text-red-500' }
          ].map((stat, i) => (
            <div key={i} className="bg-[#121214] border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
               <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 opacity-5 rounded-full bg-white group-hover:scale-110 transition-transform duration-700`}></div>
               <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-black/40 border border-white/5 ${stat.color}`}>{stat.icon}</div>
                  <div className={`flex items-center gap-1 text-[10px] font-black text-green-500`}>
                    <ArrowUpRight size={14} /> ACTIVE
                  </div>
               </div>
               <div className="space-y-1">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">{stat.label}</span>
                 <span className="text-3xl font-black text-white italic futuristic-font">{stat.value}</span>
               </div>
            </div>
          ))}
        </div>

        {/* Performance & Usage Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Traffic Trend Chart Placeholder */}
           <div className="lg:col-span-2 bg-[#121214] border border-white/5 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-cyan-500" size={20} />
                  <h3 className="text-white font-black text-sm uppercase tracking-widest">CONTENT BREAKDOWN (GENRES)</h3>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                   <span className="text-[9px] font-black text-slate-500 uppercase">Live Distribution</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {statsAnalytics.genres.map(([genre, count], idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black">
                      <span className="text-slate-400 uppercase tracking-widest">{genre}</span>
                      <span className="text-cyan-400 italic">{count} Titles</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 shadow-[0_0_10px_rgba(0,161,250,0.5)] transition-all duration-1000"
                        style={{ width: `${(count / (addedContent.length || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {statsAnalytics.genres.length === 0 && (
                   <div className="h-[200px] flex items-center justify-center italic text-slate-600 text-[11px] uppercase tracking-widest">
                      Add content to view breakdown
                   </div>
                )}
              </div>
           </div>

           {/* Platform Usage & Server Load */}
           <div className="space-y-8">
              <div className="bg-[#121214] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <HardDrive className="text-purple-500" size={18} />
                  <h3 className="text-white font-black text-sm uppercase tracking-widest">QUALITY STANDARDS</h3>
                </div>
                <div className="space-y-5">
                   {statsAnalytics.qualities.map(([q, count]) => (
                     <div key={q} className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black">
                          <div className="flex items-center gap-2 text-slate-400">
                             <FileVideo size={14} className="text-purple-500" /> {q}
                          </div>
                          <span className="text-white italic">{Math.round((count / (addedContent.length || 1)) * 100)}%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className={`h-full bg-purple-600 shadow-[0_0_10px_purple]`} style={{ width: `${(count / (addedContent.length || 1)) * 100}%` }}></div>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              <div className="bg-[#121214] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="text-cyan-500" size={18} />
                  <h3 className="text-white font-black text-sm uppercase tracking-widest">DATABASE HEALTH</h3>
                </div>
                <div className="flex items-end justify-between gap-6">
                   <div className="space-y-1">
                      <div className="text-3xl font-black text-white italic futuristic-font">{statsAnalytics.health}% <span className="text-green-500 text-[10px] font-black uppercase tracking-widest not-italic">PUBLISHED</span></div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">RATIO PUBLISHED VS DRAFT</p>
                   </div>
                   <Zap className="text-yellow-500 animate-pulse" size={24} />
                </div>
              </div>
           </div>
        </div>

        {/* Bottom Section: Top Content & Real-time Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Top Content (Real Sorted) */}
           <div className="bg-[#121214] border border-white/5 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Star className="text-yellow-500" size={20} />
                  <h3 className="text-white font-black text-sm uppercase tracking-widest italic">REAL TOP PERFORMERS</h3>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-white/5">
                   <Eye size={14} className="text-slate-500" />
                   <span className="text-[9px] font-black text-white">{statsAnalytics.totalViews} TOTAL</span>
                </div>
              </div>
              <div className="space-y-4">
                 {statsAnalytics.topViewed.map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-slate-700 italic">{(i + 1).toString().padStart(2, '0')}</span>
                        <div className="w-10 h-14 bg-black/60 rounded border border-white/5 overflow-hidden flex-shrink-0">
                           <img src={item.posterUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                        </div>
                        <span className={`text-[11px] font-black uppercase tracking-tight text-[#70ccff] group-hover:scale-105 transition-transform truncate max-w-[150px]`}>{item.title}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{item.views || 0} views</span>
                        <div className="flex items-center gap-1.5">
                           <TrendingUp size={14} className="text-green-500" />
                        </div>
                   </div>
                   </div>
                 ))}
                 {statsAnalytics.topViewed.length === 0 && (
                   <div className="h-40 flex items-center justify-center italic text-slate-700 uppercase tracking-widest text-[11px]">No content tracked yet</div>
                 )}
              </div>
           </div>

           {/* Language Analytics */}
           <div className="bg-[#121214] border border-white/5 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Globe2 className="text-cyan-500" size={20} />
                  <h3 className="text-white font-black text-sm uppercase tracking-widest italic">LANGUAGE PENETRATION</h3>
                </div>
              </div>
              <div className="space-y-6">
                 {statsAnalytics.langs.map(([lang, count], i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-7 rounded border border-white/10 overflow-hidden shadow-lg">
                            <img src={`https://raw.githubusercontent.com/Anime-Sama/IMG/img/autres/flag_${AVAILABLE_LANGUAGES.find(l => l.id === lang)?.flag || 'fr'}.png`} className="w-full h-full object-cover" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[11px] font-black text-white">{lang}</span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase">{count} Entries</span>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-[14px] font-black text-cyan-400 italic futuristic-font">{Math.round((count / (addedContent.length || 1)) * 100)}%</div>
                         <div className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">OF TOTAL LIBRARY</div>
                      </div>
                   </div>
                 ))}
                 {statsAnalytics.langs.length === 0 && (
                    <div className="h-40 flex items-center justify-center italic text-slate-700 uppercase tracking-widest text-[11px]">Sync content to view analytics</div>
                 )}
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderAdsManagement = () => {
    const zones = [
      { id: 'headerBottom', label: 'Header Bottom', size: 'Banner 728x90' },
      { id: 'topList', label: 'Top List', size: 'Banner 728x90' },
      { id: 'bottomList', label: 'Bottom List', size: 'Banner 728x90' },
      { id: 'singleMovieTop', label: 'Single Movies Top', size: 'Banner 728x90' },
      { id: 'singleMovieBottom', label: 'Single Movies Bottom', size: 'Banner 728x90' },
      { id: 'singleSeriesTop', label: 'Single Series Top', size: 'Banner 728x90' },
      { id: 'singleSeriesBottom', label: 'Single Series Bottom', size: 'Banner 728x90' },
      { id: 'singleSeasonTop', label: 'Single Season Top', size: 'Banner 728x90' },
      { id: 'singleSeasonBottom', label: 'Single Season Bottom', size: 'Banner 728x90' },
      { id: 'singleEpisodeTop', label: 'Single Episode Top', size: 'Banner 728x90' },
      { id: 'singleEpisodeBottom', label: 'Single Episode Bottom', size: 'Banner 728x90' },
      { id: 'singlePlayerTop', label: 'Single Player Top', size: 'Banner 468x60' },
      { id: 'singlePlayerBottom', label: 'Single Player Bottom', size: 'Banner 468x60' },
      { id: 'singlePlayerInside', label: 'Single Player Inside', size: 'Banner 300x250' },
      { id: 'sidebarLeft', label: 'Sidebar Left', size: 'Banner 160x600' },
      { id: 'sidebarRight', label: 'Sidebar Right', size: 'Banner 160x600' }
    ];

    const handleSaveAds = () => {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }, 800);
    };

    const handleClearZone = (zoneId: string) => {
       if (window.confirm(`Effacer tout le code de la zone "${zoneId}" ?`)) {
          setAdsConfig({
            ...adsConfig,
            [zoneId]: { ...adsConfig[zoneId], desktop: '', mobile: '' }
          });
       }
    };

    const handleToggleZone = (zoneId: string) => {
       setAdsConfig({
         ...adsConfig,
         [zoneId]: { ...adsConfig[zoneId], enabled: !adsConfig[zoneId].enabled }
       });
    };

    const copyTag = (zoneId: string) => {
       const tag = `<?php tr_banners('${zoneId}'); ?>`;
       navigator.clipboard.writeText(tag);
       alert(`Copié : ${tag}`);
    };

    return (
      <div className="max-w-5xl space-y-10 animate-in fade-in duration-700 pb-20">
        <div className="bg-[#121821] border-l-4 border-cyan-500 p-6 rounded shadow-xl">
           <p className="text-[12px] text-slate-300 font-medium leading-relaxed">
             Manage ads on your site easily. Remember that if you add desktop ads they will not be seen on mobile unless you also add it on mobile. Keep in mind that if you exceed 300px wide and your banner is not responsive it will not fit well to all screens.
           </p>
        </div>

        <div className="grid grid-cols-1 gap-16">
          {zones.map((zone) => {
            const currentView = activeAdView[zone.id] || 'desktop';
            const isEnabled = adsConfig[zone.id].enabled;
            return (
              <div key={zone.id} className={`space-y-4 p-6 rounded-xl border transition-all ${isEnabled ? 'bg-black/40 border-white/5' : 'bg-red-500/5 border-red-500/10 grayscale-[0.5]'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                       <h3 className="text-white font-black text-base uppercase tracking-tight italic flex items-center gap-2">
                         {zone.label} 
                         {!isEnabled && <Ban size={14} className="text-red-500" />}
                       </h3>
                       <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{zone.size}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                     <button 
                       onClick={() => copyTag(zone.id)}
                       className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-black text-slate-400 hover:text-[#70ccff] transition-all flex items-center gap-2 uppercase tracking-tighter"
                       title="Copier le tag PHP"
                     >
                       <Copy size={12} /> tr_banners('{zone.id}')
                     </button>
                     
                     <button 
                       onClick={() => handleToggleZone(zone.id)}
                       className={`px-4 py-2 rounded text-[10px] font-black uppercase transition-all flex items-center gap-2 border ${isEnabled ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}
                     >
                       {isEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                       {isEnabled ? 'Activé' : 'Désactivé'}
                     </button>

                     <button 
                       onClick={() => handleClearZone(zone.id)}
                       className="p-2 bg-black/40 border border-white/5 text-slate-600 hover:text-red-500 hover:border-red-500/30 rounded transition-all"
                       title="Vider la zone"
                     >
                        <Ban size={16} />
                     </button>
                  </div>
                </div>

                <div className="flex gap-2">
                   <button 
                    onClick={() => setActiveAdView({...activeAdView, [zone.id]: 'desktop'})}
                    className={`px-6 py-2 rounded text-[11px] font-black uppercase transition-all ${currentView === 'desktop' ? 'bg-[#00A1FA] text-white shadow-[0_0_15px_rgba(0,161,250,0.3)]' : 'bg-[#1a1a1c] text-slate-500 hover:text-white'}`}
                   >
                     Desktop
                   </button>
                   <button 
                    onClick={() => setActiveAdView({...activeAdView, [zone.id]: 'mobile'})}
                    className={`px-6 py-2 rounded text-[11px] font-black uppercase transition-all ${currentView === 'mobile' ? 'bg-[#00A1FA] text-white shadow-[0_0_15px_rgba(0,161,250,0.3)]' : 'bg-[#1a1a1c] text-slate-500 hover:text-white'}`}
                   >
                     Mobile
                   </button>
                </div>

                <textarea 
                  rows={4}
                  placeholder="Insert code here"
                  className="w-full bg-[#050505] border border-white/5 rounded-lg p-5 text-xs text-[#70ccff] font-mono focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-800 shadow-inner"
                  value={adsConfig[zone.id][currentView]}
                  onChange={(e) => {
                    const newConfig = { ...adsConfig };
                    newConfig[zone.id][currentView] = e.target.value;
                    setAdsConfig(newConfig);
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-bottom-10 duration-500">
          <button 
            onClick={handleSaveAds}
            className={`px-10 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_10px_50px_rgba(0,0,0,0.8)] border-2 ${saveSuccess ? 'bg-green-600 border-green-400' : 'bg-[#0071b9] hover:bg-cyan-500 border-[#00A1FA]/40 text-white'}`}
          >
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {saveSuccess ? 'MODIFICATIONS ENREGISTRÉES' : 'ENREGISTRER LES PUBS'}
          </button>
        </div>
      </div>
    );
  };

  const renderAdBlockManagement = () => {
    const handleSaveAdBlock = () => {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }, 800);
    };

    return (
      <div className="max-w-4xl animate-in fade-in duration-700 pb-20">
        <style>{`
          .adblock-toggle {
            position: relative;
            width: 54px;
            height: 28px;
            background: #ffb7b7;
            border-radius: 999px;
            cursor: pointer;
            transition: all 0.3s;
          }
          .adblock-toggle.active {
            background: #ff4d4d;
          }
          .adblock-toggle-circle {
            position: absolute;
            top: 4px;
            left: 4px;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          .adblock-toggle.active .adblock-toggle-circle {
            left: 30px;
          }
          .adblock-input {
            background: #ffffff !important;
            color: #333 !important;
            font-weight: 700 !important;
          }
          .save-btn-adblock {
            background: linear-gradient(135deg, #ff4d4d 0%, #7c0000 100%);
            box-shadow: 0 10px 20px rgba(255, 77, 77, 0.3);
          }
          .save-btn-adblock:hover {
            box-shadow: 0 15px 30px rgba(255, 77, 77, 0.5);
            transform: translateY(-2px);
          }
        `}</style>

        <div className="flex items-center gap-3 mb-10">
           <Flower2 size={32} className="text-[#ff4d4d] fill-[#ff4d4d]/20" />
           <h1 className="text-3xl font-bold text-[#ff4d4d] tracking-tight">AdBlock Notify Pro</h1>
        </div>

        <div className="bg-[#121821]/80 backdrop-blur-md border border-white/10 rounded-2xl p-10 shadow-2xl space-y-12">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <ShieldAlert size={20} className="text-[#ff4d4d]" />
                 <span className="text-sm font-bold text-[#ff4d4d] uppercase tracking-wider">Enable Detection</span>
              </div>
              <div 
                className={`adblock-toggle ${adBlockConfig.enabled ? 'active' : ''}`}
                onClick={() => setAdBlockConfig({...adBlockConfig, enabled: !adBlockConfig.enabled})}
              >
                 <div className="adblock-toggle-circle shadow-lg" />
              </div>
           </div>

           <div className="flex items-center justify-between gap-10">
              <div className="flex items-center gap-4 shrink-0">
                 <MessageSquare size={20} className="text-[#ff4d4d]" />
                 <span className="text-sm font-bold text-[#ff4d4d] uppercase tracking-wider">Notification Message</span>
              </div>
              <input 
                type="text"
                className="flex-1 adblock-input border-none rounded-lg p-3.5 text-sm focus:outline-none shadow-inner"
                value={adBlockConfig.message}
                onChange={(e) => setAdBlockConfig({...adBlockConfig, message: e.target.value})}
              />
           </div>

           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <Palette size={20} className="text-[#ff4d4d]" />
                 <span className="text-sm font-bold text-[#ff4d4d] uppercase tracking-wider">Background Color</span>
              </div>
              <div className="flex items-center bg-[#ffffff] rounded-lg overflow-hidden border border-white/10 w-48">
                 <div className="w-12 h-10 shrink-0" style={{ backgroundColor: adBlockConfig.bgColor }}></div>
                 <input 
                   type="text"
                   className="flex-1 bg-transparent border-none p-2 text-[10px] font-bold text-slate-400 focus:outline-none text-center"
                   value="Sélectionner une couleur"
                   readOnly
                 />
              </div>
           </div>

           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <Sparkles size={20} className="text-[#ff4d4d]" />
                 <span className="text-sm font-bold text-[#ff4d4d] uppercase tracking-wider">Sticker Character</span>
              </div>
              <div className="relative w-64">
                 <select 
                   className="w-full adblock-input border-none rounded-lg p-3.5 text-sm appearance-none focus:outline-none shadow-inner cursor-pointer"
                   value={adBlockConfig.sticker}
                   onChange={(e) => setAdBlockConfig({...adBlockConfig, sticker: e.target.value})}
                 >
                    <option>😻 Cute Cat</option>
                    <option>👮 Police Officer</option>
                    <option>🤖 Tech Robot</option>
                    <option>🌸 Sakura</option>
                 </select>
                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
              </div>
           </div>
        </div>

        <div className="mt-12">
           <button 
             onClick={handleSaveAdBlock}
             className="save-btn-adblock flex items-center gap-3 px-10 py-4 rounded-full text-white font-bold text-sm transition-all active:scale-95"
           >
              <Save size={18} />
              {isSaving ? 'Saving...' : saveSuccess ? 'Settings Saved' : 'Save Settings'}
           </button>
        </div>
      </div>
    );
  };

  const renderSettingsGeneral = () => {
    const inputClass = "w-full bg-[#1e1e22] border border-slate-800 rounded p-3 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium";
    const labelClass = "text-[12px] font-bold text-slate-400 mb-2 block uppercase tracking-tight flex items-center gap-2";
    
    return (
      <div className="max-w-4xl space-y-8 animate-in fade-in duration-700 pb-20">
         <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-white font-black text-3xl uppercase tracking-tighter italic futuristic-font">GENERAL SETTINGS</h1>
              <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em]">Configure core platform identity & features</p>
            </div>
            <button 
              onClick={() => { setIsSaving(true); setTimeout(() => { setIsSaving(false); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2000); }, 800); }}
              className={`px-8 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl ${saveSuccess ? 'bg-green-600' : 'bg-[#5e5ce6] hover:bg-[#4d4acb] text-white'}`}
            >
               {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
               {isSaving ? 'Updating...' : saveSuccess ? 'Settings Saved' : 'Save Configuration'}
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#121214] border border-white/5 rounded-2xl p-8 shadow-2xl space-y-6">
               <div className="flex items-center gap-3 mb-2 border-b border-white/5 pb-4">
                  <AppWindow className="text-indigo-500" size={20} />
                  <h3 className="text-white font-black text-sm uppercase tracking-widest">Site Identity</h3>
               </div>
               
               <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Site Title</label>
                    <input type="text" className={inputClass} value={siteSettings.siteName} onChange={e => setSiteSettings({...siteSettings, siteName: e.target.value})} placeholder="PLANET STREAM" />
                  </div>
                  <div>
                    <label className={labelClass}>Slogan / Tagline</label>
                    <input type="text" className={inputClass} value={siteSettings.siteTagline} onChange={e => setSiteSettings({...siteSettings, siteTagline: e.target.value})} placeholder="Streaming Illimité" />
                  </div>
                  <div>
                    <label className={labelClass}>Main Logo URL</label>
                    <input type="text" className={inputClass} value={siteSettings.siteLogo} onChange={e => setSiteSettings({...siteSettings, siteLogo: e.target.value})} placeholder="https://..." />
                  </div>
                  <div>
                    <label className={labelClass}>Favicon URL</label>
                    <input type="text" className={inputClass} value={siteSettings.siteLogo} onChange={e => setSiteSettings({...siteSettings, siteFavicon: e.target.value})} placeholder="https://..." />
                  </div>
               </div>
            </div>

            <div className="bg-[#121214] border border-white/5 rounded-2xl p-8 shadow-2xl space-y-6">
               <div className="flex items-center gap-3 mb-2 border-b border-white/5 pb-4">
                  <Monitor className="text-indigo-500" size={20} />
                  <h3 className="text-white font-black text-sm uppercase tracking-widest">Global Features</h3>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                     <div className="flex flex-col">
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Maintenance Mode</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Lock the site for public users</span>
                     </div>
                     <button 
                       onClick={() => setSiteSettings({...siteSettings, maintenanceMode: !siteSettings.maintenanceMode})}
                       className={`admin-toggle-btn ${siteSettings.maintenanceMode ? 'on' : 'off'}`}
                     >
                        <div className="admin-toggle-circle"></div>
                     </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                     <div className="flex flex-col">
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Allow User Registration</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Let new members join the platform</span>
                     </div>
                     <button 
                       onClick={() => setSiteSettings({...siteSettings, allowRegistration: !siteSettings.allowRegistration})}
                       className={`admin-toggle-btn ${siteSettings.allowRegistration ? 'on' : 'off'}`}
                     >
                        <div className="admin-toggle-circle"></div>
                     </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                     <div className="flex flex-col">
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Admin Email Alerts</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Notifications for broken links</span>
                     </div>
                     <button 
                       onClick={() => setSiteSettings({...siteSettings, emailNotifications: !siteSettings.emailNotifications})}
                       className={`admin-toggle-btn ${siteSettings.emailNotifications ? 'on' : 'off'}`}
                     >
                        <div className="admin-toggle-circle"></div>
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  };

  const renderSettingsSeo = () => {
    const inputClass = "w-full bg-[#1e1e22] border border-slate-800 rounded p-3 text-[11px] text-slate-400 placeholder:text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-bold tracking-tight";
    const labelClass = "text-[10px] font-black text-slate-500 mb-1.5 block uppercase tracking-[0.1em]";
    const variableClass = "text-[9px] text-[#5e5ce6] font-black uppercase tracking-widest mt-1 block opacity-80";

    const sections = [
      { key: 'site', label: 'Site', variables: '[sortable]' },
      { key: 'browse', label: 'Browse', variables: '[sortable]' },
      { key: 'manga', label: 'MANGA', variables: '[sortable]' },
      { key: 'movies', label: 'Movies', variables: '[sortable]' },
      { key: 'tvShows', label: 'TV Shows', variables: '[sortable]' },
      { key: 'genre', label: 'Genre', variables: '[genre] [sortable]' },
      { key: 'movie', label: 'Movie', variables: '[title] [description] [release] [country] [genre]' },
      { key: 'tvShow', label: 'TV Show', variables: '[title] [description] [release] [country] [genre]' },
      { key: 'scan', label: 'Scan', variables: '[title] [description] [release] [country] [genre]' },
      { key: 'episode', label: 'Episode', variables: '[title] [description] [release] [country] [genre]' },
      { key: 'tag', label: 'Tag', variables: '[tag]' },
      { key: 'search', label: 'Search', variables: '[search]' },
      { key: 'trending', label: 'Trending', variables: '[sortable]' },
      { key: 'topImdb', label: 'Top IMDb', variables: '[sortable]' },
      { key: 'profile', label: 'Profile', variables: '[username]' },
      { key: 'page', label: 'Page', variables: '[title]' }
    ];

    const handleSeoChange = (key: string, field: 'title' | 'description', value: string) => {
      setSeoSettings(prev => ({
        ...prev,
        [key]: { ...prev[key as keyof typeof seoSettings], [field]: value }
      }));
    };

    const handleSaveSeo = () => {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }, 800);
    };

    return (
      <div className="space-y-10 animate-in fade-in duration-700 pb-20">
         <div className="flex items-center gap-10 border-b border-white/5 mb-8">
            <button onClick={() => setSubView('settings-general')} className="pb-4 text-[12px] font-bold text-slate-500 hover:text-slate-300 uppercase transition-all">General</button>
            <button className="pb-4 text-[12px] font-bold text-indigo-400 uppercase relative">
               Seo
               <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_indigo]"></div>
            </button>
            <button onClick={() => setSubView('settings-sitemap')} className="pb-4 text-[12px] font-bold text-slate-500 hover:text-slate-300 uppercase transition-all">XML Sitemap</button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
            {sections.map((section) => (
              <React.Fragment key={section.key}>
                <div className="space-y-4">
                   <div>
                     <label className={labelClass}>{section.label} title</label>
                     <input 
                       type="text" 
                       className={inputClass} 
                       value={seoSettings[section.key as keyof typeof seoSettings].title}
                       onChange={e => handleSeoChange(section.key, 'title', e.target.value)}
                     />
                     <span className={variableClass}>Available variable: <span className="text-[#a855f7]">{section.variables}</span></span>
                   </div>
                </div>
                <div className="space-y-4">
                   <div>
                     <label className={labelClass}>{section.label} description</label>
                     <input 
                       type="text" 
                       className={inputClass} 
                       value={seoSettings[section.key as keyof typeof seoSettings].description}
                       onChange={e => handleSeoChange(section.key, 'description', e.target.value)}
                     />
                     <span className={variableClass}>Available variable: <span className="text-[#a855f7]">{section.variables}</span></span>
                   </div>
                </div>
              </React.Fragment>
            ))}
         </div>

         <div className="pt-10 border-t border-white/5">
            <button 
              onClick={handleSaveSeo}
              className={`px-12 py-4 rounded font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl ${saveSuccess ? 'bg-green-600' : 'bg-[#5e5ce6] hover:bg-[#4d4acb] text-white'}`}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Updating database...' : saveSuccess ? 'Settings Saved' : 'Save change'}
            </button>
         </div>
      </div>
    );
  };

  const renderSettingsSitemap = () => {
    const handleSitemapToggle = (key: keyof typeof sitemapSettings) => {
      setSitemapSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const SitemapItem = ({ label, code, active }: { label: string, code: string, active: boolean }) => (
      <div className="space-y-2">
        <label className="text-white font-black text-xs uppercase tracking-tight block">
          {label} ( <span className="text-slate-500 lowercase">{code}</span> )
        </label>
        <div className="flex bg-[#1a1a1c] border border-white/10 rounded overflow-hidden max-w-[280px]">
          <button 
            onClick={() => !active && handleSitemapToggle(code as any)}
            className={`flex-1 py-2 text-[9px] font-black uppercase transition-all ${active ? 'bg-[#9d174d] text-white shadow-inner' : 'bg-transparent text-slate-500 hover:text-white'}`}
          >
            Dans la sitemap
          </button>
          <button 
            onClick={() => active && handleSitemapToggle(code as any)}
            className={`flex-1 py-2 text-[9px] font-black uppercase transition-all ${!active ? 'bg-[#9d174d] text-white shadow-inner' : 'bg-transparent text-slate-500 hover:text-white'}`}
          >
            Pas dans la sitemap
          </button>
        </div>
      </div>
    );

    return (
      <div className="space-y-10 animate-in fade-in duration-700 pb-20">
         <div className="flex items-center gap-10 border-b border-white/5 mb-8">
            <button onClick={() => setSubView('settings-general')} className="pb-4 text-[12px] font-bold text-slate-500 hover:text-slate-300 uppercase transition-all">General</button>
            <button onClick={() => setSubView('settings-seo')} className="pb-4 text-[12px] font-bold text-slate-500 hover:text-slate-300 uppercase transition-all">Seo</button>
            <button className="pb-4 text-[12px] font-bold text-indigo-400 uppercase relative">
               XML Sitemap
               <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_indigo] text-center"></div>
            </button>
         </div>

         <div className="space-y-8 max-w-2xl">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <span className="text-slate-300 text-xs font-medium">Vous pouvez trouver votre fichier sitemap XML ici :</span>
                 <a href="/sitemap.xml" className="bg-white border border-slate-300 text-slate-600 px-3 py-1 rounded text-[10px] font-bold shadow-sm hover:bg-slate-50 transition-colors">XML Sitemap</a>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Vous n'avez <span className="font-black italic">pas</span> besoin de générer le fichier sitemap XML, pas plus qu'il ne faudra de temps pour le mettre à jour à chaque nouvel article.
              </p>
            </div>

            <div className="space-y-10 pt-4">
               <SitemapItem label="Series" code="series" active={sitemapSettings.series} />
               <SitemapItem label="Seasons" code="seasons" active={sitemapSettings.seasons} />
               <SitemapItem label="Episodes" code="episodes" active={sitemapSettings.episodes} />
               <SitemapItem label="Films" code="films" active={sitemapSettings.films} />
               <SitemapItem label="Scan" code="scan" active={sitemapSettings.scan} />
               <SitemapItem label="Catégories" code="category" active={sitemapSettings.category} />
               <SitemapItem label="Étiquettes" code="post_tag" active={sitemapSettings.post_tag} />
               <SitemapItem label="Pages" code="pages" active={sitemapSettings.pages} />
            </div>

            <div className="pt-8 border-t border-white/5 space-y-4">
               <div className="space-y-2">
                  <h3 className="text-white font-black text-xs uppercase tracking-tight">Entrées par page</h3>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Merci de saisir le nombre maximal d'entrées par page de sitemap (par défaut 1000, vous pouvez réduire ce nombre pour éviter les problèmes de mémoire sur certaines installations) :
                  </p>
               </div>
               <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] font-bold uppercase">Nombre d'entrées maximal par sitemap:</label>
                  <input 
                    type="number" 
                    className="w-full bg-white border border-slate-300 rounded p-3 text-sm text-black focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={sitemapSettings.maxEntries}
                    onChange={e => setSitemapSettings({...sitemapSettings, maxEntries: parseInt(e.target.value) || 1000})}
                  />
               </div>
            </div>

            <div className="pt-6">
               <button 
                onClick={() => { setIsSaving(true); setTimeout(() => { setIsSaving(false); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2000); }, 800); }}
                className={`px-8 py-3 bg-[#0071b9] hover:bg-[#005a96] text-white font-bold text-xs rounded transition-all shadow-lg flex items-center gap-2`}
               >
                 {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                 Enregistrer les modifications
               </button>
            </div>
         </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const totalMovies = addedContent.filter(m => m.type === 'movie').length;
    const totalAnimes = addedContent.filter(m => m.type === 'series' || m.type === 'anime').length;
    const totalManga = addedContent.filter(m => m.type === 'manga').length;
    const totalPinned = addedContent.filter(m => m.isPinned).length;

    const stats = [
      { label: 'VISITES AUJOURD\'HUI', value: '12,482', trend: '+14%', icon: <PulseIcon size={24} className="text-cyan-400" /> },
      { label: 'UTILISATEURS ACTIFS', value: '458', trend: '+5%', icon: <Users size={24} className="text-green-400" /> },
      { label: 'BANDE PASSANTE', value: '2.4 TB', trend: 'Stable', icon: <Database size={24} className="text-yellow-400" /> },
      { label: 'TAUX DE REBOND', value: '24%', trend: '-2%', icon: <Navigation size={24} className="text-red-400" /> },
    ];

    const managementStats = [
      { label: 'MOVIES', value: totalMovies, icon: <LayoutGrid size={24} className="text-indigo-400" /> },
      { label: 'TV SHOWS', value: totalAnimes, icon: <Tv size={24} className="text-blue-400" /> },
      { label: 'MANGA', value: totalManga, icon: <BookOpen size={24} className="text-purple-400" /> },
      { label: 'PINNED', value: totalPinned, icon: <Pin size={24} className="text-indigo-600" /> },
    ];

    const activities = [
      { user: 'Admin', action: 'a ajouté', target: 'Deadpool & Wolverine', time: 'IL Y A 2 MIN', color: 'text-[#70ccff]', icon: <PlusSquare size={16} className="text-green-500" /> },
      { user: 'System', action: 'a mis à jour', target: 'One Piece Ep. 1115', time: 'IL Y A 15 MIN', color: 'text-[#70ccff]', icon: <RefreshCw size={16} className="text-blue-500" /> },
      { user: 'Moderator', action: 'a épinglé', target: 'House of the Dragon', time: 'IL Y A 45 MIN', color: 'text-[#70ccff]', icon: <Pin size={16} className="text-indigo-500" /> },
      { user: 'Admin', action: 'a supprimé', target: 'Old Movie (1994)', time: 'IL Y A 2H', color: 'text-[#70ccff]', icon: <Trash2 size={16} className="text-red-500" /> },
    ];

    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="mod-box p-6 flex flex-col justify-between bg-[#151515] hover:bg-[#1a1a1c] transition-all group border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-black/40 rounded-lg group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tighter ${stat.trend.startsWith('+') ? 'text-green-500 bg-green-500/10' : stat.trend === 'Stable' ? 'text-orange-500 bg-orange-500/10' : 'text-red-500 bg-red-500/10'}`}>
                  {stat.trend}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{stat.label}</span>
                <span className="text-3xl font-black text-white italic futuristic-font tracking-tight">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Management row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {managementStats.map((stat, i) => (
            <div key={i} className="bg-[#121214] border border-white/5 rounded-xl p-6 flex items-center gap-5 group hover:border-indigo-500/30 transition-all shadow-xl">
              <div className="p-3 bg-black/40 rounded-lg shadow-lg group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                 <span className="text-4xl font-black text-white italic futuristic-font leading-none mt-1">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Recent Activity Column */}
           <div className="lg:col-span-2 bg-[#0c0c0e] rounded-xl border border-white/5 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PulseIcon size={18} className="text-cyan-500" />
                  <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] italic">ACTIVITÉ RÉCENTE</h3>
                </div>
                <button className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Voir Tout</button>
              </div>
              <div className="divide-y divide-white/5">
                {activities.map((act, i) => (
                  <div key={i} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-5">
                       <div className="p-2.5 bg-[#0f0f11] border border-white/5 rounded group-hover:border-cyan-500/30 transition-all">
                         {act.icon}
                       </div>
                       <div className="space-y-1">
                         <div className="text-[13px] font-bold">
                           <span className="text-white">{act.user}</span>
                           <span className="text-slate-500 mx-1.5">{act.action}</span>
                           <span className={act.color}>{act.target}</span>
                         </div>
                         <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{act.time}</div>
                       </div>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-700 group-hover:text-cyan-500 transition-colors" />
                  </div>
                ))}
              </div>
           </div>

           {/* Dashboard Sidebar Controls */}
           <div className="space-y-8">
              {/* FONCTIONNEMENT & DESIGN Card */}
              <div className="bg-[#0c0c0e] rounded-xl border border-white/5 p-8 shadow-2xl space-y-8">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] italic">FONCTIONNEMENT & DESIGN</h3>
                <div className="h-px bg-white/5 w-full"></div>
                
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="pr-4">
                      <h4 className="text-white font-black text-xs uppercase tracking-widest leading-tight">INSCRIPTIONS OUVERTES</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1.5 leading-tight">Permettre aux nouveaux utilisateurs de s'inscrire</p>
                    </div>
                    <button 
                      onClick={() => setSiteSettings({...siteSettings, allowRegistration: !siteSettings.allowRegistration})}
                      className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-lg shrink-0 ${siteSettings.allowRegistration ? 'bg-[#22c55e]' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${siteSettings.allowRegistration ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="pr-4">
                      <h4 className="text-white font-black text-xs uppercase tracking-widest leading-tight">MODE MAINTENANCE</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1.5 leading-tight">Bloque l'accès au site pour le public</p>
                    </div>
                    <button 
                      onClick={() => setSiteSettings({...siteSettings, maintenanceMode: !siteSettings.maintenanceMode})}
                      className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-lg shrink-0 ${siteSettings.maintenanceMode ? 'bg-[#ef4444]' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${siteSettings.maintenanceMode ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h4 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">COULEUR PRIMAIRE (THÈME)</h4>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-12 rounded border border-white/10 shadow-lg" style={{ backgroundColor: siteSettings.accentColor }}></div>
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{siteSettings.accentColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0c0c0e] rounded-xl border border-white/5 p-6 shadow-2xl space-y-6">
                 <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <Shield size={18} className="text-cyan-500" />
                    <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] italic">STATUT SERVEUR</h3>
                 </div>
                 <div className="space-y-5">
                    {[
                      { name: 'API GATEWAY', status: 'ONLINE', color: 'text-green-500' },
                      { name: 'DATABASE NODE', status: 'ONLINE', color: 'text-green-500' },
                      { name: 'CDN EDGE', status: 'ONLINE', color: 'text-green-500' },
                      { name: 'IMAGE PARSER', status: 'WARNING', color: 'text-yellow-500' }
                    ].map((srv, i) => (
                      <div key={i} className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{srv.name}</span>
                         <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${srv.color === 'text-green-500' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'}`}></div>
                            <span className={`text-[10px] font-black uppercase ${srv.color}`}>{srv.status}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Pro Version Active Card */}
              <div className="bg-gradient-to-br from-[#0c141d] to-[#08080a] border border-cyan-500/20 rounded-xl p-8 shadow-2xl space-y-4 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-cyan-500 opacity-5 blur-3xl group-hover:opacity-10 transition-opacity"></div>
                 <h4 className="text-white font-black italic text-lg uppercase tracking-tighter futuristic-font italic">PRO VERSION ACTIVE</h4>
                 <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                   Vous utilisez la version Entreprise de Planet Streaming Admin. Toutes les fonctionnalités sont débloquées.
                 </p>
                 <button className="w-full py-3 bg-[#00A1FA] hover:bg-cyan-500 text-white font-black text-[11px] uppercase tracking-widest rounded shadow-[0_0_20px_rgba(0,161,250,0.3)] transition-all active:scale-95">
                   CHECK UPDATES
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderEditor = () => {
    if (subView === 'genres') return renderGenreEditor();
    if (subView === 'settings-page') return renderPageEditor();
    if (subView === 'settings-slider') return renderSettingsSlider();
    
    const inputClass = "w-full bg-[#1e1e22] border border-slate-800 rounded p-3 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium";
    const labelClass = "text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-tight";
    const sectionClass = "space-y-4 mb-8";

    const isSeriesEditor = formData.type === 'series' || formData.type === 'anime' || formData.type === 'manga';
    const editorTabs: EditTab[] = editingEpisode 
      ? ['Overview', 'Video', 'Advanced']
      : isSeriesEditor 
        ? ['Overview', 'Season', 'People', 'Advanced']
        : ['Overview', 'Video', 'People', 'Subtitle', 'Advanced'];

    const genreValue = Array.isArray(formData.genre) ? formData.genre.join(', ') : (formData.genre || '');
    const baseDomain = "https://vf.vostanime.fr/";
    let subPath = "anime/";
    if (!editingEpisode && formData.type === 'movie') subPath = "film/";
    if (!editingEpisode && formData.type === 'manga') subPath = "manga/";
    const displayBaseUrl = `${baseDomain}${subPath}`;

    return (
      <div className="flex flex-col lg:flex-row gap-10 animate-in fade-in duration-500 pb-20">
        <style>{`
          .number-input-custom {
             background: #1e1e22 !important;
             border: 1px solid #00e0ff !important;
             color: #00e0ff !important;
             font-weight: 900 !important;
             font-family: 'Orbitron', sans-serif;
             border-radius: 4px;
             text-align: center;
             padding: 8px;
          }
          .admin-toggle-btn {
             position: relative;
             width: 48px;
             height: 24px;
             border-radius: 999px;
             transition: all 0.3s;
             cursor: pointer;
             border: 2px solid transparent;
          }
          .admin-toggle-btn.on {
             background: #4F46E5;
          }
          .admin-toggle-btn.off {
             background: #2D2D33;
          }
          .admin-toggle-circle {
             position: absolute;
             top: 2px;
             width: 16px;
             height: 16px;
             border-radius: 50%;
             background: white;
             transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .admin-toggle-btn.on .admin-toggle-circle {
             left: 26px;
          }
          .admin-toggle-btn.off .admin-toggle-circle {
             left: 2px;
          }
          .planning-field-block {
             background: #0d1117;
             border: 1px solid rgba(0, 161, 250, 0.1);
             padding: 6px 12px;
             border-radius: 4px;
             display: flex;
             align-items: center;
             gap: 10px;
             box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
          }
          .planning-field-label {
             color: #4b5563;
             font-size: 10px;
             font-weight: 900;
             text-transform: uppercase;
             letter-spacing: 0.1em;
             white-space: nowrap;
          }
          .planning-field-input {
             background: transparent;
             border: none;
             color: #00A1FA;
             font-size: 12px;
             font-weight: 900;
             outline: none;
             width: 100%;
             text-align: left;
             font-family: 'Orbitron', sans-serif;
          }
          .planning-field-select {
             background: transparent;
             border: none;
             color: #00A1FA;
             font-size: 12px;
             font-weight: 900;
             outline: none;
             cursor: pointer;
             font-family: 'Orbitron', sans-serif;
             appearance: none;
          }
          .advanced-title-label {
             font-size: 12px;
             font-weight: 900;
             text-transform: uppercase;
             letter-spacing: 0.05em;
             color: #fff;
             margin-bottom: 2px;
          }
          .advanced-sub-label {
             font-size: 9px;
             font-weight: 700;
             color: #4b5563;
          }
          .advanced-divider {
             text-align: center;
             padding: 20px 0;
             color: #1e293b;
             font-size: 9px;
             font-weight: 900;
             letter-spacing: 0.2em;
             text-transform: uppercase;
             border-top: 1px solid rgba(255,255,255,0.02);
             margin-top: 20px;
          }
        `}</style>

        <div className="flex-1 min-w-0">
          {editingEpisode && (
            <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-500 rounded text-white"><Tv size={20}/></div>
                <div>
                  <h3 className="text-white font-black uppercase text-sm">Editing {formData.type === 'manga' ? 'Chapter' : 'Episode'}</h3>
                  <p className="text-[11px] text-slate-400 font-bold">{editingEpisode.seriesTitle} - S{editingEpisode.seasonNumber} {formData.type === 'manga' ? 'Ch.' : 'E'}{formData.number || editingEpisode.number}</p>
                </div>
              </div>
              <button onClick={() => { setEditingEpisode(null); setMode('list'); }} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
          )}

          <div className="flex items-center gap-10 border-b border-white/5 mb-10 overflow-x-auto custom-scrollbar whitespace-nowrap">
             {editorTabs.map(tab => (
               <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`pb-4 text-[12px] font-bold transition-all relative uppercase ${activeTab === tab ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 {tab === 'Season' && formData.type === 'manga' ? 'Chapters' : tab}
                 {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_indigo]"></div>}
               </button>
             ))}
          </div>

          {renderSubHeaderActions()}

          {activeTab === 'Overview' && (
            <div className="space-y-6">
               <div className={sectionClass}>
                 <label className={labelClass}>Title</label>
                 <input type="text" className={inputClass} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value, slug: formData.slug || slugify(e.target.value)})} placeholder="Title" />
                 <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] font-medium text-slate-500">
                    <span className="opacity-70">Permalien :</span>
                    <span className="text-slate-400">{displayBaseUrl}</span>
                    {isEditingPermalink ? (
                      <div className="flex items-center gap-2">
                        <input type="text" autoFocus className="bg-[#1e1e22] border border-cyan-500/50 rounded px-2 py-0.5 text-slate-200 focus:outline-none min-w-[150px]" value={tempPermalink} onChange={(e) => setTempPermalink(e.target.value)} />
                        <button onClick={() => { setFormData({...formData, slug: tempPermalink}); setIsEditingPermalink(false); }} className="bg-white/5 border border-white/10 hover:bg-white/10 px-2 py-0.5 rounded text-cyan-400 font-bold uppercase text-[10px]">OK</button>
                        <button onClick={() => setIsEditingPermalink(false)} className="text-[#70ccff] hover:underline">Annuler</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-[#70ccff] font-bold underline cursor-default">{formData.slug || slugify(formData.title || 'untitled')}</span>
                        <button onClick={() => { setTempPermalink(formData.slug || slugify(formData.title || '')); setIsEditingPermalink(true); }} className="bg-white/5 border border-white/10 hover:bg-white/10 px-2.5 py-0.5 rounded text-slate-400 hover:text-white transition-all text-[10px] font-bold uppercase ml-2">Modifier</button>
                      </>
                    )}
                 </div>
               </div>

               {!editingEpisode && (
                 <div className={sectionClass}>
                   <label className={labelClass}>Language Versions (Badges)</label>
                   <div className="bg-black/20 p-4 rounded-lg border border-white/5 flex flex-wrap gap-3">
                     {AVAILABLE_LANGUAGES.map((lang) => {
                       const isActive = formData.langue?.includes(lang.id);
                       return (
                         <button
                           key={lang.id}
                           onClick={() => handleToggleLang(lang.id)}
                           className={`relative w-16 h-10 rounded border transition-all overflow-hidden flex items-center justify-center group ${
                             isActive 
                               ? 'border-[#00A1FA] ring-2 ring-[#00A1FA]/40 shadow-[0_0_15px_rgba(0,161,250,0.3)]' 
                               : 'border-white/10 grayscale hover:grayscale-0 opacity-40 hover:opacity-100'
                           }`}
                         >
                           <img 
                             src={`https://raw.githubusercontent.com/Anime-Sama/IMG/img/autres/flag_${lang.flag}.png`} 
                             className="w-full h-full object-cover" 
                             alt={lang.id}
                           />
                           <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                             <span className="text-[10px] font-black text-black drop-shadow-[0_0_2px_rgba(255,255,255,0.8)] uppercase">
                               {lang.label}
                             </span>
                           </div>
                         </button>
                       );
                     })}
                   </div>
                 </div>
               )}

               {!editingEpisode && (
                 <>
                  <div className={sectionClass}>
                    <label className={labelClass}>Alternative title</label>
                    <input type="text" className={inputClass} value={formData.altTitle} onChange={e => setFormData({...formData, altTitle: e.target.value})} placeholder="Alternative title" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Genre</label>
                        <input type="text" className={inputClass} value={genreValue} onChange={e => setFormData({...formData, genre: e.target.value.split(',').map(s=>s.trim())})} placeholder="Action, Drama..." />
                      </div>
                      <div>
                        <label className={labelClass}>Tag line</label>
                        <input type="text" className={inputClass} value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} placeholder="Tag line" />
                      </div>
                  </div>
                 </>
               )}
               {editingEpisode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>{formData.type === 'manga' ? 'Chapter' : 'Episode'} number</label>
                      <input type="number" className="w-full number-input-custom" value={formData.number} onChange={e => setFormData({...formData, number: parseInt(e.target.value)})} />
                    </div>
                    <div>
                      <label className={labelClass}>Section</label>
                      <input type="text" className={inputClass} value={formData.type === 'manga' ? 'Chapters' : `Season ${editingEpisode.seasonNumber}`} disabled />
                    </div>
                  </div>
               )}
               <div className={sectionClass}>
                 <label className={labelClass}>Overview</label>
                 <textarea rows={6} className={`${inputClass} resize-none`} value={formData.overview} onChange={e => setFormData({...formData, overview: e.target.value})} placeholder="Overview" />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>{formData.type === 'manga' ? 'Total Chap.' : 'Runtime'}</label>
                    <input type="text" className={inputClass} value={formData.runtime} onChange={e => setFormData({...formData, runtime: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>{formData.type === 'manga' ? 'Quality' : 'Video Quality'}</label>
                    <select className={inputClass} value={formData.videoQuality} onChange={e => setFormData({...formData, videoQuality: e.target.value})}>
                        <option>Choose</option><option>ULTRA HD / 4K</option><option>Scan HD</option><option>HD</option><option>DVDRip</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>View</label>
                    <input type="number" className={inputClass} value={formData.view} onChange={e => setFormData({...formData, view: e.target.value})} />
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'Video' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               {formData.type === 'manga' && editingEpisode && (
                 <div className="bg-[#121214] p-6 rounded-xl border border-slate-800 space-y-4 mb-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                      <h3 className="text-white font-black uppercase text-xs tracking-widest">Scan Pages (Manga Scan Images)</h3>
                    </div>
                    <div className="space-y-2">
                       <label className={labelClass}>Image Links (One URL per line)</label>
                       <textarea 
                         rows={12} 
                         className={`${inputClass} font-mono text-[11px] leading-relaxed`} 
                         placeholder="https://example.com/page1.jpg&#10;https://example.com/page2.jpg&#10;..."
                         value={(formData.images || []).join('\n')}
                         onChange={(e) => setFormData({...formData, images: e.target.value.split('\n').map(l => l.trim()).filter(l => l !== '')})}
                       />
                       <p className="text-[10px] text-slate-500 italic mt-1">Collez ici la liste des liens directs vers les images du chapitre. Ces liens seront utilisés par le lecteur Planet Scan.</p>
                    </div>
               </div>
               )}
            
               <div className="bg-[#121214] p-6 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                    <h3 className="text-white font-black uppercase text-xs tracking-widest">{formData.type === 'manga' ? 'Alternative Readers' : 'Video Sources'}</h3>
                  </div>
                  {(formData.videos || []).map((video: any, idx: number) => (
                    <div key={idx} className="flex flex-wrap gap-4 items-end bg-black/40 p-4 rounded border border-white/5">
                      <div className="flex-1 min-w-[150px]">
                        <label className={labelClass}>Type</label>
                        <select className={inputClass} value={video.type} onChange={(e) => handleUpdateVideoLink(idx, 'type', e.target.value)}>
                          {formData.type === 'manga' ? (
                            <>
                              <option>Manga Reader</option><option>Direct Image List</option><option>Download (CBZ)</option>
                            </>
                          ) : (
                            <>
                              <option>Embed link</option><option>Mp4 link</option><option>Download</option><option>HLS (.m3u8)</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className={labelClass}>Label</label>
                        <input type="text" className={inputClass} value={video.label} placeholder={formData.type === 'manga' ? 'LECTEUR SCANS' : 'LECTEUR 1'} onChange={(e) => handleUpdateVideoLink(idx, 'label', e.target.value)} />
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <label className={labelClass}>Language</label>
                        <select className={inputClass} value={video.langue} onChange={(e) => handleUpdateVideoLink(idx, 'langue', e.target.value)}>
                          {AVAILABLE_LANGUAGES.map(l => ( <option key={l.id} value={l.id}>{l.id}</option> ))}
                        </select>
                      </div>
                      <div className="w-full sm:flex-1 lg:flex-[2] min-w-[200px]">
                        <label className={labelClass}>URL</label>
                        <input type="text" className={inputClass} value={video.url} placeholder="https://..." onChange={(e) => handleUpdateVideoLink(idx, 'url', e.target.value)} />
                      </div>
                      <button onClick={() => handleRemoveVideoLink(idx)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-3 rounded transition-all"><Trash2 size={18} /></button>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <button onClick={handleAddVideoLink} className="py-4 bg-[#1a1a1c] border border-slate-800 rounded-lg text-indigo-400 font-bold text-[13px] hover:bg-[#252528] transition-all flex items-center justify-center gap-2"><Plus size={18} /> Add new link</button>
                    <button className="py-4 bg-[#1a1a1c] border border-slate-800 rounded-lg text-slate-400 font-bold text-[13px] hover:bg-[#252528] transition-all flex items-center justify-center gap-2"><Layers size={18} /> Bulk add</button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'Season' && isSeriesEditor && (
            <div className="space-y-6 animate-in fade-in duration-300 pb-20">
               {formData.seasons?.map((season: any, index: number) => {
                 const isExpanded = expandedSeasons.includes(season.id);
                 const visibleEpisodes = isExpanded ? (season.episodes || []) : (season.episodes || []).slice(0, 5);
                 const moreCount = (season.episodes || []).length - 5;
                 
                 const bulkCount = bulkEpisodeCounts[season.id] || 1;
                 const bulkRange = bulkRanges[season.id] || { from: 1, to: 12 };
                 const selectedSet = selectedEpisodeIds[season.id] || new Set();

                 return (
                  <div key={season.id || index} className="space-y-4 bg-[#121214] p-5 rounded-lg border border-slate-800 shadow-lg">
                      <div className="flex gap-4 items-center">
                        <div className="flex-1"><input type="text" className={inputClass} value={season.title} onChange={e => { const newSeasons = [...formData.seasons]; newSeasons[index].title = e.target.value; setFormData({...formData, seasons: newSeasons}); }} placeholder={formData.type === 'manga' ? 'Section Name' : 'Season Name'} /></div>
                        <div className="w-32"><input type="number" className="w-full number-input-custom" value={season.number} onChange={e => { const newSeasons = [...formData.seasons]; newSeasons[index].number = parseInt(e.target.value); setFormData({...formData, seasons: newSeasons}); }} placeholder="No." /></div>
                        <button onClick={() => { 
                          if(window.confirm('Supprimer cette section ?')) {
                            const newSeasons = formData.seasons.filter((_:any, i:number) => i !== index); 
                            const updatedData = {...formData, seasons: newSeasons};
                            setFormData(updatedData); 
                            if (addedContent.some(m => m.tmdbId === formData.tmdbId || m.id === formData.id)) {
                              onAddContent(updatedData);
                            }
                          }
                        }} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-3 rounded text-[12px] font-bold transition-all">Remove</button>
                      </div>

                      <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
                         <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 bg-[#1a1a1c] border border-white/5 rounded px-3 py-2">
                               <span className="text-[10px] font-black text-slate-500 uppercase">ADD {formData.type === 'manga' ? 'CHAPTERS' : 'EPISODES'} OF</span>
                               <input 
                                 type="number" 
                                 className="bg-transparent border-none text-cyan-400 font-bold w-12 text-center focus:outline-none" 
                                 value={bulkCount}
                                 onChange={(e) => setBulkEpisodeCounts({ ...bulkEpisodeCounts, [season.id]: parseInt(e.target.value) || 0 })}
                               />
                               <span className="text-[10px] font-black text-slate-500 uppercase">IN NUMBER</span>
                               <button 
                                 onClick={() => handleBulkAddByCount(index, bulkCount)}
                                 className="ml-2 bg-[#00A1FA] hover:bg-[#0081FA] text-white p-1 rounded transition-colors"
                               >
                                 <Plus size={14} />
                               </button>
                            </div>

                            <div className="flex items-center gap-2 bg-[#1a1a1c] border border-white/5 rounded px-3 py-2">
                               <span className="text-[10px] font-black text-slate-500 uppercase">TOTAL {formData.type === 'manga' ? 'CH' : 'EP'} From</span>
                               <input 
                                 type="number" 
                                 className="bg-transparent border-none text-cyan-400 font-bold w-12 text-center focus:outline-none" 
                                 value={bulkRange.from}
                                 onChange={(e) => setBulkRanges({ ...bulkRanges, [season.id]: { ...bulkRange, from: parseInt(e.target.value) || 0 } })}
                               />
                               <span className="text-[10px] font-black text-slate-500 uppercase">TO</span>
                               <input 
                                 type="number" 
                                 className="bg-transparent border-none text-cyan-400 font-bold w-12 text-center focus:outline-none" 
                                 value={bulkRange.to}
                                 onChange={(e) => setBulkRanges({ ...bulkRanges, [season.id]: { ...bulkRange, to: parseInt(e.target.value) || 0 } })}
                               />
                               <button 
                                 onClick={() => handleBulkAddByRange(index, bulkRange.from, bulkRange.to)}
                                 className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-0.5 rounded text-[10px] font-black transition-colors"
                               >
                                 ADD
                               </button>
                            </div>

                            <button 
                              onClick={() => handleDeleteAllPlayersInSeason(index)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded text-[10px] font-black uppercase flex items-center gap-2 border border-red-500/20 transition-all"
                            >
                              <Trash2 size={12} /> Supprimer tout le contenu
                            </button>
                         </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-500 px-1 border-b border-white/5 pb-3">
                        <span className="opacity-70 uppercase tracking-widest font-black">Permalien Section :</span>
                        <span className="text-slate-400 opacity-60">{displayBaseUrl}{formData.slug}/</span>
                        {editingSeasonSlugId === season.id ? (
                          <div className="flex items-center gap-2">
                            <input type="text" autoFocus className="bg-[#1e1e22] border border-cyan-500/50 rounded px-2 py-0.5 text-slate-200 focus:outline-none min-w-[150px] text-[10px]" value={tempSeasonSlug} onChange={(e) => setTempSeasonSlug(e.target.value)} />
                            <button onClick={() => { 
                              const newSeasons = [...formData.seasons]; 
                              newSeasons[index].slug = tempSeasonSlug; 
                              const updatedData = {...formData, seasons: newSeasons};
                              setFormData(updatedData); 
                              setEditingSeasonSlugId(null); 
                              if (addedContent.some(m => m.tmdbId === formData.tmdbId || m.id === formData.id)) {
                                onAddContent(updatedData);
                              }
                            }} className="bg-white/5 border border-white/10 hover:bg-white/10 px-2 py-0.5 rounded text-cyan-400 font-black uppercase text-[9px]">OK</button>
                            <button onClick={() => setEditingSeasonSlugId(null)} className="text-[#70ccff] hover:underline uppercase text-[9px] font-black">Annuler</button>
                          </div>
                        ) : (
                          <>
                            <span className="text-[#70ccff] font-black underline cursor-default">{season.slug || slugify(season.title || 'untitled')}</span>
                            <button onClick={() => { setTempSeasonSlug(season.slug || slugify(season.title || '')); setEditingSeasonSlugId(season.id); }} className="bg-white/5 border border-white/10 hover:bg-white/10 px-2.5 py-0.5 rounded text-slate-400 hover:text-white transition-all text-[9px] font-black uppercase ml-2">Modifier</button>
                          </>
                        )}
                      </div>
                      
                      <div className="pl-4 border-l border-white/5 space-y-2 pt-2">
                         <div className="flex flex-wrap items-center justify-between py-2 border-b border-white/5 mb-2 gap-4">
                            <div className="flex items-center gap-4">
                               <input 
                                 type="checkbox" 
                                 className="w-4 h-4 bg-black border-white/10 rounded cursor-pointer accent-indigo-500"
                                 checked={season.episodes?.length > 0 && selectedSet.size === season.episodes.length}
                                 onChange={() => handleSelectAllEpisodes(season.id, season.episodes || [])}
                                 title="Tout sélectionner"
                               />
                               
                               <div className="flex items-center gap-2 bg-[#0b0b0d] border border-white/10 rounded px-2 py-1">
                                  <select 
                                    id={`bulk-action-${season.id}`}
                                    className="bg-transparent border-none text-[10px] font-black text-slate-400 uppercase focus:outline-none cursor-pointer"
                                  >
                                    <option value="">Actions groupées</option>
                                    <option value="delete">Supprimer</option>
                                  </select>
                                  <button 
                                    onClick={() => handleApplyBulkAction(index, season.id)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase px-3 py-1 rounded transition-all shadow-lg active:scale-95"
                                  >
                                    Appliquer
                                  </button>
                               </div>

                               {selectedSet.size > 0 && (
                                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                    {selectedSet.size} sélectionnés
                                 </span>
                               )}
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">({season.episodes?.length || 0} {formData.type === 'manga' ? 'Chapitres' : 'Episodes'})</span>
                            </div>
                            <div className="flex items-center gap-3">
                               {formData.type !== 'manga' && (
                                 <button onClick={() => handleUpdateEpisodesAPI(season.number)} className="text-[10px] font-black text-[#00A1FA] hover:text-white uppercase flex items-center gap-1 bg-[#00A1FA]/10 px-3 py-1.5 rounded transition-all"><RefreshCw size={12} className={discoveryProgress ? "animate-spin" : ""} /> Discover API</button>
                               )}
                               <button onClick={() => { 
                                 const nextNo = (season.episodes?.length || 0) + 1; 
                                 const newSeasons = [...formData.seasons]; 
                                 newSeasons[index].episodes = [...(newSeasons[index].episodes || []), { id: Date.now().toString(), number: nextNo, title: `${formData.type === 'manga' ? 'Chapitre' : 'Episode'} ${nextNo}`, videos: [], images: [], langue: ['VF'], slug: slugify(`episode ${nextNo}`), lastUpdated: Date.now() }]; 
                                 const updatedData = {...formData, seasons: newSeasons};
                                 setFormData(updatedData); 
                                 if (addedContent.some(m => m.tmdbId === formData.tmdbId || m.id === formData.id)) {
                                   onAddContent(updatedData);
                                 }
                               }} className="text-[10px] font-black text-green-500 hover:text-white uppercase flex items-center gap-1 bg-green-500/10 px-3 py-1.5 rounded transition-all"><Plus size={12} /> Add Manual</button>
                            </div>
                         </div>
                         {season.episodes?.length > 0 ? (
                           <>
                             {visibleEpisodes.map((ep: any) => (
                               <div key={ep.id} className="flex items-center justify-between text-[11px] text-slate-400 bg-black/20 p-2 rounded hover:bg-black/40 transition-colors group">
                                  <div className="flex items-center gap-3">
                                     <input 
                                       type="checkbox" 
                                       className="w-3 h-3 bg-black border-white/10 rounded cursor-pointer accent-indigo-500"
                                       checked={selectedSet.has(ep.id)}
                                       onChange={() => toggleEpisodeSelection(season.id, ep.id)}
                                     />
                                     <span className={selectedSet.has(ep.id) ? "text-indigo-400 font-black" : ""}>{formData.type === 'manga' ? 'Ch.' : 'E'}{ep.number}: {ep.title}</span>
                                     {(ep.videos?.length > 0 || (ep.images && ep.images.length > 0)) && <LayersIcon size={10} className="text-cyan-500" title={`${ep.videos?.length || 0} lecteurs / ${ep.images?.length || 0} pages`} />}
                                  </div>
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button 
                                       onClick={() => { setEditingEpisode({...ep, seriesId: formData.id, seriesTitle: formData.title, seasonNumber: season.number}); setFormData({...getInitialFormData(formData.type), ...ep, id: ep.id, title: ep.title, overview: ep.overview || '', number: ep.number, runtime: ep.runtime || '34', videoQuality: ep.videoQuality || 'Choose', view: ep.view || '0', videos: ep.videos || [], images: ep.images || [], posterUrl: ep.thumbnailUrl || formData.posterUrl, langue: ep.langue || ['VF'], slug: ep.slug || slugify(ep.title || '') }); setActiveTab('Overview'); }}
                                       className="p-1 hover:text-white transition-colors"
                                     >
                                        <Edit2 size={12} />
                                     </button>
                                     <button 
                                       onClick={() => { 
                                         if(window.confirm('Supprimer cet élément ?')) { 
                                           const newSeasons = formData.seasons.map((s: any, idx: number) => {
                                             if (idx === index) {
                                               return {
                                                 ...s,
                                                 episodes: s.episodes.filter((e: any) => e.id !== ep.id)
                                               };
                                             }
                                             return s;
                                           });
                                           const updatedData = {...formData, seasons: newSeasons};
                                           setFormData(updatedData); 
                                           if (addedContent.some(m => m.tmdbId === formData.tmdbId || m.id === formData.id)) {
                                              onAddContent(updatedData);
                                           }
                                         } 
                                       }}
                                       className="p-1 hover:text-red-500 transition-colors"
                                     >
                                        <Trash2 size={12} />
                                     </button>
                                  </div>
                               </div>
                             ))}
                             {!isExpanded && moreCount > 0 && (
                               <button onClick={() => setExpandedSeasons(prev => [...prev, season.id])} className="w-full py-1.5 text-[9px] text-slate-600 hover:text-slate-400 text-center uppercase font-black tracking-widest bg-black/10 rounded transition-colors">+ {moreCount} more... (Click to expand)</button>
                             )}
                           </>
                         ) : ( <p className="text-[10px] text-slate-600 italic py-2">No items extracted for this section yet.</p> )}
                      </div>
                   </div>
                 );
               })}
               <button onClick={() => { 
                 const nextNo = (formData.seasons?.length || 0) + 1; 
                 const newSeasons = [...(formData.seasons || []), { id: Date.now().toString(), title: formData.type === 'manga' ? 'Chapitres' : `Season ${nextNo}`, number: nextNo, episodes: [], slug: 'chapters' }]; 
                 const updatedData = {...formData, seasons: newSeasons};
                 setFormData(updatedData); 
                 if (addedContent.some(m => m.tmdbId === formData.tmdbId || m.id === formData.id)) {
                   onAddContent(updatedData);
                 }
               }} className="w-full py-4 bg-[#1a1a1c] border border-slate-800 rounded-lg text-slate-300 font-bold text-[13px] hover:bg-[#252528] transition-all">Add new Section</button>
            </div>
          )}

          {activeTab === 'Advanced' && (
             <div className="bg-[#0b0b0d] p-10 rounded-lg border border-white/5 space-y-12 max-w-4xl animate-in fade-in duration-300 shadow-2xl">
                 <div className="space-y-6">
                    <div className="flex items-center justify-between group">
                       <div className="flex flex-col">
                          <h3 className="advanced-title-label">
                            {formData.type === 'movie' ? 'ADD NEW ANIME FILMS' : formData.type === 'manga' ? 'ADD NEW MANGA SCAN' : 'ADD NEW ANIME SERIES'}
                          </h3>
                          <p className="advanced-sub-label">Pin this content to the planning page / top of listings.</p>
                       </div>
                       <button 
                         onClick={() => setFormData({...formData, isAnimeSeries: !formData.isAnimeSeries})}
                         className={`admin-toggle-btn ${formData.isAnimeSeries ? 'on' : 'off'}`}
                       >
                         <div className="admin-toggle-circle"></div>
                       </button>
                    </div>

                    <div className="flex items-center justify-between">
                       <h3 className="advanced-title-label">
                         {formData.type === 'movie' ? 'DERNIÈRE FILMS' : formData.type === 'manga' ? 'DERNIÈRE SCANS' : 'DERNIÈRE EPISODES'}
                       </h3>
                       <button 
                         onClick={() => setFormData({...formData, showInLatestEpisodes: !formData.showInLatestEpisodes})}
                         className={`admin-toggle-btn ${formData.showInLatestEpisodes ? 'on' : 'off'}`}
                       >
                         <div className="admin-toggle-circle"></div>
                       </button>
                    </div>

                    <div className="flex items-center justify-between">
                       <h3 className="advanced-title-label">AUJOURD'HUI</h3>
                       <button 
                         onClick={() => setFormData({...formData, isTodayHighlight: !formData.isTodayHighlight})}
                         className={`admin-toggle-btn ${formData.isTodayHighlight ? 'on' : 'off'}`}
                       >
                         <div className="admin-toggle-circle"></div>
                       </button>
                    </div>

                    <div className="flex items-center justify-between">
                       <h3 className="advanced-title-label">DERNIERS AJOUTS</h3>
                       <button 
                         onClick={() => setFormData({...formData, isRecentAddition: !formData.isRecentAddition})}
                         className={`admin-toggle-btn ${formData.isRecentAddition ? 'on' : 'off'}`}
                       >
                         <div className="admin-toggle-circle"></div>
                       </button>
                    </div>
                 </div>

                 <div className="advanced-divider">
                    {"<<<<<<<<<<<<<<<<<<<<<<ADD FOR PLANNING>>>>>>>>>>>>>>>>>>>>>>"}
                 </div>

                 <div className="space-y-8">
                    <div className="flex items-center justify-between">
                       <h3 className="advanced-title-label">
                         {formData.type === 'movie' ? 'ADD A FILM FOR PLANNING' : formData.type === 'manga' ? 'ADD A MANGA FOR PLANNING' : 'ADD AN ANIME FOR PLANNING'}
                       </h3>
                       <button 
                         onClick={() => setFormData({...formData, inPlanningPage: !formData.inPlanningPage})}
                         className={`admin-toggle-btn ${formData.inPlanningPage ? 'on' : 'off'}`}
                       >
                         <div className="admin-toggle-circle"></div>
                       </button>
                    </div>

                    {formData.inPlanningPage && (
                      <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3 mb-2">
                           <span className="text-[11px] font-black text-white uppercase tracking-tighter">RELEASE DATE (RELEASE TIME)</span>
                        </div>

                        {formData.planningEntries?.map((entry: any, idx: number) => (
                           <div key={idx} className="flex flex-col gap-2 py-1">
                              <div className="flex items-center gap-8 w-full">
                                  <div className="flex-1 max-w-[200px] flex items-center justify-end">
                                     <div className="planning-field-block w-full">
                                        <span className="planning-field-label">
                                          {formData.type === 'movie' ? 'MOIS' : 'days'}
                                        </span>
                                        <select 
                                          className="planning-field-select w-full"
                                          value={formData.type === 'movie' ? (entry.month ?? 0) : (entry.day ?? 1)}
                                          onChange={(e) => {
                                              const val = parseInt(e.target.value);
                                              if (formData.type === 'movie') {
                                                updatePlanningEntry(idx, { month: val, day: undefined });
                                              } else {
                                                updatePlanningEntry(idx, { day: val, month: undefined });
                                              }
                                          }}
                                        >
                                          {formData.type === 'movie' 
                                              ? MONTHS.map(m => <option key={m.id} value={m.id} className="bg-[#0d1117]">{m.name}</option>)
                                              : WEEK_DAYS.map(d => <option key={d.id} value={d.id} className="bg-[#0d1117]">{d.label}</option>)
                                          }
                                        </select>
                                     </div>
                                  </div>

                                  <div className="flex-1 flex items-center gap-3">
                                    <div className="planning-field-block flex-1 min-w-[200px]">
                                       <div className="flex items-center gap-1.5 flex-1">
                                          <span className="planning-field-label">date</span>
                                          <input 
                                            type="text" 
                                            className="planning-field-input"
                                            value={entry.time}
                                            onChange={(e) => updatePlanningEntry(idx, { time: e.target.value })}
                                            placeholder="20h00"
                                          />
                                       </div>
                                       <div className="flex items-center gap-3 border-l border-white/10 pl-4">
                                         <select 
                                            className="bg-transparent border-none text-[#70ccff] font-black text-[12px] focus:outline-none cursor-pointer appearance-none"
                                            value={entry.language}
                                            onChange={(e) => updatePlanningEntry(idx, { language: e.target.value })}
                                         >
                                            {AVAILABLE_LANGUAGES.map(lang => (
                                              <option key={lang.id} value={lang.id} className="bg-[#0d1117]">
                                                {lang.id}
                                              </option>
                                            ))}
                                         </select>
                                         <img 
                                           src={`https://raw.githubusercontent.com/Anime-Sama/IMG/img/autres/flag_${AVAILABLE_LANGUAGES.find(l => l.id === entry.language)?.flag || 'fr'}.png`} 
                                           className="w-5 h-3.5 rounded shadow-lg border border-black/20" 
                                           alt="flag"
                                         />
                                       </div>
                                    </div>
                                    <button 
                                      onClick={() => removePlanningEntry(idx)} 
                                      className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded border border-red-500/20 transition-all flex items-center justify-center shadow-lg"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                              </div>
                           </div>
                        ))}
                        
                        <button 
                          onClick={addPlanningEntry}
                          className="w-full py-4 bg-[#121821] hover:bg-[#1a2330] border border-white/5 rounded-lg text-[11px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-[0.2em] mt-2 shadow-inner"
                        >
                          Add new Release date (RELEASE TIME)
                        </button>
                      </div>
                    )}
                 </div>

                 <div className="pt-6 space-y-8">
                    {isSeriesEditor && (
                      <div className="flex items-center justify-between animate-in fade-in duration-700">
                        <h3 className="advanced-title-label">TOTAL {formData.type === 'manga' ? 'CHAPTERS' : 'EPISODES'}</h3>
                        <div className="bg-[#0d1117] px-5 py-2.5 rounded border border-white/5 min-w-[120px] text-center shadow-[inset_0_0_15px_rgba(0,161,250,0.5)]">
                            <input 
                              type="text" 
                              className="bg-transparent border-none text-cyan-400 font-black text-[13px] w-full text-center focus:outline-none futuristic-font"
                              value={formData.totalEpisodesCount}
                              onChange={(e) => setFormData({...formData, totalEpisodesCount: e.target.value})}
                            />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                       <h3 className="advanced-title-label">DATE DE SORTIE</h3>
                       <div className="relative group">
                          <div className="flex items-center bg-[#0d1117] border border-cyan-500/30 rounded px-5 py-2.5 min-w-[240px] shadow-[inset_0_0_15px_rgba(0,161,250,0.5)] focus-within:border-cyan-400 transition-all">
                             <input 
                               type="date"
                               className="bg-transparent border-none text-[13px] text-white font-black focus:outline-none w-full appearance-none futuristic-font"
                               value={formData.releaseDate}
                               onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                             />
                             <div className="flex gap-2 ml-3">
                               <Calendar size={14} className="text-white opacity-40" />
                             </div>
                          </div>
                       </div>
                    </div>

                    {isSeriesEditor && (
                      <div className="pt-8 border-t border-white/5 animate-in fade-in duration-700">
                        <div className="flex items-center justify-between bg-black/10 p-10 rounded border border-white/5 shadow-inner">
                          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic futuristic-font">
                            {formData.type === 'manga' ? 'CURRENT VOLUME' : 'SEASON NUMBER'}
                          </h3>
                          <div className="relative flex items-center bg-[#0d1117] border-2 border-cyan-500/30 rounded p-4 min-w-[140px] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                              <input 
                                type="number"
                                className="bg-transparent border-none text-cyan-400 font-black text-3xl w-full text-center focus:outline-none appearance-none futuristic-font"
                                value={formData.currentSeasonNum}
                                onChange={(e) => setFormData({...formData, currentSeasonNum: parseInt(e.target.value) || 1})}
                              />
                              <div className="flex flex-col gap-2 ml-3">
                                <button onClick={() => setFormData({...formData, currentSeasonNum: (formData.currentSeasonNum || 1) + 1})} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-0.5 rounded"><ChevronUp size={16} strokeWidth={4} /></button>
                                <button onClick={() => setFormData({...formData, currentSeasonNum: Math.max(1, (formData.currentSeasonNum || 1) - 1)})} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-0.5 rounded"><ChevronDown size={16} strokeWidth={4} /></button>
                              </div>
                          </div>
                        </div>
                      </div>
                    )}
                 </div>
             </div>
          )}
        </div>

        <div className="w-full lg:w-[320px] shrink-0 space-y-8">
           <div className="bg-[#121214] border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative group">
              <div className="aspect-[2/3] flex flex-col items-center justify-center p-8 text-center bg-black/40 border-2 border-dashed border-slate-800 m-4 rounded-xl cursor-pointer">
                 {formData.posterUrl ? (
                   <img src={formData.posterUrl} className="absolute inset-0 w-full h-full object-cover" alt="poster" />
                 ) : (
                   <>
                     <Upload size={32} className="text-slate-700 mb-4" />
                     <p className="text-[12px] font-bold text-slate-500 uppercase leading-relaxed">Click to upload or drag<br /><span className="opacity-40">PNG or JPG (MAX. 300×450)</span></p>
                   </>
                 )}
              </div>
              <div className="px-8 pb-4">
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option>Publish</option><option>Draft</option>
                </select>
              </div>
           </div>
           
           <div className="space-y-4">
              <button 
               onClick={editingEpisode ? handleSaveEpisode : handleSaveContent} 
               className={`w-full py-4 rounded-lg font-bold text-[14px] transition-all flex items-center justify-center gap-2 shadow-xl ${saveSuccess ? 'bg-green-600' : 'bg-[#5e5ce6] hover:bg-[#4d4acb] text-white'}`}
              >
                 {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                 {isSaving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save change'}
              </button>
              {!editingEpisode && (
                <button onClick={() => setIsImporterOpen(true)} className="w-full py-3.5 bg-[#1a1a1c] hover:bg-[#252528] text-slate-400 font-bold text-[11px] uppercase rounded-lg border border-slate-800 transition-all">{formData.type === 'manga' ? 'MyAnimeList Importer' : 'Themoviedb importer'}</button>
              )}
              <button onClick={() => { setMode('list'); setEditingEpisode(null); setExpandedSeasons([]); }} className="w-full py-2.5 text-slate-500 hover:text-white text-xs font-bold uppercase transition-colors">Cancel</button>
           </div>
        </div>
      </div>
    );
  };

  const SidebarGroup = ({ title, children, icon }: any) => (
    <div className="mb-6">
      <div className="px-6 flex items-center gap-2 mb-3">
         {icon && <span className="text-slate-700">{icon}</span>}
         <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );

  return (
    <div className="flex bg-[#0a0a0b] min-h-screen -mx-4 md:mx-0 rounded-xl overflow-hidden border border-white/5 shadow-2xl animate-in fade-in duration-700 relative">
      <aside className={`bg-[#0b0b0d] border-r border-white/5 flex flex-col shrink-0 overflow-y-auto custom-scrollbar transition-all duration-500 ${isSidebarOpen ? 'w-[260px]' : 'w-0'}`}>
        <div className="p-8 mb-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400"><Shield size={24} /></div>
            <span className="text-2xl futuristic-font font-black italic tracking-tighter text-white">PLANET</span>
          </div>
        </div>
        <div className="flex-1 pb-10">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={subView === 'dashboard'} onClick={() => handleSubViewChange('dashboard')} />
          <SidebarGroup title="MANAGEMENT">
            <SidebarItem icon={<Film size={20} />} label="Movie" active={subView === 'movies'} onClick={() => handleSubViewChange('movies')} />
            <SidebarItem icon={<Tv size={20} />} label="TV Show" subItems={[{ label: 'TV Show', id: 'tv-shows' }, { label: 'Episode', id: 'episodes' }]} active={subView === 'tv-shows' || subView === 'episodes'} expanded={tvShowsExpanded} onSubItemClick={handleSubViewChange} onClick={() => setTvShowsExpanded(!tvShowsExpanded)} />
            <SidebarItem icon={<BookOpen size={20} />} label="Manga Scan" active={subView === 'manga'} onClick={() => handleSubViewChange('manga')} />
            <SidebarItem icon={<BarChart3 size={20} />} label="Site statistics" active={subView === 'statistics'} onClick={() => handleSubViewChange('statistics')} />
            <SidebarItem 
              icon={<SlidersHorizontal size={20} />} 
              label="Management" 
              subItems={[
                { label: 'Genre', id: 'genres' },
                { label: 'Permalink Settings', id: 'permalink-settings' },
                { label: 'Ads', id: 'ads' },
                { label: 'AdBlock Notify', id: 'adblock' }
              ]} 
              active={subView === 'genres' || subView === 'permalink-settings' || subView === 'ads' || subView === 'adblock'}
              expanded={managementExpanded}
              onSubItemClick={handleSubViewChange}
              onClick={() => setManagementExpanded(!managementExpanded)}
            />
          </SidebarGroup>
          <SidebarGroup title="COMMUNITY">
            <SidebarItem icon={<Users size={20} />} label="Community" />
            <SidebarItem icon={<PlaySquare size={20} />} label="Comment" />
          </SidebarGroup>
          <SidebarGroup title="SYSTEM">
             <SidebarItem icon={<Wrench size={20} />} label="Tools" />
             <SidebarItem 
               icon={<Settings size={20} />} 
               label="Settings" 
               subItems={[
                 { label: 'General', id: 'settings-general' },
                 { label: 'Seo', id: 'settings-seo' },
                 { label: 'XML Sitemap', id: 'settings-sitemap' },
                 { label: 'Slider', id: 'settings-slider' },
                 { label: 'Page', id: 'settings-page' }
               ]}
               active={subView.startsWith('settings-')}
               expanded={settingsExpanded}
               onSubItemClick={handleSubViewChange}
               onClick={() => setSettingsExpanded(!settingsExpanded)}
             />
          </SidebarGroup>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#080808]">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-10 shrink-0 bg-black/20 sticky top-0 z-[50]">
           <div className="flex items-center gap-10">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 hover:text-white transition-all"><MenuIcon size={24} /></button>
              <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500">
                <span className="opacity-40 uppercase tracking-widest">Admin</span>
                <ChevronRight size={14} className="opacity-20" />
                <span className="text-white uppercase tracking-widest italic futuristic-font">
                  {subView === 'tv-shows' ? 'TV Show' : subView === 'movies' ? 'Movie' : subView === 'manga' ? 'Manga Scan' : subView === 'episodes' ? 'Episode' : subView === 'statistics' ? 'Site Statistics' : subView === 'genres' ? 'Genre' : subView === 'permalink-settings' ? 'Permalink Settings' : subView === 'ads' ? 'Ads Management' : subView === 'adblock' ? 'AdBlock Notify Pro' : subView.startsWith('settings-') ? 'Settings' : 'Dashboard'}
                </span>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-[12px] font-black text-indigo-400 uppercase">AD</div>
           </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
           {subView === 'dashboard' && renderDashboard()}
           {subView === 'statistics' && renderStatistics()}
           {subView === 'ads' && renderAdsManagement()}
           {subView === 'adblock' && renderAdBlockManagement()}
           {subView === 'settings-general' && renderSettingsGeneral()}
           {subView === 'settings-seo' && renderSettingsSeo()}
           {subView === 'settings-sitemap' && renderSettingsSitemap()}
           {subView === 'settings-slider' && renderSettingsSlider()}
           {subView === 'permalink-settings' && renderPermalinkSettings()}
           {subView === 'movies' && (mode === 'list' ? renderList(filteredData, 'Movies') : renderEditor())}
           {subView === 'tv-shows' && (mode === 'list' ? renderList(filteredData, 'TV Shows') : renderEditor())}
           {subView === 'episodes' && (mode === 'list' ? renderList(filteredData, 'Episodes', true) : renderEditor())}
           {subView === 'manga' && (mode === 'list' ? renderList(filteredData, 'Manga') : renderEditor())}
           {subView === 'genres' && (mode === 'list' ? renderList(filteredData, 'Genres') : renderGenreEditor())}
           {subView === 'settings-page' && (mode === 'list' ? renderList(filteredData, 'Pages') : renderPageEditor())}
           {(subView === 'people') && (
             <div className="p-20 text-center bg-[#121214] border border-white/5 rounded-2xl shadow-2xl">
                <Settings2 size={64} className="text-slate-800 mx-auto mb-6" />
                <h2 className="text-white font-black text-2xl uppercase tracking-tighter italic">Module Under Construction</h2>
                <p className="text-slate-500 text-sm mt-2 uppercase tracking-widest">This identity management sub-module will be available in v1.2</p>
             </div>
           )}
        </div>
      </main>

      {renderProgressModal()}
      {renderQuickLinksModal()}

      {isImporterOpen && (
        <div className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1e22] border border-white/10 rounded-xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-white font-black uppercase tracking-widest text-sm">ADD NEW {subView === 'movies' ? 'MOVIE' : subView === 'manga' ? 'MANGA' : 'SERIE'}</h3>
              <button onClick={() => setIsImporterOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <input type="text" value={importerId} onChange={(e) => setImporterId(e.target.value)} placeholder={subView === 'manga' ? "MAL ID (ex: 13)" : "Themoviedb id"} className="w-full bg-black/40 border border-slate-700 rounded p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium" />
              </div>
              <button onClick={handleImportTMDB} disabled={isImporting || !importerId} className="w-full bg-[#5e5ce6] hover:bg-[#4d4acb] text-white py-4 rounded-lg font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-xl">
                {isImporting ? <Loader2 size={18} className="animate-spin" /> : null} Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
