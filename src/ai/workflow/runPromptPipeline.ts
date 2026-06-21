import {
  generateContentPackageWithArk,
  type ContentPackageSource,
  type ContentPackageStatus,
} from "../api/generateContentPackage";
import {
  createFallbackVisualAssetsFromContentPackage,
  generateVisualAssetsFromContentPackage,
} from "./generateVisualAssets";
import type {
  ContentPackage,
  ExportPackageData,
  PipelineInput,
  PipelineRunState,
  PipelineStepState,
  Platform,
  VisualAssetsPackage,
} from "../../types/campaign";

const platformLabels = {
  douyin: "抖音",
  xiaohongshu: "小红书",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube_shorts: "YouTube Shorts",
  push_banner: "Push / Banner",
};

const definitions = [
  ["prompt-compile", "Prompt 编译", "读取 Campaign Prompt，拆解任务目标、平台、内容格式和输出约束。"],
  ["strategy", "内容策略生成", "生成 Campaign 核心概念、用户痛点、产品卖点、平台策略和传播角度。"],
  ["platform-content", "多平台内容生成", "按平台路由生成短视频脚本、图文卡片、Carousel 和 Push / Banner。"],
  ["visual-prompts", "视觉 Prompt 生成", "生成视频关键帧、图文封面、Carousel 背景和 Banner 视觉 Prompt。"],
  ["visual-assets", "视觉素材生成", "按目标平台调用火山方舟生成单张视觉背景；失败时保留前端视觉草图。"],
  ["preview-data", "平台预览渲染", "准备短视频、小红书、Instagram、Push 和 Banner 所需预览数据。"],
  ["quality", "质量评分", "评估 Hook、平台适配、品牌一致性、视觉可执行性、本地化和风险等级。"],
  ["rewrite", "优化建议", "生成问题诊断、优化动作以及改进后的 Hook、Caption 和视觉 Prompt。"],
  ["export", "导出发布包", "整理 Markdown、JSON、CSV 和资产检查清单。"],
] as const;

export const pipelineRuntimeVersion = 2;

