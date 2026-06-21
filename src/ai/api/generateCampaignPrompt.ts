import { generateMockCampaignPrompt } from "../mock/mockPromptEngine";
import type {
  CampaignPrompt,
  CampaignPromptInferredSummary,
  CampaignPromptSource,
  Platform,
  PromptEngineOptions,
  PromptScore,
  RawRequirement,
} from "../../types/campaign";
import {
  ArkResponseFormatUnsupportedError,
  ArkThinkingUnsupportedError,
  arkResponseText,
} from "./arkClient";

export interface GenerateCampaignPromptWithArkOptions {
  selectedPlatforms: string[];
  generateVisuals: boolean;
  enableScoring: boolean;
  outputCount: number;
}

export interface GenerateCampaignPromptResult {
  campaignPrompt: CampaignPrompt;
  promptScore: PromptScore;
  inferredSummary: CampaignPromptInferredSummary;
  source: Extract<CampaignPromptSource, "ark" | "ark-repaired" | "ark-regenerated" | "ark-parse-failed" | "ark-request-failed">;
  fallback: boolean;
  rawResponse?: string;
  errorMessage?: string;
  responseFormatUsed?: boolean;
  error?: string;
}

type ArkCampaignPromptPayload = {
  promptText?: string;
  content?: string;
  version?: string;
  generatedAt?: string;
  improved?: boolean;
  sourceRequirement?: string;
};

type ArkPromptScorePayload = {
  completeness?: number;
  requirementCompleteness?: number;
  platformFit?: number;
  outputClarity?: number;
  visualFeasibility?: number;
  visualExecutability?: number;
  scoringReadiness?: number;
  scoringConstraints?: number;
  riskControl?: number;
  totalScore?: number;
  total?: number;
  issues?: unknown[];
  suggestions?: unknown[];
};

type ArkCampaignPromptResponse = {
  campaignPrompt?: ArkCampaignPromptPayload;
  promptScore?: ArkPromptScorePayload;
  inferredSummary?: Partial<CampaignPromptInferredSummary>;
};

const systemPrompt = `你是一个资深 AI 内容创作策略专家，服务于地图、出行、本地生活类 AI 产品。你的任务不是直接生成最终内容，而是把用户自然语言需求扩展成一个可执行的 Campaign Prompt，用于驱动后续多平台内容生产流水线。

请遵守：
1. 保留用户原始需求细节，不要压缩成简单字段。
2. 补充平台规则、内容任务、视觉任务、质量评分标准和输出格式。
3. Prompt 要能驱动后续 Pipeline 生成内容资产、视觉素材、平台预览、质量评分、优化建议和导出包。
4. 只返回一个 JSON object，响应必须以 { 开始并以 } 结束。
5. 不要返回 Markdown，不要使用 \`\`\`json 或任何代码块。
6. 不要返回解释、前言、结尾或 JSON 之外的多余文本。
7. 所有指定字段必须完整，不得省略。
8. 所有评分字段必须是 0-100 的数字，不能是字符串。`;

const platformLabels: Record<Platform, string> = {
  douyin: "抖音",
  xiaohongshu: "小红书",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube_shorts: "YouTube Shorts",
  push_banner: "Push / Banner",
};

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
  youtube: "youtube_shorts",
  push_banner: "push_banner",
  pushbanner: "push_banner",
  "push / banner": "push_banner",
  push: "push_banner",
  banner: "push_banner",
};

