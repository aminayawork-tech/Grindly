import Foundation

struct WeightEntry: Identifiable, Codable {
    var id: UUID = UUID()
    var weight: Double
    var date: Date = Date()
    var notes: String = ""

    var dateKey: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}

struct WeightTrend {
    var entries: [WeightEntry]
    var startWeight: Double
    var goalWeight: Double

    var currentWeight: Double {
        entries.sorted { $0.date > $1.date }.first?.weight ?? startWeight
    }

    var totalLost: Double {
        startWeight - currentWeight
    }

    var remaining: Double {
        currentWeight - goalWeight
    }

    var progressPercentage: Double {
        let totalToLose = startWeight - goalWeight
        guard totalToLose > 0 else { return 1.0 }
        return min(max(totalLost / totalToLose, 0), 1.0)
    }

    var weeklyRate: Double {
        guard entries.count >= 2 else { return 0 }
        let sorted = entries.sorted { $0.date < $1.date }
        let recent = Array(sorted.suffix(7))
        guard recent.count >= 2,
              let first = recent.first,
              let last = recent.last else { return 0 }
        let days = Calendar.current.dateComponents([.day], from: first.date, to: last.date).day ?? 1
        guard days > 0 else { return 0 }
        let change = first.weight - last.weight
        return (change / Double(days)) * 7
    }

    var projectedDaysToGoal: Int? {
        guard weeklyRate > 0, remaining > 0 else { return nil }
        let weeks = remaining / weeklyRate
        return Int(weeks * 7)
    }

    var projectedGoalDate: Date? {
        guard let days = projectedDaysToGoal else { return nil }
        return Calendar.current.date(byAdding: .day, value: days, to: Date())
    }

    func nextMilestone() -> Double? {
        let milestones = stride(from: startWeight - 5, through: goalWeight, by: -5)
        return milestones.first { $0 < currentWeight - 0.1 }
    }

    func lastMilestoneAchieved() -> Double? {
        let milestones = stride(from: startWeight, through: goalWeight, by: -5).map { $0 }
        return milestones.last { currentWeight <= $0 + 0.5 && currentWeight >= $0 - 2.5 }
    }
}
