'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Habit } from '@/lib/types';
import { nanoid, todayKey, dateKey, last7Days, currentWeekDays, sevenDayLabel, habitColorClass } from '@/lib/utils';
import StatCard from '@/components/StatCard';

const ICONS = ['💊', '🏋️', '🍽️', '⚖️', '📚', '💧', '🧘', '🌅', '🏃', '💪', '🥗', '😴', '🧠', '❤️'];
const COLORS = ['orange', 'blue', 'green', 'purple', 'pink', 'red'] as const;

function getStreak(habit: Habit): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', icon: '⭐', color: 'orange' as typeof COLORS[number] });
  const weekDays = currentWeekDays();
  const todayStr = todayKey();

  const completedToday = store.habits.filter(h => h.completions.includes(todayStr)).length;
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

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Today" value={`${completedToday}/${store.habits.length}`} subtitle="done" emoji="✅" color="green" compact />
        <StatCard label="Weekly" value={`${Math.round(avgRate * 100)}%`} subtitle="rate" emoji="📈" color="purple" compact />
        <StatCard label="Streak" value={`${bestStreak}`} subtitle="days" emoji="🔥" color="orange" compact />
      </div>

      {store.habits.length > 0 && (
        <div className="card">
          <div className="flex items-center mb-3">
            <div className="flex-1 font-bold text-gray-900">Today&apos;s Habits</div>
            <div className="flex gap-1">
              {weekDays.map(d => (
                <div key={d} className="w-8 text-center text-xs font-semibold text-gray-400">{sevenDayLabel(d)}</div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {store.habits.map(habit => {
              const done = habit.completions.includes(todayStr);
              const streak = getStreak(habit);
              const rate = getWeeklyRate(habit);
              const colorCls = habitColorClass(habit.color);
              const confirming = deleteConfirm === habit.id;

              return (
                <div key={habit.id}>
                  <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${done ? `bg-${habit.color}-50 border border-${habit.color}-100` : 'bg-gray-50'}`}>
                    <button
                      onClick={() => store.toggleHabit(habit.id)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
                        done ? `${colorCls.bg} text-white shadow-sm` : 'bg-white border-2 border-gray-200'
                      }`}
                    >
                      {done && <span className="text-sm font-bold">✓</span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{habit.icon}</span>
                        <span className={`font-semibold text-sm ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{habit.name}</span>
                        {streak > 0 && <span className="text-xs font-bold text-orange-500">🔥 {streak}</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{Math.round(rate * 100)}% this week</div>
                    </div>

                    {!confirming && (
                      <div className="flex gap-1">
                        {weekDays.map(d => {
                          const completed = habit.completions.includes(d);
                          const isToday = d === todayStr;
                          const isFuture = d > todayStr;
                          return (
                            <div
                              key={d}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                                completed
                                  ? `${colorCls.bg} text-white`
                                  : isFuture
                                  ? 'bg-gray-50 text-gray-200'
                                  : isToday
                                  ? 'bg-white border-2 border-gray-200'
                                  : 'bg-gray-100'
                              }`}
                            >
                              {completed && '✓'}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => setDeleteConfirm(confirming ? null : habit.id)}
                      className="text-gray-300 hover:text-red-400 flex-shrink-0 text-base leading-none transition-colors ml-1"
                    >
                      ⋯
                    </button>
                  </div>

                  {confirming && (
                    <div className="flex items-center justify-between mt-1 ml-12 bg-red-50 rounded-lg px-3 py-2">
                      <span className="text-xs text-red-600 font-medium">Remove this habit?</span>
                      <div className="flex gap-2">
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-500 font-semibold px-2 py-1 rounded-lg hover:bg-gray-100">Cancel</button>
                        <button onClick={() => { store.removeHabit(habit.id); setDeleteConfirm(null); }} className="text-xs text-white font-semibold px-2 py-1 rounded-lg bg-red-500">Remove</button>
                      </div>
                    </div>
                  )}
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