const platformPromptSpecs: Record<Platform, {
  contentTasks: string[];
  visualTasks: string[];
  qualityCriteria: string[];
  contentFormats: string[];
}> = {
  douyin: {
    contentTasks: [
      "生成抖音 3 秒 Hook",
      "按需求生成抖音视频脚本；未指定时长时，宣传视频默认 60s",
      "生成抖音分镜表、字幕、旁白和封面文案",
      "生成抖音 Hashtags",
    ],
    visualTasks: [
      "生成抖音 9:16 视频关键帧 Prompt",
      "生成抖音封面图 Prompt",
    ],
    qualityCriteria: [
      "抖音 Hook 强度",
      "短视频节奏",
      "封面点击吸引力",
    ],
    contentFormats: ["抖音短视频脚本", "分镜表", "字幕", "封面文案", "Hashtags"],
  },
  xiaohongshu: {
    contentTasks: [
      "生成小红书图文笔记标题",
      "生成小红书封面标题",
      "生成小红书正文",
      "生成小红书动态页数规划 recommendedPageCount 和 pagePlan",
      "生成 5-9 页官方品牌级小红书图文，封面独立规划，区分强视觉页与信息排版页",
      "生成小红书话题标签",
      "生成评论区互动引导",
    ],
    visualTasks: [
      "生成小红书封面图 Prompt",
      "生成小红书封面独立视觉 Prompt 和每页不同类型视觉 Prompt",
    ],
    qualityCriteria: [
      "小红书标题吸引力",
      "图文卡片连贯性",
      "种草感",
      "文化旅游内容准确性",
      "平台社区规范风险",
    ],
    contentFormats: ["小红书图文笔记", "动态页数图文轮播", "封面标题", "正文", "话题标签"],
  },
  tiktok: {
    contentTasks: [
      "生成 TikTok 英文口语化 Hook",
      "按需求生成 TikTok 竖屏视频脚本；未指定时长时默认 60s",
      "生成 TikTok 分镜、字幕、Caption 和 Hashtags",
      "生成 TikTok 封面文案",
    ],
    visualTasks: [
      "生成 TikTok 9:16 视频关键帧 Prompt",
      "生成 TikTok 封面图 Prompt",
    ],
    qualityCriteria: [
      "TikTok Hook 强度",
      "海外用户理解成本",
      "英文口语化程度",
    ],
    contentFormats: ["TikTok短视频脚本", "分镜", "字幕", "Caption", "Hashtags"],
  },
  instagram: {
    contentTasks: [
      "生成 Instagram Reels 脚本",
      "生成 Instagram Carousel 每页文案",
      "生成 Instagram Caption",
      "生成 Instagram Hashtags",
    ],
    visualTasks: [
      "生成 Instagram Carousel 视觉 Prompt",
      "生成 Instagram Reels 封面 Prompt",
    ],
    qualityCriteria: [
      "Instagram 生活方式表达",
      "Carousel 视觉连贯性",
      "Caption 可读性",
    ],
    contentFormats: ["Instagram Reels脚本", "Instagram Carousel", "Caption", "Hashtags"],
  },
  youtube_shorts: {
    contentTasks: [
      "生成 YouTube Shorts 搜索友好标题",
      "生成 YouTube Shorts 功能解释脚本",
      "生成 YouTube Shorts 字幕、描述和 Hashtags",
      "生成 YouTube Shorts 封面文案",
    ],
    visualTasks: [
      "生成 YouTube Shorts 9:16 视频关键帧 Prompt",
      "生成 YouTube Shorts 封面图 Prompt",
    ],
    qualityCriteria: [
      "YouTube Shorts 标题搜索友好度",
      "功能解释清晰度",
      "短视频留存节奏",
    ],
    contentFormats: ["YouTube Shorts标题", "短视频脚本", "字幕", "描述", "Hashtags"],
  },
  push_banner: {
    contentTasks: [
      "生成 Push 标题",
      "生成 Push 正文",
      "生成 Banner 主标题",
      "生成 Banner 副标题",
      "生成 CTA 和 A/B 测试版本",
    ],
    visualTasks: [
      "生成 Banner 图 Prompt",
      "生成 Push / Banner 转化视觉说明",
    ],
    qualityCriteria: [
      "Push 转化清晰度",
      "Banner 主标题识别度",
      "CTA 行动明确度",
    ],
    contentFormats: ["Push通知", "Banner横幅", "CTA", "A/B测试版本"],
  },
};

const platformMentionPatterns: Record<Platform, RegExp> = {
  douyin: /抖音|\bdouyin\b/i,
  xiaohongshu: /小红书|小紅書|\bred\b|\brednote\b|\bxhs\b/i,
  tiktok: /\btiktok\b/i,
  instagram: /\binstagram\b|\big\b|\bins\b/i,
  youtube_shorts: /\byoutube\s*shorts\b|\byt\s*shorts\b|\bshorts\b/i,
  push_banner: /\bpush\b|\bbanner\b|推送|通知|横幅/i,
};

function getRequirementContent(rawRequirement: RawRequirement | string) {
  return typeof rawRequirement === "string" ? rawRequirement.trim() : rawRequirement.content.trim();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown Ark API error";
}

function normalizePlatforms(platforms: string[]): Platform[] {
  const normalized = platforms
    .map((platform) => platformAliases[platform.trim().toLowerCase()] ?? platformAliases[platform.trim()])
    .filter((platform): platform is Platform => Boolean(platform));

  return Array.from(new Set(normalized));
}

function toPromptEngineOptions(options: GenerateCampaignPromptWithArkOptions): PromptEngineOptions {
  return {
    platforms: normalizePlatforms(options.selectedPlatforms),
    generateVisuals: options.generateVisuals,
    enableQualityScoring: options.enableScoring,
    outputCount: options.outputCount,
  };
}

function getScopedPlatforms(platforms: Platform[]) {
  return platforms.length > 0 ? platforms : (["xiaohongshu"] satisfies Platform[]);
}

function buildContentTasks(platforms: Platform[]) {
  return getScopedPlatforms(platforms)
    .flatMap((platform) => platformPromptSpecs[platform].contentTasks)
    .map((task) => `- ${task}`)
    .join("\n");
}

