import type {
  CampaignBrief,
  CampaignPrompt,
  CampaignPromptInferredSummary,
  CampaignPromptSource,
  ContentPackage,
  ExportPackageData,
  PipelineInput,
  PipelineRunState,
  PromptEngineOptions,
  PromptScore,
  RawRequirement,
  VisualAssetsPackage,
} from "../types/campaign";
import { createMockContentPackage } from "../data/mockContentPackage";

const CAMPAIGN_BRIEF_KEY = "amap_campaign_brief";
const CONTENT_PACKAGE_KEY = "amap_content_package";
const VISUAL_ASSETS_KEY = "amap_visual_assets";
const PIPELINE_STATUS_KEY = "amap_pipeline_status";
const CURRENT_TASK_KEY = "amap_current_campaign_task";
const NEW_TASK_REQUEST_KEY = "amap_new_campaign_task_requested";
const RAW_REQUIREMENT_KEY = "amap_raw_requirement";
const CAMPAIGN_PROMPT_KEY = "amap_campaign_prompt";
const PROMPT_SCORE_KEY = "amap_prompt_score";
const PIPELINE_INPUT_KEY = "amap_pipeline_input";
const PROMPT_DRAFT_KEY = "amap_prompt_engine_draft";
const EXPORT_PACKAGE_KEY = "amap_export_package";

function readJson<T>(key: string): T | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveCampaignBrief(brief: CampaignBrief) {
  window.localStorage.setItem(CAMPAIGN_BRIEF_KEY, JSON.stringify(brief));
}

export function getCampaignBrief() {
  return readJson<CampaignBrief>(CAMPAIGN_BRIEF_KEY);
}

export function createEmptyCampaignBrief(): CampaignBrief {
  return {
    rawBrief: "",
    demandTags: [],
    analysisConfidence: 0,
    feature: "",
    campaignTheme: "",
    contentGoal: "",
    platforms: [],
    audience: "",
    market: "",
    language: "",
    tone: "",
    generateVisuals: true,
    outputCount: 3,
    createdAt: "",
  };
}

export function initializeNewCampaignTask() {
  const task = {
    id: `campaign_${Date.now()}`,
    status: "draft",
    createdAt: new Date().toISOString(),
  };

  window.sessionStorage.setItem(CURRENT_TASK_KEY, JSON.stringify(task));
  window.sessionStorage.setItem(NEW_TASK_REQUEST_KEY, "true");
  return task;
}

export function consumeNewCampaignTaskRequest() {
  const requested = window.sessionStorage.getItem(NEW_TASK_REQUEST_KEY) === "true";
  window.sessionStorage.removeItem(NEW_TASK_REQUEST_KEY);
  return requested;
}

export function clearCampaignResult() {
  window.localStorage.removeItem(CONTENT_PACKAGE_KEY);
  window.localStorage.removeItem(VISUAL_ASSETS_KEY);
  window.localStorage.removeItem(PIPELINE_STATUS_KEY);
  window.localStorage.removeItem(EXPORT_PACKAGE_KEY);
}

export function clearGeneratedPromptData() {
  [
    CAMPAIGN_PROMPT_KEY,
    PROMPT_SCORE_KEY,
    PIPELINE_INPUT_KEY,
    CONTENT_PACKAGE_KEY,
    VISUAL_ASSETS_KEY,
    PIPELINE_STATUS_KEY,
    EXPORT_PACKAGE_KEY,
    PROMPT_DRAFT_KEY,
  ].forEach((key) => window.localStorage.removeItem(key));
}

export function clearWorkflowData() {
  [
    RAW_REQUIREMENT_KEY,
    CAMPAIGN_PROMPT_KEY,
    PROMPT_SCORE_KEY,
    PIPELINE_INPUT_KEY,
    CONTENT_PACKAGE_KEY,
    VISUAL_ASSETS_KEY,
    PIPELINE_STATUS_KEY,
    EXPORT_PACKAGE_KEY,
    PROMPT_DRAFT_KEY,
  ].forEach((key) => window.localStorage.removeItem(key));
}

