export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className="text-purple-400 lowercase font-semibold text-2xl tracking-wide">positive</span>
      <span className="text-purple-700 uppercase font-extrabold text-2xl tracking-wide">THOUGHT</span>
      <span className="text-teal-600 font-semibold text-2xl ml-3 tracking-wide">Counselling</span>
    </div>
  )
}
