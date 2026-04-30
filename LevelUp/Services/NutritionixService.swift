import Foundation
import Combine

class NutritionixService: ObservableObject {
    static let shared = NutritionixService()

    private let baseURL = "https://trackapi.nutritionix.com/v2"
    // These are Nutritionix API keys — replace with your own from developer.nutritionix.com
    private let appID = "YOUR_NUTRITIONIX_APP_ID"
    private let appKey = "YOUR_NUTRITIONIX_APP_KEY"

    @Published var searchResults: [NutritionixFood] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private var cancellables = Set<AnyCancellable>()
    private init() {}

    func searchFood(query: String) {
        guard !query.trimmingCharacters(in: .whitespaces).isEmpty else {
            searchResults = []
            return
        }

        isLoading = true
        errorMessage = nil

        guard let url = URL(string: "\(baseURL)/search/instant?query=\(query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query)") else { return }

        var request = URLRequest(url: url)
        request.addValue(appID, forHTTPHeaderField: "x-app-id")
        request.addValue(appKey, forHTTPHeaderField: "x-app-key")

        URLSession.shared.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: NutritionixSearchResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                    self?.searchResults = []
                }
            } receiveValue: { [weak self] response in
                self?.searchResults = Array((response.common + response.branded).prefix(20))
            }
            .store(in: &cancellables)
    }

    func getNutrients(for food: NutritionixFood, completion: @escaping (NutritionixFood?) -> Void) {
        guard let url = URL(string: "\(baseURL)/natural/nutrients") else {
            completion(nil)
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue(appID, forHTTPHeaderField: "x-app-id")
        request.addValue(appKey, forHTTPHeaderField: "x-app-key")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = ["query": "\(food.servingQty) \(food.servingUnit) \(food.foodName)"]
        request.httpBody = try? JSONEncoder().encode(body)

        URLSession.shared.dataTask(with: request) { data, _, error in
            DispatchQueue.main.async {
                guard let data = data, error == nil,
                      let response = try? JSONDecoder().decode(NutritionixNutrientsResponse.self, from: data),
                      let first = response.foods.first else {
                    completion(nil)
                    return
                }
                completion(first)
            }
        }.resume()
    }

    func foodEntryFromNutritionix(_ food: NutritionixFood, mealType: MealType) -> FoodEntry {
        FoodEntry(
            foodName: food.foodName.capitalized,
            brandName: food.brandName,
            calories: food.nfCalories,
            protein: food.nfProtein ?? 0,
            carbs: food.nfTotalCarbohydrate ?? 0,
            fat: food.nfTotalFat ?? 0,
            servingQty: food.servingQty,
            servingUnit: food.servingUnit,
            mealType: mealType
        )
    }
}
