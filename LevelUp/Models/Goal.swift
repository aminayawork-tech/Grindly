import Foundation
import SwiftUI

enum GoalCategory: String, Codable, CaseIterable {
    case fitness = "Fitness"
    case weight = "Weight"
    case financial = "Financial"
    case relationship = "Relationship"
    case health = "Health"
    case custom = "Custom"

    var icon: String {
        switch self {
        case .fitness: return "flame.fill"
        case .weight: return "scalemass.fill"
        case .financial: return "dollarsign.circle.fill"
        case .relationship: return "heart.fill"
        case .health: return "cross.case.fill"
        case .custom: return "star.fill"
        }
    }

    var accentColor: Color {
        switch self {
        case .fitness: return .orange
        case .weight: return .blue
        case .financial: return .green
        case .relationship: return .pink
        case .health: return .purple
        case .custom: return .indigo
        }
    }
}

struct Goal: Identifiable, Codable {
    var id: UUID = UUID()
    var title: String
    var category: GoalCategory
    var progressValue: Double
    var targetValue: Double
    var unit: String
    var motivationalMessage: String
    var targetDate: Date?
    var notes: String
    var milestones: [Milestone]
    var isActive: Bool = true
    var createdAt: Date = Date()

    var progressPercentage: Double {
        guard targetValue > 0 else { return 0 }
        return min(progressValue / targetValue, 1.0)
    }

    var statusMessage: String {
        let pct = progressPercentage
        if pct >= 1.0 { return "Goal Achieved! 🏆" }
        if pct >= 0.75 { return "Almost there! Keep pushing!" }
        if pct >= 0.5 { return "Halfway there — stay consistent!" }
        if pct >= 0.25 { return "Building momentum, don't stop!" }
        return "Day 1 energy — let's go!"
    }
}

struct Milestone: Identifiable, Codable {
    var id: UUID = UUID()
    var title: String
    var value: Double
    var achieved: Bool = false
    var achievedDate: Date?
}

extension Goal {
    static let defaults: [Goal] = [
        Goal(
            title: "Get Ripped",
            category: .fitness,
            progressValue: 35,
            targetValue: 100,
            unit: "%",
            motivationalMessage: "Build the body you've always wanted. No shortcuts.",
            notes: "Consistent workouts, high protein, low body fat.",
            milestones: [
                Milestone(title: "First month consistent", value: 25),
                Milestone(title: "Visible abs", value: 60),
                Milestone(title: "Competition ready", value: 100)
            ]
        ),
        Goal(
            title: "Lose Weight",
            category: .weight,
            progressValue: 180,
            targetValue: 160,
            unit: "lbs",
            motivationalMessage: "20 lbs stands between you and your best self.",
            targetDate: Calendar.current.date(byAdding: .month, value: 4, to: Date()),
            notes: "Target: 180 → 160 lbs. Calorie deficit + strength training.",
            milestones: [
                Milestone(title: "175 lbs", value: 175),
                Milestone(title: "170 lbs", value: 170),
                Milestone(title: "165 lbs", value: 165),
                Milestone(title: "160 lbs — GOAL!", value: 160)
            ]
        ),
        Goal(
            title: "Grow Bank Account",
            category: .financial,
            progressValue: 5000,
            targetValue: 50000,
            unit: "$",
            motivationalMessage: "Wealth is built in the boring, consistent moments.",
            notes: "Save aggressively, invest wisely, eliminate waste.",
            milestones: [
                Milestone(title: "$10K milestone", value: 10000),
                Milestone(title: "$25K halfway", value: 25000),
                Milestone(title: "$50K goal", value: 50000)
            ]
        ),
        Goal(
            title: "Grow My Relationship",
            category: .relationship,
            progressValue: 60,
            targetValue: 100,
            unit: "%",
            motivationalMessage: "Show up every day. Relationships are built in the ordinary.",
            notes: "Quality time, communication, shared experiences.",
            milestones: [
                Milestone(title: "30-day streak of intentionality", value: 40),
                Milestone(title: "Memorable shared experience", value: 70),
                Milestone(title: "Deep trust and connection", value: 100)
            ]
        ),
        Goal(
            title: "Hair Growth",
            category: .health,
            progressValue: 30,
            targetValue: 100,
            unit: "%",
            motivationalMessage: "Consistency with Hims is the whole game. Don't miss a day.",
            notes: "Take Hims medication daily. Track progress monthly.",
            milestones: [
                Milestone(title: "30 days consistent", value: 25),
                Milestone(title: "Noticeable improvement", value: 60),
                Milestone(title: "Full results", value: 100)
            ]
        )
    ]
}
