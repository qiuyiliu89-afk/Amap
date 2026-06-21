import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, RefreshCw, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SectionTitle } from "../components/ui/SectionTitle";
import { WorkflowStatusStrip } from "../components/workflow/WorkflowStatusStrip";
import { mockBatchRows } from "../data/mockBatchRows";
import type { BatchRow } from "../types/campaign";
import { convertRowsToCSV, downloadTextFile } from "../utils/exportUtils";

type BatchStatus = "waiting" | "generating" | "scored" | "ready" | "needs-rewrite";

interface BatchMatrixRow extends BatchRow {
  id: string;
  status: BatchStatus;
  caption: string;
  visualPrompt: string;
  rewriteSuggestion: string;
}

function createRows(): BatchMatrixRow[] {
  return mockBatchRows.map((row, index) => ({
    ...row,
    id: `${row.city}-${row.platform}-${index}`,
    status: row.score < 4 ? "needs-rewrite" : "ready",
    caption:
      row.platform === "TikTok"
        ? "A route that adapts to your time, mood and real-world traffic — before the next stop."
        : row.platform === "Instagram"
          ? "Turn city tabs into one route that matches your mood, timing and distance."
          : row.platform === "Push"
            ? "打开路线，查看现在更适合先去哪里。"
            : "把收藏、时间和距离交给 AI，今天就能少绕路。",
    visualPrompt:
      row.visualStatus === "No visual needed"
        ? "No visual asset required. Keep notification typography clear and action-first."
        : `City ${row.city} map route visual, teal AI glow, 2-3 landmark nodes, platform-safe text area, premium travel-tech style.`,
    rewriteSuggestion:
      row.score < 4
        ? "强化前三秒冲突，并补充视觉节点，让用户更快理解城市路线从分散到清晰的变化。"
        : "当前内容可进入导出包；后续可按城市活动节点微调地点表达。",
  }));
}

function statusLabel(status: BatchStatus) {
  if (status === "needs-rewrite") return "Needs rewrite";
  return status;
}

function statusTone(status: BatchStatus): "aqua" | "orange" | "slate" | "green" {
  if (status === "ready") return "green";
  if (status === "generating" || status === "scored") return "aqua";
  if (status === "needs-rewrite") return "orange";
  return "slate";
}

