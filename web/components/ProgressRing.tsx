'use client';

interface ProgressRingProps {
  progress: number; // 0–1
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  showPercent?: boolean;
}

export default function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 7,
  color = '#2563EB',
  label,
  sublabel,
  showPercent = true,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.min(progress, 1) * circ;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} opacity={0.12} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="ring-progress"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercent && (
          <span className="font-bold text-gray-900 leading-none" style={{ fontSize: size * 0.22 }}>
            {Math.round(progress * 100)}%
          </span>
        )}
        {label && (
          <span className="text-gray-400 leading-none mt-0.5" style={{ fontSize: size * 0.13 }}>
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-gray-300 leading-none" style={{ fontSize: size * 0.11 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
