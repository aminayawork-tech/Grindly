'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { WorkoutSession, WorkoutSet } from '@/lib/types';
import { nanoid, formatDuration, formatDate } from '@/lib/utils';
import StatCard from '@/components/StatCard';

const WORKOUT_TYPES = [
  { id: 'pullUps', label: 'Pull-Ups', emoji: '🏋️' },
  { id: 'dips', label: 'Dips', emoji: '💪' },
  { id: 'pushUps', label: 'Push-Ups', emoji: '👐' },
  { id: 'running', label: 'Running', emoji: '🏃' },
  { id: 'custom', label: 'Custom', emoji: '⚡' },
] as const;

export default function FitnessPage() {
  const store = useStore();
  const [showLog, setShowLog] = useState(false);
  const [workoutType, setWorkoutType] = useState<WorkoutSession['type']>('pullUps');
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [repsInput, setRepsInput] = useState('');
  const [restInput, setRestInput] = useState('60');
  const [distance, setDistance] = useState('');
  const [pace, setPace] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [startTime] = useState(Date.now());

  const isRunning = workoutType === 'running';

  function addSet() {
    const reps = parseInt(repsInput);
    if (!reps) return;
    setSets(s => [...s, { id: nanoid(), reps, restSeconds: parseInt(restInput) || 60 }]);
    setRepsInput('');
  }

  function saveWorkout() {
    const duration = Math.round((Date.now() - startTime) / 1000);
    const session: WorkoutSession = {
      id: nanoid(),
      type: workoutType,
      date: new Date().toISOString(),
      sets,
      notes,
      duration,
      calories: parseFloat(calories) || 0,
      distance: parseFloat(distance) || 0,
      pace: parseFloat(pace) || 0,
    };
    store.addWorkout(session);
    setShowLog(false);
    setSets([]);
    setRepsInput('');
    setRestInput('60');
    setDistance('');
    setPace('');
    setCalories('');
    setNotes('');
  }

  const canSave = isRunning ? !!(parseFloat(distance) || parseFloat(calories)) : sets.length > 0;

  const weeklyWorkouts = store.weeklyWorkoutCount();
  const totalCalories = store.workouts.slice(0, 7).reduce((s, w) => s + w.calories, 0);
  const totalReps = store.workouts.slice(0, 10).reduce((s, w) => s + w.sets.reduce((a, b) => a + b.reps, 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Fitness 🏋️</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">Track every rep, every run</p>
        </div>
        <button onClick={() => setShowLog(true)} className="btn-primary">+ Log</button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        <StatCard label="Workouts" value={`${weeklyWorkouts}`} subtitle="this week" emoji="🔥" color="orange" />
        <StatCard label="Cals Burned" value={`${Math.round(totalCalories)}`} subtitle="recent" emoji="⚡" color="red" />
        <StatCard label="Total Reps" value={`${totalReps}`} subtitle="recent" emoji="💪" color="blue" />
      </div>

      {/* Quick log buttons */}
      <div>
        <h2 className="section-title mb-3">Quick Log</h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {WORKOUT_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => { setWorkoutType(t.id as WorkoutSession['type']); setShowLog(true); }}
              className="card-sm flex-shrink-0 flex flex-col items-center gap-2 w-20 hover:shadow-md transition-all active:scale-95"
            >
              <span className="text-3xl">{t.emoji}</span>
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent workouts */}
      <div>
        <h2 className="section-title mb-3">Recent Workouts</h2>
        {store.workouts.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-3">🏋️</div>
            <p className="font-semibold text-gray-500">No workouts yet</p>
            <p className="text-sm text-gray-400 mt-1">Tap + Log to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {store.workouts.slice(0, 15).map(w => {
              const t = WORKOUT_TYPES.find(x => x.id === w.type);
              const totalReps = w.sets.reduce((s, x) => s + x.reps, 0);
              return (
                <div key={w.id} className="card-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {t?.emoji ?? '⚡'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{t?.label ?? 'Custom'}</div>
                    <div className="text-sm text-gray-400 mt-0.5">
                      {w.sets.length > 0 && `${w.sets.length} sets · ${totalReps} reps`}
                      {w.distance ? ` · ${w.distance.toFixed(2)} mi` : ''}
                      {w.pace ? ` · ${w.pace.toFixed(1)} min/mi` : ''}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-gray-700">{formatDuration(w.duration)}</div>
                    <div className="text-xs text-gray-400">{formatDate(w.date)}</div>
                    {w.calories > 0 && <div className="text-xs text-orange-500 font-medium">{Math.round(w.calories)} kcal</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Modal */}
      {showLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Log Workout</h2>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Type picker */}
              <div>
                <label className="label mb-2 block">Type</label>
                <div className="flex gap-2 flex-wrap">
                  {WORKOUT_TYPES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setWorkoutType(t.id as WorkoutSession['type'])}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${workoutType === t.id ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {isRunning ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label mb-1 block">Distance (miles)</label>
                      <input className="input" type="number" step="0.01" placeholder="3.1" value={distance} onChange={e => setDistance(e.target.value)} />
                    </div>
                    <div>
                      <label className="label mb-1 block">Avg Pace (min/mi)</label>
                      <input className="input" type="number" step="0.1" placeholder="9.5" value={pace} onChange={e => setPace(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label mb-1 block">Calories Burned</label>
                    <input className="input" type="number" placeholder="320" value={calories} onChange={e => setCalories(e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label mb-2 block">Sets</label>
                    <div className="flex gap-2 mb-3">
                      <input className="input" type="number" placeholder="Reps" value={repsInput} onChange={e => setRepsInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSet()} />
                      <input className="input w-24" type="number" placeholder="Rest (s)" value={restInput} onChange={e => setRestInput(e.target.value)} />
                      <button onClick={addSet} disabled={!repsInput} className="btn-primary px-4">+</button>
                    </div>
                    {sets.length > 0 && (
                      <div className="space-y-2">
                        {sets.map((s, i) => (
                          <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                            <span className="font-semibold text-sm text-gray-700">Set {i + 1}</span>
                            <span className="text-sm text-gray-500">{s.reps} reps · {s.restSeconds}s rest</span>
                            <button onClick={() => setSets(prev => prev.filter(x => x.id !== s.id))} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="label mb-1 block">Calories Burned (optional)</label>
                    <input className="input" type="number" placeholder="e.g. 150" value={calories} onChange={e => setCalories(e.target.value)} />
                  </div>
                </>
              )}

              <div>
                <label className="label mb-1 block">Notes</label>
                <input className="input" placeholder="Optional notes" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowLog(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={saveWorkout} disabled={!canSave} className="flex-1 btn-primary">Save Workout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