export function BatchPage() {
  const [rows, setRows] = useState<BatchMatrixRow[]>(() => createRows());
  const [expandedRowId, setExpandedRowId] = useState<string | null>(rows[0]?.id ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const timers = useRef<number[]>([]);

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }

  useEffect(() => clearTimers, []);

  function generateBatchMatrix() {
    clearTimers();
    setIsGenerating(true);
    setRows((current) => current.map((row) => ({ ...row, status: "waiting" })));

    timers.current.push(window.setTimeout(() => {
      setRows((current) => current.map((row) => ({ ...row, status: "generating" })));
    }, 260));

    timers.current.push(window.setTimeout(() => {
      setRows((current) => current.map((row) => ({ ...row, status: "scored" })));
    }, 1050));

    timers.current.push(window.setTimeout(() => {
      setRows((current) => current.map((row) => ({
        ...row,
        status: row.score < 4 ? "needs-rewrite" : "ready",
        exportStatus: row.score < 4 ? "Needs rewrite" : "Ready",
      })));
      setIsGenerating(false);
    }, 1750));
  }

  function rescoreLowQualityRows() {
    clearTimers();
    setRows((current) => current.map((row) => (
      row.score < 4 ? { ...row, status: "generating" } : row
    )));

    timers.current.push(window.setTimeout(() => {
      setRows((current) => current.map((row) => (
        row.score < 4
          ? {
              ...row,
              score: 4.2,
              status: "ready",
              exportStatus: "Ready",
              rewriteSuggestion: "已增强 Hook 冲突和视觉节点，当前行可进入导出包。",
            }
          : row
      )));
    }, 800));
  }

  function exportCsv() {
    const csv = convertRowsToCSV(rows.map(({ id, caption, visualPrompt, rewriteSuggestion, status, ...row }) => ({
      ...row,
      status: statusLabel(status),
      caption,
      visualPrompt,
      rewriteSuggestion,
    })));
    downloadTextFile("amap-batch-matrix.csv", csv, "text/csv");
  }

  const readyCount = rows.filter((row) => row.status === "ready").length;
  const rewriteCount = rows.filter((row) => row.status === "needs-rewrite").length;
  const selectedRow = rows.find((row) => row.id === expandedRowId);

  return (
    <div className="space-y-8">
      <WorkflowStatusStrip />
      <SectionTitle
        eyebrow="Batch"
        title="批量内容矩阵生成"
        description="本页面内容由已完成的 AI 内容生产流水线自动生成，用于发布前校对、批量扩展和导出交付。基于同一个 Campaign Prompt，将内容自动扩展到多个城市、市场、语言和平台。"
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aqua-300">Batch Matrix Header</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              ["Batch Rows", rows.length],
              ["Platforms", new Set(rows.map((row) => row.platform)).size],
              ["Markets", new Set(rows.map((row) => row.market)).size],
              ["Ready", readyCount],
              ["Needs Rewrite", rewriteCount],
              ["Source Prompt", "Confirmed"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-2 text-xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aqua-300">Batch Control Panel</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            控制区展示批量矩阵自动生成、低分行重评分和 CSV 导出。状态变化使用前端计时呈现工作流推进。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" onClick={generateBatchMatrix} disabled={isGenerating}>
              <Sparkles size={16} /> {isGenerating ? "Generating Matrix" : "Generate Batch Matrix"}
            </Button>
            <Button type="button" variant="secondary" onClick={rescoreLowQualityRows}>
              <RefreshCw size={16} /> Re-score Low Quality Rows
            </Button>
            <Button type="button" variant="secondary" onClick={exportCsv}>
              <Download size={16} /> Export CSV
            </Button>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-white/[0.05] text-slate-300">
              <tr>
                {["City", "Market", "Language", "Platform", "Content Format", "Hook", "Visual Status", "Score", "Status", "Export"].map((head) => (
                  <th key={head} className="px-4 py-3 font-semibold">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setExpandedRowId((current) => (current === row.id ? null : row.id))}
                  className="cursor-pointer border-t border-white/8 transition hover:bg-white/[0.035]"
                >
                  <td className="px-4 py-4 text-white">{row.city}</td>
                  <td className="px-4 py-4 text-slate-300">{row.market}</td>
                  <td className="px-4 py-4 text-slate-300">{row.language}</td>
                  <td className="px-4 py-4 text-slate-300">{row.platform}</td>
                  <td className="px-4 py-4 text-slate-300">{row.format}</td>
                  <td className="max-w-[280px] px-4 py-4 text-slate-300">{row.hook}</td>
                  <td className="px-4 py-4">
                    <Badge tone={row.visualStatus === "No visual needed" ? "slate" : "aqua"}>{row.visualStatus}</Badge>
                  </td>
                  <td className="px-4 py-4 text-aqua-100">{row.status === "waiting" ? "--" : row.score.toFixed(1)}</td>
                  <td className="px-4 py-4">
                    <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300">
                      {row.exportStatus}
                      <ChevronDown size={14} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedRow ? (
        <Card className="border-aqua-300/25">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge tone={statusTone(selectedRow.status)}>{statusLabel(selectedRow.status)}</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                {selectedRow.city} · {selectedRow.platform} · {selectedRow.format}
              </h2>
            </div>
            <pre className="max-w-xl overflow-auto rounded-lg border border-white/10 bg-black/20 p-4 text-xs leading-5 text-slate-300">
              {JSON.stringify({
                city: selectedRow.city,
                market: selectedRow.market,
                language: selectedRow.language,
                platform: selectedRow.platform,
                format: selectedRow.format,
                score: selectedRow.score,
                status: statusLabel(selectedRow.status),
              }, null, 2)}
            </pre>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {[
              ["Generated Hook", selectedRow.hook],
              ["Caption", selectedRow.caption],
              ["Visual Prompt", selectedRow.visualPrompt],
              ["Rewrite Suggestion", selectedRow.rewriteSuggestion],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-aqua-200">{label}</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="flex justify-end">
        <Link to="/bonus">
          <Button>View Bonus Mapping</Button>
        </Link>
      </div>
    </div>
  );
}
