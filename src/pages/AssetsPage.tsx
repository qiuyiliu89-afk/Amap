import { useState } from "react";
import { Link } from "react-router-dom";
import { Captions, Check, ChevronDown, Clapperboard, Download, FileJson, FileText, Hash, ImageIcon, MessageCircle, PackageCheck, Sparkles } from "lucide-react";
import { createFallbackVisualAssetsFromContentPackage } from "../ai/workflow/generateVisualAssets";
import { QualityScoreCard } from "../components/assets/QualityScoreCard";
import { InstagramCarouselPreview } from "../components/preview/InstagramCarouselPreview";
import { VerticalVideoPreview } from "../components/preview/VerticalVideoPreview";
import { XiaohongshuCarouselPreview } from "../components/preview/XiaohongshuCarouselPreview";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SectionTitle } from "../components/ui/SectionTitle";
import { WorkflowStatusStrip } from "../components/workflow/WorkflowStatusStrip";
import type {
  ContentPackage,
  DouyinPublishPackage,
  GeneratedVisualAsset,
  Platform,
  StoryboardFrame,
  VisualAssetsPackage,
  XiaohongshuPublishPackage,
} from "../types/campaign";
import { ensurePublishPackages } from "../utils/publishPackageUtils";
import { getContentPackage, getPipelineInput, getPipelineStatus, getVisualAssets } from "../utils/storageUtils";

const platformLabels: Record<Platform, string> = {
  douyin: "抖音",
  xiaohongshu: "小红书",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube_shorts: "YouTube Shorts",
  push_banner: "Push / Banner",
};

function getSelectedPlatforms(contentPackage: ContentPackage, selected?: Platform[]) {
  if (selected?.length) return selected;

  const inferred: Platform[] = [];
  if (contentPackage.platformAssets.tiktok) inferred.push("tiktok");
  if (contentPackage.platformAssets.douyin) inferred.push("douyin");
  if (contentPackage.platformAssets.xiaohongshu) inferred.push("xiaohongshu");
  if (contentPackage.platformAssets.instagram) inferred.push("instagram");
  if (contentPackage.platformAssets.pushBanner) inferred.push("push_banner");
  return inferred;
}

function CopyActionButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleCopy} type="button">
      {copied ? <Check size={16} /> : null}
      {copied ? "已复制" : label}
    </Button>
  );
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function ExportButton({
  label,
  filename,
  content,
  type,
  icon,
}: {
  label: string;
  filename: string;
  content: string;
  type: string;
  icon: "markdown" | "json";
}) {
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={() => downloadTextFile(filename, content, type)}
      className="border border-white/10"
    >
      {icon === "json" ? <FileJson size={16} /> : <FileText size={16} />}
      {label}
    </Button>
  );
}

function VisualStatusBadge({ asset }: { asset?: GeneratedVisualAsset }) {
  const hasImage = asset?.status === "success" && Boolean(asset.imageUrl);

  return (
    <Badge tone={hasImage ? "green" : "orange"}>
      {hasImage ? "AI image generated" : "Visual draft fallback"}
    </Badge>
  );
}

