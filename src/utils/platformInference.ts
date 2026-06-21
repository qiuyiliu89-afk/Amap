import type { Platform } from "../types/campaign";

const platformRules: Array<{ platform: Platform; patterns: RegExp[] }> = [
  {
    platform: "xiaohongshu",
    patterns: [/小红书/i, /小紅書/i, /\bred\b/i, /\brednote\b/i, /\bxhs\b/i],
  },
  {
    platform: "tiktok",
    patterns: [/\btiktok\b/i],
  },
  {
    platform: "douyin",
    patterns: [/抖音/i, /\bdouyin\b/i],
  },
  {
    platform: "instagram",
    patterns: [/\binstagram\b/i, /\big\b/i, /\bins\b/i],
  },
  {
    platform: "push_banner",
    patterns: [/\bpush\b/i, /推送/i, /通知/i, /\bbanner\b/i, /横幅/i],
  },
  {
    platform: "youtube_shorts",
    patterns: [/\byoutube\s+shorts\b/i, /\byt\s+shorts\b/i, /\bshorts\b/i],
  },
];

const platformAliases: Record<string, Platform> = {
  douyin: "douyin",
  抖音: "douyin",
  xiaohongshu: "xiaohongshu",
  "小红书": "xiaohongshu",
  "小紅書": "xiaohongshu",
  red: "xiaohongshu",
  rednote: "xiaohongshu",
  xhs: "xiaohongshu",
  tiktok: "tiktok",
  instagram: "instagram",
  ig: "instagram",
  ins: "instagram",
  youtube_shorts: "youtube_shorts",
  youtubeshorts: "youtube_shorts",
  "youtube shorts": "youtube_shorts",
  "yt shorts": "youtube_shorts",
  shorts: "youtube_shorts",
  push_banner: "push_banner",
  pushbanner: "push_banner",
  "push / banner": "push_banner",
  push: "push_banner",
  banner: "push_banner",
};

function uniquePlatforms(platforms: Platform[]) {
  return Array.from(new Set(platforms));
}

function normalizePlatform(platform: string): Platform | null {
  const normalized = platform.trim().toLowerCase();
  return platformAliases[normalized] ?? platformAliases[platform.trim()] ?? null;
}

export function inferExplicitPlatformsFromRequirement(rawRequirement: string): string[] {
  const requirement = rawRequirement.trim();
  if (!requirement) return [];

  return uniquePlatforms(
    platformRules
      .filter((rule) => rule.patterns.some((pattern) => pattern.test(requirement)))
      .map((rule) => rule.platform),
  );
}

export function inferPlatformsFromRequirement(
  rawRequirement: string,
  currentSelectedPlatforms: string[],
): string[] {
  const explicitPlatforms = inferExplicitPlatformsFromRequirement(rawRequirement);
  if (explicitPlatforms.length > 0) return explicitPlatforms;

  const normalizedCurrent = uniquePlatforms(
    currentSelectedPlatforms
      .map(normalizePlatform)
      .filter((platform): platform is Platform => Boolean(platform)),
  );
  if (normalizedCurrent.length > 0) return normalizedCurrent;

  return ["xiaohongshu"];
}
