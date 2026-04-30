import SwiftUI
import Charts

struct WeightTrackerView: View {
    @EnvironmentObject var store: DataStore
    @State private var showLogWeight = false
    @State private var showMilestoneCard = false
    @State private var milestoneValue: Double = 0

    var trend: WeightTrend { store.weightTrend() }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    currentWeightCard
                    progressChartCard
                    statsRow
                    projectionCard
                    if showMilestoneCard {
                        MilestoneCard(
                            title: "Milestone Hit! 🎉",
                            subtitle: "You hit \(String(format: "%.0f", milestoneValue)) lbs — \(String(format: "%.0f", store.startWeight - milestoneValue)) lbs down!",
                            emoji: "🏆"
                        )
                        .padding(.horizontal)
                        .transition(.scale.combined(with: .opacity))
                    }
                    weightLogSection
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 32)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Weight")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showLogWeight = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 22))
                    }
                }
            }
            .sheet(isPresented: $showLogWeight) {
                LogWeightView { weight in
                    checkMilestone(newWeight: weight)
                }
                .environmentObject(store)
            }
        }
    }

    private var currentWeightCard: some View {
        HStack(spacing: 20) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Current Weight")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)
                    .tracking(0.5)
                Text(String(format: "%.1f", trend.currentWeight))
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                Text("lbs")
                    .font(.title3)
                    .foregroundColor(.secondary)

                HStack(spacing: 8) {
                    Label(String(format: "%.1f lbs lost", trend.totalLost), systemImage: "arrow.down.circle.fill")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.blue)
                }
            }

            Spacer()

            ProgressRingView(
                progress: trend.progressPercentage,
                lineWidth: 10,
                color: .blue,
                size: 90,
                showLabel: true,
                label: "to goal"
            )
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(20)
        .shadow(color: .blue.opacity(0.08), radius: 10, x: 0, y: 4)
    }

    private var progressChartCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Progress Chart")

            if store.weightEntries.count < 2 {
                VStack(spacing: 8) {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.system(size: 36))
                        .foregroundColor(.secondary.opacity(0.4))
                    Text("Log at least 2 weights to see your trend")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(30)
            } else {
                WeightChart(entries: store.weightEntries, goalWeight: store.goalWeight)
            }
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 2)
    }

    private var statsRow: some View {
        HStack(spacing: 12) {
            StatCardView(
                title: "Weekly Rate",
                value: trend.weeklyRate > 0 ? String(format: "%.1f lbs", trend.weeklyRate) : "--",
                subtitle: "per week",
                icon: "arrow.down.right",
                color: .blue
            )
            StatCardView(
                title: "Remaining",
                value: String(format: "%.1f lbs", trend.remaining),
                subtitle: "to goal",
                icon: "target",
                color: .orange
            )
        }
    }

    private var projectionCard: some View {
        HStack(spacing: 16) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 28))
                .foregroundColor(.blue)

            VStack(alignment: .leading, spacing: 4) {
                Text("Projected Goal Date")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                if let goalDate = trend.projectedGoalDate {
                    Text(goalDate.formatted(date: .long, time: .omitted))
                        .font(.system(size: 17, weight: .bold))
                    if let days = trend.projectedDaysToGoal {
                        Text("\(days) days from now at current pace")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                } else {
                    Text("Log more weights to project")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            Spacer()
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }

    private var weightLogSection: some View {
        VStack(spacing: 12) {
            SectionHeader(title: "Weight Log")

            if store.weightEntries.isEmpty {
                Text("No weight logged yet. Tap + to add today's weight.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(20)
                    .frame(maxWidth: .infinity)
                    .background(Color(.systemBackground))
                    .cornerRadius(14)
            } else {
                ForEach(store.weightEntries.sorted { $0.date > $1.date }.prefix(14)) { entry in
                    HStack {
                        Text(entry.date.formatted(date: .abbreviated, time: .omitted))
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(String(format: "%.1f lbs", entry.weight))
                            .font(.system(size: 16, weight: .semibold, design: .rounded))
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(Color(.systemBackground))
                    .cornerRadius(10)
                }
            }
        }
    }

    private func checkMilestone(newWeight: Double) {
        let milestones = stride(from: store.startWeight - 5, through: store.goalWeight, by: -5)
        for milestone in milestones {
            if newWeight <= milestone && (trend.currentWeight > milestone) {
                withAnimation(.spring()) {
                    milestoneValue = milestone
                    showMilestoneCard = true
                }
                NotificationService.shared.scheduleMilestoneNotification(
                    title: "Milestone Reached! 🏆",
                    subtitle: "You hit \(Int(milestone)) lbs — keep going!"
                )
                break
            }
        }
    }
}

struct WeightChart: View {
    let entries: [WeightEntry]
    let goalWeight: Double

    var sortedEntries: [WeightEntry] {
        entries.sorted { $0.date < $1.date }.suffix(30).map { $0 }
    }

    var minWeight: Double {
        (sortedEntries.map { $0.weight }.min() ?? goalWeight) - 2
    }

    var maxWeight: Double {
        (sortedEntries.map { $0.weight }.max() ?? 180) + 2
    }

    var body: some View {
        Chart {
            ForEach(sortedEntries) { entry in
                LineMark(
                    x: .value("Date", entry.date),
                    y: .value("Weight", entry.weight)
                )
                .foregroundStyle(Color.blue)
                .interpolationMethod(.catmullRom)

                AreaMark(
                    x: .value("Date", entry.date),
                    yStart: .value("Min", minWeight),
                    yEnd: .value("Weight", entry.weight)
                )
                .foregroundStyle(LinearGradient(
                    colors: [.blue.opacity(0.2), .blue.opacity(0.02)],
                    startPoint: .top,
                    endPoint: .bottom
                ))
                .interpolationMethod(.catmullRom)

                PointMark(
                    x: .value("Date", entry.date),
                    y: .value("Weight", entry.weight)
                )
                .foregroundStyle(Color.blue)
                .symbolSize(40)
            }

            RuleMark(y: .value("Goal", goalWeight))
                .foregroundStyle(Color.orange.opacity(0.7))
                .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [6, 3]))
                .annotation(position: .trailing) {
                    Text("Goal")
                        .font(.caption2.bold())
                        .foregroundColor(.orange)
                }
        }
        .chartYScale(domain: minWeight...maxWeight)
        .chartXAxis {
            AxisMarks(values: .stride(by: .day, count: 7)) { value in
                AxisGridLine()
                AxisValueLabel(format: .dateTime.month().day())
            }
        }
        .frame(height: 200)
    }
}

struct LogWeightView: View {
    @EnvironmentObject var store: DataStore
    @Environment(\.dismiss) var dismiss
    var onSave: (Double) -> Void

    @State private var weightText = ""
    @State private var notes = ""
    @State private var date = Date()

    var body: some View {
        NavigationView {
            Form {
                Section("Today's Weight") {
                    HStack {
                        TextField("e.g. 178.5", text: $weightText)
                            .keyboardType(.decimalPad)
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                        Text("lbs")
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                }
                Section("Notes (optional)") {
                    TextField("How are you feeling?", text: $notes)
                }
                if let current = store.weightEntries.first {
                    if let newWeight = Double(weightText) {
                        let diff = newWeight - current.weight
                        Section {
                            HStack {
                                Text("Change from last entry")
                                Spacer()
                                Text(String(format: "%+.1f lbs", diff))
                                    .fontWeight(.semibold)
                                    .foregroundColor(diff < 0 ? .green : diff > 0 ? .red : .secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Log Weight")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        if let w = Double(weightText) {
                            let entry = WeightEntry(weight: w, date: date, notes: notes)
                            store.addWeightEntry(entry)
                            onSave(w)
                            dismiss()
                        }
                    }
                    .bold()
                    .disabled(Double(weightText) == nil)
                }
            }
        }
    }
}
