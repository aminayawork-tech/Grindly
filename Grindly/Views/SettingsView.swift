import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var store: DataStore
    @State private var calorieGoalText = ""
    @State private var startWeightText = ""
    @State private var goalWeightText = ""
    @State private var anthropicKey = ""
    @State private var nutritionixID = ""
    @State private var nutritionixKey = ""
    @State private var showSavedAlert = false

    var body: some View {
        Form {
            Section("Calorie Goal") {
                HStack {
                    TextField("Daily calorie goal", text: $calorieGoalText)
                        .keyboardType(.numberPad)
                    Text("kcal/day")
                        .foregroundColor(.secondary)
                }
            }

            Section("Weight Goals") {
                HStack {
                    TextField("Starting weight", text: $startWeightText)
                        .keyboardType(.decimalPad)
                    Text("lbs (start)")
                        .foregroundColor(.secondary)
                }
                HStack {
                    TextField("Goal weight", text: $goalWeightText)
                        .keyboardType(.decimalPad)
                    Text("lbs (goal)")
                        .foregroundColor(.secondary)
                }
            }

            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("API Keys")
                        .font(.headline)
                    Text("Add your API keys to enable AI coaching and food search. Keys are stored locally on device only.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                SecureField("Anthropic API Key (Claude AI Coach)", text: $anthropicKey)
                    .font(.system(.body, design: .monospaced))
                TextField("Nutritionix App ID", text: $nutritionixID)
                    .font(.system(.body, design: .monospaced))
                SecureField("Nutritionix App Key", text: $nutritionixKey)
                    .font(.system(.body, design: .monospaced))
            } header: {
                Text("API Configuration")
            } footer: {
                VStack(alignment: .leading, spacing: 4) {
                    Text("• Claude AI: anthropic.com → Get API Key")
                    Text("• Nutritionix: developer.nutritionix.com → Free tier available")
                }
                .font(.caption)
            }

            Section {
                Button("Save Settings") { saveSettings() }
                    .frame(maxWidth: .infinity)
                    .foregroundColor(.blue)
                    .fontWeight(.semibold)
            }

            Section("About") {
                HStack {
                    Text("Version")
                    Spacer()
                    Text("1.0.0")
                        .foregroundColor(.secondary)
                }
                HStack {
                    Text("Platform")
                    Spacer()
                    Text("iOS 16+")
                        .foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.large)
        .alert("Settings Saved", isPresented: $showSavedAlert) {
            Button("OK", role: .cancel) {}
        }
        .onAppear {
            calorieGoalText = "\(Int(store.dailyCalorieGoal))"
            startWeightText = "\(store.startWeight)"
            goalWeightText = "\(store.goalWeight)"
            anthropicKey = UserDefaults.standard.string(forKey: "anthropic_api_key") ?? ""
            nutritionixID = UserDefaults.standard.string(forKey: "nutritionix_app_id") ?? ""
            nutritionixKey = UserDefaults.standard.string(forKey: "nutritionix_app_key") ?? ""
        }
    }

    private func saveSettings() {
        if let val = Double(calorieGoalText), val > 0 {
            store.dailyCalorieGoal = val
        }
        if let val = Double(startWeightText), val > 0 {
            store.startWeight = val
        }
        if let val = Double(goalWeightText), val > 0 {
            store.goalWeight = val
        }
        store.save()

        if !anthropicKey.isEmpty {
            UserDefaults.standard.set(anthropicKey, forKey: "anthropic_api_key")
        }
        if !nutritionixID.isEmpty {
            UserDefaults.standard.set(nutritionixID, forKey: "nutritionix_app_id")
        }
        if !nutritionixKey.isEmpty {
            UserDefaults.standard.set(nutritionixKey, forKey: "nutritionix_app_key")
        }

        showSavedAlert = true
    }
}
