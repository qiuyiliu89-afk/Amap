import { useEffect, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Heart, MoreHorizontal, Share2 } from "lucide-react";
import type {
  CarouselCard,
  RenderHints,
  XiaohongshuPageType,
  XiaohongshuPublishCarouselPage,
  XiaohongshuPublishPackage,
  XiaohongshuVisualStyle,
} from "../../types/campaign";

function toFallbackPages(
  coverTitle: string,
  carouselCards: CarouselCard[],
  hashtags: string[],
): XiaohongshuPublishCarouselPage[] {
  const pageTypes: XiaohongshuPageType[] = ["cover", "scene", "landmark", "route", "feature", "tips", "cta"];
  const visualStyles: XiaohongshuVisualStyle[] = [
    "brand-poster",
    "cinematic-scene",
    "editorial-landmark",
    "premium-route",
    "product-story",
    "editorial-layout",
    "closing-poster",
  ];

  return pageTypes.map((pageType, index) => {
    const card = carouselCards[index];
    const title = index === 0 ? coverTitle : card?.title ?? `城市灵感 ${index + 1}`;
    const bodyText = card?.body ?? "把想去的地方整理成一条可以直接出发的城市路线。";

    return {
      id: card?.id ?? `xhs-preview-${index + 1}`,
      pageType,
      role: pageType,
      eyebrow: `${index + 1}/${pageTypes.length}`,
      title,
      subtitle: index === 0 ? "城市文化旅行特辑" : bodyText,
      body: bodyText,
      bodyText,
      visualCue: card?.visualCue ?? "官方品牌级城市旅行视觉",
      bullets: pageType === "cta" ? hashtags.slice(0, 3) : ["城市漫游", "路线收藏", "直接出发"],
      visualStyle: visualStyles[index],
      imagePrompt: `Xiaohongshu official brand ${pageType} visual, premium editorial travel campaign, no text, no logo.`,
      overlayText: [title],
    };
  });
}

function pageTypeLabel(pageType: XiaohongshuPageType) {
  const labels: Record<XiaohongshuPageType, string> = {
    cover: "封面",
    scene: "场景",
    landmark: "地标",
    route: "路线",
    feature: "功能",
    tips: "Tips",
    cta: "收藏",
  };
  return labels[pageType];
}

function isVisualPage(pageType: XiaohongshuPageType) {
  return pageType === "cover" || pageType === "scene" || pageType === "landmark";
}

function EditorialFallback({ pageType }: { pageType: XiaohongshuPageType }) {
  if (pageType === "cover") {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#0b746c]">
        <div className="absolute inset-x-0 top-0 h-[45%] bg-[#79d8df]" />
        <div className="absolute inset-x-0 bottom-0 h-[58%] bg-[#228c83]" />
        <div className="absolute inset-x-0 bottom-[29%] h-[2px] bg-white/40" />
        <div className="absolute inset-x-0 bottom-[22%] h-[2px] bg-white/25" />
        <div className="absolute -left-[8%] top-[28%] h-[26%] w-[38%] bg-[#f7f0dc]" />
        <div className="absolute -left-[10%] top-[23%] h-[9%] w-[44%] bg-[#244e49] [clip-path:polygon(0_100%,18%_0,82%_0,100%_100%)]" />
        <div className="absolute -right-[7%] top-[30%] h-[24%] w-[34%] bg-[#f7f0dc]" />
        <div className="absolute -right-[10%] top-[25%] h-[9%] w-[42%] bg-[#244e49] [clip-path:polygon(0_100%,18%_0,82%_0,100%_100%)]" />
        <div className="absolute left-[24%] top-[29%] h-[29%] w-[52%] rounded-t-[999px] border-[14px] border-b-0 border-[#efe7d2]" />
        <div className="absolute bottom-[24%] left-[28%] h-[5%] w-[46%] rotate-[-3deg] bg-[#e8a73a] [clip-path:polygon(0_20%,90%_0,100%_45%,88%_100%,8%_82%)]" />
        <div className="absolute bottom-[30%] left-[47%] h-[15%] w-[3px] rotate-[6deg] bg-[#513a25]" />
        <div className="absolute bottom-[42%] left-[42%] h-[8%] w-[15%] bg-[#d64f3f] [clip-path:polygon(0_50%,100%_0,100%_100%)]" />
        <div className="absolute -right-[3%] top-[4%] h-[28%] w-[18%] rotate-[14deg] bg-[#3e8d55] [clip-path:polygon(0_0,100%_8%,72%_100%,35%_72%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[17%] bg-[#063f3f]/72" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#dfe9de]">
      <div className="absolute inset-x-0 top-0 h-[58%] bg-[#8bc7c2]" />
      <div className="absolute bottom-0 left-0 h-[58%] w-[58%] bg-[#284f4c] [clip-path:polygon(0_42%,100%_0,78%_100%,0_100%)]" />
      <div className="absolute bottom-0 right-0 h-[72%] w-[58%] bg-[#d9b46f] [clip-path:polygon(42%_0,100%_18%,100%_100%,0_100%)]" />
      <div className="absolute right-[18%] top-[24%] h-[34%] w-[24%] bg-[#f4eee0] [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
    </div>
  );
}