function XiaohongshuPublishPackageSection({
  contentPackage,
  packageData,
  visualAsset,
  pageVisualAssets,
}: {
  contentPackage: ContentPackage;
  packageData: XiaohongshuPublishPackage;
  visualAsset?: GeneratedVisualAsset;
  pageVisualAssets?: Record<string, GeneratedVisualAsset>;
}) {
  const pageImageUrls = Object.fromEntries(
    Object.entries(pageVisualAssets ?? {})
      .filter(([, asset]) => asset.status === "success" && asset.imageUrl)
      .map(([pageId, asset]) => [pageId, asset.imageUrl]),
  );
  const markdown = `# ${packageData.title}

${packageData.postText}

## Hashtags
${packageData.hashtags.join(" ")}`;

  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-300">Xiaohongshu Publish Package</p>
          <h2 className="mt-2 text-2xl font-black text-white">小红书图文发布包</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            {packageData.recommendedPageCount} 页动态图文规划，封面独立生成，先看图片成品，再复制标题、正文、标签和评论引导。
          </p>
        </div>
        <VisualStatusBadge asset={visualAsset} />
      </div>

      <XiaohongshuCarouselPreview
        coverTitle={contentPackage.platformAssets.xiaohongshu?.coverTitle ?? packageData.title}
        carouselCards={contentPackage.platformAssets.xiaohongshu?.carouselCards ?? []}
        postBody={contentPackage.platformAssets.xiaohongshu?.postBody ?? packageData.postText}
        hashtags={packageData.hashtags}
        renderHints={contentPackage.renderHints}
        imageUrl={visualAsset?.imageUrl}
        pageImageUrls={pageImageUrls}
        publishPackage={packageData}
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles size={17} className="text-rose-300" />
            标题 / Hook 候选
          </div>
          <div className="mt-4 space-y-3">
            {packageData.titleCandidates.map((candidate, index) => (
              <p key={candidate} className="rounded-xl border border-rose-300/18 bg-rose-300/[0.06] px-4 py-3 text-sm font-semibold leading-6 text-rose-50">
                {index + 1}. {candidate}
              </p>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            {packageData.hookCandidates.map((candidate) => (
              <p key={candidate} className="text-sm leading-6 text-slate-300">“{candidate}”</p>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aqua-300">可直接复制发布</p>
          <h3 className="mt-3 text-xl font-black text-white">{packageData.title}</h3>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-200">{packageData.postText}</pre>
          <div className="mt-5 flex flex-wrap gap-2">
            {packageData.hashtags.map((tag) => (
              <span key={tag} className="rounded-full border border-aqua-300/18 bg-aqua-300/[0.06] px-3 py-1 text-xs font-semibold text-aqua-50">
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-4 rounded-2xl border border-rose-300/16 bg-rose-300/[0.06] px-4 py-3 text-sm font-semibold leading-6 text-rose-50">
            {packageData.commentGuide}
          </p>
        </div>
      </div>

      <details className="rounded-2xl border border-white/10 bg-white/[0.035]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-white">
          <span className="inline-flex items-center gap-2">
            <ImageIcon size={17} className="text-aqua-300" />
            生产信息：pagePlan / visual prompts
          </span>
          <ChevronDown size={17} className="text-slate-400" />
        </summary>
        <div className="space-y-4 border-t border-white/10 p-5">
          <div className="rounded-xl border border-white/10 bg-black/18 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-aqua-300">Cover Prompt</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{packageData.coverVisualPrompt}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {packageData.pagePlan.pages.map((page, index) => (
              <div key={`${page.pageType}-${index}`} className="rounded-xl border border-white/10 bg-black/18 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">{index + 1}. {page.pageType}</p>
                <p className="mt-2 font-semibold text-white">{page.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{page.subtitle}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{page.imagePrompt}</p>
              </div>
            ))}
          </div>
        </div>
      </details>

      <div className="flex flex-wrap gap-3">
        <CopyActionButton label="复制小红书标题" text={packageData.title} />
        <CopyActionButton label="复制小红书正文" text={packageData.postText} />
        <CopyActionButton label="复制标签" text={packageData.hashtags.join(" ")} />
        <CopyActionButton label="复制评论引导" text={packageData.commentGuide} />
        <CopyActionButton label="复制全部小红书发布包" text={packageData.copyReadyText} />
        <ExportButton
          label="导出 Markdown"
          filename="xiaohongshu-publish-package.md"
          content={markdown}
          type="text/markdown;charset=utf-8"
          icon="markdown"
        />
        <ExportButton
          label="导出 JSON"
          filename="xiaohongshu-publish-package.json"
          content={JSON.stringify(packageData, null, 2)}
          type="application/json;charset=utf-8"
          icon="json"
        />
      </div>
    </Card>
  );
}

function toStoryboardFrames(packageData: DouyinPublishPackage): StoryboardFrame[] {
  return packageData.storyboard.map((frame, index) => ({
    id: `douyin-preview-${index + 1}`,
    scene: frame.timeRange,
    visualCue: frame.visual,
    copy: frame.voiceover,
  }));
}

function DouyinPublishPackageSection({
  contentPackage,
  packageData,
  visualAsset,
}: {
  contentPackage: ContentPackage;
  packageData: DouyinPublishPackage;
  visualAsset?: GeneratedVisualAsset;
}) {
  const visualStyle = contentPackage.platformAssets.douyin?.visualStyle ?? contentPackage.renderHints.visualMood;
  const scriptText = packageData.script15s.map((line) => `${line.timeRange}：${line.line}`).join("\n");
  const storyboardText = packageData.storyboard
    .map((frame) => `${frame.timeRange}
画面：${frame.visual}
旁白：${frame.voiceover}
屏幕字幕：${frame.screenSubtitle}`)
    .join("\n\n");
  const hashtagsText = packageData.hashtags.join(" ");
  const creativePack = packageData.videoCreativePack;
  const creativeShotText = creativePack.shotList
    .map((shot, index) => `Shot ${index + 1} · ${shot.timeRange}
镜头目标：${shot.sceneGoal}
画面：${shot.visualDescription}
运镜：${shot.cameraMovement}
转场：${shot.transition}
后期叠字：${shot.overlayText}
口播：${shot.voiceover}
Image Prompt：${shot.imagePrompt}
Video Prompt：${shot.videoPrompt}`)
    .join("\n\n");

  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aqua-300">Douyin Video Asset</p>
          <h2 className="mt-2 text-2xl font-black text-white">抖音短视频发布包</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            不接真实视频 API；先交付可直接用于可灵、即梦、Runway、Pika 的 AI 视频生产包。
          </p>
        </div>
        <VisualStatusBadge asset={visualAsset} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div>
          <p className="mb-3 text-sm font-semibold text-white">视频封面 / 首帧预览</p>
          <VerticalVideoPreview
            hook={packageData.hook}
            subtitles={packageData.script15s.map((line) => line.line)}
            storyboard={toStoryboardFrames(packageData)}
            visualStyle={visualStyle}
            renderHints={contentPackage.renderHints}
            hashtags={packageData.hashtags}
            imageUrl={visualAsset?.imageUrl}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-aqua-300/18 bg-aqua-300/[0.045] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aqua-300">Hook 标题</p>
            <h3 className="mt-3 text-2xl font-black leading-8 text-white">{packageData.title}</h3>
            <p className="mt-4 rounded-2xl bg-black/24 px-4 py-3 text-base font-black leading-7 text-aqua-50">
              {packageData.hook}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles size={17} className="text-aqua-300" />
                标题候选
              </div>
              <div className="mt-4 space-y-2">
                {packageData.titleCandidates.map((candidate, index) => (
                  <p key={candidate} className="text-sm leading-6 text-slate-300">{index + 1}. {candidate}</p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Clapperboard size={17} className="text-orange-300" />
                前 3 秒 Hook
              </div>
              <div className="mt-4 space-y-2">
                {packageData.hookCandidates.map((candidate) => (
                  <p key={candidate} className="text-sm leading-6 text-slate-300">“{candidate}”</p>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aqua-300">可直接复制发布文案</p>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-200">{packageData.caption}</pre>
            <div className="mt-5 flex flex-wrap gap-2">
              {packageData.hashtags.map((tag) => (
                <span key={tag} className="rounded-full border border-aqua-300/18 bg-aqua-300/[0.06] px-3 py-1 text-xs font-semibold text-aqua-50">
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-4 rounded-2xl border border-orange-300/16 bg-orange-300/[0.08] px-4 py-3 text-sm font-semibold leading-6 text-orange-50">
              CTA：{packageData.cta}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Captions size={17} className="text-aqua-300" />
              字幕文案
            </div>
            <div className="mt-4 grid gap-2">
              {packageData.script15s.map((line) => (
                <p key={line.timeRange} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-slate-200">
                  <span className="mr-2 text-xs font-bold text-aqua-200">{line.timeRange}</span>
                  {line.line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-aqua-300/22 bg-[#071722]">
        <div className="border-b border-white/10 bg-aqua-300/[0.055] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aqua-300">AI Video Creative Pack</p>
              <h3 className="mt-2 text-2xl font-black text-white">AI 视频生产包</h3>
              <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-aqua-50">{creativePack.concept}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="aqua">{creativePack.duration}</Badge>
              <Badge tone="slate">{creativePack.aspectRatio}</Badge>
              <Badge tone="green">Prompt ready</Badge>
            </div>
          </div>
          <p className="mt-4 max-w-5xl text-sm leading-6 text-slate-300">{creativePack.styleDirection}</p>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Clapperboard size={17} className="text-aqua-300" />
            {creativePack.shotList.length} 镜头分镜时间轴
          </div>
          <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
            {creativePack.shotList.map((shot, index) => (
              <article key={`${shot.timeRange}-${index}`} className="grid gap-4 py-5 lg:grid-cols-[92px_minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <div>
                  <p className="text-xs font-black text-aqua-300">SHOT {String(index + 1).padStart(2, "0")}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{shot.timeRange}</p>
                </div>
                <div>
                  <h4 className="text-base font-black leading-6 text-white">{shot.sceneGoal}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{shot.visualDescription}</p>
                  <p className="mt-3 text-xs leading-5 text-slate-400">运镜：{shot.cameraMovement}</p>
                  <p className="mt-1 text-xs leading-5 text-orange-100">转场：{shot.transition}</p>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <p className="text-xs font-semibold text-slate-500">后期叠字</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-aqua-50">{shot.overlayText}</p>
                  <p className="mt-3 text-xs font-semibold text-slate-500">口播 / 字幕</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{shot.voiceover}</p>
                  <details className="mt-3 border-t border-white/10 pt-3">
                    <summary className="cursor-pointer text-xs font-semibold text-aqua-200">查看单镜头 Prompt</summary>
                    <p className="mt-3 text-xs leading-5 text-slate-400">Image：{shot.imagePrompt}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">Video：{shot.videoPrompt}</p>
                  </details>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="grid border-t border-white/10 lg:grid-cols-2">
          <div className="border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <p className="text-sm font-semibold text-white">转场设计</p>
            <div className="mt-4 space-y-3">
              {creativePack.transitionPlan.map((transition) => (
                <p key={transition} className="border-l-2 border-aqua-300/55 pl-3 text-sm leading-6 text-slate-300">{transition}</p>
              ))}
            </div>
            <p className="mt-6 text-sm font-semibold text-white">音乐方向</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{creativePack.musicDirection}</p>
          </div>
          <div className="p-5 sm:p-6">
            <p className="text-sm font-semibold text-white">口播与字幕</p>
            <div className="mt-4 space-y-3">
              {creativePack.voiceover.map((line, index) => (
                <p key={`${line}-${index}`} className="text-sm leading-6 text-slate-300">
                  <span className="mr-2 text-xs font-black text-aqua-300">{String(index + 1).padStart(2, "0")}</span>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-aqua-300">完整视频 Prompt</p>
          <pre className="mt-3 whitespace-pre-wrap bg-black/24 p-4 font-mono text-xs leading-6 text-slate-200">{creativePack.fullVideoPrompt}</pre>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">Negative Prompt</p>
          <pre className="mt-3 whitespace-pre-wrap bg-black/24 p-4 font-mono text-xs leading-6 text-slate-300">{creativePack.negativePrompt}</pre>
          <div className="mt-5 flex flex-wrap gap-3">
            <CopyActionButton label="复制完整视频 Prompt" text={creativePack.fullVideoPrompt} />
            <CopyActionButton label="复制 Negative Prompt" text={creativePack.negativePrompt} />
            <CopyActionButton label="复制分镜脚本" text={creativeShotText} />
            <CopyActionButton label="复制全部视频生产包" text={creativePack.copyReadyPrompt} />
          </div>
        </div>
      </section>

      <details className="rounded-2xl border border-white/10 bg-white/[0.035]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-white">
          <span className="inline-flex items-center gap-2">
            <Clapperboard size={17} className="text-aqua-300" />
            生产信息：script / storyboard / subtitles / prompt
          </span>
          <ChevronDown size={17} className="text-slate-400" />
        </summary>
        <div className="grid gap-4 border-t border-white/10 p-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/18 p-5">
            <p className="font-semibold text-white">{creativePack.duration} 视频脚本</p>
            <div className="mt-4 space-y-3">
              {packageData.script15s.map((line) => (
                <div key={line.timeRange} className="rounded-xl border border-aqua-300/15 bg-aqua-300/[0.06] p-3">
                  <p className="text-xs font-bold text-aqua-200">{line.timeRange}</p>
                  <p className="mt-2 text-sm leading-6 text-white">{line.line}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/18 p-5">
            <p className="font-semibold text-white">分镜脚本</p>
            <div className="mt-4 grid gap-3">
              {packageData.storyboard.map((frame) => (
                <div key={frame.timeRange} className="rounded-xl border border-white/10 bg-black/18 p-4">
                  <p className="text-xs font-bold text-aqua-200">{frame.timeRange}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">画面：{frame.visual}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">旁白：{frame.voiceover}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">屏幕字幕：{frame.screenSubtitle}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/18 p-5 lg:col-span-2">
            <p className="font-semibold text-white">字幕文件</p>
            <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-black/35 p-4 font-mono text-xs leading-6 text-slate-200">
              {packageData.subtitles}
            </pre>
            {packageData.coverVisualPrompt ? (
              <p className="mt-4 text-xs leading-5 text-slate-500">Prompt：{packageData.coverVisualPrompt}</p>
            ) : null}
          </div>
        </div>
      </details>

      <div className="flex flex-wrap gap-3">
        <CopyActionButton label="复制抖音标题" text={packageData.title} />
        <CopyActionButton label="复制抖音文案" text={packageData.caption} />
        <CopyActionButton label="复制标签" text={hashtagsText} />
        <CopyActionButton label="复制 CTA" text={packageData.cta} />
        <CopyActionButton label="复制视频脚本" text={scriptText} />
        <CopyActionButton label="复制字幕" text={packageData.subtitles} />
        <ExportButton
          label="导出 JSON"
          filename="douyin-publish-package.json"
          content={JSON.stringify({ ...packageData, storyboardText }, null, 2)}
          type="application/json;charset=utf-8"
          icon="json"
        />
      </div>
    </Card>
  );
}

function InstagramAssetSection({
  contentPackage,
  visualAsset,
}: {
  contentPackage: ContentPackage;
  visualAsset?: GeneratedVisualAsset;
}) {
  const asset = contentPackage.platformAssets.instagram;
  if (!asset) return null;

  const markdown = `# Instagram Carousel

${asset.caption}

${asset.hashtags.join(" ")}`;

  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-200">Instagram Carousel Asset</p>
          <h2 className="mt-2 text-2xl font-black text-white">Instagram Carousel 成品</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            面向海外平台的生活方式 Carousel：顶部展示多页图片预览，下方是可直接发布的 caption、hashtags 和语言策略。
          </p>
        </div>
        <VisualStatusBadge asset={visualAsset} />
      </div>

      <InstagramCarouselPreview
        carouselSlides={asset.carouselSlides}
        caption={asset.caption}
        hashtags={asset.hashtags}
        renderHints={contentPackage.renderHints}
        imageUrl={visualAsset?.imageUrl}
        captionLanguageStrategy={asset.captionLanguageStrategy}
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles size={17} className="text-fuchsia-200" />
            Title / Hook candidates
          </div>
          <div className="mt-4 space-y-3">
            {(asset.titleCandidates ?? asset.carouselSlides.map((slide) => slide.title).slice(0, 3)).map((candidate, index) => (
              <p key={candidate} className="rounded-xl border border-fuchsia-300/18 bg-fuchsia-300/[0.06] px-4 py-3 text-sm font-semibold leading-6 text-fuchsia-50">
                {index + 1}. {candidate}
              </p>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            {(asset.hookCandidates ?? [asset.carouselSlides[0]?.title ?? "Start with a route."]).map((candidate) => (
              <p key={candidate} className="text-sm leading-6 text-slate-300">“{candidate}”</p>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aqua-300">Ready-to-post caption</p>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-200">{asset.caption}</pre>
          <div className="mt-5 flex flex-wrap gap-2">
            {asset.hashtags.map((tag) => (
              <span key={tag} className="rounded-full border border-aqua-300/18 bg-aqua-300/[0.06] px-3 py-1 text-xs font-semibold text-aqua-50">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <details className="rounded-2xl border border-white/10 bg-white/[0.035]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-white">
          <span className="inline-flex items-center gap-2">
            <ImageIcon size={17} className="text-aqua-300" />
            生产信息：slides / reels script / prompt
          </span>
          <ChevronDown size={17} className="text-slate-400" />
        </summary>
        <div className="grid gap-4 border-t border-white/10 p-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/18 p-5">
            <p className="font-semibold text-white">Carousel Slides</p>
            <div className="mt-4 space-y-3">
              {asset.carouselSlides.map((slide, index) => (
                <div key={slide.id} className="rounded-xl border border-white/10 bg-black/18 p-4">
                  <p className="text-xs font-bold text-aqua-200">Slide {index + 1}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{slide.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{slide.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/18 p-5">
            <p className="font-semibold text-white">Reels Script / Visual Prompt</p>
            <div className="mt-4 space-y-2">
              {asset.reelsScript.map((line) => (
                <p key={line} className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-slate-300">
                  {line}
                </p>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              {contentPackage.visualPrompts.instagramCarouselPrompt}
            </p>
          </div>
        </div>
      </details>

      <div className="flex flex-wrap gap-3">
        <CopyActionButton label="复制 Instagram Caption" text={asset.caption} />
        <CopyActionButton label="复制 Hashtags" text={asset.hashtags.join(" ")} />
        <ExportButton
          label="导出 Markdown"
          filename="instagram-carousel-package.md"
          content={markdown}
          type="text/markdown;charset=utf-8"
          icon="markdown"
        />
        <ExportButton
          label="导出 JSON"
          filename="instagram-carousel-package.json"
          content={JSON.stringify(asset, null, 2)}
          type="application/json;charset=utf-8"
          icon="json"
        />
      </div>
    </Card>
  );
}

function getGeneratedAssetCount(
  selectedPlatforms: Platform[],
  visualAssets: VisualAssetsPackage,
  contentPackage: ContentPackage,
) {
  const publishPackageCount = [
    selectedPlatforms.includes("xiaohongshu") && contentPackage.publishPackages?.xiaohongshu,
    selectedPlatforms.includes("douyin") && contentPackage.publishPackages?.douyin,
    selectedPlatforms.includes("instagram") && contentPackage.platformAssets.instagram,
  ].filter(Boolean).length;

  const imageCount = [
    visualAssets.assets.xiaohongshuCover,
    ...Object.values(visualAssets.assets.xiaohongshuPageVisuals ?? {}),
    visualAssets.assets.verticalVideoKeyframe,
    visualAssets.assets.instagramCarouselCover,
    visualAssets.assets.bannerVisual,
  ].filter((asset) => asset?.status === "success" && asset.imageUrl).length;

  return publishPackageCount + imageCount;
}

function CampaignOverview({
  contentPackage,
  selectedPlatforms,
  visualAssets,
}: {
  contentPackage: ContentPackage;
  selectedPlatforms: Platform[];
  visualAssets: VisualAssetsPackage;
}) {
  const pipelineStatus = getPipelineStatus();
  const generatedAssetCount = getGeneratedAssetCount(selectedPlatforms, visualAssets, contentPackage);

  return (
    <Card className="border-aqua-300/20 bg-aqua-300/[0.04]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aqua-300">Campaign Overview</p>
          <h2 className="mt-2 text-2xl font-black text-white">{contentPackage.campaignStrategy.coreConcept}</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            这是面向高德 AI 内容生成场景的发布包导出页，展示最终能复制、预览和交付的多平台内容资产。
          </p>
        </div>
        <Badge tone={pipelineStatus?.completed ? "green" : "aqua"}>
          {pipelineStatus?.completed ? "Pipeline 9/9 completed" : "Publishing package ready"}
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
          <p className="text-xs text-slate-400">活动主题</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-white">{contentPackage.campaignStrategy.contentAngles[0] ?? "高德 AI 文化出行内容"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
          <p className="text-xs text-slate-400">目标平台</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedPlatforms.map((platform) => (
              <Badge key={platform} tone="slate">{platformLabels[platform]}</Badge>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
          <p className="text-xs text-slate-400">生成状态</p>
          <p className="mt-2 text-sm font-semibold text-white">
            {visualAssets.status === "success"
              ? "图片与发布包已生成"
              : visualAssets.status === "partial"
                ? "发布包完成，部分图片降级"
                : "发布包完成，图片使用视觉草图"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
          <p className="text-xs text-slate-400">已生成资产数量</p>
          <p className="mt-2 text-3xl font-black text-aqua-100">{generatedAssetCount}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-white">核心卖点</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {contentPackage.campaignStrategy.productSellingPoints.slice(0, 4).map((item) => (
            <span key={item} className="rounded-full border border-aqua-300/18 bg-aqua-300/[0.06] px-3 py-1.5 text-xs font-semibold text-aqua-50">
              {item}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function AssetsPage() {
  const storedContentPackage = getContentPackage();
  const pipelineInput = getPipelineInput();

  if (!storedContentPackage) {
    return (
      <div className="space-y-8">
        <WorkflowStatusStrip />
          <SectionTitle
          eyebrow="Assets"
          title="内容资产库 / 发布包导出页"
          description="Pipeline 生成的可复制发布包、视觉预览和导出内容会在这里汇总。"
        />

        <Card className="flex flex-col gap-5 border-aqua-300/20 bg-aqua-300/5 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aqua-300">Empty State</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">还没有生成内容资产包</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              请先创建 Campaign Brief，并运行 AI Content Pipeline。生成完成后，这里会展示可直接复制的图文笔记、短视频发布包和导出入口。
            </p>
          </div>
          <Link to="/brief">
            <Button>去创建内容任务</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const pipelinePlatforms = (pipelineInput?.selectedPlatforms?.length
    ? pipelineInput.selectedPlatforms
    : pipelineInput?.platforms) as Platform[] | undefined;
  const selectedPlatforms = getSelectedPlatforms(storedContentPackage, pipelinePlatforms);
  const contentPackage = ensurePublishPackages(
    storedContentPackage,
    selectedPlatforms,
    pipelineInput?.rawRequirement.content ?? "",
  );
  const visualAssets = getVisualAssets() ?? createFallbackVisualAssetsFromContentPackage(
    contentPackage,
    selectedPlatforms,
    "No saved AI image is available for this campaign.",
  );

  const showXiaohongshu = selectedPlatforms.includes("xiaohongshu") && contentPackage.publishPackages?.xiaohongshu;
  const showDouyin = selectedPlatforms.includes("douyin") && contentPackage.publishPackages?.douyin;
  const showInstagram = selectedPlatforms.includes("instagram") && contentPackage.platformAssets.instagram;

  return (
    <div className="space-y-8">
      <WorkflowStatusStrip />
      <SectionTitle
        eyebrow="Assets"
        title="内容资产库 / 发布包导出页"
        description="这里展示最终可交付的内容资产：先看平台预览，再复制文案、脚本、字幕或导出结构化文件。"
      />

      <CampaignOverview
        contentPackage={contentPackage}
        selectedPlatforms={selectedPlatforms}
        visualAssets={visualAssets}
      />

      <div className="space-y-6">
        {showXiaohongshu ? (
          <XiaohongshuPublishPackageSection
            contentPackage={contentPackage}
            packageData={contentPackage.publishPackages!.xiaohongshu!}
            visualAsset={visualAssets.assets.xiaohongshuCover}
            pageVisualAssets={visualAssets.assets.xiaohongshuPageVisuals}
          />
        ) : null}

        {showDouyin ? (
          <DouyinPublishPackageSection
            contentPackage={contentPackage}
            packageData={contentPackage.publishPackages!.douyin!}
            visualAsset={visualAssets.assets.verticalVideoKeyframe}
          />
        ) : null}

        {showInstagram ? (
          <InstagramAssetSection
            contentPackage={contentPackage}
            visualAsset={visualAssets.assets.instagramCarouselCover}
          />
        ) : null}
      </div>

      {!showXiaohongshu && !showDouyin && !showInstagram ? (
        <Card className="border-aqua-300/20 bg-aqua-300/[0.04]">
          <div className="flex items-start gap-3">
            <PackageCheck className="mt-1 text-aqua-300" size={22} />
            <div>
              <h2 className="text-xl font-semibold text-white">当前平台暂无成品资产模块</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                当前资产页优先展示小红书、抖音和 Instagram 的成品内容。其他已选平台仍会在 Preview 中按平台形态展示预览，不会展示未选择的平台。
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <QualityScoreCard contentPackage={contentPackage} />
        <Card>
          <h3 className="text-xl font-semibold text-white">优化建议</h3>
          <div className="mt-5 space-y-3">
            {contentPackage.rewriteSuggestions.suggestions.map((suggestion) => (
              <div key={suggestion} className="rounded-lg border border-signal-400/20 bg-signal-400/10 p-4 text-sm leading-6 text-orange-50">
                {suggestion}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-6 text-slate-300">
          发布包已经按平台整理好，下一步可以校对最终平台效果。
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="ghost"
            type="button"
            onClick={() => downloadTextFile(
              "amap-campaign-publish-packages.json",
              JSON.stringify(contentPackage.publishPackages, null, 2),
              "application/json;charset=utf-8",
            )}
            className="border border-white/10"
          >
            <Download size={16} />
            导出全部发布包 JSON
          </Button>
          <Link to="/preview">
            <Button>查看平台预览</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
