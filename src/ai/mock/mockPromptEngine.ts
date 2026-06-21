import type {
  CampaignPrompt,
  PromptEngineOptions,
  PromptScore,
  RawRequirement,
} from "../../types/campaign";

const platformLabels = {
  douyin: "抖音",
  xiaohongshu: "小红书",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube_shorts: "YouTube Shorts",
  push_banner: "Push / Banner",
};

function getRequirementContent(rawRequirement: RawRequirement | string) {
  return typeof rawRequirement === "string" ? rawRequirement.trim() : rawRequirement.content.trim();
}

function buildPlatformTasks(options: PromptEngineOptions) {
  return options.platforms.flatMap((platform) => {
    if (platform === "douyin") {
      return [
        "- 生成抖音 3 秒 Hook",
        "- 按需求生成抖音视频脚本，未指定时长时宣传视频默认 60s",
        "- 生成抖音分镜、字幕、封面标题和 Hashtags",
      ];
    }
    if (platform === "tiktok") {
      return [
        "- 生成 TikTok 英文口语化 Hook",
        "- 生成 TikTok 短视频脚本",
        "- 生成 TikTok Caption、Hashtags 和 9:16 关键帧方案",
      ];
    }
    if (platform === "youtube_shorts") {
      return [
        "- 生成 YouTube Shorts 搜索友好标题",
        "- 生成 YouTube Shorts 功能解释脚本",
        "- 生成 YouTube Shorts 字幕、描述和 Hashtags",
      ];
    }
    if (platform === "xiaohongshu") {
      return [
        "- 生成小红书图文笔记标题",
        "- 生成小红书封面标题",
        "- 生成小红书正文",
        "- 生成 recommendedPageCount 和 pagePlan",
        "- 生成 5-9 页官方品牌级小红书图文，封面独立规划，区分强视觉页与信息排版页",
        "- 生成小红书话题标签",
        "- 生成评论区互动引导",
      ];
    }
    if (platform === "instagram") {
      return [
        "- 生成 Instagram Reels 脚本",
        "- 生成 Instagram Carousel 每页文案",
        "- 生成 Instagram Caption 和 Hashtags",
      ];
    }
    return [
      "- 生成 Push 标题",
      "- 生成 Push 正文",
      "- 生成 Banner 主标题",
      "- 生成 Banner 副标题",
      "- 生成 CTA 和 A/B 版本",
    ];
  });
}

function buildVisualTasks(options: PromptEngineOptions) {
  if (!options.generateVisuals) {
    return ["- 不直接生成视觉素材，但保留已选平台所需的视觉 Prompt 与构图说明。"];
  }

  return options.platforms.flatMap((platform) => {
    if (platform === "douyin") return ["- 生成抖音 9:16 视频关键帧 Prompt 和封面图 Prompt。"];
    if (platform === "tiktok") return ["- 生成 TikTok 9:16 视频关键帧 Prompt 和封面图 Prompt。"];
    if (platform === "youtube_shorts") return ["- 生成 YouTube Shorts 9:16 视频关键帧 Prompt 和封面图 Prompt。"];
    if (platform === "xiaohongshu") return ["- 生成小红书封面独立 Prompt 和每页不同类型图文视觉 Prompt。"];
    if (platform === "instagram") return ["- 生成 Instagram Carousel 视觉 Prompt 和 Reels 封面 Prompt。"];
    return ["- 生成 Banner 图 Prompt 和 Push / Banner 转化视觉说明。"];
  });
}

function buildQualityCriteria(options: PromptEngineOptions) {
  if (!options.enableQualityScoring) {
    return "执行基础品牌一致性、事实准确性和风险检查，不输出详细评分矩阵。";
  }

  const platformCriteria = options.platforms.flatMap((platform) => {
    if (platform === "douyin") return ["抖音 Hook 强度", "短视频节奏", "封面点击吸引力"];
    if (platform === "tiktok") return ["TikTok Hook 强度", "海外用户理解成本", "英文口语化程度"];
    if (platform === "youtube_shorts") return ["YouTube Shorts 标题搜索友好度", "功能解释清晰度", "短视频留存节奏"];
    if (platform === "xiaohongshu") return ["小红书标题吸引力", "图文卡片连贯性", "种草感", "文化旅游内容准确性", "平台社区规范风险"];
    if (platform === "instagram") return ["Instagram 生活方式表达", "Carousel 视觉连贯性", "Caption 可读性"];
    return ["Push 转化清晰度", "Banner 主标题识别度", "CTA 行动明确度"];
  });

  return Array.from(new Set([
    ...platformCriteria,
    "高德地图功能植入自然度",
    "高德 AI 伴行能力表达清晰度",
    "用户痛点清晰度",
    "视觉可执行性",
    "内容新鲜感",
    "风险等级",
  ])).map((criterion) => `- ${criterion}`).join("\n");
}

