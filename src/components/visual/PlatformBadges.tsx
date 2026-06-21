interface PlatformBadgesProps {
  className?: string;
}

const platforms = ["抖音", "小红书", "TikTok", "IG"];

export function PlatformBadges({ className = "" }: PlatformBadgesProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {platforms.map((platform) => (
        <span key={platform} className="rounded-lg border border-aqua-300/25 bg-white/[0.06] px-3 py-1.5 text-sm font-semibold text-white">
          {platform}
        </span>
      ))}
    </div>
  );
}
