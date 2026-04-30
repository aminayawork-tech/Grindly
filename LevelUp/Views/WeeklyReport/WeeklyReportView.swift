import SwiftUI

struct WeeklyReportView: View {
    @EnvironmentObject var store: DataStore
    @StateObject private var aiService = ClaudeAIService.shared
    @State private var report: WeeklyReportData? = nil
    @State private var coachMessage = ""
    @State private var isLoadingMessage = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if let report = report {
                        reportContent(report)
                    } else {
                        ProgressView("Generating report...")
                            .padding(40)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 32)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Weekly Report")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Refresh") { generateReport() }
                        .disabled(isLoadingMessage)
                }
            }
            .onAppear { generateReport() }
        }
    }

    @ViewBuilder
    private func reportContent(_ report: WeeklyReportData) -> some View {
        reportHeader(report)
        statsGrid(report)
        habitsSection(report)
        coachMessageSection
    }

    private func reportHeader(_ report: WeeklyReportData) -> some View {
        VStack(spacing: 8) {
            Text("Week of \(weekDateRange())")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.secondary)
                .textCase(.uppercase)
                .tracking(0.5)

            HStack(spacing: 4) {
                Text(weekScoreEmoji(report))
                    .font(.system(size: 48))
                Text(weekScoreLabel(report))
                    .font(.system(size: 28, weight: .bold))
            }

            Text(weekScoreSubtitle(report))
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(
            LinearGradient(
                colors: [Color.blue.opacity(0.08), Color.purple.opacity(0.08)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(20)
    }

    private func statsGrid(_ report: WeeklyReportData) -> some View {
        VStack(spacing: 12) {
            SectionHeader(title: "This Week's Numbers")

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                StatCardView(
                    title: "Workouts",
                    value: "\(report.workoutsCompleted)",
                    subtitle: "sessions completed",
                    icon: "flame.fill",
                    color: .orange
                )

                StatCardView(
                    title: "Avg Calories",
                    value: "\(Int(report.avgDailyCalories))",
                    subtitle: "kcal per day",
                    icon: "fork.knife",
                    color: .green
                )

                StatCardView(
                    title: "Weight Change",
                    value: String(format: "%+.1f lbs", report.weightChange),
                    subtitle: report.weightChange < 0 ? "Great progress! 💪" : "Watch the trend",
                    icon: "scalemass.fill",
                    color: report.weightChange <= 0 ? .blue : .orange
                )

                StatCardView(
                    title: "Habits",
                    value: "\(Int(report.habitCompletionRate * 100))%",
                    subtitle: "\(report.habitsHit)/\(report.habitsTotal) completed",
                    icon: "checkmark.seal.fill",
                    color: habitColor(report.habitCompletionRate)
                )
            }
        }
    }

    private func habitsSection(_ report: WeeklyReportData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Habit Breakdown")

            ForEach(store.habits) { habit in
                HabitWeeklyRow(habit: habit)
            }
        }
    }

    private var coachMessageSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Coach's Weekly Take")

            if isLoadingMessage {
                HStack {
                    ProgressView()
                    Text("Coach is reviewing your week...")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(20)
                .frame(maxWidth: .infinity)
                .background(Color(.systemBackground))
                .cornerRadius(14)
            } else if !coachMessage.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 10) {
                        Image(systemName: "brain.head.profile")
                            .font(.system(size: 18))
                            .foregroundColor(.white)
                            .frame(width: 36, height: 36)
                            .background(Color.blue)
                            .clipShape(Circle())
                        Text("Your Coach")
                            .font(.system(size: 14, weight: .semibold))
                    }

                    Text(coachMessage)
                        .font(.system(size: 15))
                        .foregroundColor(.primary)
                        .lineSpacing(4)
                }
                .padding(20)
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
            } else {
                Button("Get Coach's Take") {
                    fetchCoachMessage()
                }
                .font(.system(size: 15, weight: .semibold))
                .frame(maxWidth: .infinity)
                .padding(14)
                .background(Color.blue.opacity(0.1))
                .foregroundColor(.blue)
                .cornerRadius(12)
            }
        }
    }

    private func generateReport() {
        let generated = store.generateWeeklyReport()
        withAnimation { report = generated }
        fetchCoachMessage()
    }

    private func fetchCoachMessage() {
        guard let report = report else { return }
        isLoadingMessage = true
        let context = UserContext.from(store)
        aiService.generateWeeklyCoachMessage(report: report, context: context) { message in
            withAnimation {
                coachMessage = message
                isLoadingMessage = false
            }
        }
    }

    private func weekDateRange() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        let end = Date()
        let start = Calendar.current.date(byAdding: .day, value: -6, to: end) ?? end
        return "\(formatter.string(from: start)) – \(formatter.string(from: end))"
    }

    private func weekScoreEmoji(_ report: WeeklyReportData) -> String {
        let score = calculateScore(report)
        if score >= 80 { return "🔥" }
        if score >= 60 { return "💪" }
        if score >= 40 { return "📈" }
        return "🎯"
    }

    private func weekScoreLabel(_ report: WeeklyReportData) -> String {
        let score = calculateScore(report)
        if score >= 80 { return "Crushing It" }
        if score >= 60 { return "Solid Week" }
        if score >= 40 { return "Building Up" }
        return "Keep Going"
    }

    private func weekScoreSubtitle(_ report: WeeklyReportData) -> String {
        let score = calculateScore(report)
        if score >= 80 { return "You're in top form. Keep the momentum." }
        if score >= 60 { return "Good week. A few tweaks and you'll be elite." }
        if score >= 40 { return "Progress is progress. Consistency beats intensity." }
        return "Every legend started where you are. Next week is yours."
    }

    private func calculateScore(_ report: WeeklyReportData) -> Int {
        var score = 0
        score += min(report.workoutsCompleted * 15, 40)
        score += Int(report.habitCompletionRate * 40)
        if report.weightChange < 0 { score += 20 }
        return score
    }

    private func habitColor(_ rate: Double) -> Color {
        if rate >= 0.8 { return .green }
        if rate >= 0.5 { return .orange }
        return .red
    }
}

struct HabitWeeklyRow: View {
    let habit: Habit

    var last7Days: [String] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return (0..<7).compactMap { offset -> String? in
            guard let date = Calendar.current.date(byAdding: .day, value: -offset, to: Date()) else { return nil }
            return formatter.string(from: date)
        }.reversed()
    }

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: habit.icon)
                .font(.system(size: 14))
                .foregroundColor(.secondary)
                .frame(width: 20)

            Text(habit.name)
                .font(.system(size: 13, weight: .medium))
                .lineLimit(1)

            Spacer()

            HStack(spacing: 4) {
                ForEach(last7Days, id: \.self) { key in
                    let completed = habit.completions.contains { $0.dateKey == key }
                    Circle()
                        .fill(completed ? Color.green : Color(.systemGray5))
                        .frame(width: 20, height: 20)
                        .overlay(
                            Image(systemName: "checkmark")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(.white)
                                .opacity(completed ? 1 : 0)
                        )
                }
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .cornerRadius(10)
    }
}
