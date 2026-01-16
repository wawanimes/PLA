
import { FunctionDeclaration, Type } from "@google/genai";
import { Movie, Episode } from "../types";

const TMDB_API_KEY = '67f72af3decc8346e0493120f89e5988';
const BASE_URL = 'https://api.themoviedb.org/3';
const JIKAN_URL = 'https://api.jikan.moe/v4';

export const searchMoviesFunctionDeclaration: FunctionDeclaration = {
  name: 'searchMovies',
  parameters: {
    type: Type.OBJECT,
    description: 'Search for movies, series or manga in the database.',
    properties: {
      query: {
        type: Type.STRING,
        description: 'The search query or genre name (e.g., "manga action", "trending movies").',
      },
    },
    required: ['query'],
  },
};

const mapTmdbToMovie = (item: any): Movie => {
  if (!item) return {} as Movie;
  const isSeries = item.media_type === 'tv' || !!item.first_air_date || !!item.name;
  const genres = item.genre_ids ? [] : (item.genres ? item.genres.map((g: any) => g.name) : []);
  
  return {
    id: (item.id || '').toString(),
    tmdbId: (item.id || '').toString(),
    title: item.title || item.name || 'Sans titre',
    year: parseInt((item.release_date || item.first_air_date || '0').split('-')[0]) || 2024,
    rating: (item.vote_average || 0).toFixed(1),
    duration: isSeries ? 'Saison 1' : (item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : '2h 10m'),
    genre: genres.length > 0 ? genres : ['Action', 'Drame'],
    description: item.overview || 'Aucun synopsis disponible pour le moment.',
    posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : `https://picsum.photos/seed/${item.id || Math.random()}/500/750`,
    backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : `https://picsum.photos/seed/${item.id || Math.random()}/1200/600`,
    director: 'Production TMDB',
    cast: [],
    popularity: Math.round(item.popularity || 0),
    type: isSeries ? 'series' : 'movie',
    episode: isSeries ? 'Ãpisode 1' : undefined,
    season: isSeries ? 1 : undefined
  };
};

const mapJikanToManga = (item: any): Movie => {
  return {
    id: `manga-${item.mal_id}`,
    tmdbId: `mal-${item.mal_id}`,
    title: item.title,
    year: item.published?.prop?.from?.year || 2024,
    rating: (item.score || 0).toFixed(1),
    duration: `${item.chapters || '?'} Chapitres`,
    genre: item.genres?.map((g: any) => g.name) || ['Manga'],
    description: item.synopsis || 'Aucun synopsis disponible.',
    posterUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
    backdropUrl: item.images?.jpg?.large_image_url,
    director: item.authors?.[0]?.name || 'Auteur Inconnu',
    cast: [],
    popularity: item.popularity || 0,
    type: 'manga',
    episode: `Chap. ${item.chapters || '1'}`,
    season: 1,
    status: item.status
  };
};

export async function fetchManga(query: string = "", page: number = 1): Promise<Movie[]> {
  try {
    const endpoint = query ? `/manga?q=${encodeURIComponent(query)}&page=${page}` : `/top/manga?page=${page}`;
    const response = await fetch(`${JIKAN_URL}${endpoint}`);
    const data = await response.json();
    if (!data || !data.data) return [];
    return data.data.map(mapJikanToManga);
  } catch (error) {
    console.error("Jikan Manga Fetch Error:", error);
    return [];
  }
}

export async function fetchMovies(query: string = "trending", count: number = 20, page: number = 1): Promise<Movie[]> {
  try {
    if (query.toLowerCase().includes('manga')) {
      return await fetchManga(query.replace(/manga/gi, '').trim(), page);
    }

    let endpoint = '/trending/all/day';
    let params = `api_key=${TMDB_API_KEY}&language=fr-FR&page=${page}`;
    
    if (query.toLowerCase().includes('series') || query.toLowerCase().includes('sÃ©ries')) {
      endpoint = '/tv/popular';
      if (query.toLowerCase().includes('top')) endpoint = '/tv/top_rated';
    } else if (query.toLowerCase().includes('movies') || query.toLowerCase().includes('films')) {
      endpoint = '/movie/popular';
      if (query.toLowerCase().includes('box office')) endpoint = '/movie/now_playing';
    }

    const response = await fetch(`${BASE_URL}${endpoint}?${params}`);
    const data = await response.json();
    
    if (!data || !data.results) return [];
    
    return data.results.slice(0, count).map(mapTmdbToMovie).filter((m: any) => m.id);
  } catch (error) {
    console.error("TMDB Fetch Error:", error);
    return [];
  }
}

