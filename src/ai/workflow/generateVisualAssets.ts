import { ArkImageGenerationError, generateImageWithArk } from "../api/generateImageWithArk";
import type {
  ContentPackage,
  GeneratedVisualAsset,
  Platform,
  VisualAssetsPackage,
} from "../../types/campaign";

type SelectedVisualPlatform = Platform | "pushBanner";
type VisualAssetKey = keyof VisualAssetsPackage["assets"];

const visualRequestGapMs = 1800;
const imageOnlyConstraints =
  "no text, no typography, no logo, no watermark, no UI text, background visual only, leave clean space for frontend overlay text, clean composition, premium commercial campaign art direction, no random letters";

function normalizeSelectedPlatforms(selectedPlatforms: SelectedVisualPlatform[]) {
  return Array.from(new Set(
    selectedPlatforms.map((platform) => platform === "pushBanner" ? "push_banner" : platform),
  ));
}

function cleanPrompt(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeImagePrompt(prompt: string) {
  return prompt
    .replace(/高德地图\s*(?:logo|Logo|LOGO)/g, "抽象地图路线视觉灵感")
    .replace(/\b(?:logo|typography|headline|caption|wording|watermark|UI text)\b/gi, "")
    .replace(/(?:文字|字体|标题|文案|字幕|按钮|标签|标语|水印|品牌标识|官方标识)[^，。,.;；]*/g, "")
    .replace(/\s*\+\s*/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/[，,]{2,}/g, "，")
    .trim();
}

function enhanceImagePrompt(prompt: string) {
  const basePrompt = sanitizeImagePrompt(prompt);
  return `BACKGROUND IMAGE ONLY. ${imageOnlyConstraints}. Visual direction: ${basePrompt}. ${imageOnlyConstraints}.`;
}

function buildFallbackVisualPrompt(
  contentPackage: ContentPackage,
  platform: GeneratedVisualAsset["platform"],
) {
  const { renderHints, platformAssets, campaignStrategy } = contentPackage;
  const commonVisualCues = [
    renderHints.theme,
    renderHints.visualMood,
    renderHints.routeStyle,
    renderHints.backgroundType,
    renderHints.cityMood,
    ...renderHints.keyObjects.slice(0, 5),
    ...renderHints.colorPalette.slice(0, 4),
  ];

  let platformCues: string[] = [];
  if (platform === "xiaohongshu") {
    platformCues = [
      platformAssets.xiaohongshu?.coverTitle,
      platformAssets.xiaohongshu?.carouselCards[0]?.visualCue,
      "Xiaohongshu official brand account visual, editorial travel poster, cinematic destination scene, one strong real-world subject, premium commercial photography or polished illustration, portrait-friendly composition, no cards, no map pins, no dotted route",
    ].filter((value): value is string => Boolean(value));
  } else if (platform === "tiktok" || platform === "douyin") {
    const videoAsset = platform === "douyin" ? platformAssets.douyin : platformAssets.tiktok;
    platformCues = [
      videoAsset?.storyboard[0]?.visualCue,
      videoAsset?.visualStyle,
      "cinematic vertical video opening keyframe, 9:16 composition",
    ].filter((value): value is string => Boolean(value));
  } else if (platform === "instagram") {
    platformCues = [
      platformAssets.instagram?.carouselSlides[0]?.visualCue,
      "premium lifestyle travel carousel cover, square composition",
    ].filter((value): value is string => Boolean(value));
  } else if (platform === "pushBanner") {
    platformCues = [
      platformAssets.pushBanner?.bannerSubtitle,
      "wide campaign banner background, strong focal area with clean copy space",
    ].filter((value): value is string => Boolean(value));
  }

  return [
    `${platform} campaign background visual for an Amap AI content generation workflow`,
    campaignStrategy.coreConcept,
    ...commonVisualCues,
    ...platformCues,
    "Treat all wording only as semantic visual guidance and do not render any words",
  ].filter(Boolean).join(", ");
}

function getErrorMessage(error: unknown) {
  if (error instanceof ArkImageGenerationError) {
    return [error.status ? `HTTP ${error.status}` : "Ark image error", error.detail || error.message]
      .filter(Boolean)
      .join(": ");
  }
  return error instanceof Error ? error.message : "Unknown Ark image generation error";
}

async function generateAsset(
  key: VisualAssetKey,
  platform: GeneratedVisualAsset["platform"],
  sourcePrompt: string,
): Promise<[VisualAssetKey, GeneratedVisualAsset]> {
  return [key, await generateAssetValue(platform, sourcePrompt)];
}

function waitBeforeNextVisualRequest() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, visualRequestGapMs));
}

