import type { RenderHints } from "../../types/campaign";

function classifyTheme(theme = "") {
  const text = theme.toLowerCase();
  if (text.includes("commute") || text.includes("通勤")) return "commute";
  if (text.includes("food") || text.includes("本地生活") || text.includes("餐厅") || text.includes("local")) return "food";
  if (text.includes("shopping") || text.includes("消费") || text.includes("商圈")) return "shopping";
  if (text.includes("travel") || text.includes("旅行")) return "travel";
  if (text.includes("city route") || text.includes("城市路线") || text.includes("citywalk")) return "city";
  return "city";
}

function palette(renderHints: RenderHints) {
  const [primary = "#5eead4", secondary = "#38bdf8", accent = "#fb923c", dark = "#0f172a"] = renderHints.colorPalette;
  return { primary, secondary, accent, dark };
}

export function RenderHintVisual({
  renderHints,
  className = "",
  compact = false,
}: {
  renderHints: RenderHints;
  className?: string;
  compact?: boolean;
}) {
  const type = classifyTheme(renderHints.theme);
  const colors = palette(renderHints);
  const objects = renderHints.keyObjects.slice(0, compact ? 3 : 5);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 ${className}`}
      style={{
        background:
          type === "food" || type === "shopping"
            ? `linear-gradient(135deg, ${colors.dark}, rgba(251,146,60,.28), rgba(94,234,212,.12))`
            : type === "commute"
              ? `linear-gradient(135deg, ${colors.dark}, rgba(59,130,246,.24), rgba(244,63,94,.16))`
              : `linear-gradient(135deg, ${colors.dark}, rgba(56,189,248,.22), rgba(94,234,212,.16))`,
      }}
    >
      <div className="absolute inset-0 bg-route-grid route-texture opacity-20" />
      <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full blur-3xl" style={{ backgroundColor: `${colors.primary}40` }} />
      <div className="absolute -right-14 bottom-0 h-36 w-36 rounded-full blur-3xl" style={{ backgroundColor: `${colors.accent}38` }} />

      {type === "food" || type === "shopping" ? (
        <div className="absolute inset-4 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="rounded-xl border border-white/12 bg-white/10 p-3 shadow-lg backdrop-blur"
              style={{ transform: `translateY(${index % 2 ? 14 : 0}px)` }}
            >
              <span className="rounded-full px-2 py-1 text-[10px] font-bold text-slate-950" style={{ backgroundColor: index === 1 ? colors.accent : colors.primary }}>
                {type === "shopping" ? "Rank" : "Local"}
              </span>
              <div className="mt-3 h-2 rounded-full bg-white/45" />
              <div className="mt-2 h-2 w-2/3 rounded-full bg-white/25" />
            </div>
          ))}
        </div>
      ) : type === "commute" ? (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 420 260" aria-hidden="true">
          <path d="M34 76 H370" stroke="rgba(255,255,255,.18)" strokeWidth="3" strokeLinecap="round" />
          <path d="M34 174 H370" stroke="rgba(255,255,255,.12)" strokeWidth="3" strokeLinecap="round" />
          <path d="M42 76 C116 40 180 112 246 76 S330 54 372 98" fill="none" stroke={colors.primary} strokeWidth="6" strokeLinecap="round" />
          <path d="M42 174 C122 148 172 210 252 166 S334 132 380 180" fill="none" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" strokeDasharray="12 10" />
          {[42, 180, 300, 372].map((cx, index) => (
            <circle key={cx} cx={cx} cy={index === 3 ? 98 : 76} r="10" fill={index === 2 ? colors.accent : colors.primary} />
          ))}
        </svg>
      ) : (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 420 260" aria-hidden="true">
          <path d="M40 190 C110 92 152 166 216 90 S326 70 382 142" fill="none" stroke={colors.primary} strokeWidth="7" strokeLinecap="round" strokeDasharray="16 12" />
          {[40, 216, 382].map((cx, index) => (
            <g key={cx}>
              <circle cx={cx} cy={index === 0 ? 190 : index === 1 ? 90 : 142} r="18" fill="rgba(2,6,23,.7)" stroke={colors.secondary} strokeWidth="2" />
              <circle cx={cx} cy={index === 0 ? 190 : index === 1 ? 90 : 142} r="6" fill={index === 1 ? colors.accent : colors.primary} />
            </g>
          ))}
          <rect x="40" y="205" width="44" height="30" rx="4" fill="rgba(255,255,255,.1)" />
          <rect x="104" y="178" width="50" height="57" rx="4" fill="rgba(255,255,255,.08)" />
          <rect x="316" y="166" width="56" height="69" rx="5" fill="rgba(255,255,255,.08)" />
        </svg>
      )}

      <div className="relative z-10 flex h-full min-h-[180px] flex-col justify-between p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{renderHints.theme}</p>
          <p className="mt-2 max-w-[260px] text-sm leading-5 text-white/85">{renderHints.visualMood}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {objects.map((object) => (
            <span key={object} className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[10px] font-semibold text-white/85 backdrop-blur">
              {object}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

