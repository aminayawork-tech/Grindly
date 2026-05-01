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
    <div className="card-sm min-w-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colorMap[color]}`}>
        <span className="text-base">{emoji}</span>
      </div>
      <div className="text-xl font-bold text-gray-900 tabular-nums truncate">{value}</div>
      <div className="label mt-0.5 truncate">{label}</div>
      {subtitle && <div className="text-xs text-gray-400 truncate">{subtitle}</div>}
    </div>
  );
}
