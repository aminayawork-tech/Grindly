interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  emoji: string;
  color?: 'orange' | 'blue' | 'green' | 'purple' | 'pink' | 'red';
}

const colorMap = {
  orange: 'bg-orange-50 text-orange-500',
  blue: 'bg-blue-50 text-blue-500',
  green: 'bg-green-50 text-green-500',
  purple: 'bg-purple-50 text-purple-500',
  pink: 'bg-pink-50 text-pink-500',
  red: 'bg-red-50 text-red-500',
};

export default function StatCard({ label, value, subtitle, emoji, color = 'blue' }: StatCardProps) {
  return (
    <div className="card-sm flex-1 min-w-0">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <span className="text-lg">{emoji}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums truncate">{value}</div>
      <div className="label mt-1">{label}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
    </div>
  );
}
