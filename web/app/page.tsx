'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Goal } from '@/lib/types';
import { categoryColor, categoryIcon, nanoid } from '@/lib/utils';
import ProgressRing from '@/components/ProgressRing';
import StatCard from '@/components/StatCard';

const COLOR_RING: Record<string, string> = {
  orange: '#F97316', blue: '#2563EB', green: '#16A34A',
  pink: '#DB2777', purple: '#7C3AED', indigo: '#4F46E5',
};

function progressPct(goal: Goal) {
  if (goal.category === 'weight') {
    const range = goal.progressValue - goal.targetValue;
    const total = (goal.milestones[0]?.value ?? goal.progressValue) - goal.targetValue;
    return total > 0 ? Math.min(1 - range / total, 1) : 0;
  }
  return goal.targetValue > 0 ? Math.min(goal.progressValue / goal.targetValue, 1) : 0;
}

function statusMessage(pct: number) {
  if (pct >= 1) return 'Goal Achieved! 🏆';
  if (pct >= 0.75) return 'Almost there! Keep pushing!';
  if (pct >= 0.5) return 'Halfway there — stay consistent!';
  if (pct >= 0.25) return 'Building momentum, don\'t stop!';
  return 'Day 1 energy — let\'s go!';
}

export default function GoalsDashboard() {
  const store = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'custom', progressValue: '', targetValue: '', unit: '', notes: '', motivationalMessage: '' });

  const activeGoals = store.goals.filter(g => g.isActive);
  const avgHabit = store.habits.length
    ? store.habits.map(h => {
        const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); });
        return days.filter(d => h.completions.includes(d)).length / 7;
      }).reduce((a, b) => a + b, 0) / store.habits.length
    : 0;

  function addGoal() {
    const goal: Goal = {
      id: nanoid(),
      title: form.title,
      category: form.category as Goal['category'],
      progressValue: parseFloat(form.progressValue) || 0,
      targetValue: parseFloat(form.targetValue) || 100,
      unit: form.unit,
      motivationalMessage: form.motivationalMessage,
      notes: form.notes,
      milestones: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    store.addGoal(goal);
    setShowAdd(false);
    setForm({ title: '', category: 'custom', progressValue: '', targetValue: '', unit: '', notes: '', motivationalMessage: '' });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Grindly ⚡</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">Your personal growth dashboard</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1.5">
          <span>+</span> Goal
        </button>
      </div>

      {/* Quick stats — 2×2 grid on mobile */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Workouts" value={`${store.weeklyWorkoutCount()}`} subtitle="this week" emoji="🔥" color="orange" />
        <StatCard label="Calories" value={`${Math.round(store.todayCalories())}`} subtitle="today" emoji="🍽️" color="green" />
        <StatCard label="Weight" value={`${store.weightTrendData().current.toFixed(1)}`} subtitle="lbs" emoji="⚖️" color="blue" />
        <StatCard label="Habits" value={`${Math.round(avgHabit * 100)}%`} subtitle="weekly" emoji="✅" color="purple" />
      </div>

      {/* Goals */}
      <div>
        <h2 className="section-title mb-4">Active Goals</h2>
        <div className="space-y-3">
          {activeGoals.map(goal => {
            const pct = progressPct(goal);
            const color = categoryColor(goal.category);
            const ringColor = COLOR_RING[color] ?? '#2563EB';
            return (
              <div key={goal.id} className="card hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-${color}-50 flex-shrink-0`}>
                    {categoryIcon(goal.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{goal.title}</h3>
                        <p className="text-sm text-gray-400 mt-0.5">{statusMessage(pct)}</p>
                      </div>
                      <ProgressRing progress={pct} size={56} strokeWidth={5} color={ringColor} />
                    </div>
                    {goal.motivationalMessage && (
                      <p className="text-sm text-gray-500 italic mt-2 line-clamp-1">&ldquo;{goal.motivationalMessage}&rdquo;</p>
                    )}
                    {goal.milestones.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {goal.milestones.map(m => {
                          const achieved = goal.category === 'weight'
                            ? goal.progressValue <= m.value
                            : goal.progressValue >= m.value;
                          return (
                            <span key={m.id} className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${achieved ? `bg-${color}-100 text-${color}-700` : 'bg-gray-100 text-gray-400'}`}>
                              {achieved ? '✓' : '○'} {m.title}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold">New Goal</h2>
            </div>
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="label mb-1 block">Goal Title</label>
                <input className="input" placeholder="e.g. Run a 5K" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="label mb-1 block">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {['fitness', 'weight', 'financial', 'relationship', 'health', 'custom'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label mb-1 block">Current</label>
                  <input className="input" placeholder="0" type="number" value={form.progressValue} onChange={e => setForm(f => ({ ...f, progressValue: e.target.value }))} />
                </div>
                <div>
                  <label className="label mb-1 block">Target</label>
                  <input className="input" placeholder="100" type="number" value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))} />
                </div>
                <div>
                  <label className="label mb-1 block">Unit</label>
                  <input className="input" placeholder="%" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label mb-1 block">Motivational Message</label>
                <input className="input" placeholder="What drives you?" value={form.motivationalMessage} onChange={e => setForm(f => ({ ...f, motivationalMessage: e.target.value }))} />
              </div>
              <div>
                <label className="label mb-1 block">Notes</label>
                <textarea className="input resize-none" rows={3} placeholder="Strategy, context..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600">Cancel</button>
              <button onClick={addGoal} disabled={!form.title} className="flex-1 btn-primary">Add Goal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
