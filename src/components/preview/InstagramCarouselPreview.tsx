import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import type { CarouselCard, RenderHints } from "../../types/campaign";
import { Badge } from "../ui/Badge";
import { GeneratedImageBackground } from "./GeneratedImageBackground";
import { RenderHintVisual } from "./RenderHintVisual";

function slidePalette(index: number) {
  const palettes = [
    "from-[#101827] via-[#1d5d65] to-[#f59e67]",
    "from-[#f7efe4] via-[#d7f7ef] to-[#9bd5ff]",
    "from-[#111827] via-[#26415f] to-[#7dd3fc]",
    "from-[#fff6dc] via-[#f7c59f] to-[#203040]",
    "from-[#eaf8ff] via-[#d8fff6] to-[#f9d08d]",
  ];
  return palettes[index % palettes.length];
}

function InstagramSlideCard({
  slide,
  index,
  total,
  renderHints,
  imageUrl,
}: {
  slide: CarouselCard;
  index: number;
  total: number;
  renderHints: RenderHints;
  imageUrl?: string;
}) {
  const isCover = index === 0;

  return (
    <div className={`relative aspect-square w-[190px] shrink-0 overflow-hidden rounded-[1.4rem] bg-gradient-to-br ${slidePalette(index)} p-4 shadow-sm md:w-[220px]`}>
      {isCover ? (
        <>
          <RenderHintVisual renderHints={renderHints} className="absolute inset-0 rounded-none border-0 opacity-80" />
          <GeneratedImageBackground imageUrl={imageUrl} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-black/26" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.35),transparent_28%),radial-gradient(circle_at_78%_24%,rgba(45,212,191,.3),transparent_28%)]" />
          <div className="absolute left-5 top-5 h-20 w-24 rounded-[2rem] bg-white/28 backdrop-blur-sm" />
          <div className="absolute bottom-5 right-5 h-24 w-20 rounded-[2rem] bg-black/16 backdrop-blur-sm" />
          <svg className="absolute inset-0 h-full w-full opacity-80" viewBox="0 0 220 220" aria-hidden="true">
            <path
              d="M28 170 C72 110 104 154 134 92 S182 72 196 104"
              fill="none"
              stroke={index % 2 ? "rgba(20,184,166,.72)" : "rgba(255,255,255,.62)"}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="12 9"
            />
          </svg>
        </>
      )}

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <Badge tone={isCover ? "slate" : "aqua"}>{index + 1}/{total}</Badge>
          <span className="rounded-full bg-black/22 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            Carousel
          </span>
        </div>

        <div>
          <p className="text-[1.55rem] font-black leading-8 text-white drop-shadow-[0_3px_12px_rgba(0,0,0,.36)]">
            {slide.title}
          </p>
          <p className="mt-3 text-sm font-medium leading-6 text-white/88">
            {slide.body}
          </p>
        </div>
      </div>
    </div>
  );
}

export function InstagramCarouselPreview({
  carouselSlides,
  caption,
  hashtags,
  renderHints,
  imageUrl,
  captionLanguageStrategy,
}: {
  carouselSlides: CarouselCard[];
  caption: string;
  hashtags: string[];
  renderHints: RenderHints;
  imageUrl?: string;
  captionLanguageStrategy?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-white/12 bg-[#0f1419] shadow-card">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-full bg-gradient-to-br from-fuchsia-400 via-orange-300 to-yellow-200" />
          <div>
            <p className="font-semibold text-white">amap.ai.studio</p>
            <p className="text-xs text-slate-400">Lifestyle city route carousel</p>
          </div>
        </div>
        <Badge>Instagram</Badge>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 py-5">
        {carouselSlides.map((slide, index) => (
          <InstagramSlideCard
            key={slide.id}
            slide={slide}
            index={index}
            total={carouselSlides.length}
            renderHints={renderHints}
            imageUrl={index === 0 ? imageUrl : undefined}
          />
        ))}
      </div>

      <div className="space-y-4 border-t border-white/10 p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex gap-4">
            <Heart size={19} />
            <MessageCircle size={19} />
            <Send size={19} />
          </div>
          <Bookmark size={19} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-aqua-200">Ready-to-post caption</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-200">{caption}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hashtags</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <span key={tag} className="text-xs font-semibold text-aqua-100">{tag}</span>
            ))}
          </div>
        </div>
        {captionLanguageStrategy ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs leading-5 text-slate-400">
            {captionLanguageStrategy}
          </p>
        ) : null}
      </div>
    </div>
  );
}
