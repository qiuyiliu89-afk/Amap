import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { InstagramCarouselPreview } from "../components/preview/InstagramCarouselPreview";
import { PushBannerPreview } from "../components/preview/PushBannerPreview";
import { VerticalVideoPreview } from "../components/preview/VerticalVideoPreview";
import { XiaohongshuCarouselPreview } from "../components/preview/XiaohongshuCarouselPreview";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SectionTitle } from "../components/ui/SectionTitle";
import { WorkflowStatusStrip } from "../components/workflow/WorkflowStatusStrip";
import type { ContentPackage, Platform, StoryboardFrame } from "../types/campaign";
import { ensurePublishPackages } from "../utils/publishPackageUtils";
import { getContentPackage, getPipelineInput, getVisualAssets } from "../utils/storageUtils";

function hasSelectedPlatform(selectedPlatforms: Platform[], platform: Platform) {
  if (platform === "tiktok" && selectedPlatforms.includes("youtube_shorts")) return true;
  return selectedPlatforms.length === 0 || selectedPlatforms.includes(platform);
}

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

function douyinStoryboardToFrames(contentPackage: ContentPackage): StoryboardFrame[] {
  const douyinPackage = contentPackage.publishPackages?.douyin;
  if (!douyinPackage) return contentPackage.platformAssets.douyin?.storyboard ?? [];

  return douyinPackage.storyboard.map((frame, index) => ({
    id: `douyin-final-${index + 1}`,
    scene: frame.timeRange,
    visualCue: frame.visual,
    copy: frame.voiceover,
  }));
}

function PlatformPreviewCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aqua-300">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        </div>
        <Badge tone="green">最终效果预览</Badge>
      </div>
      {children}
    </Card>
  );
}

