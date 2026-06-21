import { createMockContentPackage } from "../../data/mockContentPackage";
import type {
  CarouselCard,
  ContentPackage,
  DouyinVideoAsset,
  InstagramAsset,
  PipelineInput,
  Platform,
  PushBannerAsset,
  StoryboardFrame,
  TikTokVideoAsset,
  XiaohongshuAsset,
} from "../../types/campaign";
import { ensurePublishPackages } from "../../utils/publishPackageUtils";
import { formatVideoDuration, inferVideoDurationSeconds } from "../../utils/videoDuration";
import {
  ArkResponseFormatUnsupportedError,
  ArkThinkingUnsupportedError,
  arkResponseText,
} from "./arkClient";

export type ContentPackageStatus =
  | "ark-content-success"
  | "ark-content-repaired"
  | "ark-content-parse-failed"
  | "ark-content-request-failed"
  | "fallback";

export type ContentPackageSource = "ark-content-success" | "ark-content-repaired" | "fallback";

export interface GenerateContentPackageResult {
  contentPackage: ContentPackage;
  source: ContentPackageSource;
  fallback: boolean;
  status: ContentPackageStatus;
  rawResponse?: string;
  errorMessage?: string;
  parseError?: string;
}

type PlatformAssetKey = keyof ContentPackage["platformAssets"];

const platformLabels: Record<Platform, string> = {
  douyin: "抖音",
  xiaohongshu: "小红书",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube_shorts: "YouTube Shorts",
  push_banner: "Push / Banner",
};

const platformAliases: Record<string, Platform> = {
  douyin: "douyin",
  抖音: "douyin",
  xiaohongshu: "xiaohongshu",
  "小红书": "xiaohongshu",
  "小紅書": "xiaohongshu",
  red: "xiaohongshu",
  rednote: "xiaohongshu",
  xhs: "xiaohongshu",
  tiktok: "tiktok",
  instagram: "instagram",
  ig: "instagram",
  ins: "instagram",
  youtube_shorts: "youtube_shorts",
  youtubeshorts: "youtube_shorts",
  "youtube shorts": "youtube_shorts",
  "yt shorts": "youtube_shorts",
  shorts: "youtube_shorts",
  push_banner: "push_banner",
  pushbanner: "push_banner",
  "push / banner": "push_banner",
  push: "push_banner",
  banner: "push_banner",
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown Ark content package error";
}

function normalizePlatforms(platforms: string[] | undefined): Platform[] {
  const normalized = (platforms ?? [])
    .map((platform) => platformAliases[platform.trim().toLowerCase()] ?? platformAliases[platform.trim()])
    .filter((platform): platform is Platform => Boolean(platform));

  return Array.from(new Set(normalized));
}

function getSelectedPlatforms(pipelineInput: PipelineInput): Platform[] {
  const selected = normalizePlatforms(pipelineInput.selectedPlatforms);
  if (selected.length > 0) return selected;
  if (pipelineInput.platforms.length > 0) return pipelineInput.platforms;
  return ["xiaohongshu"];
}

function getAssetKey(platform: Platform): PlatformAssetKey {
  if (platform === "push_banner") return "pushBanner";
  if (platform === "youtube_shorts") return "tiktok";
  return platform;
}

function getSelectedAssetKeys(platforms: Platform[]) {
  return Array.from(new Set(platforms.map(getAssetKey)));
}

type ContentPackageParseResult = {
  value: Partial<ContentPackage>;
  repaired: boolean;
};

function assertContentPackageObject(parsed: unknown): Partial<ContentPackage> {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Parsed content package is not a JSON object.");
  }

  return parsed as Partial<ContentPackage>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasMeaningfulContent(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length >= 2;
  if (Array.isArray(value)) return value.some(hasMeaningfulContent);
  if (isRecord(value)) return Object.values(value).some(hasMeaningfulContent);
  return false;
}

function assertUsableContentPackagePayload(
  payload: Partial<ContentPackage>,
  platforms: Platform[],
) {
  const root = payload as Record<string, unknown>;
  if (!isRecord(root.campaignStrategy) || !hasMeaningfulContent(root.campaignStrategy)) {
    throw new Error("Ark Content Package is incomplete: campaignStrategy is missing or empty.");
  }
  if (!isRecord(root.platformAssets)) {
    throw new Error("Ark Content Package is incomplete: platformAssets is missing.");
  }
  const platformAssets = root.platformAssets;

  const missingAssetKeys = getSelectedAssetKeys(platforms).filter(
    (assetKey) => !isRecord(platformAssets[assetKey]) || !hasMeaningfulContent(platformAssets[assetKey]),
  );
  if (missingAssetKeys.length > 0) {
    throw new Error(
      `Ark Content Package is incomplete: missing usable platform assets for ${missingAssetKeys.join(", ")}.`,
    );
  }
  if (!isRecord(root.visualPrompts) || !hasMeaningfulContent(root.visualPrompts)) {
    throw new Error("Ark Content Package is incomplete: visualPrompts is missing or empty.");
  }

  return payload;
}

function getJSONCandidates(rawText: string) {
  const trimmed = rawText.trim();
  if (!trimmed) throw new Error("Ark returned an empty content package response.");

  const candidates = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  return Array.from(new Set(candidates));
}

function stripTrailingCommas(text: string) {
  let repaired = text;
  let previous = "";

  while (repaired !== previous) {
    previous = repaired;
    repaired = repaired.replace(/,\s*([}\]])/g, "$1");
  }

  return repaired;
}

function getNextNonWhitespace(text: string, startIndex: number) {
  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];
    if (char && !/\s/.test(char)) return char;
  }

  return "";
}

function escapeUnsafeJSONStringQuotes(text: string) {
  let repaired = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (!inString) {
      if (char === "\"") inString = true;
      repaired += char;
      continue;
    }

    if (escaped) {
      repaired += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      repaired += char;
      escaped = true;
      continue;
    }

    if (char === "\"") {
      const next = getNextNonWhitespace(text, index + 1);
      const closesString = !next || next === "," || next === "}" || next === "]" || next === ":" || next === "\"";

      if (closesString) {
        inString = false;
        repaired += char;
      } else {
        repaired += "\\\"";
      }
      continue;
    }

    if (char === "\n") {
      repaired += "\\n";
      continue;
    }

    if (char === "\r") continue;

    repaired += char;
  }

  return repaired;
}

