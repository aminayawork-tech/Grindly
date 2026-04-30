import SwiftUI

struct CalorieTrackerView: View {
    @EnvironmentObject var store: DataStore
    @StateObject private var nutritionix = NutritionixService.shared
    @State private var showFoodSearch = false
    @State private var selectedMeal: MealType = .breakfast
    @State private var showGoalEditor = false

    var todayEntries: [FoodEntry] { store.todayFoodEntries() }
    var todayCalories: Double { store.todayCalories() }
    var sevenDayAvg: Double { store.sevenDayCalorieAverage() }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    calorieProgressSection
                    sevenDayAverageCard
                    mealSections
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 32)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Calories")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showFoodSearch = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 22))
                    }
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Goal: \(Int(store.dailyCalorieGoal))") {
                        showGoalEditor = true
                    }
                    .font(.system(size: 14, weight: .semibold))
                }
            }
            .sheet(isPresented: $showFoodSearch) {
                FoodSearchView(preselectedMeal: selectedMeal)
                    .environmentObject(store)
            }
            .sheet(isPresented: $showGoalEditor) {
                CalorieGoalEditorView()
                    .environmentObject(store)
            }
        }
    }

    private var calorieProgressSection: some View {
        VStack(spacing: 16) {
            CalorieProgressBar(consumed: todayCalories, goal: store.dailyCalorieGoal)

            HStack(spacing: 12) {
                macroChip(label: "Protein", value: todayMacro(.protein), color: .blue, unit: "g")
                macroChip(label: "Carbs", value: todayMacro(.carbs), color: .orange, unit: "g")
                macroChip(label: "Fat", value: todayMacro(.fat), color: .yellow, unit: "g")
            }
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }

    private func macroChip(label: String, value: Double, color: Color, unit: String) -> some View {
        VStack(spacing: 4) {
            Text("\(Int(value))\(unit)")
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundColor(color)
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(color.opacity(0.08))
        .cornerRadius(12)
    }

    enum MacroType { case protein, carbs, fat }

    private func todayMacro(_ macro: MacroType) -> Double {
        todayEntries.reduce(0) { sum, entry in
            switch macro {
            case .protein: return sum + entry.protein
            case .carbs: return sum + entry.carbs
            case .fat: return sum + entry.fat
            }
        }
    }

    private var sevenDayAverageCard: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text("7-Day Average")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)
                    .tracking(0.5)
                Text("\(Int(sevenDayAvg)) kcal/day")
                    .font(.system(size: 22, weight: .bold, design: .rounded))

                let diff = sevenDayAvg - store.dailyCalorieGoal
                Text(diff > 0 ? "\(Int(abs(diff))) over goal avg" : "\(Int(abs(diff))) under goal avg")
                    .font(.caption)
                    .foregroundColor(diff > 0 ? .red : .green)
            }

            Spacer()

            ZStack {
                Circle()
                    .fill(Color.green.opacity(0.1))
                    .frame(width: 60, height: 60)
                Image(systemName: "chart.bar.fill")
                    .font(.system(size: 26))
                    .foregroundColor(.green)
            }
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }

    private var mealSections: some View {
        VStack(spacing: 12) {
            ForEach(MealType.allCases, id: \.self) { meal in
                MealSectionView(
                    meal: meal,
                    entries: todayEntries.filter { $0.mealType == meal },
                    onAdd: {
                        selectedMeal = meal
                        showFoodSearch = true
                    },
                    onDelete: { entry in
                        store.removeFoodEntry(id: entry.id)
                    }
                )
            }
        }
    }
}

struct MealSectionView: View {
    let meal: MealType
    let entries: [FoodEntry]
    let onAdd: () -> Void
    let onDelete: (FoodEntry) -> Void

    @State private var isExpanded = true

    var mealCalories: Double { entries.reduce(0) { $0 + $1.calories } }

    var body: some View {
        VStack(spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) { isExpanded.toggle() }
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: meal.icon)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.accentColor)
                        .frame(width: 24)

                    Text(meal.rawValue)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.primary)

                    Spacer()

                    Text("\(Int(mealCalories)) kcal")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.secondary)

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                }
                .padding(16)
                .background(Color(.systemBackground))
            }
            .buttonStyle(.plain)

            if isExpanded {
                VStack(spacing: 0) {
                    if entries.isEmpty {
                        Button(action: onAdd) {
                            HStack {
                                Image(systemName: "plus.circle")
                                    .foregroundColor(.accentColor)
                                Text("Add food")
                                    .font(.subheadline)
                                    .foregroundColor(.accentColor)
                                Spacer()
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                        }
                        .background(Color(.systemBackground))
                    } else {
                        ForEach(entries) { entry in
                            Divider()
                                .padding(.leading, 16)
                            FoodEntryRow(entry: entry, onDelete: { onDelete(entry) })
                        }
                        Divider()
                            .padding(.leading, 16)
                        Button(action: onAdd) {
                            HStack {
                                Image(systemName: "plus.circle")
                                    .foregroundColor(.accentColor)
                                Text("Add more")
                                    .font(.subheadline)
                                    .foregroundColor(.accentColor)
                                Spacer()
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                        }
                        .background(Color(.systemBackground))
                    }
                }
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }
}

struct FoodEntryRow: View {
    let entry: FoodEntry
    let onDelete: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.foodName)
                    .font(.system(size: 14, weight: .medium))
                Text("\(entry.servingQty, specifier: "%.0f") \(entry.servingUnit)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            Text("\(Int(entry.calories))")
                .font(.system(size: 15, weight: .semibold, design: .rounded))
            Text("kcal")
                .font(.caption)
                .foregroundColor(.secondary)
            Button(action: onDelete) {
                Image(systemName: "trash")
                    .font(.system(size: 12))
                    .foregroundColor(.red.opacity(0.7))
                    .padding(6)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color(.systemBackground))
    }
}

struct CalorieGoalEditorView: View {
    @EnvironmentObject var store: DataStore
    @Environment(\.dismiss) var dismiss
    @State private var goalText = ""

    var body: some View {
        NavigationView {
            Form {
                Section("Daily Calorie Goal") {
                    HStack {
                        TextField("e.g. 2200", text: $goalText)
                            .keyboardType(.numberPad)
                        Text("kcal")
                            .foregroundColor(.secondary)
                    }
                }
                Section {
                    Text("Typical targets:\n• Weight loss: 1,800–2,000 kcal\n• Maintenance: 2,200–2,400 kcal\n• Building muscle: 2,500–3,000 kcal")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("Calorie Goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        if let val = Double(goalText), val > 0 {
                            store.dailyCalorieGoal = val
                            store.save()
                        }
                        dismiss()
                    }.bold()
                }
            }
            .onAppear { goalText = "\(Int(store.dailyCalorieGoal))" }
        }
    }
}
