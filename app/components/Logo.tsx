export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className="inline-flex flex-wrap items-baseline justify-center gap-x-1 gap-y-0 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] ring-1 ring-black/10"
      >
        <span className="font-semibold text-2xl lowercase tracking-wide text-purple-700 sm:text-3xl">
          positive
        </span>
        <span className="text-2xl font-extrabold uppercase tracking-[0.2em] text-purple-950 sm:text-3xl">
          THOUGHT
        </span>
        <span className="ml-1 font-semibold text-2xl tracking-wide text-teal-900 sm:ml-2 sm:text-3xl">
          Counselling
        </span>
      </div>
    </div>
  )
}
