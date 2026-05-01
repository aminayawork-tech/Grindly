'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Habit } from '@/lib/types';
import { nanoid, last7Days, sevenDayLabel, habitColorClass } from '@/lib/utils';
import StatCard from '@/components/StatCard';

const ICONS = ['💊', '🏋️', '🍽️', '⚖️', '📚', '💧', '🧘', '🌅', '🏃', '💪', '🥗', '😴', '🧠', '❤️'];
const COLORS = ['orange', 'blue', 'green', 'purple', 'pink', 'red'] as const;

function getStreak(habit: Habit): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (habit.completions.includes(key)) streak++;
    else break;
  }
  return streak;
}

function getWeeklyRate(habit: Habit): number {
  const days = last7Days();
  return days.filter(d => habit.completions.includes(d)).length / 7;
}

export default function HabitsPage() {
  const store = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '⭐', color: 'orange' as typeof COLORS[number] });
  const days = last7Days();

  const completedToday = store.habits.filter(h => h.completions.includes(new Date().toISOString().slice(0, 10))).length;
  const avgRate = store.habits.length ? store.habits.map(h => getWeeklyRate(h)).reduce((a, b) => a + b, 0) / store.habits.length : 0;
  const bestStreak = store.habits.length ? Math.max(...store.habits.map(h => getStreak(h))) : 0;

  function addHabit() {
    const habit: Habit = {
      id: nanoid(),
      name: form.name,
      icon: form.icon,
      color: form.color,
      completions: [],
      reminderEnabled: false,
      createdAt: new Date().toISOString(),
    };
    store.addHabit(habit);
    setShowAdd(false);
    setForm({ name: '', icon: '⭐', color: 'orange' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Habits ✅</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">Build the streak, become the person</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">+ Habit</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Today" value={`${completedToday}/${store.habits.length}`} subtitle="done" emoji="✅" color="green" />
        <StatCard label="Weekly" value={`${Math.round(avgRate * 100)}%`} subtitle="rate" emoji="📈" color="purple" />
        <StatCard label="Streak" value={`${bestStreak}`} subtitle="days" emoji="🔥" color="orange" />
      </div>

      {/* Week header */}
      {store.habits.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-3">Today&apos;s Habits</h2>
          <div className="space-y-2">
            {store.habits.map(habit => {
              const todayKey = new Date().toISOString().slice(0, 10);
              const done = habit.completions.includes(todayKey);
              const streak = getStreak(habit);
              const rate = getWeeklyRate(habit);
              const colorCls = habitColorClass(habit.color);

              return (
                <div key={habit.id} className={`p-3 rounded-xl transition-all ${done ? `bg-${habit.color}-50 border border-${habit.color}-100` : 'bg-gray-50'}`}>
                  {/* Top row: toggle + name */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => store.toggleHabit(habit.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
                        done ? `${colorCls.bg} text-white shadow-sm` : 'bg-white border-2 border-gray-200'
                      }`}
                    >
                      {done && <span className="text-xs font-bold">✓</span>}
                    </button>
                    <span className="text-base">{habit.icon}</span>
                    <span className={`font-semibold text-sm flex-1 truncate ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{habit.name}</span>
                    {streak > 0 && <span className="text-xs font-bold text-orange-500 flex-shrink-0">🔥 {streak}</span>}
                    <span className="text-xs text-gray-400 flex-shrink-0">{Math.round(rate * 100)}%</span>
                  </div>
                  {/* Bottom row: 7-day dots */}
                  <div className="flex gap-1.5 mt-2 ml-10">
                    {days.map(d => {
                      const completed = habit.completions.includes(d);
                      const isToday = d === todayKey;
                      return (
                        <div
                          key={d}
                          title={d}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                            completed
                              ? `${colorCls.bg} text-white`
                              : isToday
                              ? 'bg-white border-2 border-gray-300 text-gray-500'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {completed ? '✓' : sevenDayLabel(d)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {store.habits.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-5xl mb-3">✅</div>
          <p className="font-semibold text-gray-500">No habits yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first habit to start building streaks</p>
        </div>
      )}

      {/* Add Habit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-bold">New Habit</h2></div>
            <div className="p-6 space-y-5">
              <div>
                <label className="label mb-1 block">Habit Name</label>
                <input autoFocus className="input" placeholder="e.g. Take vitamins" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500 scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label mb-2 block">Color</label>
                <div className="flex gap-3">
                  {COLORS.map(color => {
                    const cls = habitColorClass(color);
                    return (
                      <button key={color} onClick={() => setForm(f => ({ ...f, color }))}
                        className={`w-8 h-8 rounded-full ${cls.bg} transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`} />
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600">Cancel</button>
              <button onClick={addHabit} disabled={!form.name} className="flex-1 btn-primary">Add Habit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