async function runVisualTasksSequentially<T>(tasks: Array<() => Promise<T>>) {
  const results: T[] = [];

  for (let index = 0; index < tasks.length; index += 1) {
    if (index > 0) {
      await waitBeforeNextVisualRequest();
    }
    results.push(await tasks[index]());
  }

  return results;
}

async function generateAssetValue(
  platform: GeneratedVisualAsset["platform"],
  sourcePrompt: string,
): Promise<GeneratedVisualAsset> {
  const prompt = enhanceImagePrompt(sourcePrompt);

  try {
    const result = await generateImageWithArk(prompt);
    return {
      platform,
      imageUrl: result.imageUrl,
      prompt,
      status: "success",
    };
  } catch (error) {
    return {
      platform,
      imageUrl: "",
      prompt,
      status: "fallback",
      errorMessage: getErrorMessage(error),
    };
  }
}

function getXiaohongshuVisualPages(contentPackage: ContentPackage) {
  return (contentPackage.publishPackages?.xiaohongshu?.carouselPages ?? [])
    .filter((page) => page.pageType === "scene" || page.pageType === "landmark")
    .slice(0, 2);
}

export function createFallbackVisualAssetsFromContentPackage(
  contentPackage: ContentPackage,
  selectedPlatforms: SelectedVisualPlatform[],
  errorMessage = "AI image generation is disabled; using frontend visual draft.",
): VisualAssetsPackage {
  const platforms = normalizeSelectedPlatforms(selectedPlatforms);
  const assets: VisualAssetsPackage["assets"] = {};

  if (platforms.includes("xiaohongshu")) {
    assets.xiaohongshuCover = {
      platform: "xiaohongshu",
      imageUrl: "",
      prompt: enhanceImagePrompt(
        contentPackage.publishPackages?.xiaohongshu?.coverVisualPrompt
          || buildFallbackVisualPrompt(contentPackage, "xiaohongshu"),
      ),
      status: "fallback",
      errorMessage,
    };
    assets.xiaohongshuPageVisuals = Object.fromEntries(
      getXiaohongshuVisualPages(contentPackage).map((page) => [page.id, {
        platform: "xiaohongshu" as const,
        imageUrl: "",
        prompt: enhanceImagePrompt(page.imagePrompt),
        status: "fallback" as const,
        errorMessage,
      }]),
    );
  }
  if (platforms.includes("tiktok") || platforms.includes("douyin")) {
    const platform = platforms.includes("tiktok") ? "tiktok" : "douyin";
    const creativePrompt = platform === "douyin"
      ? contentPackage.publishPackages?.douyin?.videoCreativePack.shotList[0]?.imagePrompt
      : undefined;
    assets.verticalVideoKeyframe = {
      platform,
      imageUrl: "",
      prompt: enhanceImagePrompt(creativePrompt || buildFallbackVisualPrompt(contentPackage, platform)),
      status: "fallback",
      errorMessage,
    };
  }
  if (platforms.includes("instagram")) {
    assets.instagramCarouselCover = {
      platform: "instagram",
      imageUrl: "",
      prompt: enhanceImagePrompt(buildFallbackVisualPrompt(contentPackage, "instagram")),
      status: "fallback",
      errorMessage,
    };
  }
  if (platforms.includes("push_banner")) {
    assets.bannerVisual = {
      platform: "pushBanner",
      imageUrl: "",
      prompt: enhanceImagePrompt(buildFallbackVisualPrompt(contentPackage, "pushBanner")),
      status: "fallback",
      errorMessage,
    };
  }

  return {
    source: "ark-image",
    status: "fallback",
    generatedAt: new Date().toISOString(),
    assets,
  };
}