export function PreviewPage() {
  const storedContentPackage = getContentPackage();
  const pipelineInput = getPipelineInput();
  const generatedVisualAssets = getVisualAssets();

  if (!storedContentPackage) {
    return (
      <div className="space-y-8">
        <WorkflowStatusStrip />
        <SectionTitle
          eyebrow="Preview"
          title="平台最终效果预览"
          description="内容资产包生成后，这里会按照已选择平台渲染最终发布效果。"
        />

        <Card className="flex flex-col gap-5 border-aqua-300/20 bg-aqua-300/5 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aqua-300">Empty State</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">还没有可预览的内容资产</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              请先完成 Campaign Brief 和 AI Content Pipeline。Preview 页面只展示最终平台效果，不展示技术字段。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/assets">
              <Button variant="secondary">返回内容资产库</Button>
            </Link>
            <Link to="/brief">
              <Button>创建任务</Button>
            </Link>
          </div>
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
  const { platformAssets, renderHints, publishPackages } = contentPackage;
  const previewBlocks = [
    hasSelectedPlatform(selectedPlatforms, "douyin") && platformAssets.douyin ? (
      <PlatformPreviewCard
        key="douyin"
        eyebrow="Douyin"
        title="抖音竖版预览"
        description="首帧图作为背景，Hook、字幕、话题和互动按钮全部由前端叠加。"
      >
        <VerticalVideoPreview
          hook={publishPackages?.douyin?.hook ?? platformAssets.douyin.hook}
          subtitles={publishPackages?.douyin?.script15s.map((line) => line.line) ?? platformAssets.douyin.subtitles}
          storyboard={douyinStoryboardToFrames(contentPackage)}
          visualStyle={platformAssets.douyin.visualStyle}
          renderHints={renderHints}
          hashtags={publishPackages?.douyin?.hashtags ?? platformAssets.douyin.hashtags}
          imageUrl={generatedVisualAssets?.assets.verticalVideoKeyframe?.imageUrl}
        />
        <div className="mt-5 rounded-lg border border-aqua-300/20 bg-aqua-300/[0.055] px-4 py-4 text-sm leading-6 text-aqua-50">
          <p className="font-semibold">AI 视频 Prompt 已生成，可复制到可灵、即梦、Runway、Pika 等视频生成工具制作成片。</p>
          <p className="mt-1 text-xs text-slate-400">当前交付为视频创意生产包与前端预览，不代表已经生成真实 MP4。</p>
        </div>
      </PlatformPreviewCard>
    ) : null,
    hasSelectedPlatform(selectedPlatforms, "xiaohongshu") && platformAssets.xiaohongshu ? (
      <div key="xiaohongshu" className="lg:col-span-2">
        <PlatformPreviewCard
          eyebrow="Xiaohongshu"
          title="小红书官方品牌级图文预览"
          description={`${publishPackages?.xiaohongshu?.recommendedPageCount ?? platformAssets.xiaohongshu.carouselCards.length} 页动态图文轮播 + 笔记正文，封面独立生成，强视觉页与信息排版页使用不同结构。`}
        >
          <XiaohongshuCarouselPreview
            coverTitle={platformAssets.xiaohongshu.coverTitle}
            carouselCards={platformAssets.xiaohongshu.carouselCards}
            postBody={platformAssets.xiaohongshu.postBody}
            hashtags={platformAssets.xiaohongshu.hashtags}
            renderHints={renderHints}
            imageUrl={generatedVisualAssets?.assets.xiaohongshuCover?.imageUrl}
            pageImageUrls={Object.fromEntries(
              Object.entries(generatedVisualAssets?.assets.xiaohongshuPageVisuals ?? {})
                .filter(([, asset]) => asset.status === "success" && asset.imageUrl)
                .map(([pageId, asset]) => [pageId, asset.imageUrl]),
            )}
            publishPackage={publishPackages?.xiaohongshu}
          />
        </PlatformPreviewCard>
      </div>
    ) : null,
    hasSelectedPlatform(selectedPlatforms, "tiktok") && platformAssets.tiktok ? (
      <PlatformPreviewCard
        key="tiktok"
        eyebrow="TikTok"
        title="TikTok 竖版预览"
        description="用于海外短视频校对，保留平台口语化 Hook 与字幕节奏。"
      >
        <VerticalVideoPreview
          hook={platformAssets.tiktok.hook}
          subtitles={platformAssets.tiktok.subtitles}
          storyboard={platformAssets.tiktok.storyboard}
          visualStyle={platformAssets.tiktok.visualStyle}
          renderHints={renderHints}
          hashtags={platformAssets.tiktok.hashtags}
          imageUrl={generatedVisualAssets?.assets.verticalVideoKeyframe?.imageUrl}
        />
      </PlatformPreviewCard>
    ) : null,
    hasSelectedPlatform(selectedPlatforms, "instagram") && platformAssets.instagram ? (
      <PlatformPreviewCard
        key="instagram"
        eyebrow="Instagram"
        title="Instagram Carousel 预览"
        description="顶部展示多页生活方式图片，下方是可直接发布的 caption、hashtags 和语言策略。"
      >
        <InstagramCarouselPreview
          carouselSlides={platformAssets.instagram.carouselSlides}
          caption={platformAssets.instagram.caption}
          hashtags={platformAssets.instagram.hashtags}
          renderHints={renderHints}
          imageUrl={generatedVisualAssets?.assets.instagramCarouselCover?.imageUrl}
          captionLanguageStrategy={platformAssets.instagram.captionLanguageStrategy}
        />
      </PlatformPreviewCard>
    ) : null,
    hasSelectedPlatform(selectedPlatforms, "push_banner") && platformAssets.pushBanner ? (
      <div key="pushBanner" className="lg:col-span-2">
        <PlatformPreviewCard
          eyebrow="Push / Banner"
          title="Push 与 Banner 预览"
          description="短转化文案、CTA 和视觉背景用于发布前校对。"
        >
          <PushBannerPreview
            pushTitle={platformAssets.pushBanner.pushTitle}
            pushBody={platformAssets.pushBanner.pushBody}
            bannerTitle={platformAssets.pushBanner.bannerTitle}
            bannerSubtitle={platformAssets.pushBanner.bannerSubtitle}
            cta={platformAssets.pushBanner.cta}
            renderHints={renderHints}
            imageUrl={generatedVisualAssets?.assets.bannerVisual?.imageUrl}
          />
        </PlatformPreviewCard>
      </div>
    ) : null,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <WorkflowStatusStrip />
      <SectionTitle
        eyebrow="Preview"
        title="平台最终效果预览"
        description="这里展示最终平台观感：图片只做背景，标题、正文、按钮、字幕和平台 UI 都由前端叠加。"
      />

      {previewBlocks.length ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          {previewBlocks}
        </div>
      ) : (
        <Card className="border-orange-300/20 bg-orange-300/5">
          <h2 className="text-xl font-semibold text-white">当前平台没有可渲染预览</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Content Package 中没有与已选平台匹配的发布包。请回到 Brief 选择平台，或重新运行 Pipeline。
          </p>
        </Card>
      )}

      <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-6 text-slate-300">
          预览用于发布前校对；系统不会调用真实平台发布接口，也不会生成真实 MP4。
        </p>
        <Link to="/batch">
          <Button>Go to Batch Matrix</Button>
        </Link>
      </Card>
    </div>
  );
}
