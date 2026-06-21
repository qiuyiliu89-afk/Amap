interface PhonePreviewCardProps {
  className?: string;
}

export function PhonePreviewCard({ className = "" }: PhonePreviewCardProps) {
  return (
    <div className={`relative h-[360px] overflow-hidden rounded-[1.2rem] border border-aqua-200/18 bg-[#071422]/72 ${className}`}>
      <div className="absolute inset-0 bg-route-grid route-texture opacity-[0.16]" />
      <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aqua-300/14 blur-3xl" />
      <div className="relative z-10 flex h-full items-center justify-center text-sm font-semibold text-aqua-100">
        AI Preview Placeholder
      </div>
    </div>
  );
}
