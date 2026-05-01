export type GoalCategory = 'fitness' | 'weight' | 'financial' | 'relationship' | 'health' | 'custom';
export type WorkoutType = 'pullUps' | 'dips' | 'pushUps' | 'running' | 'custom';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface Milestone {
  id: string;
  title: string;
  value: number;
  achieved: boolean;
}

export interface GoalEntry {
  id: string;
  date: string;
  note: string;
  progressValue?: number;
}

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  progressValue: number;
  targetValue: number;
  unit: string;
  motivationalMessage: string;
  notes: string;
  milestones: Milestone[];
  entries?: GoalEntry[];
  targetDate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  exercise?: string;
  reps: number;
  restSeconds: number;
}

export interface WorkoutSession {
  id: string;
  name?: string;
  type: WorkoutType;
  date: string;
  sets: WorkoutSet[];
  notes: string;
  duration: number;
  calories: number;
  distance?: number;
  pace?: number;
}

export interface FoodEntry {
  id: string;
  foodName: string;
  brandName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingQty: number;
  servingUnit: string;
  mealType: MealType;
  loggedAt: string;
}

export interface WeightEntry {
  id: string;
  weight: number;
  date: string;
  notes: string;
}

export interface HabitCompletion {
  id: string;
  dateKey: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  completions: string[];
  reminderEnabled: boolean;
  createdAt: string;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: string;
}

export interface AppSettings {
  dailyCalorieGoal: number;
  startWeight: number;
  goalWeight: number;
  anthropicApiKey: string;
  nutritionixAppId: string;
  nutritionixAppKey: string;
}

export interface WeeklyReport {
  weekOf: string;
  workoutsCompleted: number;
  avgDailyCalories: number;
  weightChange: number;
  habitsHit: number;
  habitsTotal: number;
  coachMessage: string;
}
