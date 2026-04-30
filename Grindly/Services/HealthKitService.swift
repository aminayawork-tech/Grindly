import Foundation
import HealthKit
import Combine

class HealthKitService: ObservableObject {
    static let shared = HealthKitService()
    let healthStore = HKHealthStore()

    @Published var isAuthorized = false
    @Published var todayActiveCalories: Double = 0
    @Published var todaySteps: Double = 0
    @Published var currentHeartRate: Double = 0
    @Published var recentWorkouts: [HKWorkout] = []

    private let typesToRead: Set<HKObjectType> = {
        var types: Set<HKObjectType> = []
        let quantityTypes: [HKQuantityTypeIdentifier] = [
            .activeEnergyBurned,
            .stepCount,
            .heartRate,
            .distanceWalkingRunning,
            .distanceCycling
        ]
        for id in quantityTypes {
            if let t = HKQuantityType.quantityType(forIdentifier: id) {
                types.insert(t)
            }
        }
        if let workoutType = HKObjectType.workoutType() as? HKObjectType {
            types.insert(workoutType)
        }
        return types
    }()

    private init() {}

    func requestAuthorization() {
        guard HKHealthStore.isHealthDataAvailable() else {
            isAuthorized = false
            return
        }
        healthStore.requestAuthorization(toShare: [], read: typesToRead) { [weak self] success, _ in
            DispatchQueue.main.async {
                self?.isAuthorized = success
                if success {
                    self?.fetchTodayData()
                }
            }
        }
    }

    func fetchTodayData() {
        fetchTodayActiveCalories()
        fetchTodaySteps()
        fetchCurrentHeartRate()
        fetchRecentWorkouts()
    }

    private func fetchTodayActiveCalories() {
        guard let type = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else { return }
        let start = Calendar.current.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: start, end: Date())
        let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { [weak self] _, stats, _ in
            DispatchQueue.main.async {
                self?.todayActiveCalories = stats?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
            }
        }
        healthStore.execute(query)
    }

    private func fetchTodaySteps() {
        guard let type = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return }
        let start = Calendar.current.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: start, end: Date())
        let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { [weak self] _, stats, _ in
            DispatchQueue.main.async {
                self?.todaySteps = stats?.sumQuantity()?.doubleValue(for: HKUnit.count()) ?? 0
            }
        }
        healthStore.execute(query)
    }

    private func fetchCurrentHeartRate() {
        guard let type = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let query = HKSampleQuery(sampleType: type, predicate: nil, limit: 1, sortDescriptors: [sort]) { [weak self] _, samples, _ in
            DispatchQueue.main.async {
                if let sample = samples?.first as? HKQuantitySample {
                    self?.currentHeartRate = sample.quantity.doubleValue(for: HKUnit(from: "count/min"))
                }
            }
        }
        healthStore.execute(query)
    }

    func fetchRecentWorkouts() {
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let query = HKSampleQuery(sampleType: .workoutType(), predicate: nil, limit: 10, sortDescriptors: [sort]) { [weak self] _, samples, _ in
            DispatchQueue.main.async {
                self?.recentWorkouts = samples as? [HKWorkout] ?? []
            }
        }
        healthStore.execute(query)
    }

    func workoutSessionFromHKWorkout(_ workout: HKWorkout) -> WorkoutSession {
        let type: WorkoutType
        switch workout.workoutActivityType {
        case .running: type = .running
        default: type = .custom
        }

        let distance = workout.totalDistance?.doubleValue(for: HKUnit.mile()) ?? 0
        let calories = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
        let duration = workout.duration
        let pace = distance > 0 ? (duration / 60) / distance : 0

        return WorkoutSession(
            type: type,
            date: workout.startDate,
            sets: [],
            duration: duration,
            activeCalories: calories,
            distance: distance,
            pace: pace
        )
    }
}
