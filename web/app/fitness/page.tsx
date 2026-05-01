'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { WorkoutSession } from '@/lib/types';
import { nanoid, formatDuration, formatDate } from '@/lib/utils';
import StatCard from '@/components/StatCard';

const CALISTHENICS_PRESETS = [
  { label: 'Pull-Ups', emoji: '🏋️' },
  { label: 'Dips', emoji: '💪' },
  { label: 'Push-Ups', emoji: '👐' },
  { label: 'Squats', emoji: '🦵' },
  { label: 'Lunges', emoji: '🚶' },
  { label: 'Burpees', emoji: '⚡' },
  { label: 'Sit-Ups', emoji: '🤸' },
  { label: 'Plank', emoji: '🧘' },
];

interface SetEntry {
  id: string;
  exercise: string;
  reps: number;
  restSeconds: number;
}

function workoutEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('run') || n.includes('jog')) return '🏃';
  if (n.includes('jiu') || n.includes('jujitsu') || n.includes('bjj') || n.includes('martial') || n.includes('grappl')) return '🥋';
  if (n.includes('box')) return '🥊';
  if (n.includes('swim')) return '🏊';
  if (n.includes('bike') || n.includes('cycl')) return '🚴';
  if (n.includes('yoga')) return '🧘';
  if (n.includes('pull')) return '🏋️';
  if (n.includes('push')) return '👐';
  if (n.includes('dip')) return '💪';
  return '⚡';
}

export default function FitnessPage() {
  const store = useStore();
  const [showLog, setShowLog] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [activeExercise, setActiveExercise] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [restInput, setRestInput] = useState('60');
  const [durationInput, setDurationInput] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');

  function selectPreset(label: string) {
    setActiveExercise(label);
    setRepsInput('');
  }

  function addSet() {
    const reps = parseInt(repsInput);
    const exercise = activeExercise.trim();
    if (!reps || !exercise) return;
    setSets(s => [...s, { id: nanoid(), exercise, reps, restSeconds: parseInt(restInput) || 60 }]);
    setRepsInput('');
  }

  function saveWorkout() {
    const session: WorkoutSession = {
      id: nanoid(),
      name: workoutName.trim() || 'Workout',
      type: 'custom',
      date: new Date().toISOString(),
      sets: sets.map(s => ({ id: s.id, exercise: s.exercise, reps: s.reps, restSeconds: s.restSeconds })),
      notes,
      duration: (parseInt(durationInput) || 0) * 60,
      calories: parseFloat(calories) || 0,
    };
    store.addWorkout(session);
    resetForm();
  }

  function resetForm() {
    setShowLog(false);
    setWorkoutName('');
    setSets([]);
    setActiveExercise('');
    setRepsInput('');
    setRestInput('60');
    setDurationInput('');
    setCalories('');
    setNotes('');
  }

  function getLabel(w: WorkoutSession): string {
    if (w.name) return w.name;
    const legacyMap: Record<string, string> = {
      pullUps: 'Pull-Ups', dips: 'Dips', pushUps: 'Push-Ups', running: 'Running', custom: 'Workout',
    };
    return legacyMap[w.type] ?? 'Workout';
  }

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

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Workouts" value={`${weeklyWorkouts}`} subtitle="this week" emoji="🔥" color="orange" compact />
        <StatCard label="Calories" value={`${Math.round(totalCalories)}`} subtitle="burned" emoji="⚡" color="red" compact />
        <StatCard label="Reps" value={`${totalReps}`} subtitle="recent" emoji="💪" color="blue" compact />
      </div>

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
              const label = getLabel(w);
              const repCount = w.sets.reduce((s, x) => s + x.reps, 0);
              return (
                <div key={w.id} className="card-sm flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {workoutEmoji(label)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{label}</div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      {w.sets.length > 0 ? `${w.sets.length} sets · ${repCount} reps` : ''}
                      {w.distance ? ` · ${w.distance.toFixed(2)} mi` : ''}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {w.duration > 0 && <div className="text-sm font-semibold text-gray-700">{formatDuration(w.duration)}</div>}
                    <div className="text-xs text-gray-400">{formatDate(w.date)}</div>
                    {w.calories > 0 && <div className="text-xs text-orange-500 font-medium">{Math.round(w.calories)} kcal</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Log Workout</h2>
              <button onClick={resetForm} className="text-gray-400 text-xl leading-none">✕</button>
            </div>
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">

              {/* Free-text workout name */}
              <div>
                <label className="label mb-1 block">Workout Name</label>
                <input
                  autoFocus
                  className="input"
                  placeholder="e.g. Jujitsu, Morning Run, Calisthenics"
                  value={workoutName}
                  onChange={e => setWorkoutName(e.target.value)}
                />
              </div>

              {/* Calisthenics sets with presets */}
              <div>
                <label className="label mb-2 block">Calisthenics Sets (optional)</label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {CALISTHENICS_PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => selectPreset(p.label)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        activeExercise === p.label
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {p.emoji} {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Exercise name"
                    value={activeExercise}
                    onChange={e => setActiveExercise(e.target.value)}
                  />
                  <input
                    className="input w-20"
                    type="number"
                    placeholder="Reps"
                    value={repsInput}
                    onChange={e => setRepsInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSet()}
                  />
                  <input
                    className="input w-20"
                    type="number"
                    placeholder="Rest s"
                    value={restInput}
                    onChange={e => setRestInput(e.target.value)}
                  />
                  <button onClick={addSet} disabled={!repsInput || !activeExercise} className="btn-primary px-3">+</button>
                </div>
                {sets.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    {sets.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                        <span className="text-xs text-gray-400 w-5 flex-shrink-0">#{i + 1}</span>
                        <span className="text-sm font-semibold text-gray-800 flex-1 truncate">{s.exercise}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">{s.reps} reps · {s.restSeconds}s</span>
                        <button onClick={() => setSets(prev => prev.filter(x => x.id !== s.id))} className="text-red-400 text-sm flex-shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1 block">Duration (min)</label>
                  <input className="input" type="number" placeholder="45" value={durationInput} onChange={e => setDurationInput(e.target.value)} />
                </div>
                <div>
                  <label className="label mb-1 block">Calories</label>
                  <input className="input" type="number" placeholder="300" value={calories} onChange={e => setCalories(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label mb-1 block">Notes</label>
                <input className="input" placeholder="Optional notes" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={resetForm} className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600">Cancel</button>
              <button onClick={saveWorkout} disabled={!workoutName.trim()} className="flex-1 btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
