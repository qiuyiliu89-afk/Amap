import { ArrowRight, Bell } from "lucide-react";
import type { RenderHints } from "../../types/campaign";
import { GeneratedImageBackground } from "./GeneratedImageBackground";
import { RenderHintVisual } from "./RenderHintVisual";

export function PushBannerPreview({
  pushTitle,
  pushBody,
  bannerTitle,
  bannerSubtitle,
  cta,
  renderHints,
  imageUrl,
}: {
  pushTitle: string;
  pushBody: string;
  bannerTitle: string;
  bannerSubtitle: string;
  cta: string;
  renderHints?: RenderHints;
  imageUrl?: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/12 bg-slate-100/95 p-4 text-slate-950 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-2"><Bell size={14} /> AMAP AI · now</span>
          <span>notification preview</span>
        </div>
        <h3 className="font-bold">{pushTitle}</h3>
        <p className="mt-1 text-sm text-slate-700">{pushBody}</p>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-aqua-300/20 p-6 shadow-card">
        {renderHints ? <RenderHintVisual renderHints={renderHints} className="absolute inset-0 rounded-none border-0" /> : null}
        <GeneratedImageBackground imageUrl={imageUrl} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
        <div className="relative max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aqua-200">In-app banner</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">{bannerTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{bannerSubtitle}</p>
          <button type="button" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-aqua-300 px-4 py-2 text-sm font-semibold text-ink-950">
            {cta}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