export async function searchMovies(query: string, page: number = 1): Promise<Movie[]> {
  try {
    if (query.toLowerCase().includes('manga')) {
      return await fetchManga(query.replace(/manga/gi, '').trim(), page);
    }
    const response = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(query)}&page=${page}`);
    const data = await response.json();
    if (!data || !data.results) return [];
    return data.results.map(mapTmdbToMovie).filter((m: any) => m.id);
  } catch (error) {
    console.error("TMDB Search Error:", error);
    return [];
  }
}

export async function fetchSeasonEpisodes(seriesId: string, seasonNumber: number): Promise<Episode[]> {
  try {
    if (seriesId.startsWith('manga-')) {
       // Mock chapters for manga
       return Array.from({ length: 12 }, (_, i) => ({
         id: `chapter-${seriesId}-${i+1}`,
         number: i + 1,
         title: `Chapitre ${i + 1}`,
         overview: "Contenu du scan manga.",
         thumbnailUrl: `https://picsum.photos/seed/${seriesId}-${i}/500/280`,
         releaseDate: new Date().toISOString()
       }));
    }
    const response = await fetch(`${BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=fr-FR`);
    const data = await response.json();
    if (!data || !data.episodes) return [];
    
    return data.episodes.map((ep: any) => ({
      id: (ep.id || '').toString(),
      number: ep.episode_number,
      title: ep.name || `Episode ${ep.episode_number}`,
      overview: ep.overview,
      thumbnailUrl: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : `https://picsum.photos/seed/${ep.id}/500/280`,
      runtime: ep.runtime ? `${ep.runtime}m` : undefined,
      releaseDate: ep.air_date
    }));
  } catch (error) {
    console.error("TMDB Season Episodes Error:", error);
    return [];
  }
}

export async function getDetailedMovie(movie: Movie): Promise<Movie> {
  if (movie.type === 'manga') return movie;
  const type = movie.type === 'series' ? 'tv' : 'movie';
  try {
    const [detailsRes, creditsRes, videosRes] = await Promise.all([
      fetch(`${BASE_URL}/${type}/${movie.id}?api_key=${TMDB_API_KEY}&language=fr-FR`),
      fetch(`${BASE_URL}/${type}/${movie.id}/credits?api_key=${TMDB_API_KEY}&language=fr-FR`),
      fetch(`${BASE_URL}/${type}/${movie.id}/videos?api_key=${TMDB_API_KEY}&language=fr-FR`)
    ]);

    const details = await detailsRes.json();
    const credits = await creditsRes.json();
    const videos = await videosRes.json();

    const cast = credits.cast?.slice(0, 5).map((c: any) => c.name) || [];
    const director = type === 'movie' 
      ? credits.crew?.find((c: any) => c.job === 'Director')?.name || 'Inconnu'
      : (details.created_by?.[0]?.name || 'TMDB Production');

    const youtubeTrailer = videos.results?.find((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
    const trailerUrl = youtubeTrailer ? `https://www.youtube.com/embed/${youtubeTrailer.key}` : undefined;

    const detailedMovie: Movie = {
      ...movie,
      genre: details.genres?.map((g: any) => g.name) || movie.genre,
      duration: type === 'movie' ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : (details.number_of_seasons ? `Saisons: ${details.number_of_seasons}` : 'Saison 1'),
      cast,
      director,
      trailerUrl,
      seasons: details.seasons?.map((s: any) => ({
        id: (s.id || '').toString(),
        number: s.season_number,
        title: s.name || `Season ${s.season_number}`,
        posterUrl: s.poster_path ? `https://image.tmdb.org/t/p/w300${s.poster_path}` : movie.posterUrl,
        episodes: [] 
      })) || []
    };

    // Auto-fetch episodes for season 1 if it's a series and we don't have them
    if (detailedMovie.type === 'series' && detailedMovie.seasons && detailedMovie.seasons.length > 0) {
      const s1 = detailedMovie.seasons.find(s => s.number === 1) || detailedMovie.seasons[0];
      if (s1 && (!s1.episodes || s1.episodes.length === 0)) {
        try {
          const episodes = await fetchSeasonEpisodes(detailedMovie.id, s1.number);
          s1.episodes = episodes;
        } catch (e) {
          console.warn("Auto-fetch episodes for season 1 failed", e);
        }
      }
    }

    return detailedMovie;
  } catch (e) {
    console.error("Details fetch error:", e);
    return movie;
  }
}

export async function getMovieRecommendations(movieId: string, isSeries: boolean): Promise<Movie[]> {
  const type = isSeries ? 'tv' : 'movie';
  try {
    const response = await fetch(`${BASE_URL}/${type}/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=fr-FR&page=1`);
    const data = await response.json();
    if (!data || !data.results) return [];
    return data.results.slice(0, 4).map(mapTmdbToMovie).filter((m: any) => m.id);
  } catch (error) {
    console.error("TMDB Recommendations Error:", error);
    return [];
  }
}
