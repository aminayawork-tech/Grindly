import SwiftUI

struct HabitsView: View {
    @EnvironmentObject var store: DataStore
    @State private var showAddHabit = false
    @State private var completionTrigger: UUID? = nil

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    summarySection
                    habitsSection
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 32)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Habits")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showAddHabit = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 22))
                    }
                }
            }
            .sheet(isPresented: $showAddHabit) {
                AddHabitView()
                    .environmentObject(store)
            }
        }
    }

    private var summarySection: some View {
        HStack(spacing: 12) {
            let completedToday = store.habits.filter { $0.isCompletedToday }.count
            let total = store.habits.count

            StatCardView(
                title: "Today",
                value: "\(completedToday)/\(total)",
                subtitle: "habits done",
                icon: "checkmark.seal.fill",
                color: .purple
            )

            StatCardView(
                title: "Weekly Rate",
                value: "\(Int(avgWeeklyRate * 100))%",
                subtitle: "completion",
                icon: "chart.bar.fill",
                color: .indigo
            )

            StatCardView(
                title: "Best Streak",
                value: "\(bestStreak)",
                subtitle: "days",
                icon: "flame.fill",
                color: .orange
            )
        }
    }

    private var avgWeeklyRate: Double {
        guard !store.habits.isEmpty else { return 0 }
        return store.habits.map { $0.weeklyCompletionRate }.reduce(0, +) / Double(store.habits.count)
    }

    private var bestStreak: Int {
        store.habits.map { $0.currentStreak }.max() ?? 0
    }

    private var habitsSection: some View {
        VStack(spacing: 10) {
            SectionHeader(title: "Today's Habits")

            ForEach(store.habits) { habit in
                HabitRowView(
                    habit: habit,
                    onToggle: {
                        store.toggleHabit(id: habit.id)
                        if store.habits.first(where: { $0.id == habit.id })?.isCompletedToday == true {
                            let generator = UIImpactFeedbackGenerator(style: .medium)
                            generator.impactOccurred()
                        }
                    }
                )
            }
        }
    }
}

struct HabitRowView: View {
    let habit: Habit
    let onToggle: () -> Void
    @State private var animateCheck = false

    var accentColor: Color {
        switch habit.color {
        case "purple": return .purple
        case "orange": return .orange
        case "green": return .green
        case "blue": return .blue
        case "pink": return .pink
        case "red": return .red
        default: return .orange
        }
    }

    var body: some View {
        HStack(spacing: 14) {
            Button(action: {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                    animateCheck.toggle()
                }
                onToggle()
            }) {
                ZStack {
                    Circle()
                        .fill(habit.isCompletedToday ? accentColor : Color(.systemGray5))
                        .frame(width: 36, height: 36)
                        .scaleEffect(animateCheck ? 1.15 : 1)

                    Image(systemName: habit.isCompletedToday ? "checkmark" : "")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)
                }
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Image(systemName: habit.icon)
                        .font(.system(size: 14))
                        .foregroundColor(accentColor)
                    Text(habit.name)
                        .font(.system(size: 15, weight: .semibold))
                        .strikethrough(habit.isCompletedToday, color: .secondary)
                        .foregroundColor(habit.isCompletedToday ? .secondary : .primary)
                }

                HStack(spacing: 8) {
                    if habit.currentStreak > 0 {
                        HStack(spacing: 3) {
                            Text("🔥")
                                .font(.system(size: 11))
                            Text("\(habit.currentStreak) day streak")
                                .font(.caption)
                                .foregroundColor(.orange)
                                .fontWeight(.semibold)
                        }
                    }
                    Text("\(Int(habit.weeklyCompletionRate * 100))% this week")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            if let reminderTime = habit.reminderTime, habit.reminderEnabled {
                Text(reminderTime.formatted(date: .omitted, time: .shortened))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(14)
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: habit.isCompletedToday ? accentColor.opacity(0.08) : .black.opacity(0.04),
                radius: 6, x: 0, y: 2)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(habit.isCompletedToday ? accentColor.opacity(0.2) : Color.clear, lineWidth: 1)
        )
    }
}

struct AddHabitView: View {
    @EnvironmentObject var store: DataStore
    @Environment(\.dismiss) var dismiss

    @State private var name = ""
    @State private var selectedIcon = "star.fill"
    @State private var selectedColor = "orange"
    @State private var reminderEnabled = true
    @State private var reminderTime = Calendar.current.date(bySettingHour: 8, minute: 0, second: 0, of: Date()) ?? Date()

    let icons = ["star.fill", "flame.fill", "heart.fill", "pills.fill", "fork.knife",
                 "figure.run", "book.fill", "drop.fill", "moon.fill", "bolt.fill",
                 "leaf.fill", "scalemass.fill", "dumbbell.fill", "brain.head.profile"]

    let colors = ["orange", "blue", "green", "purple", "pink", "red", "indigo"]

    var body: some View {
        NavigationView {
            Form {
                Section("Habit Name") {
                    TextField("e.g. Take vitamins", text: $name)
                }

                Section("Icon") {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(icons, id: \.self) { icon in
                                Button {
                                    selectedIcon = icon
                                } label: {
                                    Image(systemName: icon)
                                        .font(.system(size: 22))
                                        .foregroundColor(selectedIcon == icon ? .white : colorValue(selectedColor))
                                        .frame(width: 44, height: 44)
                                        .background(selectedIcon == icon ? colorValue(selectedColor) : colorValue(selectedColor).opacity(0.1))
                                        .cornerRadius(10)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }

                Section("Color") {
                    HStack(spacing: 12) {
                        ForEach(colors, id: \.self) { color in
                            Button {
                                selectedColor = color
                            } label: {
                                Circle()
                                    .fill(colorValue(color))
                                    .frame(width: 32, height: 32)
                                    .overlay(
                                        Circle()
                                            .stroke(Color.white, lineWidth: selectedColor == color ? 3 : 0)
                                    )
                                    .shadow(color: colorValue(color).opacity(0.4),
                                            radius: selectedColor == color ? 4 : 0)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section("Reminder") {
                    Toggle("Daily reminder", isOn: $reminderEnabled)
                    if reminderEnabled {
                        DatePicker("Time", selection: $reminderTime, displayedComponents: .hourAndMinute)
                    }
                }
            }
            .navigationTitle("New Habit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") { saveHabit() }
                        .bold()
                        .disabled(name.isEmpty)
                }
            }
        }
    }

    private func colorValue(_ colorName: String) -> Color {
        switch colorName {
        case "blue": return .blue
        case "green": return .green
        case "purple": return .purple
        case "pink": return .pink
        case "red": return .red
        case "indigo": return .indigo
        default: return .orange
        }
    }

    private func saveHabit() {
        let habit = Habit(
            name: name,
            icon: selectedIcon,
            reminderTime: reminderEnabled ? reminderTime : nil,
            reminderEnabled: reminderEnabled,
            completions: [],
            color: selectedColor
        )
        store.addHabit(habit)
        if reminderEnabled {
            NotificationService.shared.scheduleHabitReminder(for: habit)
        }
        dismiss()
    }
}
