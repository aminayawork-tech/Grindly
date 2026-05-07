import { Pill, Dumbbell, Utensils, Scale, BookOpen, Droplets, Activity, Sunrise, Heart, Moon, Brain, Flame, Target, Leaf } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const HABIT_ICONS: { name: string; Icon: LucideIcon }[] = [
  { name: 'Pill', Icon: Pill },
  { name: 'Dumbbell', Icon: Dumbbell },
  { name: 'Utensils', Icon: Utensils },
  { name: 'Scale', Icon: Scale },
  { name: 'BookOpen', Icon: BookOpen },
  { name: 'Droplets', Icon: Droplets },
  { name: 'Activity', Icon: Activity },
  { name: 'Sunrise', Icon: Sunrise },
  { name: 'Heart', Icon: Heart },
  { name: 'Moon', Icon: Moon },
  { name: 'Brain', Icon: Brain },
  { name: 'Flame', Icon: Flame },
  { name: 'Target', Icon: Target },
  { name: 'Leaf', Icon: Leaf },
];

export default function HabitIcon({ name, size = 14, className = '' }: { name: string; size?: number; className?: string }) {
  const found = HABIT_ICONS.find(i => i.name === name);
  const Icon = found?.Icon ?? Dumbbell;
  return <Icon size={size} className={className} />;
}
