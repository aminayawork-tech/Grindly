import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var store: DataStore
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            GoalsDashboardView()
                .tabItem {
                    Label("Goals", systemImage: "target")
                }
                .tag(0)

            FitnessTrackerView()
                .tabItem {
                    Label("Fitness", systemImage: "flame.fill")
                }
                .tag(1)

            CalorieTrackerView()
                .tabItem {
                    Label("Calories", systemImage: "fork.knife")
                }
                .tag(2)

            WeightTrackerView()
                .tabItem {
                    Label("Weight", systemImage: "scalemass.fill")
                }
                .tag(3)

            HabitsView()
                .tabItem {
                    Label("Habits", systemImage: "checkmark.seal.fill")
                }
                .tag(4)

            moreMenu
                .tabItem {
                    Label("More", systemImage: "ellipsis.circle.fill")
                }
                .tag(5)
        }
        .accentColor(.blue)
    }

    private var moreMenu: some View {
        NavigationView {
            List {
                Section {
                    NavigationLink {
                        AICoachView()
                            .environmentObject(store)
                    } label: {
                        Label("AI Coach", systemImage: "brain.head.profile")
                    }

                    NavigationLink {
                        WeeklyReportView()
                            .environmentObject(store)
                    } label: {
                        Label("Weekly Report", systemImage: "chart.bar.doc.horizontal")
                    }
                } header: {
                    Text("Tools")
                }

                Section {
                    NavigationLink {
                        SettingsView()
                            .environmentObject(store)
                    } label: {
                        Label("Settings", systemImage: "gearshape.fill")
                    }
                } header: {
                    Text("App")
                }
            }
            .navigationTitle("More")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}
