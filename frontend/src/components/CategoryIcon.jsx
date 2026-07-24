import React from 'react';
import {
  Tag,
  HeartPulse,
  Briefcase,
  Brain,
  Wallet,
  Home,
  Sparkles,
  BookOpen,
  Palette,
  Music,
  Smile,
  Flame,
  Zap,
  Star,
  Target,
  Shield,
} from 'lucide-react';

const ICON_MAP = {
  Tag,
  HeartPulse,
  Briefcase,
  Brain,
  Wallet,
  Home,
  Sparkles,
  BookOpen,
  Palette,
  Music,
  Smile,
  Flame,
  Zap,
  Star,
  Target,
  Shield,
};

export const AVAILABLE_CATEGORY_ICONS = [
  'Tag',
  'HeartPulse',
  'Briefcase',
  'Brain',
  'Wallet',
  'Home',
  'Sparkles',
  'BookOpen',
  'Palette',
  'Music',
  'Smile',
  'Flame',
  'Zap',
  'Star',
];

export const AVAILABLE_CATEGORY_COLORS = [
  '#6b7280', // General Gray
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#a855f7', // Violet
];

export default function CategoryIcon({ name, size = 14, className = '', style = {} }) {
  const IconComponent = ICON_MAP[name] || Tag;
  return <IconComponent size={size} className={className} style={style} />;
}
