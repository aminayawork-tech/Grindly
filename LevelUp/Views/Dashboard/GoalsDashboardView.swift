import SwiftUI

struct GoalsDashboardView: View {
    @EnvironmentObject var store: DataStore
    @State private var showAddGoal = false
    @State private var selectedGoal: Goal? = nil

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    quickStatsRow
                    goalsSection
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 32)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("LevelUp")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showAddGoal = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 22))
                    }
                }
            }
            .sheet(isPresented: $showAddGoal) {
                AddGoalView()
                    .environmentObject(store)
            }
            .sheet(item: $selectedGoal) { goal in
                GoalDetailView(goal: goal)
                    .environmentObject(store)
            }
        }
    }

    private var quickStatsRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                StatCardView(
                    title: "Workouts",
                    value: "\(store.weeklyWorkoutCount())",
                    subtitle: "this week",
                    icon: "flame.fill",
                    color: .orange
                )
                .frame(width: 140)

                StatCardView(
                    title: "Calories",
                    value: "\(Int(store.todayCalories()))",
                    subtitle: "today",
                    icon: "fork.knife",
                    color: .green
                )
                .frame(width: 140)

                StatCardView(
                    title: "Weight",
                    value: String(format: "%.1f", store.weightTrend().currentWeight),
                    subtitle: "current lbs",
                    icon: "scalemass.fill",
                    color: .blue
                )
                .frame(width: 140)

                StatCardView(
                    title: "Habits",
                    value: "\(Int(avgHabitRate * 100))%",
                    subtitle: "weekly rate",
                    icon: "checkmark.seal.fill",
                    color: .purple
                )
                .frame(width: 140)
            }
            .padding(.vertical, 4)
        }
    }

    private var avgHabitRate: Double {
        guard !store.habits.isEmpty else { return 0 }
        return store.habits.map { $0.weeklyCompletionRate }.reduce(0, +) / Double(store.habits.count)
    }

    private var goalsSection: some View {
        VStack(spacing: 12) {
            SectionHeader(title: "Active Goals")

            ForEach(store.goals.filter { $0.isActive }) { goal in
                GoalCardView(goal: goal)
                    .onTapGesture { selectedGoal = goal }
            }
        }
    }
}

struct GoalCardView: View {
    let goal: Goal
    @State private var appear = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(goal.category.accentColor.opacity(0.15))
                        .frame(width: 48, height: 48)
                    Image(systemName: goal.category.icon)
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundColor(goal.category.accentColor)
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(goal.title)
                        .font(.system(size: 18, weight: .bold))
                    Text(goal.statusMessage)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                Spacer()

                ProgressRingView(
                    progress: appear ? goal.progressPercentage : 0,
                    lineWidth: 5,
                    color: goal.category.accentColor,
                    size: 52,
                    showLabel: true
                )
            }

            if !goal.motivationalMessage.isEmpty {
                Text(goal.motivationalMessage)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .italic()
                    .lineLimit(2)
            }

            if !goal.milestones.isEmpty {
                milestonesRow
            }
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(20)
        .shadow(color: goal.category.accentColor.opacity(0.08), radius: 12, x: 0, y: 4)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(goal.category.accentColor.opacity(0.1), lineWidth: 1)
        )
        .onAppear { withAnimation(.easeOut(duration: 0.5).delay(0.1)) { appear = true } }
    }

    private var milestonesRow: some View {
        HStack(spacing: 6) {
            ForEach(goal.milestones) { milestone in
                let achieved = isMilestoneAchieved(milestone)
                HStack(spacing: 4) {
                    Image(systemName: achieved ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 12))
                        .foregroundColor(achieved ? goal.category.accentColor : .secondary.opacity(0.4))
                    Text(milestone.title)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(achieved ? .primary : .secondary)
                        .lineLimit(1)
                }
            }
        }
    }

    private func isMilestoneAchieved(_ milestone: Milestone) -> Bool {
        if goal.category == .weight {
            return goal.progressValue <= milestone.value
        }
        return goal.progressValue >= milestone.value
    }
}

