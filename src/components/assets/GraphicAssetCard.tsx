import { Images } from "lucide-react";
import type { ContentAsset } from "../../types/campaign";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

export function GraphicAssetCard({ asset, label }: { asset: ContentAsset; label: string }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Images className="text-aqua-200" size={20} />
          <h3 className="font-semibold text-white">{label}</h3>
        </div>
        <Badge tone="slate">{asset.format}</Badge>
      </div>
      <p className="text-sm font-medium text-aqua-100">{asset.title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{asset.body}</p>
      {asset.hashtags ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {asset.hashtags.map((tag) => (
            <Badge key={tag} tone="aqua">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
