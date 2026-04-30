import SwiftUI

struct ProgressRingView: View {
    let progress: Double
    let lineWidth: CGFloat
    let color: Color
    var size: CGFloat = 60
    var showLabel: Bool = true
    var label: String = ""

    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.15), lineWidth: lineWidth)

            Circle()
                .trim(from: 0, to: CGFloat(min(progress, 1.0)))
                .stroke(
                    color,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 0.8), value: progress)

            if showLabel {
                VStack(spacing: 1) {
                    Text("\(Int(progress * 100))%")
                        .font(.system(size: size * 0.22, weight: .bold, design: .rounded))
                        .foregroundColor(.primary)
                    if !label.isEmpty {
                        Text(label)
                            .font(.system(size: size * 0.14, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .frame(width: size, height: size)
    }
}

struct MultiRingView: View {
    let rings: [RingData]

    struct RingData {
        let progress: Double
        let color: Color
        let lineWidth: CGFloat
    }

    var body: some View {
        ZStack {
            ForEach(Array(rings.enumerated()), id: \.offset) { index, ring in
                let padding = CGFloat(index) * (ring.lineWidth + 4)
                Circle()
                    .stroke(ring.color.opacity(0.15), lineWidth: ring.lineWidth)
                    .padding(padding)
                Circle()
                    .trim(from: 0, to: CGFloat(ring.progress))
                    .stroke(ring.color, style: StrokeStyle(lineWidth: ring.lineWidth, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .padding(padding)
                    .animation(.easeInOut(duration: 0.8), value: ring.progress)
            }
        }
    }
}
