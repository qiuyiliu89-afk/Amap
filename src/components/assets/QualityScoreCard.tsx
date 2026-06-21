import type { ContentPackage } from "../../types/campaign";
import { Card } from "../ui/Card";
import { ScoreBar } from "../ui/ScoreBar";

export function QualityScoreCard({ contentPackage }: { contentPackage: ContentPackage }) {
  return (
    <Card>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aqua-300">
            Quality scoring
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">质量评分</h3>
        </div>
        <div className="text-right">
          <span className="text-4xl font-semibold text-aqua-100">
            {contentPackage.qualityScore.total.toFixed(1)}
          </span>
          <span className="text-slate-400">/5</span>
        </div>
      </div>
      <div className="space-y-5">
        {contentPackage.qualityScore.dimensions.map((dimension) => (
          <ScoreBar key={dimension.label} {...dimension} />
        ))}
      </div>
    </Card>
  );
}
