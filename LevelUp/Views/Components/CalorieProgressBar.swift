import SwiftUI

struct CalorieProgressBar: View {
    let consumed: Double
    let goal: Double

    var progress: Double { min(consumed / goal, 1.0) }
    var isOver: Bool { consumed > goal }

    var barColor: Color {
        if consumed / goal > 1.05 { return .red }
        if consumed / goal > 0.9 { return .orange }
        return .green
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(Int(consumed))")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                    Text("calories consumed")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(Int(max(goal - consumed, 0)))")
                        .font(.system(size: 20, weight: .semibold, design: .rounded))
                        .foregroundColor(isOver ? .red : .secondary)
                    Text(isOver ? "over goal" : "remaining")
                        .font(.caption)
                        .foregroundColor(isOver ? .red : .secondary)
                }
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(barColor.opacity(0.15))
                        .frame(height: 12)

                    Capsule()
                        .fill(barColor)
                        .frame(width: geo.size.width * CGFloat(progress), height: 12)
                        .animation(.easeInOut(duration: 0.6), value: progress)
                }
            }
            .frame(height: 12)

            HStack {
                Text("Goal: \(Int(goal)) kcal")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text("\(Int(progress * 100))%")
                    .font(.caption.bold())
                    .foregroundColor(barColor)
            }
        }
    }
}
