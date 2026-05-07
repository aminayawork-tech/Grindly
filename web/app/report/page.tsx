'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { last7Days, sevenDayLabel, habitColorClass } from '@/lib/utils';
import StatCard from '@/components/StatCard';
import { Flame, Dumbbell, TrendingUp, Target, Utensils, Scale, CheckSquare, Brain, BarChart3, Check } from 'lucide-react';
import HabitIcon from '@/components/HabitIcon';
import type { LucideIcon } from 'lucide-react';

function weekScore(workouts: number, habitRate: number, weightChange: number): number {
  return Math.min(workouts * 15, 40) + Math.round(habitRate * 40) + (weightChange < 0 ? 20 : 0);
}

export default function ReportPage() {
  const store = useStore();
  const [coachMessage, setCoachMessage] = useState('');
  const [loadingCoach, setLoadingCoach] = useState(false);
  const days = last7Days();

  const weekWorkouts = store.weeklyWorkoutCount();
  const avgCals = store.sevenDayCalorieAverage();
  const trend = store.weightTrendData();

  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  const weekWeights = store.weightEntries.filter(e => new Date(e.date) >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
  const weightChange = weekWeights.length >= 2 ? weekWeights[weekWeights.length - 1].weight - weekWeights[0].weight : 0;

  let habitsHit = 0, habitsTotal = 0;
  store.habits.forEach(h => {
    days.forEach(d => {
      habitsTotal++;
      if (h.completions.includes(d)) habitsHit++;
    });
  });
  const habitRate = habitsTotal > 0 ? habitsHit / habitsTotal : 0;
  const score = weekScore(weekWorkouts, habitRate, weightChange);

  const ScoreIcon: LucideIcon = score >= 80 ? Flame : score >= 60 ? Dumbbell : score >= 40 ? TrendingUp : Target;
  const scoreText = score >= 80 ? 'Crushing It' : score >= 60 ? 'Solid Week' : score >= 40 ? 'Building Up' : 'Keep Going';
  const scoreSubtitle = score >= 80 ? 'You\'re in top form. Keep the momentum.' : score >= 60 ? 'Good week. A few tweaks and you\'ll be elite.' : score >= 40 ? 'Progress is progress. Consistency beats intensity.' : 'Every legend started where you are. Next week is yours.';

  async function getCoachTake() {
    setLoadingCoach(true);
    const prompt = `Weekly report: ${weekWorkouts} workouts, avg ${Math.round(avgCals)} kcal/day, weight change ${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} lbs, habits ${habitsHit}/${habitsTotal} (${Math.round(habitRate * 100)}%). Give me a direct, honest weekly review. What did I do well? What to fix next week? Be specific.`;

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are a direct, no-BS life coach reviewing someone's weekly health and fitness data from the Grindly app. Be honest, specific, and actionable. Max 4 sentences.`,
          messages: [{ role: 'user', content: prompt }],
          userApiKey: store.settings.anthropicApiKey,
        }),
      });
      const data = await res.json();
      setCoachMessage(data.text ?? data.error ?? 'Coach unavailable.');
    } catch {
      setCoachMessage('Coach is unavailable right now.');
    }
    setLoadingCoach(false);
  }

  const weekRange = (() => {
    const end = new Date();
    const start = new Date(); start.setDate(start.getDate() - 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Weekly Report</h1>
        <p className="text-gray-400 text-sm font-medium mt-0.5">{weekRange}</p>
      </div>

      <div className="card bg-gradient-to-br from-blue-50 to-purple-50 border-0 text-center py-8">
        <ScoreIcon size={48} className="mx-auto mb-2 text-blue-600" />
        <div className="text-2xl font-black text-gray-900">{scoreText}</div>
        <div className="text-gray-500 mt-2 text-sm px-4">{scoreSubtitle}</div>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full">
          <span className="text-sm font-semibold text-gray-600">Week score:</span>
          <span className="text-lg font-black text-blue-600">{score}/100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Workouts" value={`${weekWorkouts}`} subtitle="sessions" icon={<Dumbbell size={14} />} color="orange" compact />
        <StatCard label="Avg Calories" value={`${Math.round(avgCals)}`} subtitle="kcal/day" icon={<Utensils size={14} />} color="green" compact />
        <StatCard
          label="Weight Change"
          value={`${weightChange >= 0 ? '+' : ''}${weightChange.toFixed(1)} lbs`}
          subtitle={weightChange < 0 ? 'Great progress!' : 'Watch the trend'}
          icon={<Scale size={14} />}
          color={weightChange <= 0 ? 'blue' : 'orange'}
          compact
        />
        <StatCard label="Habits" value={`${Math.round(habitRate * 100)}%`} subtitle={`${habitsHit}/${habitsTotal} done`} icon={<CheckSquare size={14} />} color={habitRate >= 0.8 ? 'green' : habitRate >= 0.5 ? 'orange' : 'red'} compact />
      </div>

      {store.habits.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-4">Habit Breakdown</h2>
          <div className="space-y-3">
            {store.habits.map(habit => {
              const weekDone = days.filter(d => habit.completions.includes(d)).length;
              const colorCls = habitColorClass(habit.color);
              return (
                <div key={habit.id} className="flex items-center gap-3">
                  <span className="w-7 flex items-center text-gray-400"><HabitIcon name={habit.icon} size={16} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{habit.name}</div>
                    <div className="text-xs text-gray-400">{weekDone}/7 days</div>
                  </div>
                  <div className="flex gap-0.5">
                    {days.map(d => (
                      <div key={d} title={d}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${habit.completions.includes(d) ? `${colorCls.bg} text-white` : 'bg-gray-100 text-gray-300'}`}>
                        {habit.completions.includes(d) ? <Check size={10} /> : sevenDayLabel(d)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="section-title mb-4">Coach&apos;s Weekly Take</h2>
        {coachMessage ? (
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
              <Brain size={18} className="text-white" />
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800 leading-relaxed flex-1">
              {coachMessage}
            </div>
          </div>
        ) : loadingCoach ? (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
              <Brain size={18} className="text-white" />
            </div>
            <span className="text-sm">Coach is reviewing your week...</span>
          </div>
        ) : (
          <button onClick={getCoachTake} className="w-full py-3 bg-blue-50 text-blue-600 font-semibold rounded-xl hover:bg-blue-100 transition-colors text-sm flex items-center justify-center gap-2">
            <Brain size={16} /> Get Coach&apos;s Take
          </button>
        )}
      </div>
    </div>
  );
}
