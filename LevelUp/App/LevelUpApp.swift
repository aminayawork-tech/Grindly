import SwiftUI
import UserNotifications

@main
struct LevelUpApp: App {
    @StateObject private var store = DataStore.shared

    init() {
        configureAppearance()
        setupNotifications()
    }

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(store)
        }
    }

    private func configureAppearance() {
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = .systemBackground
        navAppearance.shadowColor = .clear
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance

        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = .systemBackground
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
    }

    private func setupNotifications() {
        NotificationService.shared.requestAuthorization { granted in
            guard granted else { return }
            NotificationService.shared.scheduleDailyCheckin()
            NotificationService.shared.scheduleWeeklyReport()
            NotificationService.shared.scheduleAllHabitReminders(habits: DataStore.shared.habits)
        }
    }
}
