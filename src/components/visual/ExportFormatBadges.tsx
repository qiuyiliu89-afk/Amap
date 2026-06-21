interface ExportFormatBadgesProps {
  className?: string;
}

export function ExportFormatBadges({ className = "" }: ExportFormatBadgesProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {["MP4", "JPG", "TXT"].map((format) => (
        <span key={format} className="w-fit rounded-md border border-aqua-300/35 bg-blue-500/24 px-3 py-1 text-xs font-semibold text-white">
          {format}
        </span>
      ))}
    </div>
  );
}
