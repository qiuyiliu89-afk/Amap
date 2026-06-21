import { CheckCircle2, Clock3, LoaderCircle } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

interface PipelineStepCardProps {
  index: number;
  title: string;
  description: string;
  status?: "ready" | "fallback" | "pending" | "running";
}

export function PipelineStepCard({
  index,
  title,
  description,
  status = "pending",
}: PipelineStepCardProps) {
  const isReady = status === "ready" || status === "fallback";

  return (
    <Card className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-aqua-400/12 text-aqua-200">
        {status === "running" ? <LoaderCircle className="animate-spin" size={18} /> : isReady ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">STEP {index}</span>
          <Badge tone={status === "fallback" ? "orange" : isReady ? "green" : status === "running" ? "aqua" : "slate"}>
            {status === "fallback" ? "Stable fallback" : isReady ? "Ready" : status === "running" ? "Running" : "Queued"}
          </Badge>
        </div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
      </div>
    </Card>
  );
}
