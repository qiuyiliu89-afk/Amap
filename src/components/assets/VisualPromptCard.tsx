import { Sparkles } from "lucide-react";
import type { VisualAsset } from "../../types/campaign";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

export function VisualPromptCard({ asset }: { asset: VisualAsset }) {
  const displaySource = asset.source.includes("Mock") ? "AI visual frame ready" : asset.source;

  return (
    <Card>
      <div
        className={`mb-4 h-28 rounded-lg bg-gradient-to-br ${asset.colorHint} border border-white/10`}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{asset.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{asset.prompt}</p>
        </div>
        <Sparkles className="shrink-0 text-aqua-200" size={18} />
      </div>
      <Badge className="mt-4" tone="orange">
        {displaySource}
      </Badge>
    </Card>
  );
}
