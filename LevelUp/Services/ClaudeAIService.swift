import Foundation
import Combine

struct ClaudeMessage: Codable {
    let role: String
    let content: String
}

struct ClaudeRequest: Codable {
    let model: String
    let maxTokens: Int
    let system: String
    let messages: [ClaudeMessage]

    enum CodingKeys: String, CodingKey {
        case model
        case maxTokens = "max_tokens"
        case system
        case messages
    }
}

struct ClaudeResponse: Codable {
    struct Content: Codable {
        let type: String
        let text: String
    }
    let content: [Content]
}

class ClaudeAIService: ObservableObject {
    static let shared = ClaudeAIService()

    // Replace with your Anthropic API key
    private let apiKey = "YOUR_ANTHROPIC_API_KEY"
    private let apiURL = "https://api.anthropic.com/v1/messages"
    private let model = "claude-sonnet-4-6"

    @Published var isLoading = false
    @Published var coachMessages: [CoachMessage] = []

    private var cancellables = Set<AnyCancellable>()
    private init() {
        loadMessages()
    }

    private let messagesKey = "coach_messages_v1"

    private func loadMessages() {
        if let data = UserDefaults.standard.data(forKey: messagesKey),
           let messages = try? JSONDecoder().decode([CoachMessage].self, from: data) {
            coachMessages = messages
        }
    }

    private func saveMessages() {
        if let data = try? JSONEncoder().encode(coachMessages) {
            UserDefaults.standard.set(data, forKey: messagesKey)
        }
    }

    func sendMessage(_ userMessage: String, context: UserContext, completion: @escaping (String) -> Void) {
        isLoading = true

        let systemPrompt = buildSystemPrompt(context: context)
        let request = ClaudeRequest(
            model: model,
            maxTokens: 1024,
            system: systemPrompt,
            messages: [ClaudeMessage(role: "user", content: userMessage)]
        )

        guard let url = URL(string: apiURL),
              let body = try? JSONEncoder().encode(request) else {
            isLoading = false
            completion("I'm having trouble connecting right now. Keep pushing.")
            return
        }

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.addValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.addValue(apiKey, forHTTPHeaderField: "x-api-key")
        urlRequest.addValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        urlRequest.httpBody = body

        URLSession.shared.dataTaskPublisher(for: urlRequest)
            .map(\.data)
            .decode(type: ClaudeResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completionResult in
                self?.isLoading = false
                if case .failure = completionResult {
                    completion("Can't reach the coach right now. Keep working anyway.")
                }
            } receiveValue: { [weak self] response in
                let text = response.content.first?.text ?? "Keep pushing. No excuses."
                let coachMsg = CoachMessage(role: .coach, content: text)
                self?.coachMessages.append(CoachMessage(role: .user, content: userMessage))
                self?.coachMessages.append(coachMsg)
                self?.saveMessages()
                completion(text)
            }
            .store(in: &cancellables)
    }

    func sendDailyCheckin(context: UserContext, completion: @escaping (String) -> Void) {
        let checkinPrompt = buildDailyCheckinPrompt(context: context)
        sendMessage(checkinPrompt, context: context, completion: completion)
    }

    func generateWeeklyCoachMessage(report: WeeklyReportData, context: UserContext, completion: @escaping (String) -> Void) {
        let prompt = """
        Weekly report data:
        - Workouts: \(report.workoutsCompleted) sessions
        - Avg daily calories: \(Int(report.avgDailyCalories)) kcal
        - Weight change: \(String(format: "%+.1f", report.weightChange)) lbs
        - Habits: \(report.habitsHit)/\(report.habitsTotal) completed (\(Int(report.habitCompletionRate * 100))%)

        Give me a direct, honest weekly review. What did I do well? What do I need to fix next week? Be specific to my actual numbers.
        """
        sendMessage(prompt, context: context, completion: completion)
    }

    private func buildSystemPrompt(context: UserContext) -> String {
        """
        You are the user's personal AI life coach inside the LevelUp app. You have access to their real data.

        Current user stats:
        - Weight: \(String(format: "%.1f", context.currentWeight)) lbs (goal: \(String(format: "%.0f", context.goalWeight)) lbs)
        - Today's calories: \(Int(context.todayCalories)) / \(Int(context.dailyCalorieGoal)) kcal
        - Workouts this week: \(context.weeklyWorkouts)
        - Active habits: \(context.habitNames.joined(separator: ", "))
        - Habit completion rate: \(Int(context.habitCompletionRate * 100))%

        Your coaching style:
        - Direct, motivating, and real — no generic fluff
        - Call out when they're slipping, celebrate when they're winning
        - Give SPECIFIC, actionable advice tied to their actual data
        - Short and punchy responses — max 3-4 sentences
        - Talk like a trusted coach who knows them well
        - Never be preachy or generic
        """
    }

    private func buildDailyCheckinPrompt(context: UserContext) -> String {
        let hour = Calendar.current.component(.hour, from: Date())
        let timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"

        return """
        Good \(timeOfDay) check-in. Here's where I'm at today:
        - Calories so far: \(Int(context.todayCalories)) / \(Int(context.dailyCalorieGoal))
        - Workouts this week: \(context.weeklyWorkouts)
        - Weight: \(String(format: "%.1f", context.currentWeight)) lbs

        Give me a quick, direct daily check-in. One win, one thing to focus on today.
        """
    }
}

struct UserContext {
    var currentWeight: Double
    var goalWeight: Double
    var todayCalories: Double
    var dailyCalorieGoal: Double
    var weeklyWorkouts: Int
    var habitNames: [String]
    var habitCompletionRate: Double

    static func from(_ store: DataStore) -> UserContext {
        UserContext(
            currentWeight: store.weightTrend().currentWeight,
            goalWeight: store.goalWeight,
            todayCalories: store.todayCalories(),
            dailyCalorieGoal: store.dailyCalorieGoal,
            weeklyWorkouts: store.weeklyWorkoutCount(),
            habitNames: store.habits.map { $0.name },
            habitCompletionRate: store.habits.isEmpty ? 0 : store.habits.map { $0.weeklyCompletionRate }.reduce(0, +) / Double(store.habits.count)
        )
    }
}

struct CoachMessage: Identifiable, Codable {
    var id: UUID = UUID()
    var role: MessageRole
    var content: String
    var timestamp: Date = Date()

    enum MessageRole: String, Codable {
        case user, coach
    }
}
