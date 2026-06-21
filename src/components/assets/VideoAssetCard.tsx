import { Film } from "lucide-react";
import type { ContentAsset } from "../../types/campaign";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

export function VideoAssetCard({ asset }: { asset: ContentAsset }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Film className="text-aqua-200" size={20} />
          <h3 className="font-semibold text-white">视频内容资产</h3>
        </div>
        <Badge>9:16 Preview</Badge>
      </div>
      <p className="text-sm font-medium text-aqua-100">{asset.title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{asset.body}</p>
      <p className="mt-4 text-xs leading-5 text-slate-400">{asset.fitReason}</p>
    </Card>
  );
}
