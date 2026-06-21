import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleCheck,
  Clipboard,
  Copy,
  Eraser,
  FileCode2,
  ImageIcon,
  Layers3,
  LoaderCircle,
  RefreshCw,
  Route,
  Save,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  generateCampaignPromptWithArk,
  isCompleteCampaignPromptText,
} from "../ai/api/generateCampaignPrompt";
import { improveMockCampaignPrompt } from "../ai/mock/mockPromptEngine";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import type {
  CampaignPrompt,
  CampaignPromptInferredSummary,
  CampaignPromptSource,
  PipelineInput,
  Platform,
  PromptEngineOptions,
  PromptScore,
  RawRequirement,
} from "../types/campaign";
import {
  clearWorkflowData,
  clearCampaignResult,
  clearGeneratedPromptData,
  consumeNewCampaignTaskRequest,
  getCampaignPrompt,
  getPipelineInput,
  getPromptDraft,
  getPromptScore,
  getRawRequirement,
  saveCampaignPrompt,
  savePipelineInput,
  savePromptDraft,
  savePromptScore,
  saveRawRequirement,
} from "../utils/storageUtils";
import {
  inferExplicitPlatformsFromRequirement,
  inferPlatformsFromRequirement,
} from "../utils/platformInference";

const exampleRequirement =
  "我们计划面向海外年轻旅行者制作一组高德 AI 出行内容，重点突出 AI 路线规划、实时路况和城市探索能力。希望覆盖 TikTok、Instagram 和小红书，整体风格轻松、有科技感，并生成短视频脚本、图文卡片、视觉素材和平台预览。";

const platformOptions: Array<{ id: Platform; label: string; code: string }> = [
  { id: "douyin", label: "抖音", code: "DY" },
  { id: "xiaohongshu", label: "小红书", code: "RED" },
  { id: "tiktok", label: "TikTok", code: "TT" },
  { id: "instagram", label: "Instagram", code: "IG" },
  { id: "youtube_shorts", label: "YouTube Shorts", code: "YT" },
  { id: "push_banner", label: "Push / Banner", code: "PB" },
];

const pipelineSteps = [
  "Prompt 编译",
  "内容策略生成",
  "多平台内容生成",
  "视觉 Prompt 生成",
  "视觉素材生成",
  "平台预览渲染",
  "质量评分",
  "优化建议",
  "导出发布包",
];

const scoreDimensions: Array<{ key: keyof Omit<PromptScore, "total" | "updatedAt">; label: string; detail: string }> = [
  { key: "requirementCompleteness", label: "需求完整度", detail: "目标、受众与场景是否明确" },
  { key: "platformFit", label: "平台适配度", detail: "是否区分不同平台内容形态" },
  { key: "outputClarity", label: "输出结构清晰度", detail: "结果能否被前端直接读取" },
  { key: "visualExecutability", label: "视觉生成可执行性", detail: "视觉任务是否足够具体" },
  { key: "scoringConstraints", label: "评分约束完整度", detail: "评分与改写条件是否清晰" },
  { key: "riskControl", label: "风险控制清晰度", detail: "品牌与合规边界是否明确" },
];

const assetRules: Array<{ ids: Platform[]; title: string; outputs: string }> = [
  { ids: ["douyin", "tiktok", "youtube_shorts"], title: "短视频内容资产", outputs: "Hook · 脚本 · 分镜 · 字幕 · 9:16 预览" },
  { ids: ["xiaohongshu"], title: "小红书图文", outputs: "品牌封面 · 5-9 页图文 · 正文 · 话题" },
  { ids: ["instagram"], title: "Instagram", outputs: "Reels / Carousel · Caption · Hashtags" },
  { ids: ["push_banner"], title: "Push / Banner", outputs: "通知 · 横幅 · CTA · A/B 版本" },
];

const defaultOptions: PromptEngineOptions = {
  platforms: ["tiktok", "instagram", "xiaohongshu"],
  generateVisuals: true,
  enableQualityScoring: true,
  outputCount: 3,
};

