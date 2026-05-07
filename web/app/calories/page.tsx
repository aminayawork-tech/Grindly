'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { FoodEntry, MealType } from '@/lib/types';
import { nanoid } from '@/lib/utils';
import { Utensils, Sunrise, Sun, Moon, Leaf, BarChart3, Search, X, Check, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const MEALS: { id: MealType; label: string; Icon: LucideIcon }[] = [
  { id: 'breakfast', label: 'Breakfast', Icon: Sunrise },
  { id: 'lunch', label: 'Lunch', Icon: Sun },
  { id: 'dinner', label: 'Dinner', Icon: Moon },
  { id: 'snacks', label: 'Snacks', Icon: Leaf },
];

interface FoodResult {
  food_name: string;
  brand_name?: string;
  serving_qty: number;
  serving_unit: string;
  nf_calories: number;
  nf_protein?: number;
  nf_total_carbohydrate?: number;
  nf_total_fat?: number;
}

export default function CaloriesPage() {
  const store = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [showSearch, setShowSearch] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayEntries = store.todayFoodEntries();
  const todayCalories = store.todayCalories();
  const goal = store.settings.dailyCalorieGoal;
  const progress = Math.min(todayCalories / goal, 1);
  const sevenAvg = store.sevenDayCalorieAverage();

  const todayProtein = todayEntries.reduce((s, f) => s + f.protein, 0);
  const todayCarbs = todayEntries.reduce((s, f) => s + f.carbs, 0);
  const todayFat = todayEntries.reduce((s, f) => s + f.fat, 0);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/nutritionix/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'x-nutritionix-app-id': store.settings.nutritionixAppId,
            'x-nutritionix-app-key': store.settings.nutritionixAppKey,
          },
        });
        const data = await res.json();
        setResults([...(data.common ?? []), ...(data.branded ?? [])].slice(0, 15));
      } catch { setResults([]); }
      setSearching(false);
    }, 400);
  }, [searchQuery, store.settings.nutritionixAppId, store.settings.nutritionixAppKey]);

  function addFood(food: FoodResult) {
    const entry: FoodEntry = {
      id: nanoid(),
      foodName: food.food_name.charAt(0).toUpperCase() + food.food_name.slice(1),
      brandName: food.brand_name ?? '',
      calories: food.nf_calories,
      protein: food.nf_protein ?? 0,
      carbs: food.nf_total_carbohydrate ?? 0,
      fat: food.nf_total_fat ?? 0,
      servingQty: food.serving_qty,
      servingUnit: food.serving_unit,
      mealType: selectedMeal,
      loggedAt: new Date().toISOString(),
    };
    store.addFoodEntry(entry);
    setAddedFeedback(food.food_name);
    setTimeout(() => setAddedFeedback(null), 2000);
    setSearchQuery('');
    setResults([]);
  }

  const barColor = progress > 1.05 ? 'bg-red-500' : progress > 0.9 ? 'bg-orange-400' : 'bg-green-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Calories</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">Search, tap, done</p>
        </div>
        <button onClick={() => setShowSearch(true)} className="btn-primary">+ Add Food</button>
      </div>

      {/* Calorie progress */}
      <div className="card">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-4xl font-black text-gray-900 tabular-nums">{Math.round(todayCalories)}</div>
            <div className="label mt-1">calories today</div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold tabular-nums ${todayCalories > goal ? 'text-red-500' : 'text-gray-400'}`}>
              {todayCalories > goal ? `+${Math.round(todayCalories - goal)}` : Math.round(goal - todayCalories)}
            </div>
            <div className="text-xs text-gray-400">{todayCalories > goal ? 'over goal' : 'remaining'}</div>
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">Goal: {Math.round(goal)} kcal</span>
          <span className={`text-xs font-semibold ${barColor.replace('bg-', 'text-')}`}>{Math.round(progress * 100)}%</span>
        </div>

        {/* Macros */}
        <div className="flex gap-3 mt-4">
          {[
            { label: 'Protein', value: todayProtein, color: 'bg-blue-100 text-blue-700', unit: 'g' },
            { label: 'Carbs', value: todayCarbs, color: 'bg-orange-100 text-orange-700', unit: 'g' },
            { label: 'Fat', value: todayFat, color: 'bg-yellow-100 text-yellow-700', unit: 'g' },
          ].map(m => (
            <div key={m.label} className={`flex-1 rounded-xl py-2 px-3 ${m.color}`}>
              <div className="text-lg font-bold tabular-nums">{Math.round(m.value)}{m.unit}</div>
              <div className="text-xs font-medium opacity-70">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-day average */}
      <div className="card-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0">
          <BarChart3 size={24} />
        </div>
        <div className="flex-1">
          <div className="label">7-day average</div>
          <div className="text-2xl font-bold tabular-nums">{Math.round(sevenAvg)} <span className="text-base font-normal text-gray-400">kcal/day</span></div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${sevenAvg > goal ? 'text-red-500' : 'text-green-600'}`}>
            {sevenAvg > goal ? `+${Math.round(sevenAvg - goal)} over` : `${Math.round(goal - sevenAvg)} under`}
          </div>
          <div className="text-xs text-gray-400">vs goal</div>
        </div>
      </div>

      {/* Meal sections */}
      <div className="space-y-4">
        {MEALS.map(meal => {
          const entries = todayEntries.filter(e => e.mealType === meal.id);
          const mealCals = entries.reduce((s, e) => s + e.calories, 0);
          return (
            <div key={meal.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <meal.Icon size={16} className="text-gray-500" />
                  <span className="font-bold text-gray-900">{meal.label}</span>
                  {mealCals > 0 && <span className="text-sm text-gray-400 tabular-nums">{Math.round(mealCals)} kcal</span>}
                </div>
                <button
                  onClick={() => { setSelectedMeal(meal.id); setShowSearch(true); }}
                  className="text-blue-600 font-semibold text-sm hover:text-blue-700"
                >
                  + Add
                </button>
              </div>
              {entries.length === 0 ? (
                <p className="text-sm text-gray-300">Nothing logged yet</p>
              ) : (
                <div className="space-y-2">
                  {entries.map(e => (
                    <div key={e.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{e.foodName}</div>
                        <div className="text-xs text-gray-400">{e.servingQty} {e.servingUnit}{e.brandName ? ` · ${e.brandName}` : ''}</div>
                      </div>
                      <div className="text-sm font-semibold text-gray-700 tabular-nums flex-shrink-0">{Math.round(e.calories)} kcal</div>
                      <button onClick={() => store.removeFoodEntry(e.id)} className="text-red-300 hover:text-red-500 flex-shrink-0 flex items-center justify-center"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Food search modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold">Add Food</h2>
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); setResults([]); }} className="text-gray-400 hover:text-gray-600 flex items-center justify-center"><X size={20} /></button>
              </div>
              {/* Meal selector */}
              <div className="flex gap-2 mb-3 overflow-x-auto">
                {MEALS.map(m => (
                  <button key={m.id} onClick={() => setSelectedMeal(m.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedMeal === m.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <m.Icon size={14} /> {m.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><Search size={16} /></span>
                <input
                  autoFocus
                  className="input pl-9"
                  placeholder="Search any food..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {addedFeedback && (
                <div className="mx-4 mt-3 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <Check size={14} /> Added {addedFeedback}
                </div>
              )}
              {searching && <div className="p-6 text-center text-gray-400">Searching...</div>}
              {!searching && results.length === 0 && searchQuery.length >= 2 && (
                <div className="p-6 text-center text-gray-400">
                  <Utensils size={32} className="mx-auto mb-2 text-gray-200" />
                  <p className="font-medium">No results for &ldquo;{searchQuery}&rdquo;</p>
                  {!process.env.NUTRITIONIX_APP_ID && (
                    <p className="text-xs mt-2 text-orange-500">Add Nutritionix API keys in Settings to enable food search</p>
                  )}
                </div>
              )}
              {!searching && results.length === 0 && searchQuery.length < 2 && (
                <div className="p-8 text-center text-gray-300">
                  <Utensils size={32} className="mx-auto mb-2" />
                  <p className="font-medium">Type to search any food</p>
                </div>
              )}
              {results.map((food, i) => (
                <button key={i} onClick={() => addFood(food)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0">
                    <Leaf size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate capitalize">{food.food_name}</div>
                    <div className="text-xs text-gray-400">{food.serving_qty} {food.serving_unit}{food.brand_name ? ` · ${food.brand_name}` : ''}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-gray-900 tabular-nums">{Math.round(food.nf_calories)}</div>
                    <div className="text-xs text-gray-400">kcal</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
