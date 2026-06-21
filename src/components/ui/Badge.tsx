import type { PropsWithChildren } from "react";

interface BadgeProps {
  tone?: "aqua" | "orange" | "slate" | "green";
  className?: string;
}

const tones = {
  aqua: "border-aqua-400/35 bg-aqua-400/10 text-aqua-100",
  orange: "border-signal-400/40 bg-signal-400/10 text-orange-100",
  slate: "border-white/15 bg-white/8 text-slate-200",
  green: "border-emerald-300/35 bg-emerald-300/10 text-emerald-100",
};

export function Badge({ children, className = "", tone = "aqua" }: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
