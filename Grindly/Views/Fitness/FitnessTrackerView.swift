import SwiftUI
import HealthKit

struct FitnessTrackerView: View {
    @EnvironmentObject var store: DataStore
    @StateObject private var healthKit = HealthKitService.shared
    @State private var showLogWorkout = false
    @State private var selectedType: WorkoutType = .pullUps

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    healthRingsSection
                    quickLogSection
                    recentWorkoutsSection
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 32)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Fitness")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showLogWorkout = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 22))
                    }
                }
            }
            .sheet(isPresented: $showLogWorkout) {
                LogWorkoutView(preselectedType: selectedType)
                    .environmentObject(store)
            }
            .onAppear {
                healthKit.requestAuthorization()
            }
        }
    }

    private var healthRingsSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Today's Activity")
                    .font(.system(size: 18, weight: .bold))
                Spacer()
                if !healthKit.isAuthorized {
                    Button("Connect HealthKit") {
                        healthKit.requestAuthorization()
                    }
                    .font(.caption.bold())
                    .foregroundColor(.orange)
                }
            }

            HStack(spacing: 16) {
                StatCardView(
                    title: "Active Cals",
                    value: "\(Int(healthKit.todayActiveCalories))",
                    subtitle: "kcal burned",
                    icon: "flame.fill",
                    color: .red
                )
                StatCardView(
                    title: "Steps",
                    value: "\(Int(healthKit.todaySteps))",
                    subtitle: "today",
                    icon: "figure.walk",
                    color: .green
                )
                StatCardView(
                    title: "Heart Rate",
                    value: healthKit.currentHeartRate > 0 ? "\(Int(healthKit.currentHeartRate))" : "--",
                    subtitle: "bpm",
                    icon: "heart.fill",
                    color: .pink
                )
            }
        }
    }

    private var quickLogSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Quick Log")

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(WorkoutType.allCases.filter { $0 != .custom }, id: \.self) { type in
                        Button {
                            selectedType = type
                            showLogWorkout = true
                        } label: {
                            VStack(spacing: 8) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 14)
                                        .fill(Color.orange.opacity(0.12))
                                        .frame(width: 56, height: 56)
                                    Image(systemName: type.icon)
                                        .font(.system(size: 24, weight: .semibold))
                                        .foregroundColor(.orange)
                                }
                                Text(type.rawValue)
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundColor(.primary)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.vertical, 4)
            }
        }
    }

    private var recentWorkoutsSection: some View {
        VStack(spacing: 12) {
            SectionHeader(title: "Recent Workouts")

            if store.workouts.isEmpty {
                emptyWorkoutsView
            } else {
                ForEach(store.workouts.prefix(10)) { session in
                    WorkoutRowView(session: session)
                }
            }
        }
    }

    private var emptyWorkoutsView: some View {
        VStack(spacing: 12) {
            Image(systemName: "figure.strengthtraining.traditional")
                .font(.system(size: 48))
                .foregroundColor(.secondary.opacity(0.4))
            Text("No workouts logged yet")
                .font(.headline)
                .foregroundColor(.secondary)
            Text("Tap + to log your first session")
                .font(.subheadline)
                .foregroundColor(.secondary.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .background(Color(.systemBackground))
        .cornerRadius(16)
    }
}

struct WorkoutRowView: View {
    let session: WorkoutSession

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.orange.opacity(0.12))
                    .frame(width: 48, height: 48)
                Image(systemName: session.type.icon)
                    .font(.system(size: 22))
                    .foregroundColor(.orange)
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(session.type.rawValue)
                    .font(.system(size: 15, weight: .semibold))
                HStack(spacing: 8) {
                    if session.totalSets > 0 {
                        Text("\(session.totalSets) sets · \(session.totalReps) reps")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    if session.distance > 0 {
                        Text(session.formattedDistance)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    if session.pace > 0 {
                        Text(session.formattedPace)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 3) {
                Text(session.formattedDuration)
                    .font(.system(size: 13, weight: .semibold))
                Text(session.date.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption)
                    .foregroundColor(.secondary)
                if session.activeCalories > 0 {
                    Text("\(Int(session.activeCalories)) kcal")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
        }
        .padding(14)
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }
}

struct LogWorkoutView: View {
    @EnvironmentObject var store: DataStore
    @Environment(\.dismiss) var dismiss
    var preselectedType: WorkoutType

    @State private var workoutType: WorkoutType
    @State private var sets: [WorkoutSet] = []
    @State private var currentReps = ""
    @State private var currentRest = "60"
    @State private var notes = ""
    @State private var startTime = Date()
    @State private var distance = ""
    @State private var pace = ""
    @State private var calories = ""
    @State private var isRunning = false

    init(preselectedType: WorkoutType) {
        self.preselectedType = preselectedType
        _workoutType = State(initialValue: preselectedType)
        _isRunning = State(initialValue: preselectedType == .running)
    }

    var body: some View {
        NavigationView {
            Form {
                Section("Workout Type") {
                    Picker("Type", selection: $workoutType) {
                        ForEach(WorkoutType.allCases, id: \.self) { type in
                            Label(type.rawValue, systemImage: type.icon).tag(type)
                        }
                    }
                    .onChange(of: workoutType) { isRunning = $0 == .running }
                }

                if isRunning {
                    runningFields
                } else {
                    strengthFields
                }

                Section("Notes") {
                    TextField("Optional notes", text: $notes, axis: .vertical)
                        .lineLimit(2...4)
                }
            }
            .navigationTitle("Log Workout")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { saveWorkout() }
                        .bold()
                        .disabled(!canSave)
                }
            }
        }
    }

    private var runningFields: some View {
        Group {
            Section("Running Data") {
                HStack {
                    TextField("Distance", text: $distance)
                        .keyboardType(.decimalPad)
                    Text("miles")
                        .foregroundColor(.secondary)
                }
                HStack {
                    TextField("Avg pace", text: $pace)
                        .keyboardType(.decimalPad)
                    Text("min/mile")
                        .foregroundColor(.secondary)
                }
                HStack {
                    TextField("Calories burned", text: $calories)
                        .keyboardType(.decimalPad)
                    Text("kcal")
                        .foregroundColor(.secondary)
                }
            }
        }
    }

    private var strengthFields: some View {
        Group {
            Section("Sets") {
                HStack {
                    TextField("Reps", text: $currentReps)
                        .keyboardType(.numberPad)
                    Text("reps")
                        .foregroundColor(.secondary)
                    Spacer()
                    TextField("Rest", text: $currentRest)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                    Text("sec rest")
                        .foregroundColor(.secondary)
                }
                Button("+ Add Set") {
                    addSet()
                }
                .disabled(currentReps.isEmpty)

                ForEach(sets.indices, id: \.self) { index in
                    HStack {
                        Text("Set \(index + 1)")
                            .fontWeight(.semibold)
                        Spacer()
                        Text("\(sets[index].reps) reps")
                        Text("·")
                            .foregroundColor(.secondary)
                        Text("\(sets[index].restSeconds)s rest")
                            .foregroundColor(.secondary)
                    }
                }
                .onDelete { store.workouts.removeAll(); sets.remove(atOffsets: $0) }
            }
        }
    }

    private var canSave: Bool {
        if isRunning { return !(distance.isEmpty && calories.isEmpty) }
        return !sets.isEmpty
    }

    private func addSet() {
        guard let reps = Int(currentReps) else { return }
        let rest = Int(currentRest) ?? 60
        sets.append(WorkoutSet(reps: reps, restSeconds: rest))
        currentReps = ""
    }

    private func saveWorkout() {
        let duration = Date().timeIntervalSince(startTime)
        let session = WorkoutSession(
            type: workoutType,
            sets: sets,
            notes: notes,
            duration: duration,
            activeCalories: Double(calories) ?? 0,
            distance: Double(distance) ?? 0,
            pace: Double(pace) ?? 0
        )
        store.addWorkout(session)
        dismiss()
    }
}
