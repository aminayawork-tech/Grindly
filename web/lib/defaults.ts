import { Goal, Habit, AppSettings } from './types';
import { nanoid } from './utils';

export const defaultGoals: Goal[] = [
  {
    id: nanoid(),
    title: 'Get Ripped',
    category: 'fitness',
    progressValue: 35,
    targetValue: 100,
    unit: '%',
    motivationalMessage: 'Build the body you\'ve always wanted. No shortcuts.',
    notes: 'Consistent workouts, high protein, low body fat.',
    milestones: [
      { id: nanoid(), title: 'First month consistent', value: 25, achieved: false },
      { id: nanoid(), title: 'Visible abs', value: 60, achieved: false },
      { id: nanoid(), title: 'Competition ready', value: 100, achieved: false },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: nanoid(),
    title: 'Lose Weight',
    category: 'weight',
    progressValue: 180,
    targetValue: 160,
    unit: 'lbs',
    motivationalMessage: '20 lbs stands between you and your best self.',
    notes: 'Target: 180 → 160 lbs. Calorie deficit + strength training.',
    milestones: [
      { id: nanoid(), title: '175 lbs', value: 175, achieved: false },
      { id: nanoid(), title: '170 lbs', value: 170, achieved: false },
      { id: nanoid(), title: '165 lbs', value: 165, achieved: false },
      { id: nanoid(), title: '160 lbs — GOAL!', value: 160, achieved: false },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: nanoid(),
    title: 'Grow Bank Account',
    category: 'financial',
    progressValue: 5000,
    targetValue: 50000,
    unit: '$',
    motivationalMessage: 'Wealth is built in the boring, consistent moments.',
    notes: 'Save aggressively, invest wisely, eliminate waste.',
    milestones: [
      { id: nanoid(), title: '$10K milestone', value: 10000, achieved: false },
      { id: nanoid(), title: '$25K halfway', value: 25000, achieved: false },
      { id: nanoid(), title: '$50K goal', value: 50000, achieved: false },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: nanoid(),
    title: 'Grow My Relationship',
    category: 'relationship',
    progressValue: 60,
    targetValue: 100,
    unit: '%',
    motivationalMessage: 'Show up every day. Relationships are built in the ordinary.',
    notes: 'Quality time, communication, shared experiences.',
    milestones: [
      { id: nanoid(), title: '30-day streak of intentionality', value: 40, achieved: false },
      { id: nanoid(), title: 'Memorable shared experience', value: 70, achieved: false },
      { id: nanoid(), title: 'Deep trust and connection', value: 100, achieved: false },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: nanoid(),
    title: 'Hair Growth',
    category: 'health',
    progressValue: 30,
    targetValue: 100,
    unit: '%',
    motivationalMessage: 'Consistency with Hims is the whole game. Don\'t miss a day.',
    notes: 'Take Hims medication daily. Track progress monthly.',
    milestones: [
      { id: nanoid(), title: '30 days consistent', value: 25, achieved: false },
      { id: nanoid(), title: 'Noticeable improvement', value: 60, achieved: false },
      { id: nanoid(), title: 'Full results', value: 100, achieved: false },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const defaultHabits: Habit[] = [
  { id: nanoid(), name: 'Take Hims Medication', icon: 'Pill', color: 'purple', completions: [], reminderEnabled: true, createdAt: new Date().toISOString() },
  { id: nanoid(), name: 'Morning Workout', icon: 'Dumbbell', color: 'orange', completions: [], reminderEnabled: true, createdAt: new Date().toISOString() },
  { id: nanoid(), name: 'Log Calories', icon: 'Utensils', color: 'green', completions: [], reminderEnabled: true, createdAt: new Date().toISOString() },
  { id: nanoid(), name: 'Log Weight', icon: 'Scale', color: 'blue', completions: [], reminderEnabled: true, createdAt: new Date().toISOString() },
];

export const defaultSettings: AppSettings = {
  dailyCalorieGoal: 2200,
  startWeight: 180,
  goalWeight: 160,
  anthropicApiKey: '',
  usdaApiKey: '',
};
