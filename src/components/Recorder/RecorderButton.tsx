interface RecorderButtonProps {
  isRecording: boolean
  disabled?: boolean
  onClick: () => void
  progress?: number
}

const RING_RADIUS = 56
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function RecorderButton({
  isRecording,
  disabled,
  onClick,
  progress = 0,
}: RecorderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isRecording}
      aria-label={isRecording ? '停止录音' : '开始录音'}
      className={`group relative flex h-[120px] w-[120px] items-center justify-center rounded-full text-white font-semibold shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95 ${
        isRecording
          ? 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-300'
          : 'bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 focus-visible:ring-indigo-300'
      }`}
    >
      {isRecording && (
        <>
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-red-400/70 animate-pulse-ring"
          />
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-red-400/40 animate-pulse-ring"
            style={{ animationDelay: '0.75s' }}
          />
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 -rotate-90"
            viewBox="0 0 120 120"
          >
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              stroke="white"
              strokeOpacity="0.35"
              strokeWidth="3"
            />
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress)))}
              style={{ transition: 'stroke-dashoffset 100ms linear' }}
            />
          </svg>
        </>
      )}
      <span className="relative z-10 flex flex-col items-center">
        <svg
          className="mb-1 h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {isRecording ? (
            <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" />
          ) : (
            <>
              <rect x="9" y="3" width="6" height="12" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0" />
              <line x1="12" y1="18" x2="12" y2="22" />
            </>
          )}
        </svg>
        <span className="text-sm tracking-wide">{isRecording ? '停止' : '开始'}</span>
      </span>
    </button>
  )
}
