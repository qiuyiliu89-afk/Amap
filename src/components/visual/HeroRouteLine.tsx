interface HeroRouteLineProps {
  className?: string;
}

export function HeroRouteLine({ className = "" }: HeroRouteLineProps) {
  return (
    <svg className={className} viewBox="0 0 420 220" fill="none" aria-hidden="true">
      <path
        d="M42 174 C110 112 158 142 216 96 C268 55 316 72 378 34"
        stroke="url(#heroRouteLineGradient)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="heroRouteLineGradient" x1="42" y1="174" x2="378" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="0.55" stopColor="#2EF2FF" />
          <stop offset="1" stopColor="#A7F3D0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
