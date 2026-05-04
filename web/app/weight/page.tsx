'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { WeightEntry } from '@/lib/types';
import { nanoid, formatDate } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart } from 'recharts';
import ProgressRing from '@/components/ProgressRing';
import StatCard from '@/components/StatCard';

export default function WeightPage() {
  const store = useStore();
  const [showLog, setShowLog] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [notes, setNotes] = useState('');
  const [showMilestone, setShowMilestone] = useState<number | null>(null);
  const [showDateEdit, setShowDateEdit] = useState(false);
  const [goalDateInput, setGoalDateInput] = useState('');

  const trend = store.weightTrendData();
  const { startWeight, goalWeight, weightGoalDate } = store.settings;
  const sortedEntries = [...store.weightEntries].sort((a, b) => a.date.localeCompare(b.date));
  const progressPct = Math.min(Math.max(trend.totalLost / (startWeight - goalWeight), 0), 1);

  const chartData = sortedEntries.slice(-30).map(e => ({
    date: e.date.slice(5),
    weight: e.weight,
  }));

  const minY = Math.min(...sortedEntries.map(e => e.weight), goalWeight) - 2;
  const maxY = Math.max(...sortedEntries.map(e => e.weight), startWeight) + 2;

  function logWeight() {
    const w = parseFloat(weightInput);
    if (!w) return;
    const prevWeight = trend.current;
    const entry: WeightEntry = { id: nanoid(), weight: w, date: new Date().toISOString().slice(0, 10), notes };
    store.addWeightEntry(entry);
    const milestones = Array.from({ length: Math.ceil((startWeight - goalWeight) / 5) }, (_, i) => startWeight - (i + 1) * 5);
    for (const m of milestones) {
      if (w <= m && prevWeight > m) { setShowMilestone(m); break; }
    }
    setShowLog(false);
    setWeightInput('');
    setNotes('');
  }

  function saveGoalDate() {
    store.updateSettings({ weightGoalDate: goalDateInput });
    setShowDateEdit(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Weight ⚖️</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">Goal: {startWeight} → {goalWeight} lbs</p>
        </div>
        <button onClick={() => setShowLog(true)} className="btn-primary">+ Log</button>
      </div>

      {/* Milestone card */}
      {showMilestone && (
        <div className="card bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200 text-center py-6">
          <div className="text-5xl mb-2">🏆</div>
          <div className="text-2xl font-black text-gray-900">Milestone Hit!</div>
          <div className="text-gray-600 mt-1">You hit {showMilestone} lbs — {Math.round(startWeight - showMilestone)} lbs down!</div>
          <button onClick={() => setShowMilestone(null)} className="mt-3 text-sm text-gray-400 hover:text-gray-600">Dismiss</button>
        </div>
      )}

      {/* Current weight + ring */}
      <div className="card flex items-center gap-6">
        <div className="flex-1">
          <div className="label">Current Weight</div>
          <div className="text-5xl font-black text-gray-900 tabular-nums mt-1">{trend.current.toFixed(1)}</div>
          <div className="text-gray-400 font-medium">lbs</div>
          {trend.totalLost > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-full">
              ↓ {trend.totalLost.toFixed(1)} lbs lost
            </div>
          )}
        </div>
        <ProgressRing progress={progressPct} size={110} strokeWidth={10} color="#2563EB" label="to goal" />
      </div>

      {/* Stats */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <StatCard label="Weekly Rate" value={trend.weeklyRate > 0 ? `${trend.weeklyRate.toFixed(1)} lbs` : '--'} subtitle="per week" emoji="📉" color="blue" />
        <StatCard label="Remaining" value={`${trend.remaining.toFixed(1)} lbs`} subtitle="to goal" emoji="🎯" color="orange" />
      </div>

      {/* Goal date + projection */}
      <div className="card space-y-4">
        {/* User-set goal date */}
        <div className="flex items-start gap-4">
          <div className="text-2xl">🎯</div>
          <div className="flex-1">
            <div className="label">Your Goal Date</div>
            {showDateEdit ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="date"
                  className="input text-sm"
                  value={goalDateInput}
                  onChange={e => setGoalDateInput(e.target.value)}
                />
                <button onClick={saveGoalDate} disabled={!goalDateInput} className="btn-primary px-3 py-2 text-sm">Set</button>
                <button onClick={() => setShowDateEdit(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
              </div>
            ) : weightGoalDate ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-gray-900">
                  {new Date(weightGoalDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <button onClick={() => { setGoalDateInput(weightGoalDate); setShowDateEdit(true); }} className="text-xs text-blue-500 font-semibold hover:underline">Edit</button>
              </div>
            ) : (
              <button onClick={() => { setGoalDateInput(''); setShowDateEdit(true); }} className="text-sm text-blue-500 font-semibold mt-0.5 hover:underline">
                + Set a target date
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Auto-projected date */}
        <div className="flex items-start gap-4">
          <div className="text-2xl">📅</div>
          <div>
            <div className="label">Projected at Current Pace</div>
            {trend.projected ? (
              <>
                <div className="font-bold text-gray-900 mt-0.5">{trend.projected.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <div className="text-xs text-gray-400">at your current {trend.weeklyRate.toFixed(1)} lbs/week pace</div>
              </>
            ) : (
              <div className="text-gray-400 text-sm mt-0.5">Log more weights to project your timeline</div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="section-title mb-4">Progress Chart</h2>
        {chartData.length < 2 ? (
          <div className="text-center py-10 text-gray-300">
            <div className="text-4xl mb-2">📊</div>
            <p className="font-medium">Log at least 2 weights to see your trend</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis domain={[minY, maxY]} tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                formatter={(v: number) => [`${v.toFixed(1)} lbs`, 'Weight']}
              />
              <ReferenceLine y={goalWeight} stroke="#F97316" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Goal', position: 'insideTopRight', fontSize: 11, fill: '#F97316' }} />
              <Area type="monotone" dataKey="weight" stroke="#2563EB" strokeWidth={2.5} fill="url(#weightGrad)" dot={{ fill: '#2563EB', r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Log */}
      <div>
        <h2 className="section-title mb-3">Weight Log</h2>
        {sortedEntries.length === 0 ? (
          <div className="card text-center py-10 text-gray-300">
            <div className="text-4xl mb-2">⚖️</div>
            <p>No weight logged yet. Tap + Log to start.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...sortedEntries].reverse().slice(0, 14).map((e, i, arr) => {
              const prev = arr[i + 1];
              const diff = prev ? e.weight - prev.weight : null;
              return (
                <div key={e.id} className="card-sm flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{e.weight.toFixed(1)} lbs</div>
                    {e.notes && <div className="text-xs text-gray-400 mt-0.5">{e.notes}</div>}
                  </div>
                  <div className="text-right">
                    {diff !== null && (
                      <div className={`text-sm font-semibold ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                      </div>
                    )}
                    <div className="text-xs text-gray-400">{formatDate(e.date)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log modal */}
      {showLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6 border-b border-gray-100"><h2 className="text-xl font-bold">Log Weight</h2></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label mb-1 block">Weight (lbs)</label>
                <input autoFocus className="input text-3xl font-bold text-center" type="number" step="0.1" placeholder="178.5" value={weightInput} onChange={e => setWeightInput(e.target.value)} />
              </div>
              {store.weightEntries.length > 0 && weightInput && (
                <div className="text-center text-sm">
                  <span className={`font-semibold ${parseFloat(weightInput) < trend.current ? 'text-green-600' : 'text-red-500'}`}>
                    {parseFloat(weightInput) < trend.current ? '↓' : '↑'} {Math.abs(parseFloat(weightInput) - trend.current).toFixed(1)} lbs from last entry
                  </span>
                </div>
              )}
              <div>
                <label className="label mb-1 block">Notes (optional)</label>
                <input className="input" placeholder="How are you feeling?" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowLog(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600">Cancel</button>
              <button onClick={logWeight} disabled={!weightInput} className="flex-1 btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