export function createInitialPipelineSteps(): PipelineStepState[] {
  return definitions.map(([id, title, description], index) => ({
    id,
    index: index + 1,
    title,
    description,
    status: "waiting",
    outputSummary: "等待上一节完成",
  }));
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Pipeline aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function countVideoPrompts(contentPackage: ContentPackage | null) {
  return contentPackage?.visualPrompts.videoKeyframePrompts.length ?? 4;
}

function getSelectedPlatforms(pipelineInput: PipelineInput): Platform[] {
  const selectedPlatforms = pipelineInput.selectedPlatforms
    ?.filter((platform): platform is Platform => platform in platformLabels);
  if (selectedPlatforms?.length) return selectedPlatforms;
  return pipelineInput.platforms.length ? pipelineInput.platforms : ["xiaohongshu"];
}

function getPackageModeLabel(contentStatus: ContentPackageStatus | null) {
  if (contentStatus === "ark-content-success") return "Ark Content Package mode";
  if (contentStatus === "ark-content-repaired") return "Ark repaired Content Package mode";
  if (contentStatus === "ark-content-parse-failed") return "API returned, JSON parse failed";
  if (contentStatus === "ark-content-request-failed") return "API request failed";
  return "Fallback Content Package mode";
}

function getSelectedPlatformAssetNames(contentPackage: ContentPackage | null, platforms: Platform[]) {
  if (!contentPackage) return "等待内容包生成";

  const names: string[] = [];
  if ((platforms.includes("tiktok") || platforms.includes("youtube_shorts")) && contentPackage.platformAssets.tiktok) names.push("TikTok / Shorts");
  if (platforms.includes("douyin") && contentPackage.platformAssets.douyin) names.push("抖音");
  if (platforms.includes("xiaohongshu") && contentPackage.platformAssets.xiaohongshu) names.push("小红书");
  if (platforms.includes("instagram") && contentPackage.platformAssets.instagram) names.push("Instagram");
  if (platforms.includes("push_banner") && contentPackage.platformAssets.pushBanner) names.push("Push / Banner");

  return names.length ? names.join("、") : "无匹配平台资产";
}

function getPreviewSummary(contentPackage: ContentPackage | null, platforms: Platform[]) {
  if (!contentPackage) return "等待平台预览数据生成";

  const summaries: string[] = [];
  if ((platforms.includes("tiktok") || platforms.includes("youtube_shorts")) && contentPackage.platformAssets.tiktok) summaries.push("9:16 短视频预览");
  if (platforms.includes("douyin") && contentPackage.platformAssets.douyin) summaries.push("抖音竖屏预览");
  if (platforms.includes("xiaohongshu") && contentPackage.platformAssets.xiaohongshu) summaries.push(`${contentPackage.platformAssets.xiaohongshu.carouselCards.length} 页小红书图文轮播`);
  if (platforms.includes("instagram") && contentPackage.platformAssets.instagram) summaries.push(`${contentPackage.platformAssets.instagram.carouselSlides.length} 页 Instagram Carousel`);
  if (platforms.includes("push_banner") && contentPackage.platformAssets.pushBanner) summaries.push("Push / Banner 预览");

  return summaries.join("、") || "无匹配平台预览";
}

function getVisualAssetsSummary(visualAssets: VisualAssetsPackage | null, enabled: boolean) {
  if (!visualAssets || !enabled) {
    return "Fallback visual draft · 视觉素材生成关闭，继续使用前端视觉草图。";
  }

  const assets = [
    visualAssets.assets.xiaohongshuCover,
    ...Object.values(visualAssets.assets.xiaohongshuPageVisuals ?? {}),
    visualAssets.assets.verticalVideoKeyframe,
    visualAssets.assets.instagramCarouselCover,
    visualAssets.assets.bannerVisual,
  ].filter(Boolean);
  const successCount = assets.filter((asset) => asset?.status === "success").length;
  if (visualAssets.status === "success") {
    return `AI image generated · ${successCount}/${assets.length} 项平台视觉背景生成成功。`;
  }
  if (visualAssets.status === "partial") {
    return `AI image partially generated · ${successCount}/${assets.length} 项成功，其余使用前端视觉草图。`;
  }
  return `Fallback visual draft · ${assets.length} 项视觉背景均使用前端视觉草图。`;
}

function createStepOutputSummary({
  index,
  pipelineInput,
  contentPackage,
  visualAssets,
  contentSource,
  contentStatus,
}: {
  index: number;
  pipelineInput: PipelineInput;
  contentPackage: ContentPackage | null;
  visualAssets: VisualAssetsPackage | null;
  contentSource: ContentPackageSource | null;
  contentStatus: ContentPackageStatus | null;
}) {
  const selectedPlatforms = getSelectedPlatforms(pipelineInput);
  const platformNames = selectedPlatforms.map((platform) => platformLabels[platform]).join("、");
  const packageData = contentPackage;

  const summaries = [
    `已编译 Prompt v${pipelineInput.campaignPrompt.version}，识别 ${pipelineInput.platforms.length} 个平台、${pipelineInput.outputCount} 条/平台和结构化输出约束。`,
    packageData
      ? `${getPackageModeLabel(contentStatus)}。核心概念已生成：${packageData.campaignStrategy.coreConcept}`
      : "核心概念已生成：把分散的旅行收藏、时间与实时路况整理成一条可以直接出发的城市路线。",
    `已按 ${platformNames} 完成内容路由，仅生成 ${getSelectedPlatformAssetNames(packageData, selectedPlatforms)} 平台资产。${contentSource?.startsWith("ark-content") ? "内容来自火山方舟文本模型。" : "内容来自稳定兜底结果。"}`,
    packageData
      ? `已生成视觉 Prompt：${countVideoPrompts(packageData)} 条视频关键帧，关键词 ${packageData.visualPrompts.styleKeywords.slice(0, 3).join("、") || "地图路线、城市节点、AI 光效"}。`
      : "已生成视觉 Prompt 和构图说明。",
    getVisualAssetsSummary(visualAssets, pipelineInput.generateVisuals),
    `已生成平台预览数据：${getPreviewSummary(packageData, selectedPlatforms)}。`,
    pipelineInput.enableQualityScoring && packageData
      ? `八维质量评分完成，综合评分 ${packageData.qualityScore.totalScore}/100，风险边界清晰。`
      : "已完成基础品牌与风险检查。",
    packageData
      ? `发现 ${packageData.rewriteSuggestions.issuesFound.length} 项可优化问题，已生成改进 Hook、Caption 和视觉 Prompt。`
      : "已生成问题诊断、优化建议和改进版本。",
    packageData
      ? `导出包已就绪：Markdown、JSON、${packageData.exportPackage.csvRows.length} 行 CSV 与 ${packageData.exportPackage.assetsChecklist.length} 项资产清单。`
      : "导出包已就绪：Markdown、JSON、CSV 与资产清单。",
  ];

  return summaries[index];
}

export interface PromptPipelineResult {
  contentPackage: ContentPackage;
  visualAssets: VisualAssetsPackage;
  pipelineStatus: PipelineRunState;
  exportPackage: ExportPackageData;
}

export interface RunPromptPipelineOptions {
  pipelineInput: PipelineInput;
  onStepUpdate?: (status: PipelineRunState) => void;
  onComplete?: (result: PromptPipelineResult) => void;
  signal?: AbortSignal;
  stepDelay?: number;
}

export async function runPromptPipeline({
  pipelineInput,
  onStepUpdate,
  onComplete,
  signal,
  stepDelay = 700,
}: RunPromptPipelineOptions): Promise<PromptPipelineResult> {
  const steps = createInitialPipelineSteps();
  const emit = (status: PipelineRunState) => onStepUpdate?.(structuredClone(status));
  let visualAssets: VisualAssetsPackage | null = null;
  let contentPackage: ContentPackage | null = null;
  let contentSource: ContentPackageSource | null = null;
  let contentStatus: ContentPackageStatus | null = null;
  let contentError = "";
  let contentRawResponse = "";
  let contentParseError = "";
  let contentFallback = true;

  let status: PipelineRunState = {
    pipelineVersion: pipelineRuntimeVersion,
    status: "running",
    currentStep: 0,
    completedSteps: 0,
    source: "fallback",
    updatedAt: new Date().toISOString(),
    steps,
    completed: false,
    stepsCompleted: 0,
  };

  for (let index = 0; index < steps.length; index += 1) {
    if (signal?.aborted) throw new DOMException("Pipeline aborted", "AbortError");
    steps[index] = { ...steps[index], status: "running", outputSummary: "正在生成本步骤输出..." };
    status = { ...status, currentStep: index, steps, updatedAt: new Date().toISOString() };
    emit(status);

    await wait(stepDelay, signal);

    if (index === 1) {
      const generated = await generateContentPackageWithArk(pipelineInput);
      contentPackage = generated.contentPackage;
      contentSource = generated.source;
      contentStatus = generated.status;
      contentError = generated.errorMessage ?? "";
      contentRawResponse = generated.rawResponse ?? "";
      contentParseError = generated.parseError ?? "";
      contentFallback = generated.fallback;
      status = {
        ...status,
        source: generated.source,
        fallback: generated.fallback,
        contentPackageStatus: generated.status,
        contentPackageError: generated.errorMessage,
        contentPackageRawResponse: generated.rawResponse,
        contentPackageParseError: generated.parseError,
      };
    }

    if (index === 4 && contentPackage) {
      const selectedPlatforms = getSelectedPlatforms(pipelineInput);
      if (pipelineInput.generateVisuals) {
        try {
          visualAssets = await generateVisualAssetsFromContentPackage(contentPackage, selectedPlatforms);
        } catch (error) {
          visualAssets = createFallbackVisualAssetsFromContentPackage(
            contentPackage,
            selectedPlatforms,
            error instanceof Error ? error.message : "Unexpected visual generation error",
          );
        }
      } else {
        visualAssets = createFallbackVisualAssetsFromContentPackage(
          contentPackage,
          selectedPlatforms,
          "Visual generation was disabled in Pipeline Input.",
        );
      }
    }

    steps[index] = {
      ...steps[index],
      status: "done",
      outputSummary: createStepOutputSummary({
        index,
        pipelineInput,
        contentPackage,
        visualAssets,
        contentSource,
        contentStatus,
      }),
      completedAt: new Date().toISOString(),
    };
    status = {
      ...status,
      currentStep: index < steps.length - 1 ? index + 1 : -1,
      completedSteps: index + 1,
      stepsCompleted: index + 1,
      steps,
      updatedAt: new Date().toISOString(),
    };
    emit(status);
  }

  if (!contentPackage) {
    const generated = await generateContentPackageWithArk(pipelineInput);
    contentPackage = generated.contentPackage;
    contentSource = generated.source;
    contentStatus = generated.status;
    contentError = generated.errorMessage ?? "";
    contentRawResponse = generated.rawResponse ?? "";
    contentParseError = generated.parseError ?? "";
    contentFallback = generated.fallback;
    status = {
      ...status,
      source: generated.source,
      fallback: generated.fallback,
      contentPackageStatus: generated.status,
      contentPackageError: generated.errorMessage,
      contentPackageRawResponse: generated.rawResponse,
      contentPackageParseError: generated.parseError,
    };
  }

  if (!visualAssets) {
    const selectedPlatforms = getSelectedPlatforms(pipelineInput);
    visualAssets = pipelineInput.generateVisuals
      ? await generateVisualAssetsFromContentPackage(contentPackage, selectedPlatforms)
      : createFallbackVisualAssetsFromContentPackage(
          contentPackage,
          selectedPlatforms,
          "Visual generation was disabled in Pipeline Input.",
        );
  }

  const generatedAt = new Date().toISOString();
  const pipelineStatus: PipelineRunState = {
    ...status,
    status: "completed",
    currentStep: -1,
    completedSteps: steps.length,
    stepsCompleted: steps.length,
    completed: true,
    source: contentSource ?? "fallback",
    fallback: contentFallback,
    contentPackageStatus: contentStatus ?? "fallback",
    contentPackageError: contentError || undefined,
    contentPackageRawResponse: contentRawResponse || undefined,
    contentPackageParseError: contentParseError || undefined,
    generatedAt,
    steps,
    updatedAt: generatedAt,
  };
  const result: PromptPipelineResult = {
    contentPackage,
    visualAssets,
    pipelineStatus,
    exportPackage: contentPackage.exportPackage,
  };
  onStepUpdate?.(structuredClone(pipelineStatus));
  onComplete?.(result);
  return result;
}