function VisualPage({ page, imageUrl }: { page: XiaohongshuPublishCarouselPage; imageUrl?: string }) {
  return (
    <div className="absolute inset-0">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <EditorialFallback pageType={page.pageType} />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/35 to-transparent" />
    </div>
  );
}

function RoutePage({ page }: { page: XiaohongshuPublishCarouselPage }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e9eee7] text-[#133f3c]">
      <div className="absolute inset-x-0 top-0 h-[38%] bg-[#183f3d]" />
      <div className="absolute right-0 top-0 h-[38%] w-[45%] bg-[#d7ac5d]" />
      <svg className="absolute inset-x-0 top-[23%] h-[46%] w-full" viewBox="0 0 400 260" aria-hidden="true">
        <path d="M-20 215 C70 180 75 58 172 88 C246 111 263 8 432 36" fill="none" stroke="#1ba798" strokeWidth="12" strokeLinecap="round" />
        <path d="M-20 215 C70 180 75 58 172 88 C246 111 263 8 432 36" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-x-7 bottom-8 grid grid-cols-3 border-t border-[#174d49]/25 pt-4 text-center text-[11px] font-bold">
        {page.overlayText.slice(0, 3).map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
      </div>
    </div>
  );
}

function FeaturePage({ page }: { page: XiaohongshuPublishCarouselPage }) {
  return (
    <div className="absolute inset-0 bg-[#f2efe5] text-[#143f3c]">
      <div className="absolute inset-x-0 top-0 h-[30%] bg-[#edb74c]" />
      <div className="absolute bottom-0 right-0 h-[52%] w-[38%] bg-[#75b9b2]" />
      <div className="absolute inset-x-7 bottom-8 space-y-0 border-y border-[#174d49]/25">
        {page.overlayText.slice(0, 3).map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center justify-between border-b border-[#174d49]/18 py-4 last:border-0">
            <span className="text-[11px] font-black text-[#b05d36]">0{index + 1}</span>
            <span className="text-sm font-black">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TipsPage({ page }: { page: XiaohongshuPublishCarouselPage }) {
  return (
    <div className="absolute inset-0 bg-[#fff8e9] text-[#243f3d]">
      <div className="absolute inset-x-0 top-0 h-4 bg-[#ef634f]" />
      <div className="absolute right-0 top-0 h-full w-[30%] bg-[#acd9cf]" />
      <div className="absolute inset-x-7 bottom-8 grid gap-5">
        {page.bullets.slice(0, 3).map((item, index) => (
          <div key={`${item}-${index}`} className="border-t border-[#244a46]/30 pt-3">
            <span className="text-[10px] font-black text-[#e05443]">CHECK 0{index + 1}</span>
            <p className="mt-1 text-base font-black">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClosingPage() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#173f3d]">
      <div className="absolute inset-x-0 top-0 h-[44%] bg-[#efb648]" />
      <div className="absolute -right-[12%] bottom-[8%] h-[60%] w-[72%] rotate-[-12deg] bg-[#e95f4d]" />
      <div className="absolute -left-[20%] bottom-0 h-[42%] w-[70%] rotate-[9deg] bg-[#70bdb2]" />
    </div>
  );
}

function XiaohongshuPage({
  page,
  index,
  total,
  imageUrl,
  compact = false,
}: {
  page: XiaohongshuPublishCarouselPage;
  index: number;
  total: number;
  imageUrl?: string;
  compact?: boolean;
}) {
  const visual = isVisualPage(page.pageType);
  const lightText = visual || page.pageType === "cta";

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f4efe3]">
      {visual ? <VisualPage page={page} imageUrl={imageUrl} /> : null}
      {page.pageType === "route" ? <RoutePage page={page} /> : null}
      {page.pageType === "feature" ? <FeaturePage page={page} /> : null}
      {page.pageType === "tips" ? <TipsPage page={page} /> : null}
      {page.pageType === "cta" ? <ClosingPage /> : null}

      <div className={`absolute inset-0 flex flex-col ${compact ? "p-3" : "p-6 sm:p-8"}`}>
        <div className={`flex items-center justify-between text-[10px] font-black ${lightText ? "text-white" : "text-[#234b47]"}`}>
          <span className="border-b border-current pb-1">AMAP AI · {pageTypeLabel(page.pageType)}</span>
          <span>{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        </div>

        <div className={`${page.pageType === "route" || page.pageType === "feature" || page.pageType === "tips" ? "mt-8" : "mt-auto"}`}>
          <p className={`font-black uppercase ${compact ? "text-[8px]" : "text-[10px]"} ${lightText ? "text-white/75" : "text-[#bd633e]"}`}>
            {page.subtitle}
          </p>
          <h3 className={`${compact ? "mt-1 max-h-10 overflow-hidden text-[10px] leading-3" : "mt-3 text-[clamp(1.7rem,5vw,2.75rem)] leading-[1.08]"} max-w-[92%] font-black ${lightText ? "text-white" : "text-[#153f3c]"}`}>
            {page.title}
          </h3>
          {!compact ? (
            <p className={`mt-4 max-w-[88%] text-sm font-medium leading-6 ${lightText ? "text-white/84" : "text-[#315b57]"}`}>
              {page.bodyText || page.body}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function XiaohongshuCarouselPreview({
  coverTitle,
  carouselCards,
  postBody,
  hashtags,
  renderHints: _renderHints,
  imageUrl,
  pageImageUrls,
  publishPackage,
}: {
  coverTitle: string;
  carouselCards: CarouselCard[];
  postBody: string;
  hashtags: string[];
  renderHints: RenderHints;
  imageUrl?: string;
  pageImageUrls?: Record<string, string>;
  publishPackage?: XiaohongshuPublishPackage;
}) {
  const pages = publishPackage?.carouselPages ?? toFallbackPages(coverTitle, carouselCards, hashtags);
  const title = publishPackage?.title ?? coverTitle;
  const body = publishPackage?.postText ?? postBody;
  const tags = publishPackage?.hashtags ?? hashtags;
  const commentGuide = publishPackage?.commentGuide;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => setActiveIndex(0), [pages.length, title]);

  const activePage = pages[Math.min(activeIndex, Math.max(0, pages.length - 1))];
  const activeImage = activePage
    ? pageImageUrls?.[activePage.id] ?? (isVisualPage(activePage.pageType) ? imageUrl : undefined)
    : undefined;

  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-[#f7f4ef] text-[#181818] shadow-[0_24px_70px_rgba(6,20,31,.18)]">
      <div className="flex items-center justify-between border-b border-black/8 bg-white px-4 py-3 sm:px-6">
        <button type="button" aria-label="返回" className="grid h-9 w-9 place-items-center text-[#222]"><ChevronLeft size={22} /></button>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center bg-[#176f69] text-xs font-black text-white">A</span>
          <div>
            <p className="text-sm font-black">Amap AI Creative</p>
            <p className="text-[11px] text-[#777]">品牌图文预览 · {pages.length} 页</p>
          </div>
        </div>
        <button type="button" aria-label="更多" className="grid h-9 w-9 place-items-center text-[#222]"><MoreHorizontal size={22} /></button>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(360px,520px)_minmax(0,1fr)] xl:items-start">
        <div>
          <div className="overflow-hidden rounded-md bg-[#e8e2d8] shadow-[0_14px_35px_rgba(20,37,35,.16)]">
            {activePage ? (
              <XiaohongshuPage page={activePage} index={activeIndex} total={pages.length} imageUrl={activeImage} />
            ) : null}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              {pages.map((page, index) => (
                <button
                  key={page.id}
                  type="button"
                  aria-label={`查看第 ${index + 1} 页`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-1.5 transition-all ${index === activeIndex ? "w-7 bg-[#ef4b55]" : "w-2 bg-black/15"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-4 text-[#333]">
              <Heart size={20} />
              <Bookmark size={20} />
              <Share2 size={20} />
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-[#b75a42]">Carousel Preview</p>
          <h2 className="mt-2 text-2xl font-black leading-8 text-[#173f3d]">先看封面，再滑完整套图文</h2>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-3">
            {pages.map((page, index) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`w-[108px] shrink-0 overflow-hidden rounded border-2 text-left transition ${index === activeIndex ? "border-[#ef4b55]" : "border-transparent opacity-75 hover:opacity-100"}`}
              >
                <XiaohongshuPage
                  page={page}
                  index={index}
                  total={pages.length}
                  compact
                  imageUrl={pageImageUrls?.[page.id] ?? (isVisualPage(page.pageType) ? imageUrl : undefined)}
                />
              </button>
            ))}
          </div>

          <div className="mt-4 border-t border-black/10 pt-5">
            <h3 className="text-xl font-black leading-7">{title}</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#373737]">{body}</p>
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-sm font-semibold text-[#176f69]">
              {tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            {commentGuide ? (
              <p className="mt-4 border-l-2 border-[#ef4b55] pl-3 text-sm font-semibold leading-6 text-[#5a403b]">{commentGuide}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
