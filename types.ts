
export interface Link {
  id: string;
  url: string;
  type: string; // 'online' | 'download'
  language: string;
  langue?: string; // Language badge ID (e.g., 'VF', 'VOSTFR')
  quality: string;
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  thumbnailUrl: string;
  overview?: string;
  tmdbId?: string;
  runtime?: string;
  releaseDate?: string;
  links?: Link[];
  videos?: any[]; // Array of video sources
  images?: string[]; // Array of manga scan image URLs
  langue?: string[];
  slug?: string;
}

export interface Season {
  id: string;
  number: number;
  title: string;
  episodes: Episode[];
  posterUrl?: string;
  slug?: string;
}

export interface PlanningEntry {
  day?: number; // 0-6 (Sunday-Saturday)
  month?: number; // 0-11 (January-December) for monthly planning
  time: string; // e.g., "20h00"
  language: string; // e.g., "VF", "VOSTFR"
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  rating: string;
  duration: string;
  genre: string[];
  description: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  director: string;
  cast: string[];
  popularity: number;
  type?: 'movie' | 'series' | 'anime' | 'manga';
  episode?: string;
  season?: number;
  seasons?: Season[];
  status?: string;
  langue?: string[];
  broadcastDay?: number; // Primary day for legacy support
  broadcastTime?: string; // Primary time for legacy support
  planningEntries?: PlanningEntry[]; // New multiple entry system
  altTitle?: string;
  tagline?: string;
  country?: string;
  videoQuality?: string;
  views?: number;
  tags?: string[];
  tmdbId?: string;
  isPinned?: boolean;
  videos?: any[]; // Array of movie video sources
  slug?: string;
  // New Planning & Slider properties
  isAnimeSeries?: boolean;
  showInLatestEpisodes?: boolean;
  isTodayHighlight?: boolean;
  isRecentAddition?: boolean;
  inPlanningPage?: boolean;
  totalEpisodesCount?: string;
  releaseDate?: string;
}

export interface Genre {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  color?: string;
  metaTitle?: string;
  metaDescription?: string;
  showFeatured?: boolean;
  slug?: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  description?: string;
  color?: string;
  metaTitle?: string;
  metaDescription?: string;
  showFeatured?: boolean;
}

export interface SliderConfig {
  id: string;
  name: string;
  heading: string;
  limit: number;
  isActive: boolean;
}

export type ViewState = 'home' | 'home-movies' | 'home-series' | 'home-manga' | 'search' | 'genre' | 'details' | 'episode' | 'catalogue' | 'planning' | 'admin' | 'login';

export interface AppState {
  view: ViewState;
  selectedGenre: string | null;
  selectedType: string | null;
  selectedLanguage: string | null;
  selectedMovie: Movie | null;
  searchQuery: string;
  isLoading: boolean;
  movies: Movie[];
}