function insertLikelyMissingCommas(text: string) {
  return text
    .replace(/([}\]"0-9])(\s+)(?="[^"\n\r]+"\s*:)/g, "$1,$2")
    .replace(/\b(true|false|null)(\s+)(?="[^"\n\r]+"\s*:)/g, "$1,$2")
    .replace(/([}\]"])(\s+)(?=[{\[])/g, "$1,$2")
    .replace(/(")(\s+)(?=")/g, "$1,$2");
}

function trimDanglingJSONTail(text: string) {
  return text
    .trimEnd()
    .replace(/,\s*$/, "")
    .replace(/,\s*"[^"]*"\s*:\s*$/, "")
    .replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/, "");
}

function closeOpenJSONStructures(text: string) {
  let repaired = "";
  const closingStack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        repaired += char;
        escaped = false;
        continue;
      }

      if (char === "\\") {
        repaired += char;
        escaped = true;
        continue;
      }

      if (char === "\"") {
        inString = false;
        repaired += char;
        continue;
      }

      if (char === "\n") {
        repaired += "\\n";
        continue;
      }

      if (char === "\r") continue;

      repaired += char;
      continue;
    }

    if (char === "\"") {
      inString = true;
      repaired += char;
      continue;
    }

    if (char === "{") {
      closingStack.push("}");
      repaired += char;
      continue;
    }

    if (char === "[") {
      closingStack.push("]");
      repaired += char;
      continue;
    }

    if (char === "}" || char === "]") {
      if (closingStack[closingStack.length - 1] === char) {
        closingStack.pop();
        repaired += char;
      }
      continue;
    }

    repaired += char;
  }

  if (escaped) repaired = repaired.slice(0, -1);
  if (inString) repaired += "\"";

  return `${trimDanglingJSONTail(repaired)}${closingStack.reverse().join("")}`;
}

function buildLocalJSONRepairCandidates(candidate: string) {
  const quoteRepaired = escapeUnsafeJSONStringQuotes(candidate);
  const commaRepaired = insertLikelyMissingCommas(quoteRepaired);
  const trailingCommaRepaired = stripTrailingCommas(commaRepaired);
  const closed = closeOpenJSONStructures(trailingCommaRepaired);

  return Array.from(new Set([
    stripTrailingCommas(candidate),
    commaRepaired,
    trailingCommaRepaired,
    closed,
    stripTrailingCommas(closed),
  ])).filter((item) => item.trim());
}

function parseContentPackageJSON(
  rawText: string,
  { allowLocalRepair = false }: { allowLocalRepair?: boolean } = {},
): ContentPackageParseResult {
  const candidates = getJSONCandidates(rawText);

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      return { value: assertContentPackageObject(parsed), repaired: false };
    } catch (error) {
      lastError = error;
    }
  }

  if (allowLocalRepair) {
    for (const candidate of candidates) {
      for (const repairedCandidate of buildLocalJSONRepairCandidates(candidate)) {
        try {
          const parsed = JSON.parse(repairedCandidate) as unknown;
          return { value: assertContentPackageObject(parsed), repaired: true };
        } catch (error) {
          lastError = error;
        }
      }
    }
  }

  throw new Error(`Unable to parse Ark content package JSON: ${getErrorMessage(lastError)}`);
}

export function safeParseJSONFromLLM(rawText: string): Partial<ContentPackage> {
  return parseContentPackageJSON(rawText, { allowLocalRepair: true }).value;
}

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeStringArray(value: unknown, fallback: string[], limit = 8) {
  if (!Array.isArray(value)) return fallback.slice(0, limit);

  const normalized = value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, limit);

  return normalized.length ? normalized : fallback.slice(0, limit);
}

