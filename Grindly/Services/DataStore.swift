import Foundation
import Combine

class DataStore: ObservableObject {
    static let shared = DataStore()

    @Published var goals: [Goal] = []
    @Published var workouts: [WorkoutSession] = []
    @Published var foodEntries: [FoodEntry] = []
    @Published var weightEntries: [WeightEntry] = []
    @Published var habits: [Habit] = []
    @Published var dailyCalorieGoal: Double = 2200
    @Published var startWeight: Double = 180
    @Published var goalWeight: Double = 160

    private let goalsKey = "goals_v1"
    private let workoutsKey = "workouts_v1"
    private let foodKey = "food_entries_v1"
    private let weightKey = "weight_entries_v1"
    private let habitsKey = "habits_v1"
    private let settingsKey = "app_settings_v1"

    private init() {
        load()
    }

    func load() {
        goals = decode([Goal].self, forKey: goalsKey) ?? Goal.defaults
        workouts = decode([WorkoutSession].self, forKey: workoutsKey) ?? []
        foodEntries = decode([FoodEntry].self, forKey: foodKey) ?? []
        weightEntries = decode([WeightEntry].self, forKey: weightKey) ?? []
        habits = decode([Habit].self, forKey: habitsKey) ?? Habit.defaults

        if let settings = UserDefaults.standard.dictionary(forKey: settingsKey) {
            dailyCalorieGoal = settings["dailyCalorieGoal"] as? Double ?? 2200
            startWeight = settings["startWeight"] as? Double ?? 180
            goalWeight = settings["goalWeight"] as? Double ?? 160
        }
    }

    func save() {
        encode(goals, forKey: goalsKey)
        encode(workouts, forKey: workoutsKey)
        encode(foodEntries, forKey: foodKey)
        encode(weightEntries, forKey: weightKey)
        encode(habits, forKey: habitsKey)

        let settings: [String: Any] = [
            "dailyCalorieGoal": dailyCalorieGoal,
            "startWeight": startWeight,
            "goalWeight": goalWeight
        ]
        UserDefaults.standard.set(settings, forKey: settingsKey)
    }

    private func encode<T: Encodable>(_ value: T, forKey key: String) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    private func decode<T: Decodable>(_ type: T.Type, forKey key: String) -> T? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }

    func addWorkout(_ session: WorkoutSession) {
        workouts.insert(session, at: 0)
        save()
    }

    func addFoodEntry(_ entry: FoodEntry) {
        foodEntries.insert(entry, at: 0)
        save()
    }

    func removeFoodEntry(id: UUID) {
        foodEntries.removeAll { $0.id == id }
        save()
    }

    func addWeightEntry(_ entry: WeightEntry) {
        weightEntries.removeAll {
            Calendar.current.isDate($0.date, inSameDayAs: entry.date)
        }
        weightEntries.insert(entry, at: 0)
        if let goal = goals.first(where: { $0.category == .weight }) {
            updateWeightGoalProgress(currentWeight: entry.weight, goal: goal)
        }
        save()
    }

    private func updateWeightGoalProgress(currentWeight: Double, goal: Goal) {
        if let idx = goals.firstIndex(where: { $0.id == goal.id }) {
            goals[idx].progressValue = currentWeight
        }
    }

    func toggleHabit(id: UUID) {
        if let idx = habits.firstIndex(where: { $0.id == id }) {
            habits[idx].toggleToday()
        }
        save()
    }

    func addHabit(_ habit: Habit) {
        habits.append(habit)
        save()
    }

    func updateGoal(_ goal: Goal) {
        if let idx = goals.firstIndex(where: { $0.id == goal.id }) {
            goals[idx] = goal
        }
        save()
    }

    func addGoal(_ goal: Goal) {
        goals.append(goal)
        save()
    }

    func todayFoodEntries() -> [FoodEntry] {
        let today = Calendar.current.startOfDay(for: Date())
        return foodEntries.filter { Calendar.current.startOfDay(for: $0.loggedAt) == today }
    }

    func todayCalories() -> Double {
        todayFoodEntries().reduce(0) { $0 + $1.calories }
    }

    func sevenDayCalorieAverage() -> Double {
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        var totalCalories = 0.0
        var daysWithData = 0

        for offset in 0..<7 {
            guard let date = cal.date(byAdding: .day, value: -offset, to: today) else { continue }
            let dayEntries = foodEntries.filter { cal.startOfDay(for: $0.loggedAt) == date }
            if !dayEntries.isEmpty {
                totalCalories += dayEntries.reduce(0) { $0 + $1.calories }
                daysWithData += 1
            }
        }
        return daysWithData > 0 ? totalCalories / Double(daysWithData) : 0
    }

    func weightTrend() -> WeightTrend {
        WeightTrend(
            entries: weightEntries,
            startWeight: startWeight,
            goalWeight: goalWeight
        )
    }

    func weeklyWorkoutCount() -> Int {
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        guard let weekAgo = cal.date(byAdding: .day, value: -7, to: today) else { return 0 }
        return workouts.filter { $0.date >= weekAgo }.count
    }

    func generateWeeklyReport() -> WeeklyReportData {
        let cal = Calendar.current
        let today = Date()
        guard let weekAgo = cal.date(byAdding: .day, value: -7, to: today) else {
            return WeeklyReportData(weekOf: today, workoutsCompleted: 0, avgDailyCalories: 0, weightChange: 0, habitsHit: 0, habitsTotal: 0)
        }

        let weekWorkouts = workouts.filter { $0.date >= weekAgo }
        let avgCals = sevenDayCalorieAverage()

        let weekWeights = weightEntries.filter { $0.date >= weekAgo }.sorted { $0.date < $1.date }
        let weightChange = (weekWeights.last?.weight ?? 0) - (weekWeights.first?.weight ?? 0)

        var habitsHit = 0
        var habitsTotal = 0
        for habit in habits {
            for offset in 0..<7 {
                guard let date = cal.date(byAdding: .day, value: -offset, to: today) else { continue }
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                let key = formatter.string(from: date)
                habitsTotal += 1
                if habit.completions.contains(where: { $0.dateKey == key }) {
                    habitsHit += 1
                }
            }
        }

        return WeeklyReportData(
            weekOf: today,
            workoutsCompleted: weekWorkouts.count,
            avgDailyCalories: avgCals,
            weightChange: weightChange,
            habitsHit: habitsHit,
            habitsTotal: habitsTotal
        )
    }
}

struct WeeklyReportData {
    var weekOf: Date
    var workoutsCompleted: Int
    var avgDailyCalories: Double
    var weightChange: Double
    var habitsHit: Int
    var habitsTotal: Int
    var coachMessage: String = ""

    var habitCompletionRate: Double {
        guard habitsTotal > 0 else { return 0 }
        return Double(habitsHit) / Double(habitsTotal)
    }
}
