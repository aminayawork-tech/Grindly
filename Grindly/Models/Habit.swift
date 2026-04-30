import Foundation

struct Habit: Identifiable, Codable {
    var id: UUID = UUID()
    var name: String
    var icon: String
    var reminderTime: Date?
    var reminderEnabled: Bool = true
    var completions: [HabitCompletion]
    var createdAt: Date = Date()
    var color: String = "orange"

    var todayKey: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }

    var isCompletedToday: Bool {
        completions.contains { $0.dateKey == todayKey }
    }

    var currentStreak: Int {
        var streak = 0
        var checkDate = Date()
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        for _ in 0..<365 {
            let key = formatter.string(from: checkDate)
            if completions.contains(where: { $0.dateKey == key }) {
                streak += 1
                checkDate = Calendar.current.date(byAdding: .day, value: -1, to: checkDate) ?? checkDate
            } else {
                break
            }
        }
        return streak
    }

    var weeklyCompletionRate: Double {
        let last7Days = (0..<7).compactMap { offset -> String? in
            guard let date = Calendar.current.date(byAdding: .day, value: -offset, to: Date()) else { return nil }
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            return formatter.string(from: date)
        }
        let completed = last7Days.filter { key in
            completions.contains { $0.dateKey == key }
        }
        return Double(completed.count) / 7.0
    }

    mutating func toggleToday() {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let today = formatter.string(from: Date())

        if let idx = completions.firstIndex(where: { $0.dateKey == today }) {
            completions.remove(at: idx)
        } else {
            completions.append(HabitCompletion(dateKey: today))
        }
    }
}

struct HabitCompletion: Identifiable, Codable {
    var id: UUID = UUID()
    var dateKey: String
    var completedAt: Date = Date()
}

extension Habit {
    static let defaults: [Habit] = [
        Habit(
            name: "Take Hims Medication",
            icon: "pills.fill",
            reminderTime: Calendar.current.date(bySettingHour: 8, minute: 0, second: 0, of: Date()),
            reminderEnabled: true,
            completions: [],
            color: "purple"
        ),
        Habit(
            name: "Morning Workout",
            icon: "flame.fill",
            reminderTime: Calendar.current.date(bySettingHour: 6, minute: 30, second: 0, of: Date()),
            reminderEnabled: true,
            completions: [],
            color: "orange"
        ),
        Habit(
            name: "Log Calories",
            icon: "fork.knife",
            reminderTime: Calendar.current.date(bySettingHour: 20, minute: 0, second: 0, of: Date()),
            reminderEnabled: true,
            completions: [],
            color: "green"
        ),
        Habit(
            name: "Log Weight",
            icon: "scalemass.fill",
            reminderTime: Calendar.current.date(bySettingHour: 7, minute: 0, second: 0, of: Date()),
            reminderEnabled: true,
            completions: [],
            color: "blue"
        )
    ]
}