function normalizeNumber(value: unknown, fallback: number, min = 0, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function takeWithFallback<T>(value: T[] | undefined, fallback: T[], count: number) {
  const merged = [...(Array.isArray(value) ? value : []), ...fallback];
  return merged.slice(0, count);
}

function trimText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function createFallbackContentPackage(pipelineInput: PipelineInput, platforms: Platform[]): ContentPackage {
  const contentPackage = createMockContentPackage(
    `${pipelineInput.rawRequirement.content}\n${pipelineInput.campaignPrompt.content}`,
    platforms,
  );
  const platformNames = platforms.map((platform) => platformLabels[platform]).join("、");

  const scopedPackage: ContentPackage = {
    ...contentPackage,
    campaignStrategy: {
      ...contentPackage.campaignStrategy,
      platformStrategy: {
        ...contentPackage.campaignStrategy.platformStrategy,
        selectedPlatforms: `本轮重点平台：${platformNames}；每个平台输出 1 套内容。`,
      },
    },
    exportPackage: {
      ...contentPackage.exportPackage,
      markdownSummary: trimText(
        `${contentPackage.exportPackage.markdownSummary}\n\n## Pipeline Input\nPrompt v${pipelineInput.campaignPrompt.version} · Prompt Quality ${pipelineInput.promptScore.total}/100\n\nRaw Requirement: ${pipelineInput.rawRequirement.content}`,
        300,
      ),
      generatedAt: new Date().toISOString(),
    },
  };

  return normalizeContentPackage({}, scopedPackage, platforms, pipelineInput.rawRequirement.content);
}

function buildScopedPlatformStrategy(
  fallback: ContentPackage,
  provided: Record<string, string> | undefined,
  platforms: Platform[],
  selectedPlatformNames: string,
) {
  const strategy: Record<string, string> = {
    selectedPlatforms: `本轮重点平台：${selectedPlatformNames}；每个平台只生成 1 套内容。`,
  };

  if (platforms.some((platform) => ["douyin", "tiktok", "youtube_shorts"].includes(platform))) {
    strategy.verticalVideo = provided?.verticalVideo ?? fallback.campaignStrategy.platformStrategy.verticalVideo ?? "短视频负责快速建立痛点冲突与路线变化记忆点。";
  }
  if (platforms.includes("xiaohongshu")) {
    strategy.xiaohongshu = provided?.xiaohongshu ?? fallback.campaignStrategy.platformStrategy.xiaohongshu ?? "小红书负责可收藏、可复查的清单式路线解释。";
  }
  if (platforms.includes("instagram")) {
    strategy.instagram = provided?.instagram ?? fallback.campaignStrategy.platformStrategy.instagram ?? "Instagram 负责生活方式视觉和连续叙事。";
  }
  if (platforms.includes("push_banner")) {
    strategy.pushBanner = provided?.pushBanner ?? fallback.campaignStrategy.platformStrategy.pushBanner ?? "Push / Banner 负责即时行动转化。";
  }

  return strategy;
}

function buildScopedRewriteFallback(fallback: ContentPackage, platforms: Platform[]) {
  if (platforms.length === 1 && platforms.includes("xiaohongshu") && fallback.platformAssets.xiaohongshu) {
    return {
      issuesFound: [
        "部分卡片可以进一步补充时间、距离或排队等真实出行判断，让攻略更有收藏价值。",
        "封面标题可继续强化节日或城市文化关键词，提高首屏点击动机。",
      ],
      suggestions: [
        "小红书最后一页加入“出发前检查清单”，增强保存价值。",
        "每页视觉 Prompt 明确地图路线、历史文化地标和标题安全区。",
      ],
      improvedHook: fallback.platformAssets.xiaohongshu.coverTitle,
      improvedCaption: fallback.platformAssets.xiaohongshu.postBody,
      improvedVisualPrompt: fallback.visualPrompts.xiaohongshuCoverPrompt,
    };
  }

  if (platforms.length === 1 && platforms.includes("instagram") && fallback.platformAssets.instagram) {
    return {
      issuesFound: ["Carousel 首屏可以进一步强化生活方式视觉记忆点。"],
      suggestions: ["Instagram 维持 5 页连续叙事，用更短 caption 承接路线主张。"],
      improvedHook: fallback.platformAssets.instagram.carouselSlides[0]?.title ?? "A route that connects the city.",
      improvedCaption: fallback.platformAssets.instagram.caption,
      improvedVisualPrompt: fallback.visualPrompts.instagramCarouselPrompt,
    };
  }

  if (platforms.length === 1 && platforms.includes("push_banner") && fallback.platformAssets.pushBanner) {
    return {
      issuesFound: ["转化文案需要保持单一行动，避免塞入过多解释。"],
      suggestions: ["Push 标题聚焦当前行动，Banner 只保留一个 CTA。"],
      improvedHook: fallback.platformAssets.pushBanner.pushTitle,
      improvedCaption: fallback.platformAssets.pushBanner.bannerSubtitle,
      improvedVisualPrompt: fallback.visualPrompts.bannerPrompt,
    };
  }

  return fallback.rewriteSuggestions;
}

function normalizeCards(value: unknown, fallback: CarouselCard[], count: number) {
  const cards = Array.isArray(value)
    ? value
        .map((item, index): CarouselCard | null => {
          if (!item || typeof item !== "object") return null;
          const record = item as Partial<CarouselCard>;
          return {
            id: normalizeString(record.id, `card-${index + 1}`),
            title: normalizeString(record.title, fallback[index]?.title ?? `Page ${index + 1}`),
            body: normalizeString(record.body, fallback[index]?.body ?? ""),
            visualCue: normalizeString(record.visualCue, fallback[index]?.visualCue ?? "地图路线与城市节点视觉"),
          };
        })
        .filter((item): item is CarouselCard => Boolean(item))
    : undefined;

  return takeWithFallback(cards, fallback, count).map((card, index) => ({
    ...card,
    id: card.id || `card-${index + 1}`,
    body: trimText(card.body, 40),
  }));
}

function normalizeStoryboard(value: unknown, fallback: StoryboardFrame[]) {
  const frames = Array.isArray(value)
    ? value
        .map((item, index): StoryboardFrame | null => {
          if (!item || typeof item !== "object") return null;
          const record = item as Partial<StoryboardFrame>;
          return {
            id: normalizeString(record.id, `scene-${String(index + 1).padStart(2, "0")}`),
            scene: normalizeString(record.scene, fallback[index]?.scene ?? `${index * 3}-${index * 3 + 3}s`),
            visualCue: normalizeString(record.visualCue, fallback[index]?.visualCue ?? "地图路线关键帧"),
            copy: normalizeString(record.copy, fallback[index]?.copy ?? ""),
          };
        })
        .filter((item): item is StoryboardFrame => Boolean(item))
    : undefined;

  return frames?.length ? frames.slice(0, 10) : fallback.slice(0, 10);
}

function normalizeTikTokAsset(value: unknown, fallback: TikTokVideoAsset): TikTokVideoAsset {
  const record = value && typeof value === "object" ? value as Partial<TikTokVideoAsset> : {};
  return {
    title: normalizeString(record.title, fallback.title),
    hook: normalizeString(record.hook, fallback.hook),
    script15s: normalizeStringArray(record.script15s, fallback.script15s, 10),
    script30s: normalizeStringArray(record.script30s, fallback.script30s, 5),
    storyboard: normalizeStoryboard(record.storyboard, fallback.storyboard),
    subtitles: normalizeStringArray(record.subtitles, fallback.subtitles, 4),
    caption: normalizeString(record.caption, fallback.caption),
    hashtags: normalizeStringArray(record.hashtags, fallback.hashtags, 8),
    visualStyle: normalizeString(record.visualStyle, fallback.visualStyle),
    previewType: "vertical-video",
  };
}

function normalizeDouyinAsset(value: unknown, fallback: DouyinVideoAsset): DouyinVideoAsset {
  const record = value && typeof value === "object" ? value as Partial<DouyinVideoAsset> : {};
  return {
    title: normalizeString(record.title, fallback.title),
    hook: normalizeString(record.hook, fallback.hook),
    titleCandidates: normalizeStringArray(record.titleCandidates, fallback.titleCandidates ?? [fallback.title], 3),
    hookCandidates: normalizeStringArray(record.hookCandidates, fallback.hookCandidates ?? [fallback.hook], 2),
    script15s: normalizeStringArray(record.script15s, fallback.script15s, 10),
    storyboard: normalizeStoryboard(record.storyboard, fallback.storyboard),
    subtitles: normalizeStringArray(record.subtitles, fallback.subtitles, 4),
    coverCopy: normalizeString(record.coverCopy, fallback.coverCopy),
    hashtags: normalizeStringArray(record.hashtags, fallback.hashtags, 8),
    visualStyle: normalizeString(record.visualStyle, fallback.visualStyle),
    previewType: "vertical-video",
  };
}

function normalizeXiaohongshuAsset(value: unknown, fallback: XiaohongshuAsset): XiaohongshuAsset {
  const record = value && typeof value === "object" ? value as Partial<XiaohongshuAsset> : {};
  return {
    coverTitle: normalizeString(record.coverTitle, fallback.coverTitle),
    postBody: normalizeString(record.postBody, fallback.postBody),
    carouselCards: normalizeCards(record.carouselCards, fallback.carouselCards, 7),
    hashtags: normalizeStringArray(record.hashtags, fallback.hashtags, 8),
    commentGuide: normalizeString(record.commentGuide, fallback.commentGuide),
    previewType: "note-carousel",
  };
}

function normalizeInstagramAsset(value: unknown, fallback: InstagramAsset): InstagramAsset {
  const record = value && typeof value === "object" ? value as Partial<InstagramAsset> : {};
  return {
    carouselSlides: normalizeCards(record.carouselSlides, fallback.carouselSlides, 5),
    caption: normalizeString(record.caption, fallback.caption),
    hashtags: normalizeStringArray(record.hashtags, fallback.hashtags, 8),
    reelsScript: normalizeStringArray(record.reelsScript, fallback.reelsScript, 4),
    titleCandidates: normalizeStringArray(record.titleCandidates, fallback.titleCandidates ?? fallback.carouselSlides.map((slide) => slide.title), 3),
    hookCandidates: normalizeStringArray(record.hookCandidates, fallback.hookCandidates ?? [fallback.carouselSlides[0]?.title ?? fallback.caption], 2),
    captionLanguageStrategy: normalizeString(
      record.captionLanguageStrategy,
      fallback.captionLanguageStrategy ?? "Use English for overseas Instagram unless the brief explicitly asks for bilingual copy.",
    ),
    previewType: "instagram-carousel",
  };
}

function normalizePushBannerAsset(value: unknown, fallback: PushBannerAsset): PushBannerAsset {
  const record = value && typeof value === "object" ? value as Partial<PushBannerAsset> : {};
  return {
    pushTitle: normalizeString(record.pushTitle, fallback.pushTitle),
    pushBody: normalizeString(record.pushBody, fallback.pushBody),
    bannerTitle: normalizeString(record.bannerTitle, fallback.bannerTitle),
    bannerSubtitle: normalizeString(record.bannerSubtitle, fallback.bannerSubtitle),
    cta: normalizeString(record.cta, fallback.cta),
    abVersions: normalizeStringArray(record.abVersions, fallback.abVersions, 2),
    previewType: "notification-banner",
  };
}

function normalizePlatformAssets(
  value: Partial<ContentPackage["platformAssets"]> | undefined,
  fallback: ContentPackage["platformAssets"],
  platforms: Platform[],
): ContentPackage["platformAssets"] {
  const selectedKeys = getSelectedAssetKeys(platforms);
  const assets: ContentPackage["platformAssets"] = {};

  if (selectedKeys.includes("tiktok") && fallback.tiktok) {
    assets.tiktok = normalizeTikTokAsset(value?.tiktok, fallback.tiktok);
  }
  if (selectedKeys.includes("douyin") && fallback.douyin) {
    assets.douyin = normalizeDouyinAsset(value?.douyin, fallback.douyin);
  }
  if (selectedKeys.includes("xiaohongshu") && fallback.xiaohongshu) {
    assets.xiaohongshu = normalizeXiaohongshuAsset(value?.xiaohongshu, fallback.xiaohongshu);
  }
  if (selectedKeys.includes("instagram") && fallback.instagram) {
    assets.instagram = normalizeInstagramAsset(value?.instagram, fallback.instagram);
  }
  if (selectedKeys.includes("pushBanner") && fallback.pushBanner) {
    assets.pushBanner = normalizePushBannerAsset(value?.pushBanner, fallback.pushBanner);
  }

  return assets;
}

function normalizeContentPackage(
  value: Partial<ContentPackage>,
  fallback: ContentPackage,
  platforms: Platform[],
  sourceContext = "",
): ContentPackage {
  const campaignStrategy = (value.campaignStrategy ?? {}) as Partial<ContentPackage["campaignStrategy"]>;
  const renderHints = (value.renderHints ?? {}) as Partial<ContentPackage["renderHints"]>;
  const qualityScore = (value.qualityScore ?? {}) as Partial<ContentPackage["qualityScore"]>;
  const rewriteSuggestions = (value.rewriteSuggestions ?? {}) as Partial<ContentPackage["rewriteSuggestions"]>;
  const exportPackage = (value.exportPackage ?? {}) as Partial<ContentPackage["exportPackage"]>;
  const selectedPlatformNames = platforms.map((platform) => platformLabels[platform]).join("、");
  const hasVideoPlatform = platforms.some((platform) => ["douyin", "tiktok", "youtube_shorts"].includes(platform));
  const hasXiaohongshu = platforms.includes("xiaohongshu");
  const hasInstagram = platforms.includes("instagram");
  const hasPushBanner = platforms.includes("push_banner");
  const scopedRewriteFallback = buildScopedRewriteFallback(fallback, platforms);

  const visualPrompts = (value.visualPrompts ?? {}) as Partial<ContentPackage["visualPrompts"]>;
  const normalizedVideoPrompts = hasVideoPlatform
    ? normalizeStringArray(visualPrompts.videoKeyframePrompts, fallback.visualPrompts.videoKeyframePrompts, 3)
    : [];
  const selectedPromptCount = normalizedVideoPrompts.length +
    (hasXiaohongshu ? 1 : 0) +
    (hasInstagram ? 1 : 0) +
    (hasPushBanner ? 1 : 0);
  const maxVideoPrompts = Math.max(0, normalizedVideoPrompts.length - Math.max(0, selectedPromptCount - 3));

  const normalizedPackage: ContentPackage = {
    campaignStrategy: {
      coreConcept: normalizeString(campaignStrategy.coreConcept, fallback.campaignStrategy.coreConcept),
      userPainPoints: normalizeStringArray(campaignStrategy.userPainPoints, fallback.campaignStrategy.userPainPoints, 4),
      productSellingPoints: normalizeStringArray(
        campaignStrategy.productSellingPoints,
        fallback.campaignStrategy.productSellingPoints,
        4,
      ),
      platformStrategy: buildScopedPlatformStrategy(
        fallback,
        campaignStrategy.platformStrategy,
        platforms,
        selectedPlatformNames,
      ),
      contentAngles: normalizeStringArray(campaignStrategy.contentAngles, fallback.campaignStrategy.contentAngles, 5),
    },
    platformAssets: normalizePlatformAssets(value.platformAssets, fallback.platformAssets, platforms),
    publishPackages: value.publishPackages,
    visualPrompts: {
      videoKeyframePrompts: normalizedVideoPrompts.slice(0, maxVideoPrompts),
      xiaohongshuCoverPrompt: hasXiaohongshu
        ? normalizeString(visualPrompts.xiaohongshuCoverPrompt, fallback.visualPrompts.xiaohongshuCoverPrompt)
        : "",
      xiaohongshuCardPrompts: hasXiaohongshu
        ? normalizeStringArray(visualPrompts.xiaohongshuCardPrompts, fallback.visualPrompts.xiaohongshuCardPrompts ?? [], 9)
        : [],
      instagramCarouselPrompt: hasInstagram
        ? normalizeString(visualPrompts.instagramCarouselPrompt, fallback.visualPrompts.instagramCarouselPrompt)
        : "",
      bannerPrompt: hasPushBanner
        ? normalizeString(visualPrompts.bannerPrompt, fallback.visualPrompts.bannerPrompt)
        : "",
      styleKeywords: normalizeStringArray(visualPrompts.styleKeywords, fallback.visualPrompts.styleKeywords, 5),
    },
    renderHints: {
      theme: normalizeString(renderHints.theme, fallback.renderHints.theme),
      colorPalette: normalizeStringArray(renderHints.colorPalette, fallback.renderHints.colorPalette, 5),
      visualMood: normalizeString(renderHints.visualMood, fallback.renderHints.visualMood),
      routeStyle: normalizeString(renderHints.routeStyle, fallback.renderHints.routeStyle),
      backgroundType: normalizeString(renderHints.backgroundType, fallback.renderHints.backgroundType),
      keyObjects: normalizeStringArray(renderHints.keyObjects, fallback.renderHints.keyObjects, 6),
      cityMood: normalizeString(renderHints.cityMood, fallback.renderHints.cityMood),
      platformLayout: {
        ...(fallback.renderHints.platformLayout ?? {}),
        ...(renderHints.platformLayout ?? {}),
      },
    },
    qualityScore: {
      total: normalizeNumber(qualityScore.total, fallback.qualityScore.total, 0, 5),
      totalScore: Math.round(normalizeNumber(qualityScore.totalScore, fallback.qualityScore.totalScore, 0, 100)),
      hookStrength: normalizeNumber(qualityScore.hookStrength, fallback.qualityScore.hookStrength, 0, 5),
      platformFit: normalizeNumber(qualityScore.platformFit, fallback.qualityScore.platformFit, 0, 5),
      brandConsistency: normalizeNumber(qualityScore.brandConsistency, fallback.qualityScore.brandConsistency, 0, 5),
      painPointClarity: normalizeNumber(qualityScore.painPointClarity, fallback.qualityScore.painPointClarity, 0, 5),
      visualFeasibility: normalizeNumber(qualityScore.visualFeasibility, fallback.qualityScore.visualFeasibility, 0, 5),
      localization: normalizeNumber(qualityScore.localization, fallback.qualityScore.localization, 0, 5),
      freshness: normalizeNumber(qualityScore.freshness, fallback.qualityScore.freshness, 0, 5),
      riskLevel: normalizeNumber(qualityScore.riskLevel, fallback.qualityScore.riskLevel, 0, 5),
      dimensions: Array.isArray(qualityScore.dimensions) && qualityScore.dimensions.length
        ? qualityScore.dimensions.slice(0, 8)
        : fallback.qualityScore.dimensions,
    },
    rewriteSuggestions: {
      issuesFound: normalizeStringArray(rewriteSuggestions.issuesFound, scopedRewriteFallback.issuesFound, 4),
      suggestions: normalizeStringArray(rewriteSuggestions.suggestions, scopedRewriteFallback.suggestions, 4),
      improvedHook: normalizeString(rewriteSuggestions.improvedHook, scopedRewriteFallback.improvedHook),
      improvedCaption: normalizeString(rewriteSuggestions.improvedCaption, scopedRewriteFallback.improvedCaption),
      improvedVisualPrompt: normalizeString(
        rewriteSuggestions.improvedVisualPrompt,
        scopedRewriteFallback.improvedVisualPrompt,
      ),
    },
    exportPackage: {
      markdownSummary: trimText(
        normalizeString(exportPackage.markdownSummary, fallback.exportPackage.markdownSummary),
        300,
      ),
      csvRows: Array.isArray(exportPackage.csvRows) && exportPackage.csvRows.length
        ? exportPackage.csvRows.slice(0, platforms.length || 1)
        : fallback.exportPackage.csvRows,
      jsonReady: typeof exportPackage.jsonReady === "boolean" ? exportPackage.jsonReady : true,
      assetsChecklist: normalizeStringArray(exportPackage.assetsChecklist, fallback.exportPackage.assetsChecklist, 8),
      generatedAt: new Date().toISOString(),
    },
  };

  return ensurePublishPackages(normalizedPackage, platforms, sourceContext);
}

function buildPlatformInstructions(platforms: Platform[], durationLabel: string) {
  const instructions: string[] = [];
  if (platforms.includes("xiaohongshu")) {
    instructions.push(`小红书 platformAssets.xiaohongshu:
- coverTitle
- postBody
- carouselCards: 5-9 页，根据主题动态决定，每页包含 id、title、body、visualCue
- hashtags
- commentGuide
- previewType 必须是 "note-carousel"

小红书 publishPackages.xiaohongshu:
- pagePlan.pageCount: 5-9，必须与 pagePlan.pages 数量一致
- pagePlan.pages: 每页包含 pageType、title、subtitle、visualStyle、imagePrompt、overlayText、bodyText
- pageType 只能使用 cover / scene / landmark / route / tips / feature / cta
- cover 必须单独规划，采用官方品牌号、杂志风大片、节日营销海报或商业摄影方向
- scene / landmark 是强视觉页，主体必须是真实城市、节日或生活方式场景，路线光效只能克制点缀
- route / tips / feature / cta 是信息排版页，但不能像后台卡片、PPT 信息图或低保真地图
- titleCandidates: 3 个更像真人写的小红书标题
- hookCandidates: 2 个生活化开头
- postText 必须是可直接发布的笔记正文，不要像内部说明或报告
- carouselPages、hashtags、commentGuide 和 copyReadyText 由前端根据 pagePlan 与 platformAssets 组装，不要重复输出`);
  }
  if (platforms.includes("tiktok") || platforms.includes("youtube_shorts")) {
    instructions.push(`TikTok / YouTube Shorts platformAssets.tiktok:
- title
- hook
- script15s: 保留兼容字段名，但内容必须覆盖完整 ${durationLabel}，输出 6-10 条时间轴脚本
- script30s: 5 条以内
- storyboard: 6-10 条，每条包含 id、scene、visualCue、copy，时间范围必须连续覆盖 ${durationLabel}
- subtitles
- caption
- hashtags
- visualStyle
- previewType 必须是 "vertical-video"`);
  }
  if (platforms.includes("douyin")) {
    instructions.push(`抖音 platformAssets.douyin:
- title
- hook
- titleCandidates: 3 个
- hookCandidates: 2 个
- script15s: 保留兼容字段名，但内容必须覆盖完整 ${durationLabel}，输出 6-10 条时间轴脚本
- storyboard: 6-10 条，每条包含 id、scene、visualCue、copy，时间范围必须连续覆盖 ${durationLabel}
- subtitles
- coverCopy
- hashtags
- visualStyle
- previewType 必须是 "vertical-video"

抖音 publishPackages.douyin:
- 补充 caption、cta 和 videoCreativePack，标题候选、Hook、基础脚本和标签复用 platformAssets.douyin
- caption 必须像可直接发布的短视频文案，短促、有节奏、口语化
- videoCreativePack 必须包含 concept、styleDirection、duration、aspectRatio、creativeHook、shotList、transitionPlan、overlayCopy、voiceover、subtitles、musicDirection、fullVideoPrompt、negativePrompt、copyReadyPrompt
- shotList 根据 ${durationLabel} 输出 6-10 个镜头，每个镜头包含 timeRange、sceneGoal、visualDescription、cameraMovement、transition、overlayText、voiceover、imagePrompt、videoPrompt
- 镜头逻辑为：地图触发路线、路线变真实场景、目的地大片、产品能力自然植入、人物最终出发
- fullVideoPrompt 必须综合原始需求、抖音发布包、shotList、visualPrompts 和 renderHints，适合直接复制到可灵、即梦、Runway、Pika
- 不生成真实 MP4，不声称视频已完成；图片与视频 Prompt 均要求 no text / no logo / no watermark / no readable UI labels`);
  }
  if (platforms.includes("instagram")) {
    instructions.push(`Instagram platformAssets.instagram:
- carouselSlides: 必须 5 页，每页包含 id、title、body、visualCue
- caption
- hashtags
- reelsScript: 4 条以内
- titleCandidates: 3 个
- hookCandidates: 2 个
- captionLanguageStrategy: 明确英文或双语策略，不要无策略中英混杂
- previewType 必须是 "instagram-carousel"`);
  }
  if (platforms.includes("push_banner")) {
    instructions.push(`Push / Banner platformAssets.pushBanner:
- pushTitle
- pushBody
- bannerTitle
- bannerSubtitle
- cta
- abVersions
- previewType 必须是 "notification-banner"`);
  }

  return instructions.join("\n\n");
}

function buildPlatformAssetsSchema(platforms: Platform[]) {
  const schema: string[] = [];
  if (platforms.includes("xiaohongshu")) {
    schema.push(`"xiaohongshu": {
  "coverTitle": "string",
  "postBody": "string",
  "carouselCards": [{ "id": "card-1", "title": "string", "body": "string", "visualCue": "string" }],
  "hashtags": ["string"],
  "commentGuide": "string",
  "previewType": "note-carousel"
}`);
  }
  if (platforms.includes("tiktok") || platforms.includes("youtube_shorts")) {
    schema.push(`"tiktok": {
  "title": "string",
  "hook": "string",
  "script15s": ["string"],
  "script30s": ["string"],
  "storyboard": [{ "id": "scene-01", "scene": "0-3s", "visualCue": "string", "copy": "string" }],
  "subtitles": ["string"],
  "caption": "string",
  "hashtags": ["string"],
  "visualStyle": "string",
  "previewType": "vertical-video"
}`);
  }
  if (platforms.includes("douyin")) {
    schema.push(`"douyin": {
  "title": "string",
  "hook": "string",
  "titleCandidates": ["string"],
  "hookCandidates": ["string"],
  "script15s": ["string"],
  "storyboard": [{ "id": "scene-01", "scene": "0-3s", "visualCue": "string", "copy": "string" }],
  "subtitles": ["string"],
  "coverCopy": "string",
  "hashtags": ["string"],
  "visualStyle": "string",
  "previewType": "vertical-video"
}`);
  }
  if (platforms.includes("instagram")) {
    schema.push(`"instagram": {
  "carouselSlides": [{ "id": "slide-1", "title": "string", "body": "string", "visualCue": "string" }],
  "caption": "string",
  "hashtags": ["string"],
  "reelsScript": ["string"],
  "titleCandidates": ["string"],
  "hookCandidates": ["string"],
  "captionLanguageStrategy": "string",
  "previewType": "instagram-carousel"
}`);
  }
  if (platforms.includes("push_banner")) {
    schema.push(`"pushBanner": {
  "pushTitle": "string",
  "pushBody": "string",
  "bannerTitle": "string",
  "bannerSubtitle": "string",
  "cta": "string",
  "abVersions": ["string"],
  "previewType": "notification-banner"
}`);
  }

  return schema.join(",\n");
}

function buildPublishPackagesSchema(platforms: Platform[], durationLabel: string) {
  const schema: string[] = [];
  if (platforms.includes("xiaohongshu")) {
    schema.push(`"xiaohongshu": {
  "pagePlan": {
    "pageCount": 7,
    "pages": [{ "pageType": "cover", "title": "string", "subtitle": "string", "visualStyle": "brand-poster", "imagePrompt": "string", "overlayText": ["string"], "bodyText": "string" }]
  },
  "titleCandidates": ["string"],
  "hookCandidates": ["string"],
  "title": "string",
  "coverCopy": "string",
  "coverVisualPrompt": "string",
  "postText": "string"
}`);
  }
  if (platforms.includes("douyin")) {
    schema.push(`"douyin": {
  "caption": "string",
  "cta": "string",
  "videoCreativePack": {
    "concept": "string",
    "styleDirection": "string",
    "duration": "${durationLabel}",
    "aspectRatio": "9:16",
    "creativeHook": "string",
    "shotList": [{ "timeRange": "0-8s", "sceneGoal": "string", "visualDescription": "string", "cameraMovement": "string", "transition": "string", "overlayText": "string", "voiceover": "string", "imagePrompt": "string", "videoPrompt": "string" }],
    "transitionPlan": ["string"],
    "overlayCopy": ["string"],
    "voiceover": ["string"],
    "subtitles": ["string"],
    "musicDirection": "string",
    "fullVideoPrompt": "string",
    "negativePrompt": "string",
    "copyReadyPrompt": "string"
  }
}`);
  }

  return schema.join(",\n");
}

function buildVisualPromptsSchema(platforms: Platform[]) {
  const fields: string[] = [];
  if (platforms.some((platform) => ["douyin", "tiktok", "youtube_shorts"].includes(platform))) {
    fields.push('"videoKeyframePrompts": ["string"]');
  }
  if (platforms.includes("xiaohongshu")) {
    fields.push('"xiaohongshuCoverPrompt": "string"');
  }
  if (platforms.includes("instagram")) {
    fields.push('"instagramCarouselPrompt": "string"');
  }
  if (platforms.includes("push_banner")) {
    fields.push('"bannerPrompt": "string"');
  }
  fields.push('"styleKeywords": ["string"]');
  return fields.map((field) => `    ${field}`).join(",\n");
}

function buildUserPrompt(pipelineInput: PipelineInput, platforms: Platform[]) {
  const platformNames = platforms.map((platform) => platformLabels[platform]).join("、");
  const videoDurationSeconds = inferVideoDurationSeconds(pipelineInput.rawRequirement.content);
  const videoDurationLabel = formatVideoDuration(videoDurationSeconds);

  return `请根据已确认的 Campaign Prompt，生成完整 Content Package JSON。

硬性要求：
- 只返回一个 JSON object，响应必须以 { 开始并以 } 结束。
- 不要 Markdown，不要代码块，不要解释。
- 不要调用真实平台发布，不要生成真实视频，不要生成图片文件。
- 只生成 selectedPlatforms 对应的平台资产，不要扩展平台。
- selectedPlatforms = ${JSON.stringify(platforms)}
- 目标平台名称 = ${platformNames}
- 每个平台只生成 1 套内容。
- 短视频目标时长 = ${videoDurationLabel}。原始需求明确写出时长时按需求执行；未写时长时，宣传视频默认至少 1 分钟。
- 小红书页数不能写死：根据主题输出 pagePlan.pageCount 5-9，并生成等量 pagePlan.pages；carouselPages 由前端组装，不要重复输出。
- 小红书 pageType 使用 cover、scene、landmark、route、tips、feature、cta；至少包含 cover、一个强视觉场景页、route 和 cta。
- 小红书封面 imagePrompt 必须是官方品牌号杂志海报、商业摄影或精致插画，禁止功能卡片、流程图、虚线圆点和可读文字。
- 小红书每页 carouselCards.body 不超过 40 个汉字。
- Instagram carouselSlides 必须 5 页。
- 文案不要写成总结汇报式；小红书生活化种草，抖音短促口语强 Hook，Instagram 轻松 lifestyle。
- 同一平台需要给出 3 个 titleCandidates 和 2 个 hookCandidates；caption / postText 必须可直接复制发布。
- 短视频 storyboard 与脚本必须覆盖完整 ${videoDurationLabel}，时间范围连续，不能仍停留在 15 秒。
- 抖音 videoCreativePack.shotList 根据 ${videoDurationLabel} 输出 6-10 个镜头，且不得声称已经生成真实 MP4。
- visualPrompts 中的 Prompt 总数不超过 3 条。
- visualPrompts 只能描述无文字的视觉背景，不得要求生成文字、标题、Logo、水印、按钮或 UI 文案；所有文案由前端叠加。
- exportPackage.markdownSummary 控制在 300 字以内。
- 内容务必精炼，不要生成长篇解释。
- JSON 字符串内部不要使用未转义的英文双引号；需要引用时使用中文引号。
- 如果输出长度接近限制，优先缩短数组和省略可由前端补齐的次要字段，绝不能截断 JSON。
- 不要夸大 AI 能力，不要使用“万能、绝对最强、彻底解决所有问题”等表达。

平台资产规则：
${buildPlatformInstructions(platforms, videoDurationLabel)}

返回 JSON schema：
{
  "campaignStrategy": {
    "coreConcept": "string",
    "userPainPoints": ["string"],
    "productSellingPoints": ["string"],
    "platformStrategy": { "selectedPlatforms": "string" },
    "contentAngles": ["string"]
  },
  "platformAssets": {
${buildPlatformAssetsSchema(platforms)}
  },
  "publishPackages": {
${buildPublishPackagesSchema(platforms, videoDurationLabel)}
  },
  "visualPrompts": {
${buildVisualPromptsSchema(platforms)}
  },
  "renderHints": {
    "theme": "string",
    "colorPalette": ["#38bdf8"],
    "visualMood": "string",
    "routeStyle": "string",
    "backgroundType": "string",
    "keyObjects": ["string"],
    "cityMood": "string",
    "platformLayout": { "platform": "layout hint" }
  },
  "qualityScore": {
    "total": 4.6,
    "hookStrength": 4.6,
    "platformFit": 4.7,
    "brandConsistency": 4.6,
    "painPointClarity": 4.8,
    "visualFeasibility": 4.5,
    "localization": 4.4,
    "freshness": 4.5,
    "riskLevel": 4.8,
    "totalScore": 92,
    "dimensions": [{ "label": "Hook 强度", "score": 4.6, "note": "string" }]
  },
  "rewriteSuggestions": {
    "issuesFound": ["string"],
    "suggestions": ["string"],
    "improvedHook": "string",
    "improvedCaption": "string",
    "improvedVisualPrompt": "string"
  },
  "exportPackage": {
    "markdownSummary": "string",
    "csvRows": [{ "platform": "string", "format": "string", "title": "string", "score": 92 }],
    "jsonReady": true,
    "assetsChecklist": ["string"],
    "generatedAt": "ISO string"
  }
}

原始需求：
${pipelineInput.rawRequirement.content}

Prompt Quality:
${pipelineInput.promptScore.total}/100

Campaign Prompt:
${pipelineInput.campaignPrompt.content}`;
}

function getContentPackageTokenBudget(platforms: Platform[]) {
  let budget = 1600;

  if (platforms.includes("xiaohongshu")) budget += 850;
  if (platforms.some((platform) => ["douyin", "tiktok", "youtube_shorts"].includes(platform))) budget += 1800;
  if (platforms.includes("instagram")) budget += 450;
  if (platforms.includes("push_banner")) budget += 250;

  return Math.min(6500, budget);
}

function getContentPackageRepairTokenBudget(platforms: Platform[]) {
  return Math.min(3200, 2200 + Math.max(0, platforms.length - 1) * 300);
}

let contentResponseFormatSupport: "unknown" | "supported" | "unsupported" = "unknown";

async function requestArkContentPackage(
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens: number,
  signal?: AbortSignal,
  onStreamActivity?: () => void,
) {
  const request = (disableThinking: boolean, useResponseFormat: boolean) =>
    arkResponseText({
      systemPrompt,
      userPrompt,
      temperature: 0.1,
      maxOutputTokens,
      signal,
      stream: true,
      asyncJob: true,
      onStreamActivity,
      ...(useResponseFormat ? { responseFormat: { type: "json_object" } } : {}),
      ...(disableThinking ? { thinking: { type: "disabled" } } : {}),
    });

  const requestWithThinkingFallback = async (useResponseFormat: boolean) => {
    try {
      return await request(true, useResponseFormat);
    } catch (error) {
      if (!(error instanceof ArkThinkingUnsupportedError)) throw error;
      return request(false, useResponseFormat);
    }
  };

  if (contentResponseFormatSupport !== "unsupported") {
    try {
      const text = await requestWithThinkingFallback(true);
      contentResponseFormatSupport = "supported";
      return text;
    } catch (error) {
      if (!(error instanceof ArkResponseFormatUnsupportedError)) throw error;
      contentResponseFormatSupport = "unsupported";
    }
  }

  return requestWithThinkingFallback(false);
}

function isRetryableArkRequestError(error: unknown) {
  return /timed out|no stream activity|aborterror|failed to fetch|networkerror|status (408|429|5\d\d)/i.test(
    getErrorMessage(error),
  );
}

function waitBeforeRetry(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

async function requestArkContentPackageWithRetry({
  systemPrompt,
  userPrompt,
  maxOutputTokens,
  timeoutMs,
  maxAttempts,
  label,
}: {
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens: number;
  timeoutMs: number;
  maxAttempts: number;
  label: string;
}) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    let timedOut = false;
    let timer = 0;
    const resetActivityTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
    };
    resetActivityTimer();

    try {
      return await requestArkContentPackage(
        systemPrompt,
        userPrompt,
        maxOutputTokens,
        controller.signal,
        resetActivityTimer,
      );
    } catch (error) {
      lastError = timedOut
        ? new Error(`${label} received no stream activity for ${timeoutMs}ms (attempt ${attempt}/${maxAttempts}).`)
        : error;

      if (attempt >= maxAttempts || !isRetryableArkRequestError(lastError)) {
        throw lastError;
      }

      await waitBeforeRetry(600 * attempt);
    } finally {
      window.clearTimeout(timer);
    }
  }

  throw lastError;
}

