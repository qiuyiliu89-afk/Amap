import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  FileCode2,
  Layers3,
  LoaderCircle,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  createInitialPipelineSteps,
  pipelineRuntimeVersion,
  runPromptPipeline,
} from "../ai/workflow/runPromptPipeline";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import type { PipelineRunState, PipelineStepStatus, Platform } from "../types/campaign";
import {
  getContentPackage,
  getPipelineInput,
  getPipelineStatus,
  saveContentPackage,
  saveExportPackage,
  savePipelineStatus,
  saveVisualAssets,
} from "../utils/storageUtils";

const platformLabels: Record<Platform, string> = {
  douyin: "抖音",
  xiaohongshu: "小红书",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube_shorts: "YouTube Shorts",
  push_banner: "Push / Banner",
};

function getAssetSummary(platforms: Platform[]) {
  const assets = ["Campaign 内容策略"];
  if (platforms.some((platform) => ["douyin", "tiktok", "youtube_shorts"].includes(platform))) {
    assets.push("短视频脚本与关键帧");
  }
  if (platforms.includes("xiaohongshu")) assets.push("小红书动态图文卡片");
  if (platforms.includes("instagram")) assets.push("Instagram 5 页 Carousel");
  if (platforms.includes("push_banner")) assets.push("Push / Banner 文案");
  assets.push("视觉 Prompt 与前端视觉草图", "八维质量评分与优化版本", "Markdown / JSON / CSV 导出包");
  return assets;
}

function getContentPackageMode(status: PipelineRunState) {
  if (status.source === "ark-content-success") {
    return { label: "Ark Content Package mode", tone: "aqua" as const };
  }
  if (status.source === "ark-content-repaired") {
    return { label: "Ark repaired Content Package mode", tone: "green" as const };
  }
  if (status.source === "ark-content-regenerated") {
    return { label: "Ark compact regenerated mode", tone: "green" as const };
  }
  return { label: "Fallback Content Package mode", tone: "orange" as const };
}

function getContentPackageApiStatus(status: PipelineRunState) {
  if (status.contentPackageStatus === "ark-content-success") {
    return { label: "Ark Content Package mode", tone: "aqua" as const };
  }
  if (status.contentPackageStatus === "ark-content-repaired") {
    return { label: "Ark repaired Content Package mode", tone: "green" as const };
  }
  if (status.contentPackageStatus === "ark-content-regenerated") {
    return { label: "Ark compact regenerated mode", tone: "green" as const };
  }
  if (status.contentPackageStatus === "ark-content-parse-failed") {
    return { label: "API returned, JSON parse failed", tone: "orange" as const };
  }
  if (status.contentPackageStatus === "ark-content-request-failed") {
    return { label: "API request failed", tone: "orange" as const };
  }
  return { label: "Fallback Content Package mode", tone: "orange" as const };
}

function getContentPackageParseDiagnostic(status: PipelineRunState) {
  if (status.contentPackageStatus === "ark-content-repaired") {
    return status.contentPackageParseError
      ? `Repaired successfully. Original raw response issue: ${status.contentPackageParseError}`
      : "Repaired successfully. No blocking parse error.";
  }

  return status.contentPackageParseError || "None";
}

function hasCurrentContentPackageStatus(status: PipelineRunState) {
  return [
    "ark-content-success",
    "ark-content-repaired",
    "ark-content-regenerated",
    "ark-content-parse-failed",
    "ark-content-request-failed",
    "fallback",
  ].includes(status.contentPackageStatus ?? "");
}

function createIdleStatus(): PipelineRunState {
  return {
    pipelineVersion: pipelineRuntimeVersion,
    status: "idle",
    currentStep: -1,
    completedSteps: 0,
    source: "fallback",
    updatedAt: "",
    steps: createInitialPipelineSteps(),
    completed: false,
    stepsCompleted: 0,
  };
}

function StatusBadge({ status }: { status: PipelineStepStatus }) {
  if (status === "running") return <Badge tone="aqua">running</Badge>;
  if (status === "done") return <Badge tone="green">done</Badge>;
  return <Badge tone="slate">waiting</Badge>;
}

function PromptScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 42;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="url(#pipeline-score-gradient)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
        />
        <defs>
          <linearGradient id="pipeline-score-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <strong className="text-2xl text-white">{score}</strong>
        <span className="text-[11px] text-slate-400">Prompt Quality</span>
      </div>
    </div>
  );
}

