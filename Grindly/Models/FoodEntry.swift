import Foundation

struct NutritionixFood: Codable, Identifiable {
    var id: String { foodName + brandName }
    var foodName: String
    var brandName: String
    var servingQty: Double
    var servingUnit: String
    var nfCalories: Double
    var nfTotalFat: Double?
    var nfTotalCarbohydrate: Double?
    var nfProtein: Double?
    var photo: NutritionixPhoto?

    enum CodingKeys: String, CodingKey {
        case foodName = "food_name"
        case brandName = "brand_name"
        case servingQty = "serving_qty"
        case servingUnit = "serving_unit"
        case nfCalories = "nf_calories"
        case nfTotalFat = "nf_total_fat"
        case nfTotalCarbohydrate = "nf_total_carbohydrate"
        case nfProtein = "nf_protein"
        case photo
    }
}

struct NutritionixPhoto: Codable {
    var thumb: String?
}

struct NutritionixSearchResponse: Codable {
    var common: [NutritionixFood]
    var branded: [NutritionixFood]
}

struct NutritionixNutrientsResponse: Codable {
    var foods: [NutritionixFood]
}

enum MealType: String, Codable, CaseIterable {
    case breakfast = "Breakfast"
    case lunch = "Lunch"
    case dinner = "Dinner"
    case snacks = "Snacks"

    var icon: String {
        switch self {
        case .breakfast: return "sunrise.fill"
        case .lunch: return "sun.max.fill"
        case .dinner: return "moon.stars.fill"
        case .snacks: return "leaf.fill"
        }
    }
}

struct FoodEntry: Identifiable, Codable {
    var id: UUID = UUID()
    var foodName: String
    var brandName: String
    var calories: Double
    var protein: Double
    var carbs: Double
    var fat: Double
    var servingQty: Double
    var servingUnit: String
    var mealType: MealType
    var loggedAt: Date = Date()

    var dateKey: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: loggedAt)
    }
}

struct DailyNutrition {
    var date: Date
    var entries: [FoodEntry]

    var totalCalories: Double {
        entries.reduce(0) { $0 + $1.calories }
    }

    var totalProtein: Double {
        entries.reduce(0) { $0 + $1.protein }
    }

    var totalCarbs: Double {
        entries.reduce(0) { $0 + $1.carbs }
    }

    var totalFat: Double {
        entries.reduce(0) { $0 + $1.fat }
    }

    func entries(for meal: MealType) -> [FoodEntry] {
        entries.filter { $0.mealType == meal }
    }
}