function buildVisualTasks(options: GenerateCampaignPromptWithArkOptions, platforms: Platform[]) {
  if (!options.generateVisuals) {
    return "本轮不直接生成视觉素材，但仍需为已选平台输出可供后续 Pipeline 使用的视觉 Prompt、构图说明和前端渲染线索。";
  }

  return getScopedPlatforms(platforms)
    .flatMap((platform) => platformPromptSpecs[platform].visualTasks)
    .map((task) => `- ${task}`)
    .join("\n");
}

function buildQualityCriteria(platforms: Platform[]) {
  return Array.from(new Set([
    ...getScopedPlatforms(platforms).flatMap((platform) => platformPromptSpecs[platform].qualityCriteria),
    "高德地图功能植入自然度",
    "高德 AI 伴行能力表达清晰度",
    "用户痛点清晰度",
    "视觉可执行性",
    "内容新鲜感",
    "风险等级",
  ])).map((criterion) => `- ${criterion}`).join("\n");
}

function buildContentFormats(platforms: Platform[]) {
  return Array.from(new Set(
    getScopedPlatforms(platforms).flatMap((platform) => platformPromptSpecs[platform].contentFormats),
  ));
}

function buildScopedCampaignPromptText(requirement: string, options: GenerateCampaignPromptWithArkOptions) {
  const platforms = getScopedPlatforms(toPromptEngineOptions(options).platforms);
  const platformNames = platforms.map((platform) => platformLabels[platform]);

  return `Role
你是服务于地图、出行和本地生活产品的 AI 内容创作策略专家，负责把内容需求编译成可执行的 Campaign Prompt。

Campaign Context
用户原始需求：${requirement}
目标平台：${platformNames.join("、")}
内容目标：围绕出行场景痛点、AI 伴行能力、地图连接真实世界和科技感视觉表达，生成可进入 Amap AI Content Pipeline 的内容资产任务。
平台约束：只允许生成目标平台相关任务，不要扩展到未选择的平台。

Content Tasks
每个目标平台输出 ${options.outputCount} 组内容，并严格按平台形态路由：
${buildContentTasks(platforms)}

Visual Tasks
${buildVisualTasks(options, platforms)}

Quality Criteria
${buildQualityCriteria(platforms)}

Output Format
后续模型必须输出结构化 JSON，并且只包含目标平台对应字段：
- campaignStrategy
- platformAssets
- visualPrompts
- renderHints
- qualityScore
- rewriteSuggestions
- exportPackage`;
}

function hasOutOfScopePlatformMention(promptText: string, platforms: Platform[]) {
  const selected = new Set(getScopedPlatforms(platforms));
  return Object.entries(platformMentionPatterns).some(([platform, pattern]) => {
    if (selected.has(platform as Platform)) return false;
    pattern.lastIndex = 0;
    return pattern.test(promptText);
  });
}

function enforceCampaignPromptScope(
  promptText: string,
  options: GenerateCampaignPromptWithArkOptions,
) {
  const platforms = toPromptEngineOptions(options).platforms;
  if (hasOutOfScopePlatformMention(promptText, platforms)) {
    throw new Error("Ark Campaign Prompt includes tasks for an unselected platform.");
  }

  return promptText;
}

