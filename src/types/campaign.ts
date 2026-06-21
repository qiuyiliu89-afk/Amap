export type Platform =
  | "douyin"
  | "xiaohongshu"
  | "tiktok"
  | "instagram"
  | "youtube_shorts"
  | "push_banner";

export interface RawRequirement {
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type CampaignPromptSource =
  | "ark"
  | "ark-repaired"
  | "ark-regenerated"
  | "ark-parse-failed"
  | "ark-request-failed"
  | "api"
  | "fallback";

export interface CampaignPrompt {
  content: string;
  version: number;
  status: "generated" | "improved";
  createdAt: string;
  updatedAt: string;
  promptText?: string;
  arkVersion?: string;
  generatedAt?: string;
  improved?: boolean;
  sourceRequirement?: string;
  source?: CampaignPromptSource;
  fallback?: boolean;
}

export interface PromptScore {
  requirementCompleteness: number;
  platformFit: number;
  outputClarity: number;
  visualExecutability: number;
  scoringConstraints: number;
  riskControl: number;
  total: number;
  updatedAt: string;
  completeness?: number;
  visualFeasibility?: number;
  scoringReadiness?: number;
  totalScore?: number;
  issues?: string[];
  suggestions?: string[];
}

export interface PromptEngineOptions {
  platforms: Platform[];
  generateVisuals: boolean;
  enableQualityScoring: boolean;
  outputCount: number;
}

export interface CampaignPromptInferredSummary {
  campaignGoal: string;
  targetAudience: string;
  targetPlatforms: string[];
  contentFormats: string[];
  visualDirection: string;
}

export interface PipelineInput extends PromptEngineOptions {
  rawRequirement: RawRequirement;
  campaignPrompt: CampaignPrompt;
  promptScore: PromptScore;
  createdAt: string;
  selectedPlatforms?: string[];
  enableScoring?: boolean;
  inferredSummary?: CampaignPromptInferredSummary;
  promptSource?: CampaignPromptSource;
  fallback?: boolean;
}

export interface CampaignBrief {
  rawBrief: string;
  demandTags: string[];
  analysisConfidence: number;
  feature: string;
  campaignTheme: string;
  contentGoal: string;
  platforms: Platform[];
  audience: string;
  market: string;
  language: string;
  tone: string;
  generateVisuals: boolean;
  outputCount: number;
  createdAt: string;
}

export interface QualityDimension {
  label: string;
  score: number;
  note: string;
}

export interface ContentAsset {
  platform: string;
  format: string;
  title: string;
  body: string;
  caption?: string;
  hashtags?: string[];
  publishTime?: string;
  fitReason: string;
}

export interface VisualAsset {
  id: string;
  type: "cover" | "keyframe" | "carousel" | "banner";
  title: string;
  prompt: string;
  source: string;
  colorHint: string;
}

export type GeneratedVisualAssetPlatform =
  | "xiaohongshu"
  | "tiktok"
  | "douyin"
  | "instagram"
  | "pushBanner";

export interface GeneratedVisualAsset {
  platform: GeneratedVisualAssetPlatform;
  imageUrl: string;
  prompt: string;
  status: "success" | "fallback";
  errorMessage?: string;
}

export interface VisualAssetsPackage {
  source: "ark-image";
  status: "success" | "partial" | "fallback";
  generatedAt: string;
  assets: {
    xiaohongshuCover?: GeneratedVisualAsset;
    xiaohongshuPageVisuals?: Record<string, GeneratedVisualAsset>;
    verticalVideoKeyframe?: GeneratedVisualAsset;
    instagramCarouselCover?: GeneratedVisualAsset;
    bannerVisual?: GeneratedVisualAsset;
  };
}

export interface PipelineRunState {
  pipelineVersion?: number;
  status: "idle" | "running" | "completed" | "failed";
  currentStep: number;
  completedSteps: number;
  source: string;
  updatedAt: string;
  steps: PipelineStepState[];
  completed?: boolean;
  stepsCompleted?: number;
  generatedAt?: string;
  fallback?: boolean;
  contentPackageStatus?:
    | "ark-content-success"
    | "ark-content-repaired"
    | "ark-content-regenerated"
    | "ark-content-parse-failed"
    | "ark-content-request-failed"
    | "fallback";
  contentPackageError?: string;
  contentPackageRawResponse?: string;
  contentPackageParseError?: string;
}

export type PipelineStepStatus = "waiting" | "running" | "done";

export interface PipelineStepState {
  id: string;
  index: number;
  title: string;
  description: string;
  status: PipelineStepStatus;
  outputSummary: string;
  completedAt?: string;
}

export interface ExportPackageData {
  markdownSummary: string;
  csvRows: Array<Record<string, string | number>>;
  jsonReady: boolean;
  assetsChecklist: string[];
  generatedAt: string;
}

export type PreviewType =
  | "vertical-video"
  | "note-carousel"
  | "instagram-carousel"
  | "notification-banner";

export interface StoryboardFrame {
  id: string;
  scene: string;
  visualCue: string;
  copy?: string;
}

export interface CarouselCard {
  id: string;
  title: string;
  body: string;
  visualCue: string;
}

export type XiaohongshuPageType =
  | "cover"
  | "scene"
  | "landmark"
  | "route"
  | "tips"
  | "feature"
  | "cta";

export type XiaohongshuVisualStyle =
  | "brand-poster"
  | "cinematic-scene"
  | "editorial-landmark"
  | "premium-route"
  | "editorial-layout"
  | "product-story"
  | "closing-poster";

export interface XiaohongshuPagePlanItem {
  pageType: XiaohongshuPageType;
  title: string;
  subtitle: string;
  visualStyle: XiaohongshuVisualStyle;
  imagePrompt: string;
  overlayText: string[];
  bodyText: string;
}

export interface XiaohongshuPagePlan {
  pageCount: number;
  pages: XiaohongshuPagePlanItem[];
}

export interface XiaohongshuPublishCarouselPage extends CarouselCard {
  pageType: XiaohongshuPageType;
  role?: XiaohongshuPageType;
  eyebrow: string;
  bullets: string[];
  subtitle: string;
  visualStyle: XiaohongshuVisualStyle;
  imagePrompt: string;
  overlayText: string[];
  bodyText: string;
}

export interface XiaohongshuPublishPackage {
  recommendedPageCount: number;
  pagePlan: XiaohongshuPagePlan;
  titleCandidates: string[];
  hookCandidates: string[];
  title: string;
  coverCopy: string;
  coverVisualPrompt: string;
  postText: string;
  carouselPages: XiaohongshuPublishCarouselPage[];
  hashtags: string[];
  commentGuide: string;
  copyReadyText: string;
}

export interface DouyinScriptLine {
  timeRange: string;
  line: string;
}

export interface DouyinStoryboardItem {
  timeRange: string;
  visual: string;
  voiceover: string;
  screenSubtitle: string;
}

export interface DouyinVideoCreativeShot {
  timeRange: string;
  sceneGoal: string;
  visualDescription: string;
  cameraMovement: string;
  transition: string;
  overlayText: string;
  voiceover: string;
  imagePrompt: string;
  videoPrompt: string;
}

export interface DouyinVideoCreativePack {
  concept: string;
  styleDirection: string;
  duration: string;
  aspectRatio: "9:16";
  creativeHook: string;
  shotList: DouyinVideoCreativeShot[];
  transitionPlan: string[];
  overlayCopy: string[];
  voiceover: string[];
  subtitles: string[];
  musicDirection: string;
  fullVideoPrompt: string;
  negativePrompt: string;
  copyReadyPrompt: string;
}

export interface DouyinPublishPackage {
  titleCandidates: string[];
  hookCandidates: string[];
  title: string;
  caption: string;
  hook: string;
  cta: string;
  coverVisualPrompt?: string;
  script15s: DouyinScriptLine[];
  storyboard: DouyinStoryboardItem[];
  subtitles: string;
  hashtags: string[];
  copyReadyText: string;
  videoCreativePack: DouyinVideoCreativePack;
}

export interface TikTokVideoAsset {
  title: string;
  hook: string;
  script15s: string[];
  script30s: string[];
  storyboard: StoryboardFrame[];
  subtitles: string[];
  caption: string;
  hashtags: string[];
  visualStyle: string;
  previewType: "vertical-video";
}

export interface DouyinVideoAsset {
  title: string;
  hook: string;
  titleCandidates?: string[];
  hookCandidates?: string[];
  script15s: string[];
  storyboard: StoryboardFrame[];
  subtitles: string[];
  coverCopy: string;
  hashtags: string[];
  visualStyle: string;
  previewType: "vertical-video";
}

export interface XiaohongshuAsset {
  coverTitle: string;
  postBody: string;
  carouselCards: CarouselCard[];
  hashtags: string[];
  commentGuide: string;
  previewType: "note-carousel";
}

export interface InstagramAsset {
  carouselSlides: CarouselCard[];
  caption: string;
  hashtags: string[];
  reelsScript: string[];
  titleCandidates?: string[];
  hookCandidates?: string[];
  captionLanguageStrategy?: string;
  previewType: "instagram-carousel";
}

export interface PushBannerAsset {
  pushTitle: string;
  pushBody: string;
  bannerTitle: string;
  bannerSubtitle: string;
  cta: string;
  abVersions: string[];
  previewType: "notification-banner";
}

export interface RenderHints {
  theme: string;
  colorPalette: string[];
  visualMood: string;
  routeStyle: string;
  backgroundType: string;
  keyObjects: string[];
  cityMood: string;
  platformLayout: Record<string, string>;
}

export interface ContentPackage {
  campaignStrategy: {
    coreConcept: string;
    userPainPoints: string[];
    productSellingPoints: string[];
    platformStrategy: Record<string, string>;
    contentAngles: string[];
  };
  platformAssets: {
    douyin?: DouyinVideoAsset;
    tiktok?: TikTokVideoAsset;
    xiaohongshu?: XiaohongshuAsset;
    instagram?: InstagramAsset;
    pushBanner?: PushBannerAsset;
  };
  publishPackages?: {
    xiaohongshu?: XiaohongshuPublishPackage;
    douyin?: DouyinPublishPackage;
  };
  visualPrompts: {
    videoKeyframePrompts: string[];
    xiaohongshuCoverPrompt: string;
    xiaohongshuCardPrompts?: string[];
    instagramCarouselPrompt: string;
    bannerPrompt: string;
    styleKeywords: string[];
  };
  renderHints: RenderHints;
  qualityScore: {
    total: number;
    dimensions: QualityDimension[];
    hookStrength: number;
    platformFit: number;
    brandConsistency: number;
    painPointClarity: number;
    visualFeasibility: number;
    localization: number;
    freshness: number;
    riskLevel: number;
    totalScore: number;
  };
  rewriteSuggestions: {
    issuesFound: string[];
    suggestions: string[];
    improvedHook: string;
    improvedCaption: string;
    improvedVisualPrompt: string;
  };
  exportPackage: ExportPackageData;
}

export interface BatchRow {
  city: string;
  market: string;
  language: string;
  platform: string;
  format: string;
  hook: string;
  visualStatus: string;
  score: number;
  exportStatus: string;
}
