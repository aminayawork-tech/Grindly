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

function progressPct(goal: Goal): number {
  if (goal.category === 'weight') {
    const start = Math.max(goal.progressValue, ...goal.milestones.map(m => m.value));
    const total = start - goal.targetValue;
    return total > 0 ? Math.max(0, Math.min((start - goal.progressValue) / total, 1)) : 0;
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
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editValue, setEditValue] = useState('');
  const [form, setForm] = useState({ title: '', category: 'custom', progressValue: '', targetValue: '', unit: '', notes: '', motivationalMessage: '' });

  const activeGoals = store.goals.filter(g => g.isActive);
  const avgHabit = store.habits.length
    ? store.habits.map(h => {
        const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); });
        return days.filter(d => h.completions.includes(d)).length / 7;
      }).reduce((a, b) => a + b, 0) / store.habits.length
    : 0;

  function openEdit(goal: Goal) {
    setEditGoal(goal);
    setEditValue(String(goal.progressValue));
  }

  function saveEdit() {
    if (!editGoal) return;
    store.updateGoal({ ...editGoal, progressValue: parseFloat(editValue) || editGoal.progressValue });
    setEditGoal(null);
  }

  function archiveGoal() {
    if (!editGoal) return;
    store.updateGoal({ ...editGoal, isActive: false });
    setEditGoal(null);
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Grindly ⚡</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">Your personal growth dashboard</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">+ Goal</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Workouts" value={`${store.weeklyWorkoutCount()}`} subtitle="this week" emoji="🔥" color="orange" />
        <StatCard label="Calories" value={`${Math.round(store.todayCalories())}`} subtitle="today" emoji="🍽️" color="green" />
        <StatCard label="Weight" value={`${store.weightTrendData().current.toFixed(1)}`} subtitle="lbs" emoji="⚖️" color="blue" />
        <StatCard label="Habits" value={`${Math.round(avgHabit * 100)}%`} subtitle="weekly" emoji="✅" color="purple" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Active Goals</h2>
          <span className="text-xs text-gray-400">Tap to update</span>
        </div>
        <div className="space-y-3">
          {activeGoals.map(goal => {
            const pct = progressPct(goal);
            const color = categoryColor(goal.category);
            const ringColor = COLOR_RING[color] ?? '#2563EB';
            return (
              <button key={goal.id} onClick={() => openEdit(goal)} className="card w-full text-left hover:shadow-md active:scale-[0.99] transition-all">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-${color}-50 flex-shrink-0`}>
                    {categoryIcon(goal.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{goal.title}</h3>
                        <p className="text-sm text-gray-400 mt-0.5">{statusMessage(pct)}</p>
                        <p className="text-xs text-gray-400">{goal.progressValue} / {goal.targetValue} {goal.unit}</p>
                      </div>
                      <ProgressRing progress={pct} size={56} strokeWidth={5} color={ringColor} />
                    </div>
                    {goal.milestones.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {goal.milestones.map(m => {
                          const achieved = goal.category === 'weight'
                            ? goal.progressValue <= m.value
                            : goal.progressValue >= m.value;
                          return (
                            <span key={m.id} className={`text-xs font-medium px-2 py-0.5 rounded-full ${achieved ? `bg-${color}-100 text-${color}-700` : 'bg-gray-100 text-gray-400'}`}>
                              {achieved ? '✓' : '○'} {m.title}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {activeGoals.length === 0 && (
            <div className="card text-center py-10">
              <div className="text-4xl mb-2">🎯</div>
              <p className="font-semibold text-gray-500">No active goals</p>
              <p className="text-sm text-gray-400 mt-1">Tap + Goal to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Update Goal Modal */}
      {editGoal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl flex-shrink-0">{categoryIcon(editGoal.category)}</span>
                <h2 className="text-lg font-bold truncate">{editGoal.title}</h2>
              </div>
              <button onClick={() => setEditGoal(null)} className="text-gray-400 text-xl leading-none ml-2">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label mb-1 block">Current Progress ({editGoal.unit})</label>
                <input
                  className="input text-lg font-bold"
                  type="number"
                  step="0.1"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Target: {editGoal.targetValue} {editGoal.unit}</p>
              </div>
              {editGoal.milestones.length > 0 && (
                <div className="space-y-1">
                  {editGoal.milestones.map(m => {
                    const val = parseFloat(editValue) || editGoal.progressValue;
                    const achieved = editGoal.category === 'weight' ? val <= m.value : val >= m.value;
                    return (
                      <div key={m.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${achieved ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                        <span>{achieved ? '✅' : '○'}</span>
                        <span className="font-medium flex-1">{m.title}</span>
                        <span className="text-xs opacity-60">{m.value} {editGoal.unit}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={archiveGoal} className="px-4 py-3 rounded-xl border border-red-200 text-red-500 font-semibold text-sm">
                Archive
              </button>
              <button onClick={() => setEditGoal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600">Cancel</button>
              <button onClick={saveEdit} className="flex-1 btn-primary">Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">New Goal</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 text-xl leading-none">✕</button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
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
                <textarea className="input resize-none" rows={2} placeholder="Strategy, context..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
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
