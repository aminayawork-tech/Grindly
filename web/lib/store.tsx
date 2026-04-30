'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Goal, WorkoutSession, FoodEntry, WeightEntry, Habit, CoachMessage, AppSettings } from './types';
import { defaultGoals, defaultHabits, defaultSettings } from './defaults';
import { todayKey, dateKey, last7Days } from './utils';

interface StoreState {
  goals: Goal[];
  workouts: WorkoutSession[];
  foodEntries: FoodEntry[];
  weightEntries: WeightEntry[];
  habits: Habit[];
  coachMessages: CoachMessage[];
  settings: AppSettings;
}

interface StoreActions {
  addGoal: (g: Goal) => void;
  updateGoal: (g: Goal) => void;
  addWorkout: (w: WorkoutSession) => void;
  addFoodEntry: (f: FoodEntry) => void;
  removeFoodEntry: (id: string) => void;
  addWeightEntry: (w: WeightEntry) => void;
  toggleHabit: (id: string) => void;
  addHabit: (h: Habit) => void;
  addCoachMessage: (m: CoachMessage) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  todayFoodEntries: () => FoodEntry[];
  todayCalories: () => number;
  sevenDayCalorieAverage: () => number;
  weeklyWorkoutCount: () => number;
  weightTrendData: () => { current: number; weeklyRate: number; totalLost: number; remaining: number; projected: Date | null };
}

const StoreContext = createContext<(StoreState & StoreActions) | null>(null);

const STORAGE_KEY = 'grindly_v1';

function load(): StoreState {
  if (typeof window === 'undefined') return fresh();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh();
    return JSON.parse(raw) as StoreState;
  } catch {
    return fresh();
  }
}

function fresh(): StoreState {
  return {
    goals: defaultGoals,
    workouts: [],
    foodEntries: [],
    weightEntries: [],
    habits: defaultHabits,
    coachMessages: [],
    settings: defaultSettings,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(fresh);

  useEffect(() => {
    setState(load());
  }, []);

  const persist = useCallback((next: StoreState) => {
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addGoal = useCallback((g: Goal) => {
    setState(s => { const n = { ...s, goals: [...s.goals, g] }; localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n; });
  }, []);

  const updateGoal = useCallback((g: Goal) => {
    setState(s => { const n = { ...s, goals: s.goals.map(x => x.id === g.id ? g : x) }; localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n; });
  }, []);

  const addWorkout = useCallback((w: WorkoutSession) => {
    setState(s => { const n = { ...s, workouts: [w, ...s.workouts] }; localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n; });
  }, []);

  const addFoodEntry = useCallback((f: FoodEntry) => {
    setState(s => { const n = { ...s, foodEntries: [f, ...s.foodEntries] }; localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n; });
  }, []);

  const removeFoodEntry = useCallback((id: string) => {
    setState(s => { const n = { ...s, foodEntries: s.foodEntries.filter(f => f.id !== id) }; localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n; });
  }, []);

  const addWeightEntry = useCallback((w: WeightEntry) => {
    setState(s => {
      const filtered = s.weightEntries.filter(e => e.date !== w.date);
      const n = { ...s, weightEntries: [w, ...filtered] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(n));
      return n;
    });
  }, []);

  const toggleHabit = useCallback((id: string) => {
    const today = todayKey();
    setState(s => {
      const n = {
        ...s,
        habits: s.habits.map(h => {
          if (h.id !== id) return h;
          const has = h.completions.includes(today);
          return { ...h, completions: has ? h.completions.filter(d => d !== today) : [...h.completions, today] };
        }),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(n));
      return n;
    });
  }, []);

  const addHabit = useCallback((h: Habit) => {
    setState(s => { const n = { ...s, habits: [...s.habits, h] }; localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n; });
  }, []);

  const addCoachMessage = useCallback((m: CoachMessage) => {
    setState(s => { const n = { ...s, coachMessages: [...s.coachMessages, m] }; localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n; });
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setState(s => { const n = { ...s, settings: { ...s.settings, ...patch } }; localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n; });
  }, []);

  const todayFoodEntries = useCallback(() => {
    const today = todayKey();
    return state.foodEntries.filter(f => f.loggedAt.slice(0, 10) === today);
  }, [state.foodEntries]);

  const todayCalories = useCallback(() => {
    return todayFoodEntries().reduce((s, f) => s + f.calories, 0);
  }, [todayFoodEntries]);

  const sevenDayCalorieAverage = useCallback(() => {
    const days = last7Days();
    let total = 0, count = 0;
    for (const day of days) {
      const cals = state.foodEntries.filter(f => f.loggedAt.slice(0, 10) === day).reduce((s, f) => s + f.calories, 0);
      if (cals > 0) { total += cals; count++; }
    }
    return count > 0 ? total / count : 0;
  }, [state.foodEntries]);

  const weeklyWorkoutCount = useCallback(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return state.workouts.filter(w => new Date(w.date) >= cutoff).length;
  }, [state.workouts]);

  const weightTrendData = useCallback(() => {
    const sorted = [...state.weightEntries].sort((a, b) => a.date.localeCompare(b.date));
    const current = sorted[sorted.length - 1]?.weight ?? state.settings.startWeight;
    const totalLost = state.settings.startWeight - current;
    const remaining = current - state.settings.goalWeight;
    let weeklyRate = 0;
    if (sorted.length >= 2) {
      const recent = sorted.slice(-7);
      if (recent.length >= 2) {
        const daySpan = Math.max(1, (new Date(recent[recent.length-1].date).getTime() - new Date(recent[0].date).getTime()) / 86400000);
        weeklyRate = ((recent[0].weight - recent[recent.length-1].weight) / daySpan) * 7;
      }
    }
    let projected: Date | null = null;
    if (weeklyRate > 0 && remaining > 0) {
      const weeks = remaining / weeklyRate;
      projected = new Date();
      projected.setDate(projected.getDate() + Math.round(weeks * 7));
    }
    return { current, weeklyRate, totalLost, remaining, projected };
  }, [state.weightEntries, state.settings]);

  return (
    <StoreContext.Provider value={{
      ...state,
      addGoal, updateGoal, addWorkout, addFoodEntry, removeFoodEntry,
      addWeightEntry, toggleHabit, addHabit, addCoachMessage, updateSettings,
      todayFoodEntries, todayCalories, sevenDayCalorieAverage,
      weeklyWorkoutCount, weightTrendData,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