function getDebugResponse(rawResponse: string) {
  return rawResponse.trim().slice(0, 2000);
}

export async function repairContentPackageJSON(
  rawResponse: string,
  pipelineInput: PipelineInput,
  platforms = getSelectedPlatforms(pipelineInput),
) {
  const repairSystemPrompt =
    "你是 JSON 修复器。只返回合法 JSON，不要解释，不要 Markdown。把输入内容修复为合法 ContentPackage JSON。";
  const repairUserPrompt = `修复下面的模型输出，使其成为合法 ContentPackage JSON。

硬性要求：
- 只返回一个 JSON object，不要代码块或解释。
- 只保留 selectedPlatforms 对应的平台资产：${JSON.stringify(platforms)}。
- platformAssets 仅允许这些字段：${getSelectedAssetKeys(platforms).join("、")}。
- 小红书不要固定页数；保留 pagePlan.pageCount 5-9 和 pagePlan.pages，carouselPages 缺失时由前端组装。
- 小红书 pageType 只能使用 cover / scene / landmark / route / tips / feature / cta。
- 抖音 videoCreativePack 如存在，保留 concept、6-10 条 shotList、fullVideoPrompt 和 negativePrompt；其余缺失字段由前端补齐。
- visualPrompts 总数不超过 3 条。
- markdownSummary 不超过 300 字。
- 不要逐字重写或补全整份原始响应；只保留已经可以确认的有效内容。
- 删除被截断、未闭合或无法确认的字段，优先返回紧凑的部分 ContentPackage JSON。
- campaignStrategy、所选平台的 platformAssets 和 visualPrompts 优先保留；qualityScore、rewriteSuggestions、exportPackage 缺失时可以完全省略。
- 缺失字段可以省略，前端会自动补默认值；JSON 合法和完整闭合优先于字段数量。
- JSON 字符串内部不要使用未转义的英文双引号；需要引用时使用中文引号。
- 输出结束前必须闭合全部字符串、数组和对象，绝不能在 token 限制处截断。

待修复内容：
${rawResponse.slice(0, 12000)}`;

  return requestArkContentPackageWithRetry({
    systemPrompt: repairSystemPrompt,
    userPrompt: repairUserPrompt,
    maxOutputTokens: getContentPackageRepairTokenBudget(platforms),
    timeoutMs: 60000,
    maxAttempts: 2,
    label: "Ark Content Package JSON repair request",
  });
}

