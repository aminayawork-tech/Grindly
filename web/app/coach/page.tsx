'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { CoachMessage } from '@/lib/types';
import { nanoid } from '@/lib/utils';
import { Scale, Utensils, Dumbbell, BarChart3, Target, TrendingDown, Zap, Brain, Send, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function buildSystem(store: ReturnType<typeof useStore>): string {
  const trend = store.weightTrendData();
  const avgHabit = store.habits.length
    ? store.habits.map(h => {
        const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); });
        return days.filter(d => h.completions.includes(d)).length / 7;
      }).reduce((a, b) => a + b, 0) / store.habits.length
    : 0;

  return `You are the user's personal AI life coach inside the Grindly app (grindly.app). You have access to their real data.

Current stats:
- Weight: ${trend.current.toFixed(1)} lbs (goal: ${store.settings.goalWeight} lbs, ${trend.remaining.toFixed(1)} lbs remaining)
- Today's calories: ${Math.round(store.todayCalories())} / ${Math.round(store.settings.dailyCalorieGoal)} kcal
- Workouts this week: ${store.weeklyWorkoutCount()}
- Habit completion rate: ${Math.round(avgHabit * 100)}%
- Active habits: ${store.habits.map(h => h.name).join(', ')}

Coaching style:
- Direct, motivating, and real — no generic fluff
- Call out when they're slipping, celebrate when they're winning
- Give SPECIFIC, actionable advice tied to their actual data
- Short and punchy — max 3-4 sentences
- Talk like a trusted coach who knows them well, not a corporate chatbot`;
}

export default function CoachPage() {
  const store = useStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.coachMessages, loading]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: CoachMessage = { id: nanoid(), role: 'user', content: msg, timestamp: new Date().toISOString() };
    store.addCoachMessage(userMsg);
    setLoading(true);

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: buildSystem(store),
          messages: [
            ...store.coachMessages.slice(-10).map(m => ({ role: m.role === 'coach' ? 'assistant' : 'user', content: m.content })),
            { role: 'user', content: msg },
          ],
          userApiKey: store.settings.anthropicApiKey,
        }),
      });
      const data = await res.json();
      const coachMsg: CoachMessage = {
        id: nanoid(),
        role: 'coach',
        content: data.text ?? data.error ?? 'No response. Keep pushing.',
        timestamp: new Date().toISOString(),
      };
      store.addCoachMessage(coachMsg);
    } catch {
      store.addCoachMessage({ id: nanoid(), role: 'coach', content: 'Can\'t reach the coach right now. Keep working anyway.', timestamp: new Date().toISOString() });
    }
    setLoading(false);
  }

  const trend = store.weightTrendData();
  const contextChips: { Icon: LucideIcon; value: string }[] = [
    { Icon: Scale, value: `${trend.current.toFixed(1)} lbs` },
    { Icon: Utensils, value: `${Math.round(store.todayCalories())} kcal today` },
    { Icon: Dumbbell, value: `${store.weeklyWorkoutCount()} workouts/wk` },
  ];

  const promptIcons: LucideIcon[] = [BarChart3, Target, TrendingDown, Zap];
  const checkinPrompts = [
    `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} check-in. Calories: ${Math.round(store.todayCalories())}/${Math.round(store.settings.dailyCalorieGoal)}, workouts this week: ${store.weeklyWorkoutCount()}, weight: ${trend.current.toFixed(1)} lbs. What's your take?`,
    'What should I focus on today to make the most progress?',
    'Am I on track with my weight loss goal?',
    'Rate my week honestly based on my data.',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-48px)]">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black text-gray-900">AI Coach</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">Direct. Data-driven. No fluff.</p>
        </div>
      </div>

      {store.coachMessages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-4">
          <div className="text-center">
            <Brain size={64} className="mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Your AI Life Coach</h2>
            <p className="text-gray-400 mt-2 max-w-sm">Personalized advice based on your actual data — workouts, calories, weight, and habits.</p>
          </div>

          {/* Context snapshot */}
          <div className="flex flex-wrap gap-2 justify-center">
            {contextChips.map(chip => (
              <div key={chip.value} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full">
                <chip.Icon size={14} />{chip.value}
              </div>
            ))}
          </div>

          <div className="w-full max-w-sm space-y-2">
            {checkinPrompts.map((p, i) => {
              const PromptIcon = promptIcons[i];
              return (
                <button key={i} onClick={() => sendMessage(p)}
                  className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all font-medium flex items-center gap-2">
                  <PromptIcon size={14} className="flex-shrink-0 text-gray-400" />
                  {p.length > 60 ? p.slice(0, 60) + '...' : p}
                </button>
              );
            })}
          </div>

          {!store.settings.anthropicApiKey && !process.env.ANTHROPIC_API_KEY && (
            <div className="text-center text-sm text-orange-600 bg-orange-50 px-4 py-3 rounded-xl max-w-sm flex items-center gap-2">
              <AlertTriangle size={14} /> Add your Anthropic API key in <strong>Settings</strong> to enable the AI Coach
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {store.coachMessages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'coach' && (
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-auto">
                  <Brain size={16} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                <Brain size={16} className="text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="flex-shrink-0 flex gap-3 pt-3 border-t border-gray-100 bg-[#F5F5F7]">
        <textarea
          ref={inputRef}
          className="flex-1 input resize-none min-h-[44px] max-h-32 py-3"
          placeholder="Ask your coach anything..."
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition-colors flex-shrink-0 self-end"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