const requiredCampaignPromptSections = [
  { label: "Role", pattern: /(?:^|\n)\s*(?:#{1,6}\s*)?(?:\d+[.)]\s*)?Role\s*(?:\r?\n|[:：])/i },
  { label: "Campaign Context", pattern: /(?:^|\n)\s*(?:#{1,6}\s*)?(?:\d+[.)]\s*)?Campaign Context\s*(?:\r?\n|[:：])/i },
  { label: "Content Tasks", pattern: /(?:^|\n)\s*(?:#{1,6}\s*)?(?:\d+[.)]\s*)?Content Tasks\s*(?:\r?\n|[:：])/i },
  { label: "Visual Tasks", pattern: /(?:^|\n)\s*(?:#{1,6}\s*)?(?:\d+[.)]\s*)?Visual Tasks\s*(?:\r?\n|[:：])/i },
  { label: "Quality Criteria", pattern: /(?:^|\n)\s*(?:#{1,6}\s*)?(?:\d+[.)]\s*)?Quality Criteria\s*(?:\r?\n|[:：])/i },
  { label: "Output Format", pattern: /(?:^|\n)\s*(?:#{1,6}\s*)?(?:\d+[.)]\s*)?Output Format\s*(?:\r?\n|[:：])/i },
];

function assertCompleteCampaignPromptStructure(promptText: string) {
  const matches = requiredCampaignPromptSections.map(({ label, pattern }) => {
    const match = pattern.exec(promptText);
    if (!match || match.index === undefined) {
      throw new Error(`Ark Campaign Prompt is incomplete: missing ${label}.`);
    }

    return { label, start: match.index, bodyStart: match.index + match[0].length };
  });

  matches.forEach((match, index) => {
    const next = matches[index + 1];
    if (next && next.start <= match.start) {
      throw new Error("Ark Campaign Prompt sections are not in the required order.");
    }

    const body = promptText.slice(match.bodyStart, next?.start ?? promptText.length).trim();
    if (body.length < 20) {
      throw new Error(`Ark Campaign Prompt is incomplete: ${match.label} has no usable content.`);
    }
  });
}

export function isCompleteCampaignPromptText(promptText: string) {
  try {
    assertCompleteCampaignPromptStructure(promptText);
    return true;
  } catch {
    return false;
  }
}

function buildUserPrompt(requirement: string, options: GenerateCampaignPromptWithArkOptions) {
  const platforms = toPromptEngineOptions(options).platforms;
  const platformNames = platforms.map((platform) => platformLabels[platform]);
  const scopedPromptTemplate = buildScopedCampaignPromptText(requirement, options);

  return `请根据以下用户自然语言需求，生成一个高质量 Campaign Prompt 和 Prompt Score。

响应格式硬性要求：
- 你必须只返回 JSON，只返回一个 JSON object。
- 响应第一个字符必须是 {，最后一个字符必须是 }。
- 不要 Markdown。
- 不要代码块。
- 不要 \`\`\`json。
- 不要解释。
- 不要在 JSON 前后添加任何文字。
- campaignPrompt.promptText 必须是 JSON 字符串字段，不允许直接输出在 JSON 外面。
- campaignPrompt.promptText 必须使用与用户原始需求相同的语言；中文需求必须输出中文，并原样保留需求中的产品名、节日、功能、平台和场景关键词。
- 以下结构中的所有字段必须完整返回。
- 所有评分必须是 0-100 的数字，不能使用字符串。
- issues、suggestions、targetPlatforms、contentFormats 必须是字符串数组。

用户原始需求：
${requirement}

已选择平台：
${platformNames.join("、") || "未选择"}

运行配置：
${JSON.stringify(
  {
    selectedPlatforms: platformNames,
    generateVisuals: options.generateVisuals,
    enableScoring: options.enableScoring,
    outputCount: options.outputCount,
  },
  null,
  2,
)}

campaignPrompt.promptText 必须包含以下部分，使用清晰英文段落标题即可，但不要把整体响应包成 Markdown：

1. Role
说明模型扮演什么角色。

2. Campaign Context
必须包含用户原始需求、产品能力、目标用户、目标平台、内容目标、语气风格。

3. Content Tasks
只针对 selectedPlatforms 中选择的平台生成任务：
${buildContentTasks(platforms)}

4. Visual Tasks
${buildVisualTasks(options, platforms)}

5. Quality Criteria
只针对 selectedPlatforms 中选择的平台生成质量标准：
${buildQualityCriteria(platforms)}

6. Output Format
要求后续模型输出结构化 JSON，字段包括：
- campaignStrategy
- platformAssets
- visualPrompts
- renderHints
- qualityScore
- rewriteSuggestions
- exportPackage

平台约束模板：
campaignPrompt.promptText 必须严格遵守下面的目标平台和任务范围，不要添加未选择平台的任务、示例或字段。
${scopedPromptTemplate}

返回 JSON 结构必须严格如下，所有字段必填，分数范围为 0-100：
{
  "campaignPrompt": {
    "promptText": "string",
    "version": "v1",
    "generatedAt": "ISO string",
    "improved": false,
    "sourceRequirement": "string"
  },
  "promptScore": {
    "completeness": 0,
    "platformFit": 0,
    "outputClarity": 0,
    "visualFeasibility": 0,
    "scoringReadiness": 0,
    "riskControl": 0,
    "totalScore": 0,
    "issues": [],
    "suggestions": []
  },
  "inferredSummary": {
    "campaignGoal": "string",
    "targetAudience": "string",
    "targetPlatforms": [],
    "contentFormats": [],
    "visualDirection": "string"
  }
}

再次确认：只输出上面的单个 JSON object，不要添加任何其他字符。`;
}

export function safeParseJSONFromLLM(rawText: string): ArkCampaignPromptResponse {
  const trimmed = rawText.trim();
  const preview = trimmed.slice(0, 500);
  if (!trimmed) {
    throw new Error("LLM returned an empty response. Raw response preview: (empty)");
  }

  const candidates: string[] = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  let lastError: unknown;
  for (const candidate of Array.from(new Set(candidates))) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Parsed value is not a JSON object.");
      }
      return parsed as ArkCampaignPromptResponse;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Unable to parse Ark response as JSON: ${getErrorMessage(lastError)} Raw response preview: ${preview}`,
  );
}

let responseFormatSupport: "unknown" | "supported" | "unsupported" = "unknown";
let thinkingSupport: "unknown" | "supported" | "unsupported" = "unknown";

async function callArkText({
  requestSystemPrompt,
  requestUserPrompt,
  maxOutputTokens,
  responseFormat,
}: {
  requestSystemPrompt: string;
  requestUserPrompt: string;
  maxOutputTokens: number;
  responseFormat?: Record<string, unknown>;
}) {
  const request = (includeThinking: boolean) => arkResponseText({
    systemPrompt: requestSystemPrompt,
    userPrompt: requestUserPrompt,
    temperature: 0.2,
    maxOutputTokens,
    responseFormat,
    ...(includeThinking ? { thinking: { type: "disabled" } } : {}),
  });

  if (thinkingSupport === "unsupported") return request(false);

  try {
    const text = await request(true);
    thinkingSupport = "supported";
    return text;
  } catch (error) {
    if (!(error instanceof ArkThinkingUnsupportedError)) throw error;
    thinkingSupport = "unsupported";
    return request(false);
  }
}

async function requestPlainArkText(
  requestSystemPrompt: string,
  requestUserPrompt: string,
  maxOutputTokens: number,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await callArkText({
        requestSystemPrompt,
        requestUserPrompt,
        maxOutputTokens,
      });
    } catch (error) {
      lastError = error;
      const retryable = /failed to fetch|networkerror/i.test(getErrorMessage(error));
      if (!retryable || attempt === 2) break;
      await new Promise((resolve) => window.setTimeout(resolve, 600));
    }
  }

  throw lastError;
}

async function requestArkJSONText(
  requestSystemPrompt: string,
  requestUserPrompt: string,
  maxOutputTokens = 5000,
) {
  if (responseFormatSupport !== "unsupported") {
    try {
      const text = await callArkText({
        requestSystemPrompt,
        requestUserPrompt,
        maxOutputTokens,
        responseFormat: { type: "json_object" },
      });
      responseFormatSupport = "supported";
      return { text, responseFormatUsed: true };
    } catch (error) {
      const mayBeUnsupportedFormat =
        error instanceof ArkResponseFormatUnsupportedError ||
        /failed to fetch|networkerror/i.test(getErrorMessage(error));
      if (!mayBeUnsupportedFormat) throw error;
      if (error instanceof ArkResponseFormatUnsupportedError) {
        responseFormatSupport = "unsupported";
      }
    }
  }

  const text = await requestPlainArkText(requestSystemPrompt, requestUserPrompt, maxOutputTokens);
  return { text, responseFormatUsed: false };
}

export async function repairJSONWithArk(
  rawResponse: string,
  requirement = "",
  options?: GenerateCampaignPromptWithArkOptions,
) {
  const repairSystemPrompt =
    "你是 JSON 修复器。你的任务是把输入内容转换成合法 JSON。不要解释，不要 Markdown，只返回 JSON object。";
  const repairUserPrompt = `请将以下内容转换为符合 Campaign Prompt Result Schema 的合法 JSON。

你必须只返回 JSON object，不要 Markdown，不要代码块，不要解释，不要在 JSON 前后添加文字。
  campaignPrompt.promptText 必须是 JSON 字符串字段。只修复 JSON 语法和转义，不要续写、压缩或凭空补造缺失的 Prompt 内容。所有分数必须是 0-100 的数字，所有数组必须是字符串数组。

原始需求：${requirement || "未提供"}
已选择平台：${options ? toPromptEngineOptions(options).platforms.map((platform) => platformLabels[platform]).join("、") : "未提供"}

Campaign Prompt Result Schema：
{
  "campaignPrompt": {
    "promptText": "string",
    "version": "v1",
    "generatedAt": "string",
    "improved": false,
    "sourceRequirement": "string"
  },
  "promptScore": {
    "completeness": 0,
    "platformFit": 0,
    "outputClarity": 0,
    "visualFeasibility": 0,
    "scoringReadiness": 0,
    "riskControl": 0,
    "totalScore": 0,
    "issues": [],
    "suggestions": []
  },
  "inferredSummary": {
    "campaignGoal": "string",
    "targetAudience": "string",
    "targetPlatforms": [],
    "contentFormats": [],
    "visualDirection": "string"
  }
}

待修复内容：
${rawResponse}`;

  return requestArkJSONText(repairSystemPrompt, repairUserPrompt, 5000);
}

function buildRegenerationUserPrompt(
  requirement: string,
  options: GenerateCampaignPromptWithArkOptions,
  failureReason: string,
) {
  return `上一次响应无效，原因：${failureReason}

请从用户原始需求和运行配置重新生成完整结果。不要续写、压缩或复用上一次残缺内容。六个 Campaign Prompt 段落必须全部包含实质内容。

${buildUserPrompt(requirement, options)}`;
}

function clampScore(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function getStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function inferSummaryDefaults(rawRequirement: string, platforms: Platform[]): CampaignPromptInferredSummary {
  const scopedPlatforms = getScopedPlatforms(platforms);

  return {
    campaignGoal: `围绕“${rawRequirement.slice(0, 80)}${rawRequirement.length > 80 ? "..." : ""}”生成可执行的多平台 Campaign Prompt`,
    targetAudience: "地图、出行与本地生活内容的目标用户",
    targetPlatforms: scopedPlatforms.map((platform) => platformLabels[platform]),
    contentFormats: buildContentFormats(scopedPlatforms),
    visualDirection: "以地图路线、目的地节点、真实出行场景和轻科技光效形成可执行视觉方向",
  };
}

export function normalizeCampaignPromptResult(
  parsed: ArkCampaignPromptResponse,
  rawRequirement: string,
  platforms: Platform[] = [],
): ArkCampaignPromptResponse {
  const root = parsed as ArkCampaignPromptResponse & Record<string, unknown>;
  if (root.object === "response" && !root.campaignPrompt) {
    const incompleteDetails = root.incomplete_details && typeof root.incomplete_details === "object"
      ? root.incomplete_details as Record<string, unknown>
      : undefined;
    const reason = typeof incompleteDetails?.reason === "string"
      ? incompleteDetails.reason
      : "missing output_text";
    throw new Error(
      `Ark returned a Responses API envelope without Campaign Prompt JSON (${reason}).`,
    );
  }
  const campaignValue = root.campaignPrompt;
  const campaignRecord = campaignValue && typeof campaignValue === "object"
    ? campaignValue as ArkCampaignPromptPayload
    : undefined;
  const generatedPromptText = [
    campaignRecord?.promptText,
    campaignRecord?.content,
    typeof campaignValue === "string" ? campaignValue : undefined,
    typeof root.promptText === "string" ? root.promptText : undefined,
  ].find((value): value is string => typeof value === "string" && Boolean(value.trim()))?.trim();
  if (!generatedPromptText) {
    throw new Error("Ark response is missing campaignPrompt.promptText.");
  }
  const promptText = generatedPromptText.includes(rawRequirement)
    ? generatedPromptText
    : `用户原始需求：${rawRequirement}\n\n${generatedPromptText}`;
  const scoreValue = root.promptScore && typeof root.promptScore === "object"
    ? root.promptScore as ArkPromptScorePayload
    : {};
  const summaryValue = root.inferredSummary && typeof root.inferredSummary === "object"
    ? root.inferredSummary as Partial<CampaignPromptInferredSummary>
    : {};
  const summaryDefaults = inferSummaryDefaults(rawRequirement, platforms);

  return {
    campaignPrompt: {
      promptText,
      version: typeof campaignRecord?.version === "string" ? campaignRecord.version : "v1",
      generatedAt: typeof campaignRecord?.generatedAt === "string"
        ? campaignRecord.generatedAt
        : new Date().toISOString(),
      improved: typeof campaignRecord?.improved === "boolean" ? campaignRecord.improved : false,
      sourceRequirement: typeof campaignRecord?.sourceRequirement === "string"
        ? campaignRecord.sourceRequirement
        : rawRequirement,
    },
    promptScore: {
      completeness: clampScore(scoreValue.completeness ?? scoreValue.requirementCompleteness, 80),
      platformFit: clampScore(scoreValue.platformFit, 80),
      outputClarity: clampScore(scoreValue.outputClarity, 80),
      visualFeasibility: clampScore(scoreValue.visualFeasibility ?? scoreValue.visualExecutability, 80),
      scoringReadiness: clampScore(scoreValue.scoringReadiness ?? scoreValue.scoringConstraints, 80),
      riskControl: clampScore(scoreValue.riskControl, 80),
      totalScore: clampScore(scoreValue.totalScore ?? scoreValue.total, 80),
      issues: getStringArray(scoreValue.issues),
      suggestions: getStringArray(scoreValue.suggestions),
    },
    inferredSummary: {
      campaignGoal: summaryValue.campaignGoal?.trim() || summaryDefaults.campaignGoal,
      targetAudience: summaryValue.targetAudience?.trim() || summaryDefaults.targetAudience,
      targetPlatforms: summaryDefaults.targetPlatforms,
      contentFormats: summaryDefaults.contentFormats,
      visualDirection: summaryValue.visualDirection?.trim() || summaryDefaults.visualDirection,
    },
  };
}

function normalizePromptScore(score: ArkPromptScorePayload | undefined, fallback: PromptScore): PromptScore {
  const normalized = {
    requirementCompleteness: clampScore(score?.completeness ?? score?.requirementCompleteness, fallback.requirementCompleteness),
    platformFit: clampScore(score?.platformFit, fallback.platformFit),
    outputClarity: clampScore(score?.outputClarity, fallback.outputClarity),
    visualExecutability: clampScore(score?.visualFeasibility ?? score?.visualExecutability, fallback.visualExecutability),
    scoringConstraints: clampScore(score?.scoringReadiness ?? score?.scoringConstraints, fallback.scoringConstraints),
    riskControl: clampScore(score?.riskControl, fallback.riskControl),
  };
  const calculatedTotal = Math.round(
    Object.values(normalized).reduce((sum, value) => sum + value, 0) / Object.values(normalized).length,
  );
  const total = clampScore(score?.totalScore ?? score?.total, calculatedTotal);

  return {
    ...normalized,
    total,
    updatedAt: new Date().toISOString(),
    completeness: normalized.requirementCompleteness,
    visualFeasibility: normalized.visualExecutability,
    scoringReadiness: normalized.scoringConstraints,
    totalScore: total,
    issues: getStringArray(score?.issues),
    suggestions: getStringArray(score?.suggestions),
  };
}

function normalizeInferredSummary(
  summary: Partial<CampaignPromptInferredSummary> | undefined,
  requirement: string,
  platforms: Platform[],
): CampaignPromptInferredSummary {
  const scopedPlatforms = getScopedPlatforms(platforms);

  return {
    campaignGoal: summary?.campaignGoal?.trim() || "将自然语言内容需求编译为可驱动 AI Content Pipeline 的 Campaign Prompt",
    targetAudience: summary?.targetAudience?.trim() || "高德 AI 内容创作、海外媒体与短视频 / 图文内容团队",
    targetPlatforms: scopedPlatforms.map((platform) => platformLabels[platform]),
    contentFormats: buildContentFormats(scopedPlatforms),
    visualDirection:
      summary?.visualDirection?.trim() ||
      `围绕地图路线、城市节点、AI 光效和出行场景痛点呈现：${requirement.slice(0, 60)}${requirement.length > 60 ? "..." : ""}`,
  };
}

function normalizeCampaignPrompt(
  payload: ArkCampaignPromptPayload | undefined,
  fallback: CampaignPrompt,
  requirement: string,
  source: "ark" | "ark-repaired" | "ark-regenerated",
  options: GenerateCampaignPromptWithArkOptions,
): CampaignPrompt {
  const rawPromptText = (payload?.promptText ?? payload?.content ?? "").trim();
  if (!rawPromptText) {
    throw new Error("Ark response campaignPrompt.promptText is empty.");
  }
  assertCompleteCampaignPromptStructure(rawPromptText);
  const promptText = enforceCampaignPromptScope(rawPromptText, options);

  const now = new Date().toISOString();
  const versionText = payload?.version?.trim() || "v1";
  const numericVersion = Number(versionText.replace(/[^\d]/g, "")) || fallback.version || 1;
  const generatedAt = payload?.generatedAt?.trim() || now;

  return {
    content: promptText,
    promptText,
    version: numericVersion,
    arkVersion: versionText,
    status: payload?.improved ? "improved" : "generated",
    createdAt: generatedAt,
    updatedAt: now,
    generatedAt,
    improved: Boolean(payload?.improved),
    sourceRequirement: payload?.sourceRequirement?.trim() || requirement,
    source,
    fallback: false,
  };
}

function withPromptScoreAliases(score: PromptScore): PromptScore {
  return {
    ...score,
    completeness: score.completeness ?? score.requirementCompleteness,
    visualFeasibility: score.visualFeasibility ?? score.visualExecutability,
    scoringReadiness: score.scoringReadiness ?? score.scoringConstraints,
    totalScore: score.totalScore ?? score.total,
    issues: score.issues ?? [],
    suggestions: score.suggestions ?? [],
  };
}

function fallbackPrompt(
  rawRequirement: RawRequirement | string,
  options: GenerateCampaignPromptWithArkOptions,
  diagnostics: {
    source: "ark-parse-failed" | "ark-request-failed";
    errorMessage: string;
    rawResponse?: string;
    responseFormatUsed?: boolean;
  },
): GenerateCampaignPromptResult {
  const requirement = getRequirementContent(rawRequirement);
  const promptOptions = toPromptEngineOptions(options);
  const result = generateMockCampaignPrompt(rawRequirement, promptOptions);
  const inferredSummary = normalizeInferredSummary(undefined, requirement, promptOptions.platforms);

  return {
    campaignPrompt: {
      ...result.prompt,
      promptText: result.prompt.content,
      generatedAt: result.prompt.createdAt,
      improved: result.prompt.status === "improved",
      sourceRequirement: requirement,
      source: "fallback",
      fallback: true,
    },
    promptScore: withPromptScoreAliases(result.score),
    inferredSummary,
    source: diagnostics.source,
    fallback: true,
    rawResponse: diagnostics.rawResponse,
    errorMessage: diagnostics.errorMessage,
    responseFormatUsed: diagnostics.responseFormatUsed,
    error: diagnostics.errorMessage,
  };
}

export async function generateCampaignPromptWithArk(
  rawRequirement: RawRequirement | string,
  options: GenerateCampaignPromptWithArkOptions,
): Promise<GenerateCampaignPromptResult> {
  const requirement = getRequirementContent(rawRequirement);
  const promptOptions = toPromptEngineOptions(options);
  const mockResult = generateMockCampaignPrompt(rawRequirement, promptOptions);
  const mockPrompt: CampaignPrompt = {
    ...mockResult.prompt,
    promptText: mockResult.prompt.content,
    generatedAt: mockResult.prompt.createdAt,
    improved: mockResult.prompt.status === "improved",
    sourceRequirement: requirement,
    source: "fallback",
    fallback: true,
  };
  const mockScore = withPromptScoreAliases(mockResult.score);

  let initialRequest: Awaited<ReturnType<typeof requestArkJSONText>>;

  try {
    initialRequest = await requestArkJSONText(systemPrompt, buildUserPrompt(requirement, options));
  } catch (error) {
    return fallbackPrompt(rawRequirement, options, {
      source: "ark-request-failed",
      errorMessage: getErrorMessage(error),
    });
  }

  const rawText = initialRequest.text;
  let initialParseError: unknown;

  try {
    const response = normalizeCampaignPromptResult(
      safeParseJSONFromLLM(rawText),
      requirement,
      promptOptions.platforms,
    );
    return {
      campaignPrompt: normalizeCampaignPrompt(response.campaignPrompt, mockPrompt, requirement, "ark", options),
      promptScore: normalizePromptScore(response.promptScore, mockScore),
      inferredSummary: normalizeInferredSummary(response.inferredSummary, requirement, promptOptions.platforms),
      source: "ark",
      fallback: false,
      rawResponse: rawText,
      responseFormatUsed: initialRequest.responseFormatUsed,
    };
  } catch (error) {
    initialParseError = error;
  }

  try {
    const repairResult = await repairJSONWithArk(rawText, requirement, options);
    const repairedResponse = normalizeCampaignPromptResult(
      safeParseJSONFromLLM(repairResult.text),
      requirement,
      promptOptions.platforms,
    );

    return {
      campaignPrompt: normalizeCampaignPrompt(
        repairedResponse.campaignPrompt,
        mockPrompt,
        requirement,
        "ark-repaired",
        options,
      ),
      promptScore: normalizePromptScore(repairedResponse.promptScore, mockScore),
      inferredSummary: normalizeInferredSummary(
        repairedResponse.inferredSummary,
        requirement,
        promptOptions.platforms,
      ),
      source: "ark-repaired",
      fallback: false,
      rawResponse: rawText,
      responseFormatUsed: initialRequest.responseFormatUsed || repairResult.responseFormatUsed,
    };
  } catch (repairError) {
    try {
      const regeneration = await requestArkJSONText(
        systemPrompt,
        buildRegenerationUserPrompt(
          requirement,
          options,
          [getErrorMessage(initialParseError), getErrorMessage(repairError)].join(" "),
        ),
        5000,
      );
      const regeneratedResponse = normalizeCampaignPromptResult(
        safeParseJSONFromLLM(regeneration.text),
        requirement,
        promptOptions.platforms,
      );

      return {
        campaignPrompt: normalizeCampaignPrompt(
          regeneratedResponse.campaignPrompt,
          mockPrompt,
          requirement,
          "ark-regenerated",
          options,
        ),
        promptScore: normalizePromptScore(regeneratedResponse.promptScore, mockScore),
        inferredSummary: normalizeInferredSummary(
          regeneratedResponse.inferredSummary,
          requirement,
          promptOptions.platforms,
        ),
        source: "ark-regenerated",
        fallback: false,
        rawResponse: regeneration.text,
        responseFormatUsed: initialRequest.responseFormatUsed || regeneration.responseFormatUsed,
      };
    } catch (regenerationError) {
      return fallbackPrompt(rawRequirement, options, {
        source: "ark-parse-failed",
        errorMessage: [
          `Initial JSON parse or structure validation failed: ${getErrorMessage(initialParseError)}`,
          `JSON repair failed: ${getErrorMessage(repairError)}`,
          `Full regeneration failed: ${getErrorMessage(regenerationError)}`,
        ].join(" "),
        rawResponse: rawText,
        responseFormatUsed: initialRequest.responseFormatUsed,
      });
    }
  }
}

export async function generateCampaignPrompt(
  rawRequirement: RawRequirement | string,
  options: PromptEngineOptions,
): Promise<GenerateCampaignPromptResult> {
  return generateCampaignPromptWithArk(rawRequirement, {
    selectedPlatforms: options.platforms,
    generateVisuals: options.generateVisuals,
    enableScoring: options.enableQualityScoring,
    outputCount: options.outputCount,
  });
}
