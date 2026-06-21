interface ScoreRingProps {
  className?: string;
}

export function ScoreRing({ className = "" }: ScoreRingProps) {
  return (
    <div className={`relative grid h-24 w-24 place-items-center ${className}`}>
      <div className="absolute inset-0 rounded-full border border-white/15" />
      <div className="absolute inset-2 rounded-full border-[8px] border-aqua-300/80 border-b-aqua-300/20 border-l-blue-500" />
      <span className="text-2xl font-semibold text-aqua-100">92</span>
    </div>
  );
}
