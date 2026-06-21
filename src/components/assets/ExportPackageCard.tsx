import { Download } from "lucide-react";
import type { ContentPackage } from "../../types/campaign";
import {
  createContentPackageCsv,
  createPackageJson,
  createPackageMarkdown,
  downloadTextFile,
} from "../../utils/exportUtils";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { CopyButton } from "../ui/CopyButton";

export function ExportPackageCard({ contentPackage }: { contentPackage: ContentPackage }) {
  const markdown = createPackageMarkdown(contentPackage);
  const json = createPackageJson(contentPackage);
  const csv = createContentPackageCsv(contentPackage);

  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        <Download className="text-aqua-200" size={20} />
        <h3 className="text-xl font-semibold text-white">导出发布包</h3>
      </div>
      <p className="text-base leading-7 text-slate-300">导出当前 Campaign 的结构化内容，用于交付、排期和归档。</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="secondary" type="button" onClick={() => downloadTextFile("amap-campaign-package.md", markdown, "text/markdown")}>
          <Download size={16} /> Markdown
        </Button>
        <Button variant="secondary" type="button" onClick={() => downloadTextFile("amap-campaign-package.json", json, "application/json")}>
          <Download size={16} /> JSON
        </Button>
        <Button variant="secondary" type="button" onClick={() => downloadTextFile("amap-campaign-matrix.csv", csv, "text/csv")}>
          <Download size={16} /> CSV
        </Button>
        <CopyButton text={json} label="复制 JSON" />
      </div>
    </Card>
  );
}