export function saveContentPackage(contentPackage: ContentPackage) {
  window.localStorage.setItem(CONTENT_PACKAGE_KEY, JSON.stringify(contentPackage));
}

export function getContentPackage() {
  const contentPackage = readJson<ContentPackage>(CONTENT_PACKAGE_KEY);
  if (!contentPackage) return null;

  const isCurrentShape = Boolean(
    contentPackage.renderHints &&
    contentPackage.campaignStrategy?.contentAngles &&
    contentPackage.visualPrompts?.styleKeywords &&
    contentPackage.platformAssets,
  );
  if (isCurrentShape) return contentPackage;

  const pipelineInput = readJson<PipelineInput>(PIPELINE_INPUT_KEY);
  return createMockContentPackage(
    [
      pipelineInput?.rawRequirement.content,
      pipelineInput?.campaignPrompt.content,
      contentPackage.campaignStrategy?.coreConcept,
    ].filter(Boolean).join("\n"),
    pipelineInput?.platforms,
  );
}

export function saveVisualAssets(assets: VisualAssetsPackage) {
  window.localStorage.setItem(VISUAL_ASSETS_KEY, JSON.stringify(assets));
}

export function getVisualAssets() {
  const assets = readJson<VisualAssetsPackage>(VISUAL_ASSETS_KEY);
  if (!assets || Array.isArray(assets) || assets.source !== "ark-image" || !assets.assets) return null;
  return assets;
}

export function savePipelineStatus(status: PipelineRunState) {
  window.localStorage.setItem(PIPELINE_STATUS_KEY, JSON.stringify(status));
}

export function getPipelineStatus() {
  return readJson<PipelineRunState>(PIPELINE_STATUS_KEY);
}

export function saveExportPackage(exportPackage: ExportPackageData) {
  window.localStorage.setItem(EXPORT_PACKAGE_KEY, JSON.stringify(exportPackage));
}

export function getExportPackage() {
  return readJson<ExportPackageData>(EXPORT_PACKAGE_KEY);
}

export function saveRawRequirement(requirement: RawRequirement) {
  window.localStorage.setItem(RAW_REQUIREMENT_KEY, JSON.stringify(requirement));
}

export function getRawRequirement() {
  return readJson<RawRequirement>(RAW_REQUIREMENT_KEY);
}

export function saveCampaignPrompt(prompt: CampaignPrompt) {
  window.localStorage.setItem(CAMPAIGN_PROMPT_KEY, JSON.stringify(prompt));
}

export function getCampaignPrompt() {
  return readJson<CampaignPrompt>(CAMPAIGN_PROMPT_KEY);
}

export function savePromptScore(score: PromptScore) {
  window.localStorage.setItem(PROMPT_SCORE_KEY, JSON.stringify(score));
}

export function getPromptScore() {
  return readJson<PromptScore>(PROMPT_SCORE_KEY);
}

export function savePipelineInput(input: PipelineInput) {
  window.localStorage.setItem(PIPELINE_INPUT_KEY, JSON.stringify(input));
}

export function getPipelineInput() {
  return readJson<PipelineInput>(PIPELINE_INPUT_KEY);
}

export function savePromptDraft(draft: {
  rawRequirement: string;
  campaignPrompt: CampaignPrompt | null;
  promptScore: PromptScore | null;
  options: PromptEngineOptions;
  inferredSummary?: CampaignPromptInferredSummary | null;
  promptSource?: CampaignPromptSource | null;
  fallback?: boolean;
  rawResponse?: string;
  errorMessage?: string;
  updatedAt: string;
}) {
  window.localStorage.setItem(PROMPT_DRAFT_KEY, JSON.stringify(draft));
}

export function getPromptDraft() {
  return readJson<{
    rawRequirement: string;
    campaignPrompt: CampaignPrompt | null;
    promptScore: PromptScore | null;
    options: PromptEngineOptions;
    inferredSummary?: CampaignPromptInferredSummary | null;
    promptSource?: CampaignPromptSource | null;
    fallback?: boolean;
    rawResponse?: string;
    errorMessage?: string;
    updatedAt: string;
  }>(PROMPT_DRAFT_KEY);
}
