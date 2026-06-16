// SVG progress ring that depletes as the pomodoro runs. Glows in the accent
// color, shifts to warning amber/red when off-task.
export default function PomodoroRing({ progress, size = 168, stroke = 4, color = '#7C3AED', warning = false }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = circumference * Math.max(0, Math.min(1, progress))
  const ringColor = warning ? '#FCA5A5' : color

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 m-auto -rotate-90 pointer-events-none"
      style={{ filter: `drop-shadow(0 0 6px ${ringColor}88)` }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.4s ease' }}
      />
    </svg>
  )
}
