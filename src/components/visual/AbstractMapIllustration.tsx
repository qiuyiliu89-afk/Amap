interface AbstractMapIllustrationProps {
  className?: string;
}

export function AbstractMapIllustration({ className = "" }: AbstractMapIllustrationProps) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute left-6 top-6 h-20 w-20 rounded-full border border-aqua-300/20 bg-aqua-300/8" />
      <div className="absolute left-11 top-11 h-10 w-10 rounded-full bg-gradient-to-br from-aqua-200 to-blue-500 shadow-glow" />
      <div className="absolute left-1 top-[62px] h-[2px] w-32 rotate-[-26deg] bg-gradient-to-r from-transparent via-aqua-300 to-transparent" />
      <div className="absolute left-1 top-[62px] h-[2px] w-32 rotate-[24deg] bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
    </div>
  );
}
