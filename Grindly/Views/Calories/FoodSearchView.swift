import SwiftUI

struct FoodSearchView: View {
    @EnvironmentObject var store: DataStore
    @StateObject private var nutritionix = NutritionixService.shared
    @Environment(\.dismiss) var dismiss

    var preselectedMeal: MealType
    @State private var searchText = ""
    @State private var selectedMeal: MealType
    @State private var showingConfirmation = false
    @State private var pendingFood: NutritionixFood? = nil
    @FocusState private var isSearchFocused: Bool

    init(preselectedMeal: MealType) {
        self.preselectedMeal = preselectedMeal
        _selectedMeal = State(initialValue: preselectedMeal)
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                mealPicker
                searchBar
                resultsList
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Add Food")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private var mealPicker: some View {
        Picker("Meal", selection: $selectedMeal) {
            ForEach(MealType.allCases, id: \.self) { meal in
                Text(meal.rawValue).tag(meal)
            }
        }
        .pickerStyle(.segmented)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
    }

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
            TextField("Search any food (e.g. chicken breast)", text: $searchText)
                .focused($isSearchFocused)
                .onSubmit { nutritionix.searchFood(query: searchText) }
                .onChange(of: searchText) { newValue in
                    if newValue.count >= 2 {
                        nutritionix.searchFood(query: newValue)
                    }
                }
            if !searchText.isEmpty {
                Button { searchText = ""; nutritionix.searchResults = [] } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .onAppear { isSearchFocused = true }
    }

    @ViewBuilder
    private var resultsList: some View {
        if nutritionix.isLoading {
            Spacer()
            ProgressView("Searching...")
            Spacer()
        } else if !nutritionix.searchResults.isEmpty {
            List(nutritionix.searchResults) { food in
                Button {
                    addFood(food)
                } label: {
                    FoodResultRow(food: food)
                }
                .buttonStyle(.plain)
            }
            .listStyle(.plain)
        } else if !searchText.isEmpty {
            Spacer()
            VStack(spacing: 8) {
                Image(systemName: "fork.knife")
                    .font(.system(size: 40))
                    .foregroundColor(.secondary.opacity(0.4))
                Text("No results for \"\(searchText)\"")
                    .font(.headline)
                    .foregroundColor(.secondary)
                Text("Try a different food name")
                    .font(.subheadline)
                    .foregroundColor(.secondary.opacity(0.7))
            }
            Spacer()
        } else {
            Spacer()
            VStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 40))
                    .foregroundColor(.secondary.opacity(0.3))
                Text("Search any food")
                    .font(.headline)
                    .foregroundColor(.secondary)
                Text("Type at least 2 characters to search")
                    .font(.subheadline)
                    .foregroundColor(.secondary.opacity(0.7))
            }
            Spacer()
        }
    }

    private func addFood(_ food: NutritionixFood) {
        let entry = nutritionix.foodEntryFromNutritionix(food, mealType: selectedMeal)
        store.addFoodEntry(entry)

        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)

        searchText = ""
        nutritionix.searchResults = []
        isSearchFocused = true
    }
}

struct FoodResultRow: View {
    let food: NutritionixFood

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.green.opacity(0.1))
                    .frame(width: 44, height: 44)
                Image(systemName: "leaf.fill")
                    .font(.system(size: 18))
                    .foregroundColor(.green)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(food.foodName.capitalized)
                    .font(.system(size: 15, weight: .semibold))
                    .lineLimit(1)
                HStack(spacing: 4) {
                    Text("\(food.servingQty, specifier: "%.0f") \(food.servingUnit)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    if !food.brandName.isEmpty {
                        Text("·")
                            .foregroundColor(.secondary)
                        Text(food.brandName)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("\(Int(food.nfCalories))")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundColor(.primary)
                Text("kcal")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }
}