struct GoalDetailView: View {
    let goal: Goal
    @EnvironmentObject var store: DataStore
    @Environment(\.dismiss) var dismiss
    @State private var editedGoal: Goal

    init(goal: Goal) {
        self.goal = goal
        self._editedGoal = State(initialValue: goal)
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    VStack(spacing: 16) {
                        ProgressRingView(
                            progress: goal.progressPercentage,
                            lineWidth: 12,
                            color: goal.category.accentColor,
                            size: 140
                        )
                        .padding(.top, 20)

                        Text(goal.title)
                            .font(.system(size: 24, weight: .bold))
                        Text(goal.statusMessage)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)

                    if !goal.motivationalMessage.isEmpty {
                        Text("\"\(goal.motivationalMessage)\"")
                            .font(.body)
                            .italic()
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Milestones")
                        ForEach(goal.milestones) { milestone in
                            let achieved = isMilestoneAchieved(milestone)
                            HStack {
                                Image(systemName: achieved ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(achieved ? goal.category.accentColor : .secondary)
                                Text(milestone.title)
                                    .strikethrough(achieved)
                                    .foregroundColor(achieved ? .secondary : .primary)
                                Spacer()
                                if achieved {
                                    Text("Done")
                                        .font(.caption.bold())
                                        .foregroundColor(goal.category.accentColor)
                                }
                            }
                            .padding(12)
                            .background(Color(.systemBackground))
                            .cornerRadius(10)
                        }
                    }
                    .padding(.horizontal)

                    if !goal.notes.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            SectionHeader(title: "Notes")
                            Text(goal.notes)
                                .font(.body)
                                .foregroundColor(.secondary)
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color(.systemBackground))
                                .cornerRadius(10)
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.bottom, 32)
            }
            .background(Color(.systemGroupedBackground))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private func isMilestoneAchieved(_ milestone: Milestone) -> Bool {
        if goal.category == .weight {
            return goal.progressValue <= milestone.value
        }
        return goal.progressValue >= milestone.value
    }
}

struct AddGoalView: View {
    @EnvironmentObject var store: DataStore
    @Environment(\.dismiss) var dismiss

    @State private var title = ""
    @State private var category: GoalCategory = .custom
    @State private var progressValue = ""
    @State private var targetValue = ""
    @State private var unit = ""
    @State private var notes = ""
    @State private var motivationalMessage = ""
    @State private var hasTargetDate = false
    @State private var targetDate = Date()

    var body: some View {
        NavigationView {
            Form {
                Section("Goal Details") {
                    TextField("Goal title (e.g. Run a 5K)", text: $title)
                    Picker("Category", selection: $category) {
                        ForEach(GoalCategory.allCases, id: \.self) { cat in
                            Label(cat.rawValue, systemImage: cat.icon).tag(cat)
                        }
                    }
                }

                Section("Progress") {
                    TextField("Current value (e.g. 0)", text: $progressValue)
                        .keyboardType(.decimalPad)
                    TextField("Target value (e.g. 100)", text: $targetValue)
                        .keyboardType(.decimalPad)
                    TextField("Unit (e.g. %, lbs, $)", text: $unit)
                }

                Section("Motivation") {
                    TextField("Motivational message", text: $motivationalMessage)
                    TextField("Notes", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section {
                    Toggle("Set target date", isOn: $hasTargetDate)
                    if hasTargetDate {
                        DatePicker("Target date", selection: $targetDate, displayedComponents: .date)
                    }
                }
            }
            .navigationTitle("New Goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") { addGoal() }
                        .bold()
                        .disabled(title.isEmpty)
                }
            }
        }
    }

    private func addGoal() {
        let goal = Goal(
            title: title,
            category: category,
            progressValue: Double(progressValue) ?? 0,
            targetValue: Double(targetValue) ?? 100,
            unit: unit,
            motivationalMessage: motivationalMessage,
            targetDate: hasTargetDate ? targetDate : nil,
            notes: notes,
            milestones: []
        )
        store.addGoal(goal)
        dismiss()
    }
}
