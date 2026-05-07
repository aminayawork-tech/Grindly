import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'orange' | 'blue' | 'green' | 'purple' | 'pink' | 'red';
  compact?: boolean;
}

const colorMap = {
  orange: 'bg-orange-50 text-orange-500',
  blue: 'bg-blue-50 text-blue-500',
  green: 'bg-green-50 text-green-500',
  purple: 'bg-purple-50 text-purple-500',
  pink: 'bg-pink-50 text-pink-500',
  red: 'bg-red-50 text-red-500',
};

export default function StatCard({ label, value, subtitle, icon, color = 'blue', compact }: StatCardProps) {
  return (
    <div className={`min-w-0 bg-white rounded-xl shadow-sm border border-gray-100 ${compact ? 'p-3' : 'p-4'} flex-1`}>
      <div className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} rounded-lg flex items-center justify-center mb-1.5 ${colorMap[color]}`}>
        {icon}
      </div>
      <div className={`font-bold text-gray-900 tabular-nums truncate ${compact ? 'text-lg' : 'text-xl'}`}>{value}</div>
      <div className="label mt-0.5 truncate">{label}</div>
      {subtitle && <div className="text-xs text-gray-400 truncate">{subtitle}</div>}
    </div>
  );
}
