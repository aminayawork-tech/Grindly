'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Target, Dumbbell, Utensils, Scale, CheckSquare, Bot, BarChart3, Settings, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const navItems: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/', label: 'Goals', Icon: Target },
  { href: '/fitness', label: 'Fitness', Icon: Dumbbell },
  { href: '/calories', label: 'Calories', Icon: Utensils },
  { href: '/weight', label: 'Weight', Icon: Scale },
  { href: '/habits', label: 'Habits', Icon: CheckSquare },
  { href: '/coach', label: 'AI', Icon: Bot },
  { href: '/report', label: 'Report', Icon: BarChart3 },
  { href: '/settings', label: 'Settings', Icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 z-40">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Grindly</h1>
              <p className="text-xs text-gray-400 font-medium">grindly.app</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href;
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                {item.label}
                {active && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">grindly.app · v1.0</p>
        </div>
      </aside>

      {/* Mobile bottom bar — scrollable, all 8 items */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-area-bottom">
        <div className="flex overflow-x-auto scrollbar-none">
          {navItems.map(item => {
            const active = pathname === item.href;
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex-shrink-0 flex flex-col items-center justify-center py-2 px-3 gap-0.5 min-w-[64px] transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <Icon size={20} />
                <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                  {item.label}
                </span>
                {active && <div className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-full" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