export function PipelinePage() {
  const navigate = useNavigate();
  const [pipelineInput] = useState(() => getPipelineInput());
  const [pipelineStatus, setPipelineStatus] = useState<PipelineRunState>(() => {
    const stored = getPipelineStatus();
    return stored?.steps?.length ? stored : createIdleStatus();
  });
  const [contentReady, setContentReady] = useState(() => Boolean(getContentPackage()));
  const [error, setError] = useState("");

  const shouldRun = Boolean(
    pipelineInput && !(
      pipelineStatus.pipelineVersion === pipelineRuntimeVersion &&
      pipelineStatus.status === "completed" &&
      contentReady &&
      hasCurrentContentPackageStatus(pipelineStatus)
    ),
  );
  const progress = Math.round((pipelineStatus.completedSteps / pipelineStatus.steps.length) * 100);
  const currentStep = pipelineStatus.currentStep >= 0 ? pipelineStatus.steps[pipelineStatus.currentStep] : null;
  const packageMode = getContentPackageMode(pipelineStatus);
  const apiStatus = getContentPackageApiStatus(pipelineStatus);
  const parseDiagnostic = getContentPackageParseDiagnostic(pipelineStatus);
  const generatedAssetSummary = getAssetSummary(pipelineInput?.platforms ?? []);
  const promptExcerpt = useMemo(
    () => pipelineInput?.campaignPrompt.content.split("\n").filter(Boolean).slice(0, 7).join("\n") ?? "",
    [pipelineInput],
  );

  function retryArkContentPackage() {
    const idleStatus = createIdleStatus();
    setError("");
    setContentReady(false);
    setPipelineStatus(idleStatus);
    savePipelineStatus(idleStatus);
  }

  useEffect(() => {
    if (!pipelineInput || !shouldRun) return;
    const controller = new AbortController();
    setContentReady(false);
    setError("");

    runPromptPipeline({
      pipelineInput,
      signal: controller.signal,
      stepDelay: 700,
      onStepUpdate: (status) => {
        setPipelineStatus(status);
        savePipelineStatus(status);
      },
      onComplete: (result) => {
        saveContentPackage(result.contentPackage);
        saveVisualAssets(result.visualAssets);
        savePipelineStatus(result.pipelineStatus);
        saveExportPackage(result.exportPackage);
        setPipelineStatus(result.pipelineStatus);
        setContentReady(true);
      },
    }).catch((reason: unknown) => {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      const failedStatus: PipelineRunState = {
        ...pipelineStatus,
        status: "failed",
        updatedAt: new Date().toISOString(),
      };
      setPipelineStatus(failedStatus);
      savePipelineStatus(failedStatus);
      setError("Pipeline 执行中断，请返回 Prompt Engine 检查输入后重新提交。");
    });

    return () => controller.abort();
  }, [pipelineInput, shouldRun]);

  if (!pipelineInput) {
    return (
      <div className="pipeline-console space-y-8">
        <div>
          <Badge tone="aqua">AI Content Pipeline</Badge>
          <h1 className="mt-4 text-4xl font-semibold text-white">等待 Campaign Prompt</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">请先在 Prompt Engine 中生成并确认 Campaign Prompt，再启动内容生产流水线。</p>
        </div>
        <Card className="flex min-h-[320px] flex-col items-center justify-center border-cyan-300/20 text-center">
          <FileCode2 size={42} className="text-cyan-300" />
          <h2 className="mt-5 text-2xl font-semibold text-white">尚未发现 Pipeline Input</h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-slate-400">Pipeline 只读取 `amap_pipeline_input`，不会使用旧 Campaign Brief。</p>
          <Link to="/brief" className="mt-6"><Button className="h-12 px-6 text-base">返回 Prompt Engine</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="pipeline-console pb-10">
      <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <Badge tone="aqua">AI Content Pipeline</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">AI Content Pipeline</h1>
          <p className="mt-3 max-w-4xl text-[15px] leading-7 text-slate-300 md:text-base">
            基于 Campaign Prompt 自动生成内容资产、视觉素材、质量评分和导出发布包。
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3">
          {pipelineStatus.status === "completed" ? <CheckCircle2 className="text-emerald-300" size={20} /> : <LoaderCircle className="animate-spin text-cyan-300" size={20} />}
          <span className="font-medium text-slate-200">{pipelineStatus.status === "completed" ? "Pipeline Completed" : currentStep ? `正在执行：${currentStep.title}` : "准备执行"}</span>
          <Badge tone={packageMode.tone}>{packageMode.label}</Badge>
        </div>
      </header>

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
        <main className="space-y-5">
          <section className="glass-card rounded-xl border-cyan-300/25 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">Current Pipeline</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Prompt-driven Content Package</h2>
              </div>
              <div className="text-right">
                <strong className="text-3xl text-cyan-100">{progress}%</strong>
                <p className="mt-1 text-sm text-slate-400">{pipelineStatus.completedSteps}/{pipelineStatus.steps.length} steps completed</p>
              </div>
            </div>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/8">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-300" animate={{ width: `${progress}%` }} transition={{ duration: 0.35 }} />
            </div>
          </section>

          <div className="space-y-4">
            {pipelineStatus.steps.map((step) => {
              const isRunning = step.status === "running";
              const isDone = step.status === "done";
              return (
                <motion.section
                  key={step.id}
                  layout
                  className={`relative overflow-hidden rounded-xl border p-6 transition ${
                    isRunning
                      ? "border-cyan-300/55 bg-cyan-300/[0.07] shadow-[0_0_45px_rgba(34,211,238,0.14)]"
                      : isDone
                        ? "border-emerald-300/22 bg-emerald-300/[0.035]"
                        : "border-white/10 bg-[#091828]/80"
                  }`}
                >
                  {isRunning ? <motion.div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent" animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 1.2, repeat: Infinity }} /> : null}
                  <div className="flex items-start gap-5">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-semibold ${isDone ? "border-emerald-300/35 bg-emerald-300/12 text-emerald-200" : isRunning ? "border-cyan-300/45 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-500"}`}>
                      {isDone ? <Check size={21} /> : isRunning ? <LoaderCircle className="animate-spin" size={21} /> : step.index}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">STEP {step.index}</p>
                          <h3 className="mt-1 text-xl font-semibold text-white">{step.title}</h3>
                        </div>
                        <StatusBadge status={step.status} />
                      </div>
                      <p className="mt-3 text-base leading-7 text-slate-300">{step.description}</p>
                      <div className={`mt-4 rounded-lg border px-4 py-3 text-sm leading-6 ${isDone ? "border-emerald-300/18 bg-emerald-300/[0.035] text-emerald-50" : isRunning ? "border-cyan-300/20 bg-cyan-300/[0.04] text-cyan-50" : "border-white/8 bg-black/10 text-slate-500"}`}>
                        <span className="mr-2 font-semibold">Output</span>{step.outputSummary}
                      </div>
                    </div>
                  </div>
                </motion.section>
              );
            })}
          </div>

          {error ? <div className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-5 py-4 text-rose-100">{error}</div> : null}

          {pipelineStatus.status === "completed" && contentReady ? (
            <section className="glass-card rounded-xl border-emerald-300/25 p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-300" size={22} /><h2 className="text-2xl font-semibold text-white">内容生产流水线已完成</h2></div>
                  <p className="mt-3 text-base text-slate-300">内容资产、视觉草图、平台预览数据、质量评分和导出包均已保存。</p>
                  <div className="mt-3"><Badge tone={packageMode.tone}>{packageMode.label}</Badge></div>
                </div>
                <div className="flex flex-wrap gap-4">
                  {pipelineStatus.fallback ? (
                    <Button type="button" variant="secondary" onClick={retryArkContentPackage} className="h-12 whitespace-nowrap px-6 !text-base">
                      <RefreshCw size={18} /> 重新请求 Ark
                    </Button>
                  ) : null}
                  <Button type="button" onClick={() => navigate("/assets")} className="h-12 whitespace-nowrap px-6 !text-base">查看内容资产 <ArrowRight size={18} /></Button>
                  <Button type="button" variant="secondary" onClick={() => navigate("/preview")} className="h-12 whitespace-nowrap px-6 !text-base">查看平台预览</Button>
                  <Button type="button" variant="ghost" onClick={() => navigate("/brief")} className="h-12 whitespace-nowrap px-6 !text-base">返回 Prompt Engine</Button>
                </div>
              </div>
            </section>
          ) : null}

          {pipelineStatus.status === "completed" ? (
            <section className="glass-card rounded-xl border-white/10 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Content Package Debug</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Ark 文本生成状态</h2>
                </div>
                <Badge tone={apiStatus.tone}>{apiStatus.label}</Badge>
              </div>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-white/8 bg-black/10 px-4 py-3"><dt className="text-slate-500">source</dt><dd className="mt-1 break-words text-slate-100">{pipelineStatus.source}</dd></div>
                <div className="rounded-lg border border-white/8 bg-black/10 px-4 py-3"><dt className="text-slate-500">fallback</dt><dd className="mt-1 text-slate-100">{String(Boolean(pipelineStatus.fallback))}</dd></div>
                <div className="rounded-lg border border-white/8 bg-black/10 px-4 py-3 sm:col-span-2"><dt className="text-slate-500">errorMessage</dt><dd className="mt-1 break-words text-slate-100">{pipelineStatus.contentPackageError || "None"}</dd></div>
                <div className="rounded-lg border border-white/8 bg-black/10 px-4 py-3 sm:col-span-2"><dt className="text-slate-500">parseDiagnostic</dt><dd className="mt-1 break-words text-slate-100">{parseDiagnostic}</dd></div>
              </dl>
              <div className="mt-3 rounded-lg border border-white/8 bg-black/15 p-4">
                <p className="text-sm text-slate-500">rawResponse · first 2000 chars</p>
                <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-300">{pipelineStatus.contentPackageRawResponse || "No model response was returned."}</pre>
              </div>
            </section>
          ) : null}
        </main>

        <aside className="space-y-5 xl:sticky xl:top-28">
          <section className="glass-card overflow-hidden rounded-xl border-cyan-300/25">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5"><FileCode2 size={20} className="text-cyan-300" /><h2 className="text-xl font-semibold text-white">Campaign Prompt</h2></div>
            <div className="p-6">
              <div className="flex items-center gap-5">
                <PromptScoreRing score={pipelineInput.promptScore.total} />
                <div>
                  <p className="font-semibold text-white">Version {pipelineInput.campaignPrompt.version}</p>
                  <p className="mt-2 text-sm text-slate-400">{pipelineInput.campaignPrompt.status === "improved" ? "已优化 Prompt" : "已生成 Prompt"}</p>
                  <p className="mt-2 text-sm text-slate-400">{pipelineInput.outputCount} 条 / 平台</p>
                </div>
              </div>
              <pre className="mt-5 max-h-56 overflow-hidden whitespace-pre-wrap rounded-lg border border-white/10 bg-black/20 p-4 font-mono text-xs leading-6 text-slate-300">{promptExcerpt}</pre>
            </div>
          </section>

          <section className="glass-card overflow-hidden rounded-xl">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5"><Route size={20} className="text-blue-300" /><h2 className="text-xl font-semibold text-white">目标平台</h2></div>
            <div className="flex flex-wrap gap-2.5 p-5">
              {pipelineInput.platforms.map((platform) => <span key={platform} className="rounded-lg border border-blue-300/25 bg-blue-400/10 px-3 py-2 text-sm font-medium text-blue-50">{platformLabels[platform]}</span>)}
            </div>
          </section>

          <section className="glass-card overflow-hidden rounded-xl">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5"><Layers3 size={20} className="text-cyan-300" /><h2 className="text-xl font-semibold text-white">将生成的内容资产</h2></div>
            <div className="space-y-2 p-5">
              {generatedAssetSummary.map((asset) => <div key={asset} className="flex items-center gap-3 rounded-lg border border-white/8 bg-black/10 px-3.5 py-3"><span className="h-2 w-2 rounded-full bg-cyan-300" /><span className="text-sm text-slate-200">{asset}</span></div>)}
            </div>
          </section>

          <section className="glass-card overflow-hidden rounded-xl">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5"><Workflow size={20} className="text-violet-300" /><h2 className="text-xl font-semibold text-white">Pipeline 状态</h2></div>
            <dl className="divide-y divide-white/10 px-6">
              <div className="flex items-center justify-between py-4"><dt className="text-sm text-slate-400">运行状态</dt><dd><Badge tone={pipelineStatus.status === "completed" ? "green" : "aqua"}>{pipelineStatus.status}</Badge></dd></div>
              <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-slate-400">内容包来源</dt><dd className="text-right"><Badge tone={packageMode.tone}>{packageMode.label}</Badge></dd></div>
              <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-slate-400">Ark API 状态</dt><dd className="text-right"><Badge tone={apiStatus.tone}>{apiStatus.label}</Badge></dd></div>
              <div className="flex items-center justify-between py-4"><dt className="text-sm text-slate-400">当前步骤</dt><dd className="max-w-[210px] text-right text-sm text-white">{currentStep?.title ?? "全部完成"}</dd></div>
              <div className="flex items-center justify-between py-4"><dt className="text-sm text-slate-400">视觉素材</dt><dd className="text-sm text-emerald-300">{pipelineInput.generateVisuals ? "AI image generation" : "Frontend visual draft"}</dd></div>
              <div className="flex items-center justify-between py-4"><dt className="text-sm text-slate-400">质量评分</dt><dd className="text-sm text-emerald-300">{pipelineInput.enableQualityScoring ? "已启用" : "基础检查"}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
