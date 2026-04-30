# Grindly — Personal Growth Tracking App

A premium iOS personal growth tracking app built with SwiftUI. Your personal trainer, nutritionist, and life coach in one app.

## Features

### 🏋️ Fitness Tracker
- HealthKit integration for Apple Watch workouts, calories, heart rate, and steps
- Log pull-up, dip, and push-up sessions with sets, reps, and rest times
- Log running sessions with distance, pace, and duration
- Real-time activity rings

### 🍽️ Calorie Tracker
- Nutritionix API integration — search any food by name and log instantly
- Daily calorie intake vs. personalized goal with progress bar
- Meal log by breakfast, lunch, dinner, and snacks
- Macro tracking (protein, carbs, fat)
- 7-day calorie average

### ⚖️ Weight Tracker
- Daily weight logging with interactive chart (Swift Charts)
- Goal: 180 → 160 lbs with projected timeline
- Milestone celebration cards every 5 lbs lost
- Trend analysis and weekly rate calculation

### 💊 Habit Reminders
- Custom daily push notification reminders
- One-tap habit completion
- Streak counter with fire emoji 🔥
- Weekly completion rate per habit

### 🎯 Goals Dashboard
- Bold goal cards with progress rings
- Default goals: Get Ripped, Lose Weight, Grow Bank Account, Grow My Relationship, Hair Growth
- Add custom goals with notes and target dates
- Motivational status messages

### 🤖 AI Life Coach
- Powered by Claude API (claude-sonnet-4-6)
- Daily check-in messages based on real data
- Direct, personalized advice — no generic fluff
- Full chat interface with typing indicators

### 📊 Weekly Report
- Auto-generated every Sunday
- Workouts, calories, weight change, habits overview
- Coach message highlighting wins and focus areas
- Performance score and emoji rating

## Setup

### Requirements
- Xcode 15+
- iOS 16.0+
- Apple Developer account (for HealthKit)

### API Keys
Add your keys in **Settings** tab within the app, or directly in the source files:

1. **Claude AI (required for AI Coach)**
   - Get key at [anthropic.com](https://console.anthropic.com)
   - Add to `ClaudeAIService.swift` → `apiKey` or via Settings

2. **Nutritionix (required for food search)**
   - Free tier at [developer.nutritionix.com](https://developer.nutritionix.com)
   - Add `appID` and `appKey` to `NutritionixService.swift` or via Settings

### HealthKit Setup
1. Open project in Xcode
2. Select the Grindly target → Signing & Capabilities
3. Add "HealthKit" capability
4. The `Info.plist` already contains the usage descriptions

### Running the App
```bash
open Grindly.xcodeproj
```
Build and run on a physical device or simulator (HealthKit requires device for real data).

## Architecture

```
Grindly/
├── App/
│   ├── GrindlyApp.swift          # App entry, notifications setup
│   └── MainTabView.swift         # Tab navigation
├── Models/
│   ├── Goal.swift                # Goal, Milestone, GoalCategory
│   ├── Workout.swift             # WorkoutSession, WorkoutSet, WorkoutType
│   ├── FoodEntry.swift           # FoodEntry, MealType, Nutritionix models
│   ├── WeightEntry.swift         # WeightEntry, WeightTrend
│   └── Habit.swift               # Habit, HabitCompletion
├── Services/
│   ├── DataStore.swift           # Central data store (UserDefaults + Codable)
│   ├── HealthKitService.swift    # Apple HealthKit integration
│   ├── NutritionixService.swift  # Nutritionix food search API
│   ├── ClaudeAIService.swift     # Claude AI coach (Anthropic API)
│   └── NotificationService.swift # Push notification scheduling
└── Views/
    ├── Dashboard/GoalsDashboardView.swift
    ├── Fitness/FitnessTrackerView.swift
    ├── Calories/CalorieTrackerView.swift + FoodSearchView.swift
    ├── Weight/WeightTrackerView.swift
    ├── Habits/HabitsView.swift
    ├── Coach/AICoachView.swift
    ├── WeeklyReport/WeeklyReportView.swift
    ├── Components/               # Reusable UI components
    └── SettingsView.swift
```

**Stack:** SwiftUI · MVVM · Combine · Swift Charts · HealthKit · UserNotifications

**Storage:** UserDefaults + Codable (no CoreData dependency, simple and fast)

**AI:** Claude `claude-sonnet-4-6` via Anthropic Messages API

## Design
- Light mode, white backgrounds with bold accent colors
- Progress rings similar to Apple Fitness app
- Bold goal cards with category-specific accent colors
- Streak flames for habits
- Smooth animations throughout
