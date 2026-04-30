import Foundation
import UserNotifications

class NotificationService {
    static let shared = NotificationService()
    private init() {}

    func requestAuthorization(completion: @escaping (Bool) -> Void) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            DispatchQueue.main.async { completion(granted) }
        }
    }

    func scheduleHabitReminder(for habit: Habit) {
        guard habit.reminderEnabled, let reminderTime = habit.reminderTime else { return }

        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["habit-\(habit.id)"])

        let content = UNMutableNotificationContent()
        content.title = "Time for: \(habit.name)"
        content.body = habitReminderBody(habit)
        content.sound = .default

        let components = Calendar.current.dateComponents([.hour, .minute], from: reminderTime)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(identifier: "habit-\(habit.id)", content: content, trigger: trigger)

        center.add(request)
    }

    func removeHabitReminder(for habit: Habit) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["habit-\(habit.id)"])
    }

    func scheduleAllHabitReminders(habits: [Habit]) {
        for habit in habits where habit.reminderEnabled {
            scheduleHabitReminder(for: habit)
        }
    }

    func scheduleDailyCheckin() {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["daily-checkin"])

        let content = UNMutableNotificationContent()
        content.title = "Daily Check-In"
        content.body = "Your AI coach is ready. How are you performing today?"
        content.sound = .default

        var components = DateComponents()
        components.hour = 8
        components.minute = 0
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(identifier: "daily-checkin", content: content, trigger: trigger)
        center.add(request)
    }

    func scheduleWeeklyReport() {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["weekly-report"])

        let content = UNMutableNotificationContent()
        content.title = "Weekly Report Ready"
        content.body = "Your week in review — wins, misses, and what's next."
        content.sound = .default

        var components = DateComponents()
        components.weekday = 1
        components.hour = 9
        components.minute = 0
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(identifier: "weekly-report", content: content, trigger: trigger)
        center.add(request)
    }

    func scheduleMilestoneNotification(title: String, body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = UNNotificationSound(named: UNNotificationSoundName("milestone.caf"))

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }

    private func habitReminderBody(_ habit: Habit) -> String {
        let streak = habit.currentStreak
        if streak > 0 {
            return "Keep your \(streak)-day streak alive. Don't break the chain."
        }
        return "No streak yet — start one today. Every day counts."
    }
}