export async function generateVisualAssetsFromContentPackage(
  contentPackage: ContentPackage,
  selectedPlatforms: SelectedVisualPlatform[],
): Promise<VisualAssetsPackage> {
  const platforms = normalizeSelectedPlatforms(selectedPlatforms);
  const tasks: Array<() => Promise<[VisualAssetKey, GeneratedVisualAsset]>> = [];
  let xiaohongshuPageTasks: Array<() => Promise<[string, GeneratedVisualAsset]>> = [];

  if (platforms.includes("xiaohongshu")) {
    const prompt = cleanPrompt(contentPackage.publishPackages?.xiaohongshu?.coverVisualPrompt)
      || cleanPrompt(contentPackage.visualPrompts.xiaohongshuCoverPrompt)
      || cleanPrompt(contentPackage.visualPrompts.xiaohongshuCardPrompts?.[0])
      || buildFallbackVisualPrompt(contentPackage, "xiaohongshu");
    tasks.push(() => generateAsset("xiaohongshuCover", "xiaohongshu", prompt));
    xiaohongshuPageTasks = getXiaohongshuVisualPages(contentPackage).map((page) => async () => ([
      page.id,
      await generateAssetValue("xiaohongshu", page.imagePrompt),
    ] as [string, GeneratedVisualAsset]));
  }

  if (platforms.includes("tiktok") || platforms.includes("douyin")) {
    const platform = platforms.includes("tiktok") ? "tiktok" : "douyin";
    const creativePrompt = platform === "douyin"
      ? cleanPrompt(contentPackage.publishPackages?.douyin?.videoCreativePack.shotList[0]?.imagePrompt)
      : "";
    const prompt = creativePrompt
      || cleanPrompt(contentPackage.visualPrompts.videoKeyframePrompts?.[0])
      || buildFallbackVisualPrompt(contentPackage, platform);
    tasks.push(() => generateAsset("verticalVideoKeyframe", platform, prompt));
  }

  if (platforms.includes("instagram")) {
    const prompt = cleanPrompt(contentPackage.visualPrompts.instagramCarouselPrompt)
      || buildFallbackVisualPrompt(contentPackage, "instagram");
    tasks.push(() => generateAsset("instagramCarouselCover", "instagram", prompt));
  }

  if (platforms.includes("push_banner")) {
    const prompt = cleanPrompt(contentPackage.visualPrompts.bannerPrompt)
      || buildFallbackVisualPrompt(contentPackage, "pushBanner");
    tasks.push(() => generateAsset("bannerVisual", "pushBanner", prompt));
  }

  const entries = await runVisualTasksSequentially(tasks);
  const xiaohongshuPageEntries = await runVisualTasksSequentially(xiaohongshuPageTasks);
  const assets = Object.fromEntries(entries) as VisualAssetsPackage["assets"];
  if (xiaohongshuPageEntries.length) {
    assets.xiaohongshuPageVisuals = Object.fromEntries(xiaohongshuPageEntries);
  }
  const generatedAssets = [
    assets.xiaohongshuCover,
    ...Object.values(assets.xiaohongshuPageVisuals ?? {}),
    assets.verticalVideoKeyframe,
    assets.instagramCarouselCover,
    assets.bannerVisual,
  ].filter((asset): asset is GeneratedVisualAsset => Boolean(asset));
  const successCount = generatedAssets.filter((asset) => asset?.status === "success").length;
  const status: VisualAssetsPackage["status"] = successCount === generatedAssets.length && generatedAssets.length > 0
    ? "success"
    : successCount > 0
      ? "partial"
      : "fallback";

  return {
    source: "ark-image",
    status,
    generatedAt: new Date().toISOString(),
    assets,
  };
}