const isDevelopment = Boolean(
  (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV,
);

function getPlatformLabel(platform: Platform) {
  return platformOptions.find((item) => item.id === platform)?.label ?? platform;
}

function isPlatform(value: string): value is Platform {
  return platformOptions.some((platform) => platform.id === value);
}

function toPlatforms(platforms: string[]) {
  return platforms.filter(isPlatform);
}

function ToggleSetting({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
}: {
  icon: typeof ImageIcon;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex min-h-[86px] w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-5 text-left transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.04]"
    >
      <span className="flex items-center gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200"><Icon size={21} /></span>
        <span>
          <span className="block font-semibold text-white">{title}</span>
          <span className="mt-1 block text-xs text-slate-400">{description}</span>
        </span>
      </span>
      <span className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ${enabled ? "bg-cyan-400" : "bg-slate-700"}`}>
        <span className={`h-6 w-6 rounded-full bg-white shadow transition ${enabled ? "translate-x-6" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

export function BriefPage() {
  const navigate = useNavigate();
  const [initialData] = useState(() => {
    const isNewTask = consumeNewCampaignTaskRequest();
    if (isNewTask) {
      return {
        raw: "",
        prompt: null,
        score: null,
        options: defaultOptions,
        inferredSummary: null,
        promptSource: null,
        fallback: false,
        rawResponse: "",
        errorMessage: "",
        stalePromptRemoved: false,
      };
    }
    const draft = getPromptDraft();
    const pipelineInput = getPipelineInput();
    const storedPrompt = draft?.campaignPrompt ?? getCampaignPrompt();
    const storedSource = draft?.promptSource ?? pipelineInput?.promptSource ?? null;
    const hasInvalidGeneratedPrompt = Boolean(
      storedPrompt &&
      storedSource &&
      storedSource !== "fallback" &&
      !isCompleteCampaignPromptText(storedPrompt.content),
    );
    if (hasInvalidGeneratedPrompt) {
      clearGeneratedPromptData();
    }

    return {
      raw: draft?.rawRequirement ?? getRawRequirement()?.content ?? "",
      prompt: hasInvalidGeneratedPrompt ? null : storedPrompt,
      score: hasInvalidGeneratedPrompt ? null : draft?.promptScore ?? getPromptScore(),
      options: draft?.options ?? (pipelineInput
        ? {
            platforms: pipelineInput.platforms,
            generateVisuals: pipelineInput.generateVisuals,
            enableQualityScoring: pipelineInput.enableQualityScoring,
            outputCount: pipelineInput.outputCount,
          }
        : defaultOptions),
      inferredSummary: hasInvalidGeneratedPrompt ? null : draft?.inferredSummary ?? pipelineInput?.inferredSummary ?? null,
      promptSource: hasInvalidGeneratedPrompt ? null : storedSource,
      fallback: hasInvalidGeneratedPrompt ? false : draft?.fallback ?? pipelineInput?.fallback ?? false,
      rawResponse: draft?.rawResponse ?? "",
      errorMessage: hasInvalidGeneratedPrompt
        ? "已自动移除旧版残缺 Campaign Prompt，请重新生成。"
        : draft?.errorMessage ?? "",
      stalePromptRemoved: hasInvalidGeneratedPrompt,
    };
  });
  const [rawRequirement, setRawRequirement] = useState(initialData.raw);
  const [campaignPrompt, setCampaignPrompt] = useState<CampaignPrompt | null>(initialData.prompt);
  const [promptScore, setPromptScore] = useState<PromptScore | null>(initialData.score);
  const [inferredSummary, setInferredSummary] = useState<CampaignPromptInferredSummary | null>(initialData.inferredSummary);
  const [options, setOptions] = useState<PromptEngineOptions>(initialData.options);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [promptApplied, setPromptApplied] = useState(false);
  const [promptSource, setPromptSource] = useState<CampaignPromptSource | null>(initialData.promptSource);
  const [promptFallback, setPromptFallback] = useState(initialData.fallback);
  const [debugRawResponse, setDebugRawResponse] = useState(initialData.rawResponse);
  const [debugErrorMessage, setDebugErrorMessage] = useState(initialData.errorMessage);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    initialData.stalePromptRemoved ? "已自动移除旧版残缺 Campaign Prompt，请重新生成。" : "",
  );
  const [recognizedPlatforms, setRecognizedPlatforms] = useState<Platform[]>([]);
  const [platformSelectionTouched, setPlatformSelectionTouched] = useState(false);

  const promptStatus = !campaignPrompt ? "未生成" : campaignPrompt.status === "improved" ? "已优化" : "已生成";
  const pipelineReady = Boolean(rawRequirement.trim() && campaignPrompt?.content.trim() && options.platforms.length);
  const selectedAssets = useMemo(
    () => assetRules.filter((rule) => rule.ids.some((platform) => options.platforms.includes(platform))),
    [options.platforms],
  );

  function resetFeedback() {
    setError("");
    setNotice("");
  }

  function resolvePlatformsForGeneration() {
    const explicitPlatforms = toPlatforms(inferExplicitPlatformsFromRequirement(rawRequirement));
    const inferredPlatforms = toPlatforms(inferPlatformsFromRequirement(rawRequirement, options.platforms));
    const resolvedPlatforms = platformSelectionTouched ? options.platforms : inferredPlatforms;

    return {
      explicitPlatforms: platformSelectionTouched ? [] : explicitPlatforms,
      resolvedPlatforms,
    };
  }

  function persistPromptToLocalStorage({
    prompt,
    score,
    summary,
    source,
    fallback,
    resolvedOptions = options,
    rawResponse = "",
    errorMessage = "",
  }: {
    prompt: CampaignPrompt;
    score: PromptScore;
    summary: CampaignPromptInferredSummary | null;
    source: CampaignPromptSource | null;
    fallback: boolean;
    resolvedOptions?: PromptEngineOptions;
    rawResponse?: string;
    errorMessage?: string;
  }) {
    const now = new Date().toISOString();
    const raw: RawRequirement = {
      content: rawRequirement.trim(),
      createdAt: getRawRequirement()?.createdAt ?? now,
      updatedAt: now,
    };
    const nextPrompt: CampaignPrompt = {
      ...prompt,
      content: prompt.content.trim(),
      promptText: prompt.promptText ?? prompt.content.trim(),
      updatedAt: now,
      source: fallback ? "fallback" : source ?? prompt.source,
      fallback,
    };
    const pipelineInput: PipelineInput = {
      rawRequirement: raw,
      campaignPrompt: nextPrompt,
      promptScore: score,
      ...resolvedOptions,
      selectedPlatforms: resolvedOptions.platforms,
      enableScoring: resolvedOptions.enableQualityScoring,
      inferredSummary: summary ?? undefined,
      promptSource: source ?? undefined,
      fallback,
      createdAt: now,
    };

    saveRawRequirement(raw);
    saveCampaignPrompt(nextPrompt);
    savePromptScore(score);
    savePipelineInput(pipelineInput);
    savePromptDraft({
      rawRequirement,
      campaignPrompt: nextPrompt,
      promptScore: score,
      options: resolvedOptions,
      inferredSummary: summary,
      promptSource: source,
      fallback,
      rawResponse,
      errorMessage,
      updatedAt: now,
    });
  }

  function togglePlatform(platform: Platform) {
    setOptions((current) => ({
      ...current,
      platforms: current.platforms.includes(platform)
        ? current.platforms.filter((item) => item !== platform)
        : [...current.platforms, platform],
    }));
    setPlatformSelectionTouched(true);
    setRecognizedPlatforms([]);
    setPromptApplied(false);
    resetFeedback();
  }

  async function generatePrompt() {
    if (!rawRequirement.trim()) {
      setError("请先输入本次内容生成需求");
      return;
    }
    const { explicitPlatforms, resolvedPlatforms } = resolvePlatformsForGeneration();
    if (resolvedPlatforms.length === 0) {
      setError("请至少选择一个目标平台");
      return;
    }
    const resolvedOptions: PromptEngineOptions = {
      ...options,
      platforms: resolvedPlatforms,
    };
    setIsGenerating(true);
    resetFeedback();
    try {
      setOptions(resolvedOptions);
      setRecognizedPlatforms(explicitPlatforms);
      const result = await generateCampaignPromptWithArk(rawRequirement, {
        selectedPlatforms: resolvedPlatforms,
        generateVisuals: resolvedOptions.generateVisuals,
        enableScoring: resolvedOptions.enableQualityScoring,
        outputCount: resolvedOptions.outputCount,
      });
      const nextPrompt: CampaignPrompt = {
        ...result.campaignPrompt,
        version: campaignPrompt ? campaignPrompt.version + 1 : result.campaignPrompt.version,
        createdAt: campaignPrompt?.createdAt ?? result.campaignPrompt.createdAt,
      };
      setCampaignPrompt(nextPrompt);
      setPromptScore(result.promptScore);
      setInferredSummary(result.inferredSummary);
      setPromptSource(result.source);
      setPromptFallback(result.fallback);
      setDebugRawResponse(result.rawResponse ?? "");
      setDebugErrorMessage(result.errorMessage ?? "");
      setPromptApplied(true);
      persistPromptToLocalStorage({
        prompt: nextPrompt,
        score: result.promptScore,
        summary: result.inferredSummary,
        source: result.source,
        fallback: result.fallback,
        resolvedOptions,
        rawResponse: result.rawResponse,
        errorMessage: result.errorMessage,
      });
      const platformNotice = explicitPlatforms.length
        ? `识别到目标平台：${explicitPlatforms.map(getPlatformLabel).join("、")}。`
        : "";
      if (result.source === "ark") {
        setNotice(`${platformNotice}Campaign Prompt 已由火山方舟生成，并已保存为 Pipeline 输入`);
      } else if (result.source === "ark-repaired") {
        setNotice(`${platformNotice}Ark 首次返回已完成 JSON 修复，当前使用修复后的真实 Ark 结果`);
      } else if (result.source === "ark-regenerated") {
        setNotice(`${platformNotice}Ark 首次结果不完整，已由方舟重新生成完整 Campaign Prompt`);
      } else if (result.source === "ark-parse-failed") {
        setNotice(`${platformNotice}Ark API 已返回内容，但 JSON 解析失败；当前展示稳定的 Fallback Prompt`);
      } else {
        setNotice(`${platformNotice}Ark API 请求失败；当前展示稳定的 Fallback Prompt`);
      }
    } catch {
      setError("Prompt 生成失败，请稍后重试");
    } finally {
      setIsGenerating(false);
    }
  }

  function improvePrompt() {
    if (!campaignPrompt || !promptScore) {
      setError("请先生成 Campaign Prompt");
      return;
    }
    setIsImproving(true);
    resetFeedback();
    window.setTimeout(() => {
      const result = improveMockCampaignPrompt(campaignPrompt, promptScore);
      setCampaignPrompt(result.prompt);
      setPromptScore(result.score);
      setInferredSummary(inferredSummary);
      setPromptSource(null);
      setPromptFallback(false);
      setDebugRawResponse("");
      setDebugErrorMessage("");
      setPromptApplied(false);
      setIsImproving(false);
      setNotice(`Prompt 已优化，当前质量评分 ${result.score.total}/100`);
    }, 600);
  }

  async function copyPrompt() {
    if (!campaignPrompt) {
      setError("请先生成 Campaign Prompt");
      return;
    }
    try {
      await navigator.clipboard.writeText(campaignPrompt.content);
      setNotice("Prompt 已复制到剪贴板");
      setError("");
    } catch {
      setError("复制失败，请在 Prompt 编辑器中手动选择文本");
    }
  }

  function usePrompt() {
    if (!campaignPrompt?.content.trim()) {
      setError("请先生成 Campaign Prompt");
      return;
    }
    if (promptScore) {
      persistPromptToLocalStorage({
        prompt: campaignPrompt,
        score: promptScore,
        summary: inferredSummary,
        source: promptSource,
        fallback: promptFallback,
        rawResponse: debugRawResponse,
        errorMessage: debugErrorMessage,
      });
    }
    setPromptApplied(true);
    setNotice("当前 Prompt 已设为 Pipeline 输入");
    setError("");
  }

  function clearRequirement() {
    setRawRequirement("");
    setCampaignPrompt(null);
    setPromptScore(null);
    setInferredSummary(null);
    setPromptSource(null);
    setPromptFallback(false);
    setDebugRawResponse("");
    setDebugErrorMessage("");
    setPromptApplied(false);
    setRecognizedPlatforms([]);
    setPlatformSelectionTouched(false);
    resetFeedback();
  }

  function clearWorkflowDataFromBrowser() {
    clearWorkflowData();
    setRawRequirement("");
    setCampaignPrompt(null);
    setPromptScore(null);
    setInferredSummary(null);
    setOptions(defaultOptions);
    setPromptSource(null);
    setPromptFallback(false);
    setDebugRawResponse("");
    setDebugErrorMessage("");
    setPromptApplied(false);
    setRecognizedPlatforms([]);
    setPlatformSelectionTouched(false);
    setNotice("Workflow Data 已清理，可重新测试平台识别");
    setError("");
  }

  function saveDraft() {
    savePromptDraft({
      rawRequirement,
      campaignPrompt,
      promptScore,
      options,
      inferredSummary,
      promptSource,
      fallback: promptFallback,
      rawResponse: debugRawResponse,
      errorMessage: debugErrorMessage,
      updatedAt: new Date().toISOString(),
    });
    setNotice("Prompt 工作区草稿已保存");
    setError("");
  }

  function submitToPipeline() {
    if (!rawRequirement.trim()) {
      setError("自然语言内容需求不能为空");
      return;
    }
    if (!campaignPrompt?.content.trim() || !promptScore) {
      setError("请先生成 Campaign Prompt");
      return;
    }
    if (options.platforms.length === 0) {
      setError("请至少选择一个目标平台");
      return;
    }

    const now = new Date().toISOString();
    const raw: RawRequirement = {
      content: rawRequirement.trim(),
      createdAt: getRawRequirement()?.createdAt ?? now,
      updatedAt: now,
    };
    const prompt: CampaignPrompt = { ...campaignPrompt, content: campaignPrompt.content.trim(), updatedAt: now };
    const pipelineInput: PipelineInput = {
      rawRequirement: raw,
      campaignPrompt: prompt,
      promptScore,
      ...options,
      selectedPlatforms: options.platforms,
      enableScoring: options.enableQualityScoring,
      inferredSummary: inferredSummary ?? undefined,
      promptSource: promptSource ?? undefined,
      fallback: promptFallback,
      createdAt: now,
    };

    saveRawRequirement(raw);
    saveCampaignPrompt(prompt);
    savePromptScore(promptScore);
    savePipelineInput(pipelineInput);
    clearCampaignResult();
    navigate("/pipeline");
  }

  return (
    <div className="brief-page pb-10">
      <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <Badge tone="aqua">AI Content Pipeline Input</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Campaign Prompt Engine</h1>
          <p className="mt-3 max-w-4xl text-[15px] leading-7 text-slate-300 md:text-base">
            把自然语言内容需求编译成可编辑、可优化、可评分的专业 Prompt，再交给后续内容生产流水线。
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <CircleCheck size={17} className="text-emerald-300" /> Prompt 工作区保存在当前浏览器
        </div>
      </header>

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="space-y-6">
          <section className="glass-card overflow-hidden rounded-xl">
            <div className="flex items-center gap-4 border-b border-white/10 px-7 py-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300 text-base font-bold text-slate-950">1</span>
              <div>
                <h2 className="font-semibold text-white">描述你的内容生成需求</h2>
                <p className="mt-1 text-sm text-slate-400">用自然语言说明目标、用户、平台、内容与视觉方向</p>
              </div>
            </div>
            <div className="p-7">
              <div className="overflow-hidden rounded-xl border border-cyan-300/25 bg-[#061522] focus-within:border-cyan-300/60 focus-within:shadow-[0_0_35px_rgba(34,211,238,0.08)]">
                <textarea
                  value={rawRequirement}
                  maxLength={1200}
                  onChange={(event) => {
                    setRawRequirement(event.target.value);
                    setRecognizedPlatforms([]);
                    setPlatformSelectionTouched(false);
                    setPromptApplied(false);
                    resetFeedback();
                  }}
                  className="min-h-[230px] w-full resize-none bg-transparent px-6 py-6 text-base leading-8 text-white outline-none placeholder:text-slate-500"
                  placeholder={exampleRequirement}
                />
                <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 text-xs text-slate-400">
                  <span>建议包含目标用户、核心能力、目标平台和期望内容形态</span>
                  <span>{rawRequirement.length}/1200</span>
                </div>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setRawRequirement(exampleRequirement); setRecognizedPlatforms([]); setPlatformSelectionTouched(false); }} className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/12 px-4 font-medium text-slate-200 transition hover:bg-white/[0.05]">
                    <WandSparkles size={17} /> 使用示例需求
                  </button>
                  <button type="button" onClick={clearRequirement} className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/12 px-4 font-medium text-slate-300 transition hover:bg-white/[0.05]">
                    <Eraser size={17} /> 清空
                  </button>
                  {isDevelopment ? (
                    <button type="button" onClick={clearWorkflowDataFromBrowser} className="inline-flex h-12 items-center gap-2 rounded-lg border border-amber-300/25 px-4 font-medium text-amber-100 transition hover:bg-amber-300/[0.08]">
                      <Eraser size={17} /> Clear Workflow Data
                    </button>
                  ) : null}
                </div>
                <Button type="button" onClick={generatePrompt} disabled={isGenerating} className="h-12 px-7">
                  {isGenerating ? <LoaderCircle className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  {isGenerating ? "AI generating prompt" : "生成高质量 Prompt"}
                </Button>
              </div>
            </div>
          </section>

          <section className="glass-card overflow-hidden rounded-xl border-cyan-300/25">
            <div className="flex flex-col gap-4 border-b border-white/10 px-7 py-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/20 text-base font-bold text-blue-100">2</span>
                <div>
                  <h2 className="font-semibold text-white">Campaign Prompt Engine</h2>
                  <p className="mt-1 text-sm text-slate-400">Prompt 是驱动 Pipeline 的中间层，不是最终内容产物</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={campaignPrompt?.status === "improved" ? "green" : campaignPrompt ? "aqua" : "slate"}>{promptStatus}</Badge>
                {promptSource === "ark" ? <Badge tone="aqua">Ark API mode</Badge> : null}
                {promptSource === "ark-repaired" ? <Badge tone="green">Ark repaired JSON mode</Badge> : null}
                {promptSource === "ark-regenerated" ? <Badge tone="green">Ark regenerated mode</Badge> : null}
                {promptSource === "ark-parse-failed" ? <Badge tone="orange">API returned, JSON parse failed</Badge> : null}
                {promptSource === "ark-request-failed" ? <Badge tone="orange">API request failed</Badge> : null}
                {promptFallback ? <Badge tone="orange">Fallback mode</Badge> : null}
                {campaignPrompt ? <span className="text-xs text-slate-400">Version {campaignPrompt.version}</span> : null}
              </div>
            </div>

            <div className="p-7">
              {campaignPrompt ? (
                <textarea
                  value={campaignPrompt.content}
                  onChange={(event) => {
                    setCampaignPrompt({ ...campaignPrompt, content: event.target.value, updatedAt: new Date().toISOString() });
                    setPromptSource(null);
                    setPromptFallback(false);
                    setDebugRawResponse("");
                    setDebugErrorMessage("");
                    setPromptApplied(false);
                    resetFeedback();
                  }}
                  spellCheck={false}
                  className="min-h-[640px] w-full resize-y rounded-xl border border-blue-300/25 bg-[#050f1d] px-7 py-6 font-mono text-[16px] leading-8 text-slate-100 outline-none focus:border-cyan-300/55"
                />
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-cyan-300/20 bg-[#061321]/70 px-8 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200"><FileCode2 size={30} /></span>
                  <h3 className="mt-5 text-xl font-semibold text-white">等待生成 Campaign Prompt</h3>
                  <p className="mt-3 max-w-xl text-sm text-slate-400">生成后将在这里展示 Role、Campaign Context、Content Tasks、Visual Tasks、Quality Criteria 和 Output Format。</p>
                </div>
              )}

              {inferredSummary ? (
                <div className="mt-5 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.045] p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Inferred Summary</p>
                      <p className="mt-1 text-xs text-slate-400">由 Campaign Prompt 生成结果推断，用于确认后续 Pipeline 输入</p>
                    </div>
                    {promptSource === "ark" ? <Badge tone="aqua">Ark API mode</Badge> : null}
                    {promptSource === "ark-repaired" ? <Badge tone="green">Ark repaired JSON mode</Badge> : null}
                    {promptSource === "ark-regenerated" ? <Badge tone="green">Ark regenerated mode</Badge> : null}
                    {promptSource === "ark-parse-failed" ? <Badge tone="orange">API returned, JSON parse failed</Badge> : null}
                    {promptSource === "ark-request-failed" ? <Badge tone="orange">API request failed</Badge> : null}
                    {promptFallback ? <Badge tone="orange">Fallback mode</Badge> : null}
                    {!promptSource ? <Badge tone="slate">Manual edit</Badge> : null}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-black/15 p-4">
                      <p className="text-xs text-slate-500">Campaign Goal</p>
                      <p className="mt-2 text-sm leading-6 text-slate-100">{inferredSummary.campaignGoal}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/15 p-4">
                      <p className="text-xs text-slate-500">Target Audience</p>
                      <p className="mt-2 text-sm leading-6 text-slate-100">{inferredSummary.targetAudience}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/15 p-4">
                      <p className="text-xs text-slate-500">Target Platforms</p>
                      <p className="mt-2 text-sm leading-6 text-slate-100">{inferredSummary.targetPlatforms.join("、") || "未识别"}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/15 p-4">
                      <p className="text-xs text-slate-500">Content Formats</p>
                      <p className="mt-2 text-sm leading-6 text-slate-100">{inferredSummary.contentFormats.join("、") || "未识别"}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/15 p-4 md:col-span-2">
                      <p className="text-xs text-slate-500">Visual Direction</p>
                      <p className="mt-2 text-sm leading-6 text-slate-100">{inferredSummary.visualDirection}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {isDevelopment && (promptSource || debugErrorMessage || debugRawResponse) ? (
                <details className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.035]">
                  <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-amber-100">
                    Developer Debug
                  </summary>
                  <div className="space-y-4 border-t border-amber-300/15 px-5 py-4 text-xs">
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <dt className="text-slate-500">source</dt>
                        <dd className="mt-1 font-mono text-slate-100">{promptSource ?? "null"}</dd>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <dt className="text-slate-500">fallback</dt>
                        <dd className="mt-1 font-mono text-slate-100">{String(promptFallback)}</dd>
                      </div>
                    </dl>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-slate-500">errorMessage</p>
                      <p className="mt-2 whitespace-pre-wrap font-mono leading-6 text-rose-200">
                        {debugErrorMessage || "(none)"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-slate-500">rawResponse · first 2000 characters</p>
                      <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono leading-6 text-slate-200">
                        {debugRawResponse ? debugRawResponse.slice(0, 2000) : "(no raw response)"}
                      </pre>
                    </div>
                  </div>
                </details>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={copyPrompt} disabled={!campaignPrompt} className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/12 px-4 font-medium text-slate-200 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40">
                  <Copy size={17} /> Copy Prompt
                </button>
                <button type="button" onClick={generatePrompt} disabled={isGenerating || !rawRequirement.trim()} className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/12 px-4 font-medium text-slate-200 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40">
                  <RefreshCw size={17} /> Regenerate Prompt
                </button>
                <button type="button" onClick={improvePrompt} disabled={!campaignPrompt || isImproving} className="inline-flex h-12 items-center gap-2 rounded-lg border border-violet-300/25 bg-violet-400/10 px-4 font-medium text-violet-100 transition hover:bg-violet-400/15 disabled:cursor-not-allowed disabled:opacity-40">
                  {isImproving ? <LoaderCircle className="animate-spin" size={17} /> : <WandSparkles size={17} />}
                  {isImproving ? "Improving" : "Improve Prompt"}
                </button>
                <Button type="button" onClick={usePrompt} disabled={!campaignPrompt} className="h-12 px-5">
                  {promptApplied ? <Check size={18} /> : <Zap size={18} />}
                  {promptApplied ? "Prompt In Use" : "Use This Prompt"}
                </Button>
              </div>
            </div>
          </section>

          <section className="glass-card overflow-hidden rounded-xl">
            <div className="flex flex-col gap-4 border-b border-white/10 px-7 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-400/20 text-base font-bold text-violet-100">3</span>
                <div>
                  <h2 className="font-semibold text-white">Prompt Quality</h2>
                  <p className="mt-1 text-sm text-slate-400">评估当前 Prompt 是否足以稳定驱动内容生产</p>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <strong className="text-4xl font-semibold text-cyan-100">{promptScore?.total ?? "--"}</strong>
                <span className="pb-1 text-sm text-slate-400">/100</span>
              </div>
            </div>
            <div className="grid gap-px bg-white/8 md:grid-cols-2">
              {scoreDimensions.map((dimension) => {
                const value = promptScore?.[dimension.key] ?? 0;
                return (
                  <div key={dimension.key} className="bg-[#081728]/95 px-6 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{dimension.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{dimension.detail}</p>
                      </div>
                      <strong className={value ? "text-cyan-100" : "text-slate-500"}>{value || "--"}</strong>
                    </div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/8">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-300" animate={{ width: `${value}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {promptScore && ((promptScore.issues?.length ?? 0) > 0 || (promptScore.suggestions?.length ?? 0) > 0) ? (
              <div className="grid gap-4 border-t border-white/10 bg-[#081728]/95 p-6 md:grid-cols-2">
                <div>
                  <p className="font-semibold text-white">Issues</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                    {(promptScore.issues ?? []).slice(0, 4).map((issue) => <li key={issue}>• {issue}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-white">Suggestions</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                    {(promptScore.suggestions ?? []).slice(0, 4).map((suggestion) => <li key={suggestion}>• {suggestion}</li>)}
                  </ul>
                </div>
              </div>
            ) : null}
          </section>

          <section className="glass-card overflow-hidden rounded-xl">
            <div className="flex items-center gap-4 border-b border-white/10 px-7 py-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/15 text-base font-bold text-emerald-100">4</span>
              <div>
                <h2 className="font-semibold text-white">Pipeline Input Summary</h2>
                <p className="mt-1 text-sm text-slate-400">确认进入 Pipeline 的 Prompt 与必要配置</p>
              </div>
            </div>
            <div className="space-y-6 p-7">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Raw Requirement</p>
                  <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-300">{rawRequirement || "尚未输入自然语言内容需求"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Campaign Prompt</p>
                  <p className="mt-3 text-sm text-slate-300">{campaignPrompt ? `${promptStatus} · Version ${campaignPrompt.version} · ${promptScore?.total ?? "--"}/100` : "尚未生成 Campaign Prompt"}</p>
                  <p className="mt-2 text-xs text-slate-400">{promptApplied ? "已设为当前 Pipeline 输入" : "生成后可继续编辑、优化或直接提交"}</p>
                </div>
              </div>

              <div>
                <p className="mb-3 font-semibold text-white">目标平台</p>
                <div className="flex flex-wrap gap-3">
                  {platformOptions.map((platform) => {
                    const selected = options.platforms.includes(platform.id);
                    return (
                      <button key={platform.id} type="button" onClick={() => togglePlatform(platform.id)} className={`inline-flex h-11 items-center gap-2 rounded-lg border px-4 font-medium transition ${selected ? "border-cyan-300/55 bg-cyan-300/12 text-white" : "border-white/10 bg-white/[0.035] text-slate-400 hover:text-white"}`}>
                        <span className={`flex h-6 min-w-7 items-center justify-center rounded px-1 text-[11px] font-bold ${selected ? "bg-cyan-300 text-slate-950" : "bg-white/8"}`}>{platform.code}</span>
                        {platform.label}
                        {selected ? <Check size={14} /> : null}
                      </button>
                    );
                  })}
                </div>
                {recognizedPlatforms.length ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-2 text-sm font-medium text-emerald-200">
                    <Sparkles size={15} /> 识别到目标平台：{recognizedPlatforms.map(getPlatformLabel).join("、")}
                  </p>
                ) : null}
                {platformSelectionTouched ? (
                  <p className="mt-3 text-xs text-slate-400">当前使用手动选择的平台；再次编辑自然语言需求后会重新执行平台识别。</p>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <ToggleSetting icon={ImageIcon} title="生成视觉素材" description="封面、轮播背景、关键帧和 Banner" enabled={options.generateVisuals} onToggle={() => { setOptions((current) => ({ ...current, generateVisuals: !current.generateVisuals })); setPromptApplied(false); }} />
                <ToggleSetting icon={ShieldCheck} title="启用质量评分" description="低分时生成优化建议与改写版本" enabled={options.enableQualityScoring} onToggle={() => { setOptions((current) => ({ ...current, enableQualityScoring: !current.enableQualityScoring })); setPromptApplied(false); }} />
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-white">每个平台输出数量</p>
                  <p className="mt-1 text-xs text-slate-400">Pipeline 会按平台分别生成对应数量的内容方案</p>
                </div>
                <div className="flex rounded-lg border border-white/10 bg-black/20 p-1">
                  {[1, 3, 5, 10].map((count) => (
                    <button key={count} type="button" onClick={() => { setOptions((current) => ({ ...current, outputCount: count })); setPromptApplied(false); }} className={`h-10 min-w-12 rounded-md px-3 font-semibold transition ${options.outputCount === count ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:text-white"}`}>{count}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-28">
          <section className="glass-card overflow-hidden rounded-xl border-cyan-300/25">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <Clipboard size={20} className="text-cyan-300" />
              <h2 className="font-semibold text-white">Prompt & Pipeline Status</h2>
            </div>
            <dl className="divide-y divide-white/10 px-6">
              <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-slate-400">Prompt 状态</dt><dd><Badge tone={campaignPrompt?.status === "improved" ? "green" : campaignPrompt ? "aqua" : "slate"}>{promptStatus}</Badge></dd></div>
              <div className="flex items-start justify-between gap-5 py-4"><dt className="shrink-0 text-sm text-slate-400">目标平台</dt><dd className="text-right text-sm text-slate-200">{options.platforms.length ? options.platforms.map(getPlatformLabel).join("、") : "未选择"}</dd></div>
              <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-slate-400">视觉素材</dt><dd className={options.generateVisuals ? "text-emerald-300" : "text-slate-400"}>{options.generateVisuals ? "开启" : "关闭"}</dd></div>
              <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-slate-400">质量评分</dt><dd className={options.enableQualityScoring ? "text-emerald-300" : "text-slate-400"}>{options.enableQualityScoring ? "开启" : "关闭"}</dd></div>
              <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-slate-400">Pipeline 状态</dt><dd><Badge tone={pipelineReady ? "green" : "orange"}>{pipelineReady ? "Ready" : "Not Ready"}</Badge></dd></div>
            </dl>
          </section>

          <section className="glass-card overflow-hidden rounded-xl">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <Layers3 size={20} className="text-cyan-300" />
              <h2 className="font-semibold text-white">系统将生成的内容资产</h2>
            </div>
            <div className="space-y-3 p-5">
              {selectedAssets.map((asset) => (
                <div key={asset.title} className="rounded-lg border border-white/10 bg-black/15 px-4 py-3.5">
                  <p className="font-semibold text-white">{asset.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{asset.outputs}</p>
                </div>
              ))}
              {!selectedAssets.length ? <p className="rounded-lg border border-dashed border-white/15 p-5 text-center text-sm text-slate-400">选择平台后显示内容资产</p> : null}
            </div>
          </section>

          <section className="glass-card overflow-hidden rounded-xl">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
              <Route size={20} className="text-violet-300" />
              <h2 className="font-semibold text-white">Pipeline Preview</h2>
            </div>
            <div className="px-6 py-4">
              {pipelineSteps.map((step, index) => (
                <div key={step} className="relative flex min-h-12 items-center gap-3">
                  {index < pipelineSteps.length - 1 ? <span className="absolute left-[14px] top-9 h-6 w-px bg-blue-400/25" /> : null}
                  <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-300/35 bg-blue-500/18 text-xs font-semibold text-blue-100">{index + 1}</span>
                  <span className="flex-1 text-sm text-slate-300">{step}</span>
                  <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-400">待执行</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="glass-card sticky bottom-4 z-20 mt-7 flex flex-col gap-4 rounded-xl border-cyan-300/25 px-6 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.45)] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {error ? <p className="font-medium text-rose-300">{error}</p> : null}
          {!error && notice ? <p className="flex items-center gap-2 font-medium text-emerald-300"><CircleCheck size={17} />{notice}</p> : null}
          {!error && !notice ? <p className="text-sm text-slate-400">当前输入：<span className="font-medium text-slate-200">{promptStatus} · {options.platforms.length} 个平台 · {options.outputCount} 条/平台</span></p> : null}
        </div>
        <div className="flex shrink-0 gap-3">
          <button type="button" onClick={saveDraft} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/15 px-5 font-medium text-slate-200 transition hover:bg-white/[0.05]"><Save size={17} />保存草稿</button>
          <Button type="button" onClick={submitToPipeline} className="h-12 px-7">提交并进入 Pipeline <ArrowRight size={18} /></Button>
        </div>
      </div>
    </div>
  );
}
