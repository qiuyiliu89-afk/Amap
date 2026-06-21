interface GlowGridBackgroundProps {
  className?: string;
}

export function GlowGridBackground({ className = "" }: GlowGridBackgroundProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute inset-0 bg-[#020617]" />
      <img
        src="/assets/home/components/map-grid.svg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-75"
        draggable={false}
      />
      <img
        src="/assets/home/components/glow-cyan.svg"
        alt=""
        className="absolute -left-24 top-10 h-[34rem] w-[34rem] opacity-70 blur-[1px]"
        draggable={false}
      />
      <img
        src="/assets/home/components/glow-blue.svg"
        alt=""
        className="absolute left-[42%] top-[-6rem] h-[42rem] w-[42rem] opacity-55"
        draggable={false}
      />
      <img
        src="/assets/home/components/glow-cyan.svg"
        alt=""
        className="absolute bottom-[-12rem] right-[-8rem] h-[34rem] w-[34rem] opacity-50"
        draggable={false}
      />
      <div className="absolute inset-y-0 left-[18%] w-px bg-gradient-to-b from-transparent via-aqua-300/18 to-transparent" />
      <div className="absolute inset-y-0 left-[52%] w-px bg-gradient-to-b from-transparent via-blue-300/14 to-transparent" />
      <div className="absolute inset-x-0 top-[24%] h-px bg-gradient-to-r from-transparent via-aqua-300/14 to-transparent" />
      <div className="absolute inset-x-0 bottom-[20%] h-px bg-gradient-to-r from-transparent via-blue-300/12 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.2)_55%,rgba(2,6,23,0.94)_100%)]" />
    </div>
  );
}
