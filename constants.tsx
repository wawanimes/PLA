
import React from 'react';
import { 
  Film, 
  Tv, 
  Flame, 
  Clock, 
  Star, 
  TrendingUp, 
  Ghost, 
  Zap, 
  Heart, 
  Compass,
  Search,
  Menu,
  X,
  Play,
  Info,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { Genre } from './types';

export const GENRES: Genre[] = [
  { id: 'action', name: 'Action', icon: 'Zap' },
  { id: 'sci-fi', name: 'Sci-Fi', icon: 'Compass' },
  { id: 'horror', name: 'Horror', icon: 'Ghost' },
  { id: 'comedy', name: 'Comedy', icon: 'Flame' },
  { id: 'romance', name: 'Romance', icon: 'Heart' },
  { id: 'documentary', name: 'Documentary', icon: 'Monitor' },
];

export const UI_ICONS = {
  Film: <Film size={20} />,
  Tv: <Tv size={20} />,
  Flame: <Flame size={20} />,
  Clock: <Clock size={20} />,
  Star: <Star size={16} />,
  TrendingUp: <TrendingUp size={20} />,
  Ghost: <Ghost size={20} />,
  Zap: <Zap size={20} />,
  Heart: <Heart size={20} />,
  Compass: <Compass size={20} />,
  Search: <Search size={20} />,
  Menu: <Menu size={24} />,
  X: <X size={24} />,
  Play: <Play size={20} fill="currentColor" />,
  Info: <Info size={20} />,
  ChevronRight: <ChevronRight size={20} />,
};