export async function generateContentPackageWithArk(
  pipelineInput: PipelineInput,
): Promise<GenerateContentPackageResult> {
  const platforms = getSelectedPlatforms(pipelineInput);
  const fallback = createFallbackContentPackage(pipelineInput, platforms);
  const systemPrompt =
    "你是高德 AI 内容生成工作流的 Content Package 生成器。你只输出合法 JSON，不输出解释，不接视频、生图或真实发布 API。";

  let rawResponse = "";

  try {
    const maxOutputTokens = getContentPackageTokenBudget(platforms);
    rawResponse = await requestArkContentPackageWithRetry({
      systemPrompt,
      userPrompt: buildUserPrompt(pipelineInput, platforms),
      maxOutputTokens,
      timeoutMs: 60000,
      maxAttempts: 2,
      label: "Ark Content Package request",
    });
  } catch (error) {
    return {
      contentPackage: fallback,
      source: "fallback",
      fallback: true,
      status: "ark-content-request-failed",
      errorMessage: getErrorMessage(error),
    };
  }

  try {
    const parsed = parseContentPackageJSON(rawResponse);
    const usablePayload = assertUsableContentPackagePayload(parsed.value, platforms);

    return {
      contentPackage: normalizeContentPackage(usablePayload, fallback, platforms, pipelineInput.rawRequirement.content),
      source: "ark-content-success",
      fallback: false,
      status: "ark-content-success",
      rawResponse: getDebugResponse(rawResponse),
    };
  } catch (parseFailure) {
    const parseError = getErrorMessage(parseFailure);

    try {
      const locallyRepaired = parseContentPackageJSON(rawResponse, { allowLocalRepair: true });

      if (locallyRepaired.repaired) {
        const usablePayload = assertUsableContentPackagePayload(locallyRepaired.value, platforms);
        return {
          contentPackage: normalizeContentPackage(
            usablePayload,
            fallback,
            platforms,
            pipelineInput.rawRequirement.content,
          ),
          source: "ark-content-repaired",
          fallback: false,
          status: "ark-content-repaired",
          rawResponse: getDebugResponse(rawResponse),
        };
      }
    } catch {
      // Continue to the Ark repair pass; the original parse error is more useful for debugging.
    }

    try {
      const repairedResponse = await repairContentPackageJSON(rawResponse, pipelineInput, platforms);
      const repaired = parseContentPackageJSON(repairedResponse, { allowLocalRepair: true });
      const usablePayload = assertUsableContentPackagePayload(repaired.value, platforms);

      return {
        contentPackage: normalizeContentPackage(
          usablePayload,
          fallback,
          platforms,
          pipelineInput.rawRequirement.content,
        ),
        source: "ark-content-repaired",
        fallback: false,
        status: "ark-content-repaired",
        rawResponse: getDebugResponse(rawResponse),
      };
    } catch (repairFailure) {
      return {
        contentPackage: fallback,
        source: "fallback",
        fallback: true,
        status: "ark-content-parse-failed",
        rawResponse: getDebugResponse(rawResponse),
        parseError,
        errorMessage: `JSON repair failed: ${getErrorMessage(repairFailure)}`,
      };
    }
  }
}

export async function generateContentPackage(
  pipelineInput: PipelineInput,
): Promise<GenerateContentPackageResult> {
  return generateContentPackageWithArk(pipelineInput);
}
