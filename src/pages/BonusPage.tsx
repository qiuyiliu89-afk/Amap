import { useState } from "react";
import { CheckCircle2, FlaskConical, ImageIcon, LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { ArkImageGenerationError } from "../ai/api/generateImageWithArk";
import { testImageGeneration } from "../ai/api/testImageGeneration";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SectionTitle } from "../components/ui/SectionTitle";

const items = [
  ["AI Coding 作品", "React + Vite + TypeScript 搭建可运行 Web 作品，覆盖完整页面路由。"],
  ["自动化内容工作流", "Campaign Brief 到 Publish-ready Package 的 AI Content Pipeline。"],
  ["高德官方宣传视频类内容能力", "使用地图界面、真实地标、AI 伴行和 9:16 关键帧预览表达内容方法。"],
  ["海外媒体平台运营", "覆盖 TikTok、Instagram、YouTube Shorts 的内容形态和本地化评分。"],
  ["批量自动化开发", "Batch 页面展示多城市、多平台、多语言内容矩阵。"],
  ["文本 API + 视觉接口 + 稳定兜底", "文本内容包与单图视觉生成均已接入，失败时仍可稳定完成讲解链路。"],
];

const isDevelopment = Boolean(
  (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV,
);

export function BonusPage() {
  const [imageStatus, setImageStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState("");

  async function runImageGenerationTest() {
    setImageStatus("generating");
    setImageUrl("");
    setImageError("");

    try {
      const result = await testImageGeneration();
      setImageUrl(result.imageUrl);
      setImageStatus("success");
    } catch (error) {
      const message = error instanceof ArkImageGenerationError
        ? [error.status ? `HTTP ${error.status}` : "Ark image error", error.detail || error.message].join(": ")
        : error instanceof Error
          ? error.message
          : "Unknown image generation error";
      setImageError(message);
      setImageStatus("error");
    }
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Bonus"
        title="作业要求和加分项对应"
        description="这个页面用于面试讲解：项目围绕高德 AI 场景，展示从 Brief 到发布包的自动化能力。"
      />

      <div className="grid gap-5 md:grid-cols-2">
        {items.map(([title, description]) => (
          <Card key={title} className="flex gap-4">
            <CheckCircle2 className="mt-1 shrink-0 text-aqua-200" size={20} />
            <div>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
            </div>
          </Card>
        ))}
      </div>

      {isDevelopment ? (
        <Card className="overflow-hidden border-aqua-300/25">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <FlaskConical className="text-aqua-200" size={20} />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aqua-300">Development Test</p>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-white">火山方舟单图 API 测试</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                独立验证单张端午文化小红书封面；正式工作流由 Pipeline Step 5 按平台调用同一图片客户端。
              </p>
            </div>
            <Button type="button" onClick={runImageGenerationTest} disabled={imageStatus === "generating"}>
              {imageStatus === "generating" ? <LoaderCircle className="animate-spin" size={18} /> : <ImageIcon size={18} />}
              {imageStatus === "generating" ? "generating" : "测试生图 API"}
            </Button>
          </div>

          {imageStatus === "generating" ? (
            <div className="mt-6 rounded-lg border border-aqua-300/20 bg-aqua-300/[0.06] px-5 py-4 text-sm text-aqua-50">
              正在调用火山方舟 `/images/generations`，请稍候…
            </div>
          ) : null}

          {imageStatus === "error" ? (
            <div className="mt-6 rounded-lg border border-rose-300/25 bg-rose-400/10 px-5 py-4 text-sm leading-6 text-rose-100">
              {imageError}
            </div>
          ) : null}

          {imageStatus === "success" && imageUrl ? (
            <div className="mt-6 overflow-hidden rounded-lg border border-emerald-300/25 bg-black/20 p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-200">
                <CheckCircle2 size={17} /> API Generated · imageUrl received
              </div>
              <img
                src={imageUrl}
                alt="火山方舟生成的端午文化城市旅行路线小红书封面"
                className="mx-auto max-h-[680px] w-full rounded-md object-contain"
                onError={() => {
                  setImageStatus("error");
                  setImageError("Ark returned an imageUrl, but the browser could not load the generated image.");
                }}
              />
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-6 text-slate-300">
          当前版本已完成文本内容包、平台视觉背景、前端叠加预览和发布包导出；视觉生成失败时自动保留前端草图。
        </p>
        <Link to="/">
          <Button variant="secondary">Back Home</Button>
        </Link>
      </Card>
    </div>
  );
}
