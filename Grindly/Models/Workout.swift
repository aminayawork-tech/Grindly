import Foundation

enum WorkoutType: String, Codable, CaseIterable {
    case pullUps = "Pull-Ups"
    case dips = "Dips"
    case pushUps = "Push-Ups"
    case running = "Running"
    case custom = "Custom"

    var icon: String {
        switch self {
        case .pullUps: return "figure.strengthtraining.traditional"
        case .dips: return "figure.core.training"
        case .pushUps: return "figure.flexibility"
        case .running: return "figure.run"
        case .custom: return "figure.mixed.cardio"
        }
    }
}

struct WorkoutSet: Identifiable, Codable {
    var id: UUID = UUID()
    var reps: Int
    var restSeconds: Int
    var completedAt: Date = Date()
}

struct WorkoutSession: Identifiable, Codable {
    var id: UUID = UUID()
    var type: WorkoutType
    var date: Date = Date()
    var sets: [WorkoutSet]
    var notes: String = ""
    var duration: TimeInterval
    var activeCalories: Double = 0
    var heartRateAvg: Double = 0
    var distance: Double = 0
    var pace: Double = 0

    var totalReps: Int {
        sets.reduce(0) { $0 + $1.reps }
    }

    var totalSets: Int {
        sets.count
    }

    var formattedDuration: String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    var formattedPace: String {
        guard pace > 0 else { return "--" }
        let minutes = Int(pace)
        let seconds = Int((pace - Double(minutes)) * 60)
        return String(format: "%d:%02d /mi", minutes, seconds)
    }

    var formattedDistance: String {
        guard distance > 0 else { return "--" }
        return String(format: "%.2f mi", distance)
    }
}
