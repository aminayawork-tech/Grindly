'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';

export default function SettingsPage() {
  const store = useStore();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    dailyCalorieGoal: '',
    startWeight: '',
    goalWeight: '',
    anthropicApiKey: '',
    nutritionixAppId: '',
    nutritionixAppKey: '',
  });

  useEffect(() => {
    setForm({
      dailyCalorieGoal: String(store.settings.dailyCalorieGoal),
      startWeight: String(store.settings.startWeight),
      goalWeight: String(store.settings.goalWeight),
      anthropicApiKey: store.settings.anthropicApiKey,
      nutritionixAppId: store.settings.nutritionixAppId,
      nutritionixAppKey: store.settings.nutritionixAppKey,
    });
  }, [store.settings]);

  function save() {
    store.updateSettings({
      dailyCalorieGoal: parseFloat(form.dailyCalorieGoal) || 2200,
      startWeight: parseFloat(form.startWeight) || 180,
      goalWeight: parseFloat(form.goalWeight) || 160,
      anthropicApiKey: form.anthropicApiKey.trim(),
      nutritionixAppId: form.nutritionixAppId.trim(),
      nutritionixAppKey: form.nutritionixAppKey.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const f = (field: keyof typeof form) => ({
    value: form[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [field]: e.target.value })),
  });

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Settings</h1>
        <p className="text-gray-400 text-sm font-medium mt-0.5">Configure your goals and API keys</p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-2">
          ✓ Settings saved
        </div>
      )}

      <div className="card space-y-4">
        <h2 className="section-title">Personal Goals</h2>
        <div>
          <label className="label mb-1 block">Daily Calorie Goal</label>
          <div className="flex items-center gap-2">
            <input className="input" type="number" placeholder="2200" {...f('dailyCalorieGoal')} />
            <span className="text-sm text-gray-400 whitespace-nowrap">kcal/day</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Cutting: 1,800–2,000 · Maintenance: 2,200–2,400 · Bulking: 2,500+</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label mb-1 block">Start Weight</label>
            <div className="flex items-center gap-2">
              <input className="input" type="number" step="0.1" placeholder="180" {...f('startWeight')} />
              <span className="text-xs text-gray-400">lbs</span>
            </div>
          </div>
          <div>
            <label className="label mb-1 block">Goal Weight</label>
            <div className="flex items-center gap-2">
              <input className="input" type="number" step="0.1" placeholder="160" {...f('goalWeight')} />
              <span className="text-xs text-gray-400">lbs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <h2 className="section-title">API Keys</h2>
          <p className="text-sm text-gray-400 mt-1">Keys are stored locally in your browser only and never sent to our servers.</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
          <strong>Claude AI Coach</strong> — powers the AI life coach and weekly report analysis. Get your key at <span className="font-mono">console.anthropic.com</span>
        </div>
        <div>
          <label className="label mb-1 block">Anthropic API Key</label>
          <input className="input font-mono text-xs" type="password" placeholder="sk-ant-..." {...f('anthropicApiKey')} />
        </div>
        <div className="pt-2 border-t border-gray-100" />
        <div className="p-3 bg-green-50 rounded-xl text-sm text-green-700">
          <strong>Nutritionix</strong> — enables the food search in Calories. Free tier available at <span className="font-mono">developer.nutritionix.com</span>
        </div>
        <div>
          <label className="label mb-1 block">Nutritionix App ID</label>
          <input className="input font-mono text-xs" placeholder="a1b2c3d4" {...f('nutritionixAppId')} />
        </div>
        <div>
          <label className="label mb-1 block">Nutritionix App Key</label>
          <input className="input font-mono text-xs" type="password" placeholder="your app key" {...f('nutritionixAppKey')} />
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="section-title">Data</h2>
        <p className="text-sm text-gray-500">All your data is stored locally in this browser. Clearing your browser data will delete everything.</p>
        <div className="flex gap-2 text-sm">
          <div className="bg-gray-50 rounded-lg px-3 py-2"><span className="text-gray-400">Workouts: </span><span className="font-semibold">{store.workouts.length}</span></div>
          <div className="bg-gray-50 rounded-lg px-3 py-2"><span className="text-gray-400">Food entries: </span><span className="font-semibold">{store.foodEntries.length}</span></div>
          <div className="bg-gray-50 rounded-lg px-3 py-2"><span className="text-gray-400">Weight logs: </span><span className="font-semibold">{store.weightEntries.length}</span></div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title mb-3">About Grindly</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between"><span>Version</span><span className="font-semibold">1.0.0</span></div>
          <div className="flex justify-between"><span>Domain</span><span className="font-semibold text-blue-600">grindly.app</span></div>
          <div className="flex justify-between"><span>AI Model</span><span className="font-semibold">claude-sonnet-4-6</span></div>
          <div className="flex justify-between"><span>Storage</span><span className="font-semibold">Local Browser</span></div>
        </div>
      </div>

      <button onClick={save} className="w-full btn-primary py-4 text-base">Save Settings</button>
    </div>
  );
}
