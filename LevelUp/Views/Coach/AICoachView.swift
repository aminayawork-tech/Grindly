import SwiftUI

struct AICoachView: View {
    @EnvironmentObject var store: DataStore
    @StateObject private var aiService = ClaudeAIService.shared
    @State private var messageText = ""
    @State private var isComposing = false
    @State private var scrollProxy: ScrollViewProxy? = nil
    @FocusState private var inputFocused: Bool

    var context: UserContext { .from(store) }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                if aiService.coachMessages.isEmpty {
                    welcomeView
                } else {
                    messagesList
                }
                inputBar
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("AI Coach")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        requestDailyCheckin()
                    } label: {
                        Label("Check In", systemImage: "waveform")
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .disabled(aiService.isLoading)
                }
            }
        }
    }

    private var welcomeView: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer(minLength: 40)
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 64))
                    .foregroundColor(.blue)

                VStack(spacing: 8) {
                    Text("Your AI Life Coach")
                        .font(.system(size: 24, weight: .bold))
                    Text("Personalized advice based on your actual data — workouts, calories, weight trend, and habits.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 20)
                }

                contextSnapshotView

                Button {
                    requestDailyCheckin()
                } label: {
                    Label("Get Daily Check-In", systemImage: "waveform")
                        .font(.system(size: 16, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(16)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(14)
                }
                .padding(.horizontal, 20)
                .disabled(aiService.isLoading)

                Spacer(minLength: 20)
            }
        }
    }

    private var contextSnapshotView: some View {
        VStack(spacing: 8) {
            Text("Your current snapshot")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.secondary)
                .textCase(.uppercase)
                .tracking(0.5)

            HStack(spacing: 10) {
                snapshotChip(
                    icon: "scalemass.fill",
                    value: String(format: "%.1f lbs", context.currentWeight),
                    color: .blue
                )
                snapshotChip(
                    icon: "flame.fill",
                    value: "\(Int(context.todayCalories)) kcal",
                    color: .orange
                )
                snapshotChip(
                    icon: "figure.run",
                    value: "\(context.weeklyWorkouts) workouts",
                    color: .green
                )
            }
        }
        .padding(.horizontal, 20)
    }

    private func snapshotChip(icon: String, value: String, color: Color) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 12))
                .foregroundColor(color)
            Text(value)
                .font(.system(size: 12, weight: .semibold))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }

    private var messagesList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(aiService.coachMessages) { message in
                        MessageBubble(message: message)
                            .id(message.id)
                    }
                    if aiService.isLoading {
                        TypingIndicator()
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
            .onAppear {
                scrollProxy = proxy
                if let last = aiService.coachMessages.last {
                    proxy.scrollTo(last.id, anchor: .bottom)
                }
            }
            .onChange(of: aiService.coachMessages.count) { _ in
                if let last = aiService.coachMessages.last {
                    withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                }
            }
        }
    }

    private var inputBar: some View {
        HStack(spacing: 12) {
            TextField("Ask your coach anything...", text: $messageText, axis: .vertical)
                .lineLimit(1...4)
                .padding(12)
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .focused($inputFocused)
                .onSubmit { sendMessage() }

            Button(action: sendMessage) {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 32))
                    .foregroundColor(messageText.isEmpty || aiService.isLoading ? .secondary : .blue)
            }
            .disabled(messageText.isEmpty || aiService.isLoading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color(.systemGroupedBackground))
    }

    private func sendMessage() {
        let text = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !aiService.isLoading else { return }
        messageText = ""
        aiService.sendMessage(text, context: context) { _ in }
    }

    private func requestDailyCheckin() {
        aiService.sendDailyCheckin(context: context) { _ in }
    }
}

struct MessageBubble: View {
    let message: CoachMessage

    var isCoach: Bool { message.role == .coach }

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            if isCoach {
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 18))
                    .foregroundColor(.white)
                    .frame(width: 36, height: 36)
                    .background(Color.blue)
                    .clipShape(Circle())
            }

            VStack(alignment: isCoach ? .leading : .trailing, spacing: 4) {
                Text(message.content)
                    .font(.system(size: 15))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(isCoach ? Color(.systemBackground) : Color.blue)
                    .foregroundColor(isCoach ? .primary : .white)
                    .cornerRadius(18, corners: isCoach
                        ? [.topLeft, .topRight, .bottomRight]
                        : [.topLeft, .topRight, .bottomLeft])
                    .shadow(color: .black.opacity(0.04), radius: 4, x: 0, y: 2)

                Text(message.timestamp.formatted(date: .omitted, time: .shortened))
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 4)
            }

            if !isCoach { Spacer() }
        }
        .frame(maxWidth: .infinity, alignment: isCoach ? .leading : .trailing)
    }
}

struct TypingIndicator: View {
    @State private var phase = 0

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 18))
                .foregroundColor(.white)
                .frame(width: 36, height: 36)
                .background(Color.blue)
                .clipShape(Circle())

            HStack(spacing: 4) {
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(Color.secondary.opacity(0.5))
                        .frame(width: 8, height: 8)
                        .scaleEffect(phase == i ? 1.3 : 0.8)
                        .animation(
                            .easeInOut(duration: 0.4).repeatForever().delay(Double(i) * 0.15),
                            value: phase
                        )
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color(.systemBackground))
            .cornerRadius(18)

            Spacer()
        }
        .onAppear {
            phase = 1
        }
    }
}

extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat
    var corners: UIRectCorner

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}
