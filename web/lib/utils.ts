export function nanoid(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatWeight(w: number): string {
  return `${w.toFixed(1)} lbs`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function categoryColor(category: string): string {
  const map: Record<string, string> = {
    fitness: 'orange',
    weight: 'blue',
    financial: 'green',
    relationship: 'pink',
    health: 'purple',
    custom: 'indigo',
  };
  return map[category] ?? 'gray';
}

export function categoryIcon(category: string): string {
  const map: Record<string, string> = {
    fitness: '🔥',
    weight: '⚖️',
    financial: '💰',
    relationship: '❤️',
    health: '💊',
    custom: '⭐',
  };
  return map[category] ?? '🎯';
}

export function habitColorClass(color: string): { bg: string; text: string; ring: string } {
  const map: Record<string, { bg: string; text: string; ring: string }> = {
    orange: { bg: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-300' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-300' },
    green: { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-300' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-600', ring: 'ring-purple-300' },
    pink: { bg: 'bg-pink-500', text: 'text-pink-600', ring: 'ring-pink-300' },
    red: { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-300' },
  };
  return map[color] ?? map.orange;
}

export function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return dateKey(d);
  });
}

export function sevenDayLabel(key: string): string {
  const d = new Date(key + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
}
