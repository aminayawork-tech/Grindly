'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { WorkoutSession, WorkoutSet } from '@/lib/types';
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

function workoutEmoji(name: string): string {
  const n = name.toLowerCase();
  if (/jujitsu|bjj|jiu.?jitsu|grappl/.test(n)) return '🥋';
  if (/box|muay|kickbox/.test(n)) return '🥊';
  if (/run|jog|sprint/.test(n)) return '🏃';
  if (/swim/.test(n)) return '🏊';
  if (/bike|cycl/.test(n)) return '🚴';
  if (/yoga/.test(n)) return '🧘';
  if (/hike|walk/.test(n)) return '🥾';
  if (/lift|weight|gym/.test(n)) return '🏋️';
  return '⚡';
}

function getLabel(w: WorkoutSession): { label: string; emoji: string } {
  if (w.name) return { label: w.name, emoji: workoutEmoji(w.name) };
  const legacy: Record<string, { label: string; emoji: string }> = {
    pullUps: { label: 'Pull-Ups', emoji: '🏋️' },
    dips: { label: 'Dips', emoji: '💪' },
    pushUps: { label: 'Push-Ups', emoji: '👐' },
    running: { label: 'Running', emoji: '🏃' },
    custom: { label: 'Workout', emoji: '⚡' },
  };
  return legacy[w.type] ?? { label: 'Workout', emoji: '⚡' };
}

export default function FitnessPage() {
  const store = useStore();
  const [showLog, setShowLog] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [activeExercise, setActiveExercise] = useState('');
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [repsInput, setRepsInput] = useState('');
  const [restInput, setRestInput] = useState('60');
  const [calories, setCalories] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  function addSet() {
    const reps = parseInt(repsInput);
    if (!reps) return;
    setSets(s => [...s, { id: nanoid(), exercise: activeExercise || undefined, reps, restSeconds: parseInt(restInput) || 60 }]);
    setRepsInput('');
  }

  function saveWorkout() {
    const session: WorkoutSession = {
      id: nanoid(),
      type: 'custom',
      name: workoutName.trim(),
      date: new Date().toISOString(),
      sets,
      notes,
      duration: parseFloat(duration) ? Math.round(parseFloat(duration) * 60) : 0,
      calories: parseFloat(calories) || 0,
    };
    store.addWorkout(session);
    setShowLog(false);
    setWorkoutName('');
    setActiveExercise('');
    setSets([]);
    setRepsInput('');
    setRestInput('60');
    setCalories('');
    setDuration('');
    setNotes('');
  }

  const weeklyWorkouts = store.weeklyWorkoutCount();
  const totalCalories = store.workouts.slice(0, 7).reduce((s, w) => s + w.calories, 0);
  const totalReps = store.workouts.slice(0, 10).reduce((s, w) => s + w.sets.reduce((a, b) => a + b.reps, 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Fitness 🏋️</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">Track every session</p>
        </div>
        <button onClick={() => setShowLog(true)} className="btn-primary">+ Log</button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Workouts" value={`${weeklyWorkouts}`} subtitle="this week" emoji="🔥" color="orange" compact />
        <StatCard label="Cals" value={`${Math.round(totalCalories)}`} subtitle="burned" emoji="⚡" color="red" compact />
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
              const { label, emoji } = getLabel(w);
              const repsTotal = w.sets.reduce((s, x) => s + x.reps, 0);
              const exercises = [...new Set(w.sets.map(s => s.exercise).filter(Boolean))];
              return (
                <div key={w.id} className="card-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{label}</div>
                    <div className="text-sm text-gray-400 mt-0.5">
                      {exercises.length > 0 && <span>{exercises.join(', ')} · </span>}
                      {w.sets.length > 0 && `${w.sets.length} sets · ${repsTotal} reps`}
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
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Log Workout</h2>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="label mb-1 block">Workout Name</label>
                <input
                  autoFocus
                  className="input"
                  placeholder="e.g. Jujitsu, Morning Run, Chest Day..."
                  value={workoutName}
                  onChange={e => setWorkoutName(e.target.value)}
                />
              </div>

              <div>
                <label className="label mb-2 block">Quick Add Exercise</label>
                <div className="flex flex-wrap gap-2">
                  {CALISTHENICS_PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => setActiveExercise(p.label)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                        activeExercise === p.label
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {p.emoji} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label mb-2 block">Sets {activeExercise && `· ${activeExercise}`}</label>
                <div className="flex gap-2 mb-3">
                  <input
                    className="input"
                    type="number"
                    placeholder="Reps"
                    value={repsInput}
                    onChange={e => setRepsInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSet()}
                  />
                  <input className="input w-24" type="number" placeholder="Rest (s)" value={restInput} onChange={e => setRestInput(e.target.value)} />
                  <button onClick={addSet} disabled={!repsInput} className="btn-primary px-4">+</button>
                </div>
                {sets.length > 0 && (
                  <div className="space-y-2">
                    {sets.map((s, i) => (
                      <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                        <span className="font-semibold text-sm text-gray-700">Set {i + 1}{s.exercise ? ` · ${s.exercise}` : ''}</span>
                        <span className="text-sm text-gray-500">{s.reps} reps · {s.restSeconds}s rest</span>
                        <button onClick={() => setSets(prev => prev.filter(x => x.id !== s.id))} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1 block">Duration (min)</label>
                  <input className="input" type="number" placeholder="45" value={duration} onChange={e => setDuration(e.target.value)} />
                </div>
                <div>
                  <label className="label mb-1 block">Cals Burned</label>
                  <input className="input" type="number" placeholder="200" value={calories} onChange={e => setCalories(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label mb-1 block">Notes</label>
                <input className="input" placeholder="How did it go?" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowLog(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={saveWorkout} disabled={!workoutName.trim()} className="flex-1 btn-primary">Save Workout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
