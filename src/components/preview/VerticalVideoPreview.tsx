import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import type { RenderHints, StoryboardFrame } from "../../types/campaign";
import { GeneratedImageBackground } from "./GeneratedImageBackground";
import { RenderHintVisual } from "./RenderHintVisual";

export function VerticalVideoPreview({
  hook,
  subtitles,
  storyboard,
  visualStyle,
  renderHints,
  hashtags,
  imageUrl,
}: {
  hook: string;
  subtitles: string[];
  storyboard: StoryboardFrame[];
  visualStyle: string;
  renderHints: RenderHints;
  hashtags: string[];
  imageUrl?: string;
}) {
  const currentSubtitle = subtitles[0] ?? hook;
  const visualLabel = storyboard.length || visualStyle ? "AI 路线首帧 · 字幕安全区已预留" : "竖版内容预览";

  return (
    <div className="mx-auto w-full max-w-[330px] rounded-[2.1rem] border border-white/15 bg-black p-3 shadow-card">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[1.6rem] bg-ink-900">
        <RenderHintVisual renderHints={renderHints} className="absolute inset-0 rounded-none border-0" />
        <GeneratedImageBackground imageUrl={imageUrl} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/24 via-black/6 to-black/86" />
        <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black via-black/58 to-transparent" />

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between text-white">
          <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold backdrop-blur">
            竖版首帧
          </span>
          <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,.8)]" />
        </div>

        <div className="absolute right-3 bottom-24 flex flex-col gap-3 text-white">
          {[
            [Heart, "8.2w"],
            [MessageCircle, "1.1w"],
            [Share2, "转发"],
          ].map(([Icon, label]) => {
            const IconComponent = Icon as typeof Heart;
            return (
              <span key={label as string} className="flex flex-col items-center gap-1 text-[10px] font-semibold">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 backdrop-blur">
                  <IconComponent size={18} />
                </span>
                {label as string}
              </span>
            );
          })}
        </div>

        <div className="absolute left-5 right-16 bottom-36">
          <p className="max-w-[230px] text-2xl font-black leading-8 text-white drop-shadow-[0_3px_10px_rgba(0,0,0,.55)]">
            {hook}
          </p>
          <p className="mt-3 line-clamp-1 text-xs font-medium text-white/72">
            {visualLabel}
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="rounded-2xl bg-black/58 px-3 py-2 text-center text-sm font-semibold leading-5 text-white backdrop-blur">
            {currentSubtitle}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {hashtags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] font-semibold text-aqua-100">{tag}</span>
            ))}
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/18">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-aqua-400 to-sky-300"
              animate={{ width: ["16%", "86%", "16%"] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