type PromptScoreDimensions = Pick<
  PromptScore,
  | "requirementCompleteness"
  | "platformFit"
  | "outputClarity"
  | "visualExecutability"
  | "scoringConstraints"
  | "riskControl"
>;

function calculateTotal(score: PromptScoreDimensions) {
  const values = Object.values(score);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function generateMockCampaignPrompt(
  rawRequirement: RawRequirement | string,
  options: PromptEngineOptions,
): { prompt: CampaignPrompt; score: PromptScore } {
  const requirement = getRequirementContent(rawRequirement);
  const platforms = options.platforms.map((platform) => platformLabels[platform]).join("、");
  const platformTasks = buildPlatformTasks(options).join("\n");
  const visualTasks = buildVisualTasks(options).join("\n");
  const qualityCriteria = buildQualityCriteria(options);
  const now = new Date().toISOString();
  const content = `## Role
你是一名服务于高德 AI 出行场景的资深 Campaign 策略与多平台内容创作负责人。你的任务不是生成通用文案，而是把内容需求转化为平台适配、视觉可执行、可评分和可导出的内容资产包。

## Campaign Context
原始内容需求：${requirement}
目标平台：${platforms}
核心表达必须围绕“出行场景痛点 + AI 伴行能力 + 地图连接真实世界 + 科技感视觉表达”。语气可靠、聪明、轻松，不使用夸大承诺。

## Content Tasks
每个平台输出 ${options.outputCount} 组内容，并严格按平台形态路由：
${platformTasks}
同时提供内容策略、核心受众洞察、Campaign 主张和发布时间建议。

## Visual Tasks
${visualTasks}
视觉表达统一保留地图路线、真实城市节点和蓝绿色科技光效。

## Quality Criteria
${qualityCriteria}
核心评分低于 4/5 时，必须给出优化建议与改写版本。
禁止使用“万能、绝对最强、彻底解决所有问题”等夸大表达，不暗示官方上线或真实平台发布。

## Output Format
以结构化 JSON 为主输出，并同时生成适合人工评审的 Markdown 摘要。按 Strategy、Platform Assets、Visual Prompts、Preview Config、Quality Score、Rewrite Suggestions、Export Manifest 分组，字段必须完整且可被前端直接渲染。`;

  const base = {
    requirementCompleteness: requirement.length >= 80 ? 91 : 84,
    platformFit: Math.min(95, 84 + options.platforms.length * 2),
    outputClarity: 92,
    visualExecutability: options.generateVisuals ? 89 : 83,
    scoringConstraints: options.enableQualityScoring ? 93 : 80,
    riskControl: 91,
  };
  const score: PromptScore = { ...base, total: calculateTotal(base), updatedAt: now };

  return {
    prompt: { content, version: 1, status: "generated", createdAt: now, updatedAt: now },
    score,
  };
}

export function improveMockCampaignPrompt(
  currentPrompt: CampaignPrompt | string,
  promptScore: PromptScore,
): { prompt: CampaignPrompt; score: PromptScore } {
  const prompt = typeof currentPrompt === "string"
    ? { content: currentPrompt, version: 1, status: "generated" as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    : currentPrompt;
  const now = new Date().toISOString();
  const baseContent = prompt.content.split("\n\n## Optimization Addendum")[0];
  const improvedContent = `${baseContent}

## Optimization Addendum
- 对每个平台先解释适配理由，再输出内容，不允许跨平台直接复用同一文案。
- 海外平台避免默认用户了解中国节日与本地语境；必要时补充最短理解背景。
- 每条视觉 Prompt 明确画面主体、镜头、构图、比例、路线节点、字幕安全区和禁用元素。
- 输出前执行品牌边界、事实准确性、文化语境与视觉可制作性检查。
- 所有结果必须关联 source_requirement、platform、format、score 和 rewrite_status，便于追踪与导出。`;
  const values = {
    requirementCompleteness: Math.min(98, promptScore.requirementCompleteness + 5),
    platformFit: Math.min(98, promptScore.platformFit + 6),
    outputClarity: Math.min(99, promptScore.outputClarity + 5),
    visualExecutability: Math.min(98, promptScore.visualExecutability + 7),
    scoringConstraints: Math.min(99, promptScore.scoringConstraints + 5),
    riskControl: Math.min(99, promptScore.riskControl + 7),
  };

  return {
    prompt: {
      content: improvedContent,
      version: prompt.version + 1,
      status: "improved",
      createdAt: prompt.createdAt,
      updatedAt: now,
    },
    score: { ...values, total: calculateTotal(values), updatedAt: now },
  };
}
