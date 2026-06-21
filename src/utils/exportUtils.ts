import Papa from "papaparse";
import type { BatchRow, ContentPackage } from "../types/campaign";

export function createPackageMarkdown(contentPackage: ContentPackage) {
  return contentPackage.exportPackage.markdownSummary;
}

export function createPackageJson(contentPackage: ContentPackage) {
  return JSON.stringify(contentPackage, null, 2);
}

export function createBatchCsv(rows: BatchRow[]) {
  return Papa.unparse(rows);
}

export function convertRowsToCSV(rows: Array<Record<string, string | number | boolean | null | undefined>>) {
  return Papa.unparse(rows);
}

export function createContentPackageCsv(contentPackage: ContentPackage) {
  return Papa.unparse(contentPackage.exportPackage.csvRows);
}

export async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
