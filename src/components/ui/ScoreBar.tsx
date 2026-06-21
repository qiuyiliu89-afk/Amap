interface ScoreBarProps {
  label: string;
  score: number;
  note?: string;
}

export function ScoreBar({ label, score, note }: ScoreBarProps) {
  const width = `${Math.min(100, Math.max(0, (score / 5) * 100))}%`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-200">{label}</span>
        <span className="font-semibold text-aqua-100">{score.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-aqua-400 to-signal-400"
          style={{ width }}
        />
      </div>
      {note ? <p className="text-xs leading-5 text-slate-400">{note}</p> : null}
    </div>
  );
}
