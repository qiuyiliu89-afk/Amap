import { CheckCircle2, CircleDashed } from "lucide-react";
import {
  getContentPackage,
  getExportPackage,
  getPipelineInput,
  getPipelineStatus,
  getVisualAssets,
} from "../../utils/storageUtils";

const baseItems = [
  "Prompt confirmed",
  "Pipeline completed 9/9",
  "Assets generated",
  "Previews rendered",
  "Export package ready",
];

export function WorkflowStatusStrip() {
  const pipelineInput = getPipelineInput();
  const pipelineStatus = getPipelineStatus();
  const contentPackage = getContentPackage();
  const visualAssets = getVisualAssets();
  const exportPackage = getExportPackage();

  const states = [
    Boolean(pipelineInput?.campaignPrompt?.content),
    pipelineStatus?.status === "completed" && pipelineStatus.completedSteps >= 9,
    Boolean(contentPackage),
    Boolean(contentPackage) && (Boolean(visualAssets && Object.keys(visualAssets.assets).length) || pipelineStatus?.status === "completed"),
    Boolean(exportPackage?.jsonReady),
  ];

  return (
    <div className="glass-card overflow-hidden rounded-xl border-aqua-300/25">
      <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aqua-200">
          AI Workflow Status
        </p>
        <div className="flex flex-wrap gap-2">
          {baseItems.map((label, index) => {
            const ready = states[index];
            return (
              <span
                key={label}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  ready
                    ? "border-aqua-300/35 bg-aqua-300/10 text-aqua-100"
                    : "border-white/10 bg-white/[0.035] text-slate-400"
                }`}
              >
                {ready ? <CheckCircle2 size={14} /> : <CircleDashed size={14} />}
                {label}
                {!ready ? <span className="text-[10px] font-medium uppercase tracking-[0.16em]">pending</span> : null}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
