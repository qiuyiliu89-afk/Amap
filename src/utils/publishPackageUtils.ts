import type {
  CarouselCard,
  ContentPackage,
  DouyinPublishPackage,
  DouyinScriptLine,
  DouyinStoryboardItem,
  DouyinVideoCreativePack,
  DouyinVideoCreativeShot,
  Platform,
  StoryboardFrame,
  XiaohongshuPagePlanItem,
  XiaohongshuPageType,
  XiaohongshuPublishCarouselPage,
  XiaohongshuPublishPackage,
} from "../types/campaign";
import {
  createVideoTimeRanges,
  formatVideoDuration,
  inferVideoDurationSeconds,
} from "./videoDuration";

type CreativeTheme = "travel" | "citywalk" | "commute" | "localLife" | "holiday" | "culture";
type VideoCreativeTheme = CreativeTheme | "family";

const xiaohongshuFallbackHashtags = [
  "#城市探索",
  "#高德地图",
  "#AI路线规划",
  "#周末去哪儿",
  "#出行攻略",
  "#路线收藏",
];

const douyinFallbackHashtags = [
  "#城市探索",
  "#高德地图",
  "#AI路线规划",
  "#周末去哪儿",
  "#出行灵感",
];

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeStringArray(value: unknown, fallback: string[], limit = 8) {
  if (!Array.isArray(value)) return fallback.slice(0, limit);

  const normalized = value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, limit);

  return normalized.length ? normalized : fallback.slice(0, limit);
}

function normalizeHashtags(value: unknown, fallback: string[], limit = 8) {
  return normalizeStringArray(value, fallback, limit).map((tag) => {
    const cleaned = tag.trim();
    return cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
  });
}

function normalizeCount(value: unknown, fallback: number) {
  const count = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(count)) return fallback;
  return Math.min(9, Math.max(5, Math.round(count)));
}

function joinCampaignText(contentPackage: ContentPackage, sourceContext = "") {
  return [
    sourceContext,
    contentPackage.campaignStrategy.coreConcept,
    contentPackage.campaignStrategy.userPainPoints.join(" "),
    contentPackage.campaignStrategy.productSellingPoints.join(" "),
    contentPackage.platformAssets.xiaohongshu?.coverTitle,
    contentPackage.platformAssets.xiaohongshu?.postBody,
    contentPackage.platformAssets.douyin?.title,
    contentPackage.platformAssets.douyin?.hook,
    contentPackage.platformAssets.instagram?.caption,
  ]
    .filter(Boolean)
    .join(" ");
}

function detectCreativeTheme(contentPackage: ContentPackage, sourceContext = ""): CreativeTheme {
  const text = joinCampaignText(contentPackage, sourceContext).toLowerCase();
  if (/端午|节假日|假期|春节|五一|十一|holiday|vacation|dragon\s*boat|粽/.test(text)) return "holiday";
  if (/通勤|commute|早高峰|晚高峰|地铁|上班/.test(text)) return "commute";
  if (/本地生活|餐厅|咖啡|探店|榜单|food|restaurant|local life|商圈/.test(text)) return "localLife";
  if (/海外|旅行|travel|traveler|trip|tourist/.test(text)) return "travel";
  if (/citywalk|city walk|城市探索|周末|漫游|展览/.test(text)) return "citywalk";
  return "culture";
}

function detectVideoCreativeTheme(contentPackage: ContentPackage, sourceContext = ""): VideoCreativeTheme {
  const text = joinCampaignText(contentPackage, sourceContext).toLowerCase();
  if (/亲子|家庭|儿童|孩子|宝宝|family|kids?|child/.test(text)) return "family";
  return detectCreativeTheme(contentPackage, sourceContext);
}

function cleanTitle(value: string | undefined, fallback: string) {
  const title = value?.replace(/^第?[一二三四五六七0-9]+[站页：:\s-]*/u, "").trim();
  return title || fallback;
}

function cardTitle(cards: CarouselCard[] | undefined, index: number, fallback: string) {
  return cleanTitle(cards?.[index]?.title, fallback);
}

function cardBody(cards: CarouselCard[] | undefined, index: number, fallback: string) {
  return normalizeString(cards?.[index]?.body, fallback).replace(/[。.]$/u, "");
}

function themeLabel(theme: CreativeTheme) {
  const labels: Record<CreativeTheme, string> = {
    travel: "旅行",
    citywalk: "Citywalk",
    commute: "通勤",
    localLife: "本地生活",
    holiday: "节假日",
    culture: "文化出行",
  };
  return labels[theme];
}

function pageSequence(count: number): XiaohongshuPageType[] {
  if (count <= 5) return ["cover", "scene", "landmark", "route", "cta"];
  if (count === 6) return ["cover", "scene", "landmark", "route", "feature", "cta"];
  if (count === 7) return ["cover", "scene", "landmark", "route", "feature", "tips", "cta"];
  if (count === 8) return ["cover", "scene", "landmark", "landmark", "route", "feature", "tips", "cta"];
  return ["cover", "scene", "landmark", "landmark", "scene", "route", "feature", "tips", "cta"];
}

function defaultXiaohongshuPageCount(theme: CreativeTheme, cards: CarouselCard[]) {
  if (theme === "holiday" || theme === "travel") return 8;
  if (theme === "localLife" || theme === "culture") return 7;
  if (cards.length <= 4) return 5;
  return 7;
}

function normalizePageType(value: unknown, fallback: XiaohongshuPageType): XiaohongshuPageType {
  if (value === "cover" || value === "scene" || value === "landmark" || value === "route" ||
    value === "feature" || value === "tips" || value === "cta") {
    return value;
  }
  if (value === "intro" || value === "pain-points") return "scene";
  if (value === "scenic" || value === "spot-1" || value === "spot-2") return "landmark";
  if (value === "utility") return "feature";
  return fallback;
}

function defaultXiaohongshuTitles(title: string, theme: CreativeTheme) {
  const label = themeLabel(theme);
  const presets: Record<CreativeTheme, string[]> = {
    travel: [
      title,
      "第一次逛陌生城市，路线这样排更松弛",
      "收藏夹别睡了，用 AI 串成一日路线",
    ],
    citywalk: [
      title,
      "周末 Citywalk 不绕路，我会这样排",
      "半天出门灵感：咖啡、展览、公园顺路走",
    ],
    commute: [
      title,
      "通勤路线别固定，出门前看这 3 个变化",
      "早高峰不慌：路线先对比再出门",
    ],
    localLife: [
      title,
      "收藏餐厅之后，顺路下一站也排好了",
      "今晚探店路线：吃饭、散步、返程一次看",
    ],
    holiday: [
      /端午|龙舟|粽/u.test(title) ? title : "今年端午，跟着这条路线去过一个有文化感的夏天 🐉",
      "端午别只去人挤人，这几个文化打卡点更值得逛",
      "用高德串起一条端午城市漫游路线，收藏直接走",
    ],
    culture: [
      title,
      `${label}路线不想做攻略？这篇直接收藏`,
      "把想去的点连起来，城市会好逛很多",
    ],
  };

  return Array.from(new Set(presets[theme])).slice(0, 3);
}

function defaultXiaohongshuHooks(theme: CreativeTheme) {
  const hooks: Record<CreativeTheme, string[]> = {
    travel: ["旅行攻略不用越存越乱，先把收藏点连成路线。", "陌生城市第一天，最怕不是迷路，是路线太碎。"],
    citywalk: ["周末想出门，但真的不想再做一小时攻略。", "Citywalk 好不好逛，很多时候取决于路线顺不顺。"],
    commute: ["同一条通勤路，今天不一定还是最优解。", "出门前多看一眼路线，早高峰可能少绕一大圈。"],
    localLife: ["餐厅收藏了很多家，但今晚到底怎么走？", "本地生活不只看榜单，顺路才是真的会出门。"],
    holiday: ["节假日出门，先别急着导航到目的地。", "热门目的地可以去，但路线要先留一个 Plan B。"],
    culture: ["想看城市文化感，路线别临时拼。", "把景点、街区和返程一起看，出门会轻松很多。"],
  };
  return hooks[theme];
}

function defaultCoverCopy(theme: CreativeTheme) {
  const copy: Record<CreativeTheme, string> = {
    travel: "从收藏夹到可出发路线，一张图看懂怎么走",
    citywalk: "咖啡、展览、公园顺路串联，半天也能逛得刚好",
    commute: "出门前看路况、换乘和到达风险，路线更稳",
    localLife: "餐厅、商圈、咖啡点连成一次真实出门计划",
    holiday: "拥堵节点、错峰时间、备选目的地一次看清",
    culture: "文化景点、路线规划和打卡提示一起整理好",
  };
  return copy[theme];
}

function buildBrandCoverPrompt(theme: CreativeTheme) {
  const scenes: Record<CreativeTheme, string> = {
    holiday: "端午节城市文化旅行，江南水乡、古建筑、龙舟、粽叶、荷花与明亮夏日阳光",
    localLife: "城市街区、精致餐厅、夜晚灯光与真实生活方式场景",
    culture: "古城、博物馆、历史街区与具有文化质感的城市旅行场景",
    travel: "具有目的地辨识度的城市天际线、地标建筑与旅行人物",
    citywalk: "阳光下的城市街区、咖啡店、展览空间、公园与松弛行人",
    commute: "清晨城市、真实通勤人物与克制的路线光效",
  };

  return `小红书官方品牌号封面视觉，杂志风旅行海报，${scenes[theme]}，青绿色路线光效克制且自然地串联真实地点，画面高级、明亮、精致，商业广告质感，强视觉中心，适合小红书封面，顶部和下部保留标题安全区，high-end editorial poster, premium brand campaign visual, cinematic travel photography, polished commercial illustration, no text, no logo, no watermark, no UI screenshot, no map pins, no dotted route, no cards, no random letters.`;
}

function defaultPagePlan({
  title,
  coverCopy,
  cards,
  theme,
  count,
  coverVisualPrompt,
}: {
  title: string;
  coverCopy: string;
  cards: CarouselCard[];
  theme: CreativeTheme;
  count: number;
  coverVisualPrompt: string;
}): XiaohongshuPagePlanItem[] {
  const label = themeLabel(theme);
  const landmarkTitles = [
    cardTitle(cards, 2, theme === "localLife" ? "今晚最值得停的一站" : "最值得停留的一站"),
    cardTitle(cards, 3, theme === "holiday" ? "沿着水岸再看一场端午夏日" : "顺路再去这一站"),
  ];
  const routeTitle = theme === "commute" ? "路线先对比，再出门" : "把这些点串成一条顺路路线";
  const featureTitle = theme === "holiday" ? "收藏点位、路线和实时路况一次看" : "打开高德先看这三件事";
  const tipsTitle = theme === "localLife" ? "探店前的小提醒" : "出发前最后检查";

  let landmarkIndex = 0;
  let sceneIndex = 0;

  return pageSequence(count).map((pageType): XiaohongshuPagePlanItem => {
    if (pageType === "cover") {
      return {
        pageType,
        title,
        subtitle: coverCopy,
        visualStyle: "brand-poster",
        imagePrompt: coverVisualPrompt,
        overlayText: [title, coverCopy, theme === "holiday" ? "端午城市漫游" : `${label}路线灵感`],
        bodyText: coverCopy,
      };
    }

    if (pageType === "scene") {
      const isSecondScene = sceneIndex++ > 0;
      return {
        pageType,
        title: isSecondScene ? "把一天过成城市里的小假期" : `${label}真正难的不是选点`,
        subtitle: isSecondScene ? "慢一点走，才能看见路线之外的风景" : "收藏很多，临时拼路线却很消耗兴致",
        visualStyle: "cinematic-scene",
        imagePrompt: `小红书官方品牌号内页，${label}真实生活方式大场景，${isSecondScene ? "人物在城市街区自然漫游" : "具有情绪张力的出发前旅行场景"}，商业摄影或精致插画，明亮自然光，杂志大片构图，主体明确，少量青绿色路线光效作为品牌线索，no text, no logo, no UI, no cards, no map pins, no dotted line.`,
        overlayText: [isSecondScene ? "把一天过成小假期" : "值得收藏的，不只是一串地点"],
        bodyText: isSecondScene ? "路线负责带你抵达，真正值得记住的是城市里发生的那一刻。" : "想去的地方很多，但临时拼路线真的会把兴致消耗掉。",
      };
    }

    if (pageType === "landmark") {
      const currentLandmark = landmarkIndex++;
      return {
        pageType,
        title: landmarkTitles[currentLandmark] ?? `路线里的第 ${currentLandmark + 1} 个高光时刻`,
        subtitle: currentLandmark === 0 ? "一张图先把目的地氛围拉满" : "换一个视角，继续感受城市的文化与生活",
        visualStyle: "editorial-landmark",
        imagePrompt: `小红书官方品牌号景点内页，${label}主题，${theme === "holiday" ? "江南水乡、龙舟、古建筑、粽叶与夏日水面" : "具有目的地辨识度的地标、街区或本地生活场景"}，单一强主体，旅行杂志摄影，商业广告质感，细节精致，明亮高级，构图与上一页明显不同，no text, no logo, no UI screenshot, no cards, no random letters.`,
        overlayText: [landmarkTitles[currentLandmark] ?? "这一站值得专程停留"],
        bodyText: cardBody(cards, currentLandmark + 2, "适合停下来拍照、散步，也能作为整条路线里的高光节点。"),
      };
    }

    if (pageType === "route") {
      return {
        pageType,
        title: routeTitle,
        subtitle: "让路线服务于旅行，而不是把页面做成地图流程图",
        visualStyle: "premium-route",
        imagePrompt: "高端旅行杂志路线内页，以真实城市航拍或街区摄影为底，青绿色路线光带克制地穿过真实街区，只有少量精致节点，不要虚线，不要卡片，不要低保真地图 UI，留出前端叠加站点名称的空间，no text, no logo, no watermark, no random letters.",
        overlayText: ["收藏点位", "路线规划", "实时路况"],
        bodyText: theme === "commute" ? "把时间、换乘和步行距离放在一起看，出门前就能少一点犹豫。" : "先看顺路关系，再看实时路况，路线才会真正适合今天出发。",
      };
    }

    if (pageType === "feature") {
      return {
        pageType,
        title: featureTitle,
        subtitle: "能力讲清楚，但画面仍然保持品牌杂志感",
        visualStyle: "product-story",
        imagePrompt: "小红书品牌内容功能叙事页，真实旅行人物与手机地图使用场景，收藏地点、路线建议和实时变化以极简光效融入环境，不生成可读 UI，不要信息卡堆叠，商业摄影，干净构图，no text, no logo, no watermark.",
        overlayText: ["收藏点位", "路线规划", "实时路况"],
        bodyText: "把想去的点先收藏，再结合距离、时间与实时变化调整下一站。",
      };
    }

    if (pageType === "tips") {
      return {
        pageType,
        title: tipsTitle,
        subtitle: "天气、人流和返程时间，出发前再确认一次",
        visualStyle: "editorial-layout",
        imagePrompt: "小红书旅行杂志 Tips 内页背景，行李、夏日饮品、天气与城市旅行物件的精致静物摄影，柔和留白，适合前端排版清单，不要卡片框，不要图标占位，不要文字，no logo, no watermark.",
        overlayText: ["天气", "人流", "返程"],
        bodyText: `出发前再看天气、人流和返程时间，${label}会更轻松。`,
      };
    }

    return {
      pageType: "cta",
      title: "保存这篇，出门前直接看",
      subtitle: "下一条路线，想从哪座城市开始？",
      visualStyle: "closing-poster",
      imagePrompt: "小红书官方品牌号收尾海报，真实城市黄昏或节日灯光场景，人物准备出发，温暖而有行动感，杂志广告构图，青绿色光效极少点缀，大面积干净标题区，no text, no logo, no UI, no map pins, no dotted route.",
      overlayText: ["先收藏", "出门前再看"],
      bodyText: "评论区留一个你想去的城市或目的地，我来帮你拆一条能直接出发的路线。",
    };
  });
}

function pageBody(pageType: XiaohongshuPageType, cards: CarouselCard[], theme: CreativeTheme, index: number) {
  const label = themeLabel(theme);
  const bodies: Record<XiaohongshuPageType, string> = {
    cover: defaultCoverCopy(theme),
    scene: theme === "commute"
      ? "不是每天都走同一条路，而是每天都要看一次今天的变化。"
      : `想去的地方很多，但临时拼路线真的会把兴致消耗掉。`,
    landmark: cardBody(cards, index, theme === "localLife" ? "适合从一个餐厅延展到一段轻松的附近路线。" : "适合停下来拍照、散步，也能作为路线里的核心节点。"),
    route: theme === "commute"
      ? "把时间、换乘、步行距离放在一起看，出门前就能少一点犹豫。"
      : "把收藏点放进地图，让 AI 帮你判断顺路程度，少绕路，多停留。",
    feature: "看距离、看路况、看下一站能不能替换，路线就不会只是纸面攻略。",
    tips: `出发前再看天气、人流、返程时间，${label}会更轻松。`,
    cta: "评论区留一个你想去的城市或目的地，我会用同样思路帮你拆路线。",
  };
  return bodies[pageType];
}

function pageBullets(pageType: XiaohongshuPageType, hashtags: string[], theme: CreativeTheme) {
  const bullets: Record<XiaohongshuPageType, string[]> = {
    cover: [themeLabel(theme), "路线可收藏", "直接照着走"],
    scene: ["节日氛围", "城市漫游", "真实出发"],
    landmark: ["值得停留", "适合拍照", "顺路安排"],
    route: ["收藏点", "路线规划", "实时路况"],
    feature: ["时间", "距离", "替换下一站"],
    tips: ["天气", "人流", "返程"],
    cta: hashtags.slice(0, 3),
  };
  return bullets[pageType];
}

function buildXiaohongshuPages({
  pagePlan,
  cards,
  hashtags,
  theme,
  providedPages,
}: {
  pagePlan: XiaohongshuPagePlanItem[];
  cards: CarouselCard[];
  hashtags: string[];
  theme: CreativeTheme;
  providedPages: unknown[];
}): XiaohongshuPublishCarouselPage[] {
  return pagePlan.map((plan, index) => {
    const provided = providedPages[index] as Partial<XiaohongshuPublishCarouselPage> | undefined;
    const pageType = normalizePageType(provided?.pageType ?? provided?.role, plan.pageType);
    const fallbackBody = pageBody(pageType, cards, theme, index);
    const fallbackBullets = pageBullets(pageType, hashtags, theme);

    return {
      id: normalizeString(provided?.id, `xhs-page-${index + 1}`),
      pageType,
      role: pageType,
      eyebrow: normalizeString(provided?.eyebrow, `${index + 1}/${pagePlan.length} · ${pageType}`),
      title: normalizeString(provided?.title, plan.title),
      body: normalizeString(provided?.body, plan.bodyText || fallbackBody),
      visualCue: normalizeString(provided?.visualCue, plan.visualStyle),
      bullets: normalizeStringArray(provided?.bullets, fallbackBullets, 4),
      subtitle: normalizeString(provided?.subtitle, plan.subtitle),
      visualStyle: provided?.visualStyle ?? plan.visualStyle,
      imagePrompt: normalizeString(provided?.imagePrompt, plan.imagePrompt),
      overlayText: normalizeStringArray(provided?.overlayText, plan.overlayText, 4),
      bodyText: normalizeString(provided?.bodyText, plan.bodyText || fallbackBody),
    };
  });
}

function normalizePagePlan(
  value: unknown,
  fallbackPlan: XiaohongshuPagePlanItem[],
){
  const planRecord = value && typeof value === "object" && !Array.isArray(value)
    ? value as { pageCount?: unknown; pages?: unknown }
    : undefined;
  const provided = Array.isArray(planRecord?.pages)
    ? planRecord.pages
    : Array.isArray(value)
      ? value
      : [];
  const pageCount = normalizeCount(planRecord?.pageCount, fallbackPlan.length);
  const targetPlan = fallbackPlan.slice(0, pageCount);

  const pages = targetPlan.map((fallbackItem, index) => {
    const record = provided[index] as Partial<XiaohongshuPagePlanItem> | undefined;
    const pageType = normalizePageType(record?.pageType, fallbackItem.pageType);

    return {
      pageType,
      title: normalizeString(record?.title, fallbackItem.title),
      subtitle: normalizeString(record?.subtitle, fallbackItem.subtitle),
      visualStyle: record?.visualStyle ?? fallbackItem.visualStyle,
      imagePrompt: normalizeString(record?.imagePrompt, fallbackItem.imagePrompt),
      overlayText: normalizeStringArray(record?.overlayText, fallbackItem.overlayText, 4),
      bodyText: normalizeString(record?.bodyText, fallbackItem.bodyText),
    };
  });

  return { pageCount: pages.length, pages };
}

function buildXiaohongshuCopy({
  title,
  hook,
  hashtags,
  commentGuide,
  pages,
  theme,
}: {
  title: string;
  hook: string;
  hashtags: string[];
  commentGuide: string;
  pages: XiaohongshuPublishCarouselPage[];
  theme: CreativeTheme;
}) {
  const landmark = pages.find((page) => page.pageType === "landmark");
  const route = pages.find((page) => page.pageType === "route");
  const feature = pages.find((page) => page.pageType === "feature");
  const emoji = theme === "localLife" ? "🍜" : theme === "holiday" ? "🧭" : theme === "commute" ? "⏱️" : "🗺️";

  return `${title}

${hook} ${emoji}

这次我会先把想去的点放进高德，再让 AI 按时间、距离和实时路况顺一下路线。

📍先看：${landmark?.title ?? "最值得停留的一站"}
${landmark?.body ?? "适合作为路线里的核心节点。"}

🗺️路线怎么排：
${route?.body ?? "先把收藏点连起来，再看哪一段最容易绕路。"}

${feature ? `✨我会特别看：\n${feature.bullets.join(" / ")}\n` : ""}这篇适合先收藏，出门前再打开看一眼。

${commentGuide}

${hashtags.join(" ")}`;
}

function normalizeXiaohongshuPublishPackage(
  value: unknown,
  contentPackage: ContentPackage,
  sourceContext = "",
): XiaohongshuPublishPackage | undefined {
  const asset = contentPackage.platformAssets.xiaohongshu;
  if (!asset) return undefined;

  const record = value && typeof value === "object" ? value as Partial<XiaohongshuPublishPackage> : {};
  const theme = detectCreativeTheme(contentPackage, sourceContext);
  const hashtags = normalizeHashtags(record.hashtags, asset.hashtags.length ? asset.hashtags : xiaohongshuFallbackHashtags, 8);
  const titleCandidates = normalizeStringArray(
    record.titleCandidates,
    defaultXiaohongshuTitles(asset.coverTitle, theme),
    3,
  );
  const hookCandidates = normalizeStringArray(record.hookCandidates, defaultXiaohongshuHooks(theme), 2);
  const title = normalizeString(record.title, titleCandidates[0] ?? asset.coverTitle);
  const coverCopy = normalizeString(record.coverCopy, defaultCoverCopy(theme));
  const sourceCoverPrompt = normalizeString(
    record.coverVisualPrompt,
    contentPackage.visualPrompts.xiaohongshuCoverPrompt,
  );
  const coverVisualPrompt = `${buildBrandCoverPrompt(theme)}${sourceCoverPrompt ? ` Theme context: ${sourceCoverPrompt}` : ""}`;
  const requestedPageCount = record.pagePlan && typeof record.pagePlan === "object"
    ? record.pagePlan.pageCount
    : record.recommendedPageCount;
  const recommendedPageCount = normalizeCount(
    requestedPageCount,
    defaultXiaohongshuPageCount(theme, asset.carouselCards),
  );
  const fallbackPlan = defaultPagePlan({
    title,
    coverCopy,
    cards: asset.carouselCards,
    theme,
    count: recommendedPageCount,
    coverVisualPrompt,
  });
  const pagePlan = normalizePagePlan(record.pagePlan, fallbackPlan);
  const providedPages = Array.isArray(record.carouselPages) ? record.carouselPages : [];
  const carouselPages = buildXiaohongshuPages({
    pagePlan: pagePlan.pages,
    cards: asset.carouselCards,
    hashtags,
    theme,
    providedPages,
  });
  const commentGuide = normalizeString(
    record.commentGuide,
    asset.commentGuide || "你想把哪座城市排成路线？评论区留一个关键词，我来拆一版～",
  );
  const postText = normalizeString(
    record.postText,
    buildXiaohongshuCopy({
      title,
      hook: hookCandidates[0] ?? defaultXiaohongshuHooks(theme)[0],
      hashtags,
      commentGuide,
      pages: carouselPages,
      theme,
    }),
  );

  return {
    recommendedPageCount: pagePlan.pageCount,
    pagePlan,
    titleCandidates,
    hookCandidates,
    title,
    coverCopy,
    coverVisualPrompt,
    postText,
    carouselPages,
    hashtags,
    commentGuide,
    copyReadyText: normalizeString(record.copyReadyText, `${title}\n\n${postText}`),
  };
}

function parseScriptLine(value: string, fallbackTime: string): DouyinScriptLine {
  const match = value.match(/^\s*([0-9]+[-~—–][0-9]+s?)\s*[：:]\s*(.+)$/i);
  if (!match) return { timeRange: fallbackTime, line: value.trim() };
  return { timeRange: match[1].replace("~", "-"), line: match[2].trim() };
}

function defaultDouyinTitleCandidates(theme: CreativeTheme, fallbackTitle: string) {
  const titles: Record<CreativeTheme, string[]> = {
    travel: [
      fallbackTitle,
      "收藏夹别堆了，AI 直接排成路线",
      "第一次逛陌生城市，这条路线先收藏",
    ],
    citywalk: [
      fallbackTitle,
      "周末不想做攻略？这条 Citywalk 直接走",
      "半天出门路线，AI 已经帮你顺好了",
    ],
    commute: [
      fallbackTitle,
      "早高峰别硬走老路线，出门前看这个",
      "你的通勤路线，今天可能该换一条",
    ],
    localLife: [
      fallbackTitle,
      "收藏了餐厅榜单？AI 顺手排好下一站",
      "今晚约饭路线，别只停在收藏夹",
    ],
    holiday: [
      fallbackTitle,
      "节假日出门前，先让 AI 看一眼这条路",
      "热门目的地别硬挤，路线先留 Plan B",
    ],
    culture: [
      fallbackTitle,
      "想逛文化路线？别再临时拼攻略",
      "把想去的点连起来，直接出发",
    ],
  };
  return Array.from(new Set(titles[theme])).slice(0, 3);
}

function defaultDouyinHookCandidates(theme: CreativeTheme, fallbackHook: string) {
  const hooks: Record<CreativeTheme, string[]> = {
    travel: [fallbackHook, "收藏了十几个地点，最后还是不知道先去哪？"],
    citywalk: [fallbackHook, "周末想出门，但不想再查一小时攻略？"],
    commute: [fallbackHook, "你每天走的那条路，今天可能已经不是最快了。"],
    localLife: [fallbackHook, "餐厅收藏了一堆，今晚怎么走才顺？"],
    holiday: [fallbackHook, "节假日最怕什么？不是远，是出门才发现堵。"],
    culture: [fallbackHook, "想逛城市文化感，路线别临时拼。"],
  };
  return Array.from(new Set(hooks[theme])).slice(0, 2);
}

function defaultDouyinScript(
  theme: CreativeTheme,
  hook: string,
  durationSeconds: number,
): DouyinScriptLine[] {
  const scripts: Record<CreativeTheme, string[]> = {
    travel: ["收藏点很多，真正难的是把零散愿望排成一条能走的路线。", "输入时间、偏好和当前位置，AI 先理解这次出行。", "距离、开放时间和路况一起参与路线排序。", "热门景点与小众目的地被自然串联，不再来回切攻略。", "途中条件变化时，路线还能及时给出更合适的选择。", "少一点规划负担，把时间留给真正的城市体验。", "保存路线，到达城市后直接出发。"],
    citywalk: ["想轻松逛一座城，却常常先被攻略和路线耗光耐心。", "告诉 AI 今天的时间、心情和想去的地方。", "咖啡、展览、公园与街区会按顺路关系重新排列。", "路线同时考虑步行距离、停留节奏和实时变化。", "每一站都更自然，少绕路，也不用频繁切换应用。", "Citywalk 不需要做得太重，关键是更从容地走进城市。", "保存这条路线，周末直接出发。"],
    commute: ["熟悉的通勤路线，也会因为实时变化突然失去效率。", "出门前先让 AI 读取时间、路况和换乘条件。", "驾车、公交与步行方案在同一条决策线上比较。", "路线变慢时及时调整，不必堵在路上才临时后悔。", "关键转折点提前提示，让每一步更有把握。", "把重复通勤变成更稳定、更从容的日常。", "出门前看一眼路线，再做决定。"],
    localLife: ["收藏了很多餐厅和榜单，真正出门时却还是不知道怎么排。", "先选今晚最想去的地方，再补充时间和同行偏好。", "餐厅、商圈、咖啡与返程路线被顺手串起来。", "距离、营业时间和实时路况一起参与安排。", "临时换一家店，也能快速找到顺路的下一站。", "让榜单不只留在收藏夹，而是变成一次真实体验。", "保存路线，今晚就照着走。"],
    holiday: ["节假日出门最怕的不是远，而是到了路上才发现拥堵。", "AI 先结合目的地、出发时间和实时路况判断。", "热门路线与备选路线同时呈现，方便提前比较。", "遇到临时变化时，不必重新翻遍所有攻略。", "沿途停靠点与返程安排也能一并考虑。", "少一点拥堵焦虑，多一点真正属于假期的时间。", "出门前先看路线，再安心出发。"],
    culture: ["想逛出一座城市的文化感，路线不能只靠临时拼接。", "先收藏老街、展馆、古建与当地生活场景。", "AI 根据距离、时间和开放条件找到顺路关系。", "文化地标与真实街区被组织成有节奏的探索路线。", "途中还能结合路况和返程时间及时调整。", "让每一站不只是打卡，而是更完整地理解一座城。", "保存路线，下次直接沿着城市故事出发。"],
  };
  const segmentCount = durationSeconds >= 60 ? 8 : durationSeconds >= 30 ? 6 : 4;
  const lines = [hook, ...scripts[theme]].slice(0, segmentCount);
  const timeRanges = createVideoTimeRanges(durationSeconds, lines.length);

  return lines.map((line, index) => ({ timeRange: timeRanges[index], line }));
}

function normalizeDouyinScript(
  value: unknown,
  assetScript: string[] | undefined,
  theme: CreativeTheme,
  hook: string,
  durationSeconds: number,
) {
  const fallbackScript = defaultDouyinScript(theme, hook, durationSeconds);
  const maxLines = durationSeconds >= 60 ? 10 : durationSeconds >= 30 ? 8 : 6;
  const coversDuration = (items: unknown[]) => {
    const last = items.at(-1);
    const timeRange = last && typeof last === "object"
      ? String((last as Partial<DouyinScriptLine>).timeRange ?? "")
      : String(last ?? "");
    const end = Number(timeRange.match(/-(\d+)s/i)?.[1] ?? 0);
    return end >= durationSeconds * 0.9;
  };

  if (Array.isArray(value) && value.length) {
    const normalized = value.slice(0, maxLines).map((item, index) => {
      if (item && typeof item === "object") {
        const record = item as Partial<DouyinScriptLine>;
        return {
          timeRange: normalizeString(record.timeRange, fallbackScript[index]?.timeRange ?? "0-3s"),
          line: normalizeString(record.line, fallbackScript[index]?.line ?? ""),
        };
      }

      return parseScriptLine(String(item), fallbackScript[index]?.timeRange ?? "0-3s");
    });
    if (coversDuration(normalized)) return normalized;
  }

  if (Array.isArray(assetScript) && assetScript.length) {
    const normalized = assetScript.slice(0, maxLines).map((item, index) => (
      parseScriptLine(item, fallbackScript[index]?.timeRange ?? "0-3s")
    ));
    if (coversDuration(normalized)) return normalized;
  }

  return fallbackScript;
}

function defaultDouyinStoryboard(
  script15s: DouyinScriptLine[],
  frames: StoryboardFrame[] | undefined,
): DouyinStoryboardItem[] {
  return script15s.map((line, index) => ({
    timeRange: line.timeRange,
    visual: normalizeString(
      frames?.[index]?.visualCue,
      index === 0
        ? "竖屏真实城市氛围首帧，手机地图路线从画面中自然亮起"
        : index === 1
          ? "收藏点、时间和路线节点依次出现，画面干净不堆字"
          : index === 2
            ? "路线规划关键节点切换，展示顺路和实时变化"
            : "用户保存路线准备出发，城市画面有生活感",
    ),
    voiceover: normalizeString(frames?.[index]?.copy, line.line),
    screenSubtitle: line.line,
  }));
}

function normalizeDouyinStoryboard(
  value: unknown,
  script15s: DouyinScriptLine[],
  frames: StoryboardFrame[] | undefined,
) {
  const fallback = defaultDouyinStoryboard(script15s, frames);
  if (!Array.isArray(value) || !value.length) return fallback;

  return fallback.map((fallbackItem, index) => {
    const record = value[index] as Partial<DouyinStoryboardItem> | undefined;

    return {
      timeRange: normalizeString(record?.timeRange, fallbackItem.timeRange),
      visual: normalizeString(record?.visual, fallbackItem.visual),
      voiceover: normalizeString(record?.voiceover, fallbackItem.voiceover),
      screenSubtitle: normalizeString(record?.screenSubtitle, fallbackItem.screenSubtitle),
    };
  });
}

function buildSubtitles(script15s: DouyinScriptLine[]) {
  return script15s
    .map((line, index) => `${index + 1}
${line.timeRange}
${line.line}`)
    .join("\n\n");
}

function defaultDouyinCta(theme: CreativeTheme) {
  const ctas: Record<CreativeTheme, string> = {
    travel: "收藏这条路线，到城市后直接打开。",
    citywalk: "周末想轻松出门，先让 AI 排一版。",
    commute: "出门前看一眼，路线别凭习惯走。",
    localLife: "把榜单变成路线，今晚就能用。",
    holiday: "节假日出门前，先看路线再出发。",
    culture: "保存路线，下次不用临时拼攻略。",
  };
  return ctas[theme];
}

function buildDouyinCaption({
  hook,
  cta,
  theme,
  hashtags,
}: {
  hook: string;
  cta: string;
  theme: CreativeTheme;
  hashtags: string[];
}) {
  const body: Record<CreativeTheme, string> = {
    travel: "旅行最麻烦的不是没有想去的地方，是收藏太多以后不知道怎么走。\n\n我会先把地点放进高德，让 AI 按时间、距离和实时路况顺一条能出发的路线。",
    citywalk: "周末想出门，但真的不想做一张复杂行程表。\n\n把想去的咖啡、展览、公园放进高德，让 AI 先排一条不绕路的 Citywalk。",
    commute: "通勤别只靠习惯路线。\n\n出门前看一次实时路况、换乘和步行距离，路线慢了就提前换。",
    localLife: "收藏餐厅榜单只是第一步。\n\n高德 AI 可以把餐厅、商圈、咖啡和返程一起顺成今晚能走的路线。",
    holiday: "节假日出门别只看目的地。\n\n先看拥堵点、出发时间和备选路线，真的会少很多临时崩溃。",
    culture: "想逛城市文化感，别等出门后再拼攻略。\n\n先收藏想去的点，让高德 AI 帮你看顺路关系和实时路况。",
  };

  return `${hook}

${body[theme]}

${cta}

${hashtags.join(" ")}`;
}

function createVideoCreativePack(
  contentPackage: ContentPackage,
  sourceContext: string,
  hook: string,
  cta: string,
): DouyinVideoCreativePack {
  const theme = detectVideoCreativeTheme(contentPackage, sourceContext);
  const campaignText = joinCampaignText(contentPackage, sourceContext);
  const durationSeconds = inferVideoDurationSeconds(sourceContext);
  const durationLabel = formatVideoDuration(durationSeconds);
  const isDragonBoat = /端午|龙舟|粽/.test(campaignText);
  const themeConfig: Record<VideoCreativeTheme, {
    concept: string;
    destinationScene: string;
    sceneTransformation: string;
    productAction: string;
    finalScene: string;
    music: string;
  }> = {
    holiday: {
      concept: isDragonBoat
        ? "端午不只是去一个景点，而是用高德把文化景点串成一条有夏日气息的路线。"
        : "把节日里零散想去的地方，串成一条可以直接出发的路线。",
      destinationScene: isDragonBoat
        ? "江南水巷、古建筑、龙舟划过河面、粽叶与夏日阳光，年轻游客沿河漫游"
        : "节日城市街区、文化地标、河岸与真实旅行人群",
      sceneTransformation: isDragonBoat
        ? "青绿色路线光线穿过手机屏幕，match cut 成江面波光，龙舟顺着同一运动方向划入画面"
        : "路线光线越过手机边缘，丝滑变形成真实街道与目的地动线",
      productAction: "路线节点自动排序，结合少绕路、实时路况与顺路打卡的判断，UI 只作为轻量后期合成层",
      finalScene: "年轻人沿着河边步道出发，镜头升高看到路线通向下一处文化地标",
      music: "现代国风电子节拍，加入轻量鼓点、水声和由弱到强的情绪推进，转场点有干净 whoosh",
    },
    localLife: {
      concept: "把收藏的餐厅榜单，变成一条今晚就能出发的吃喝路线。",
      destinationScene: "夜晚城市街区、餐厅暖光、路边小店、朋友碰杯与步行生活方式",
      sceneTransformation: "榜单中的光点连成青绿色路线，match cut 到街道路灯和餐厅霓虹的同方向运动",
      productAction: "餐厅、咖啡、商圈与返程节点自然排序，手机只短暂出现路线建议",
      finalScene: "朋友从餐厅走进夜晚街区，路线光效继续指向下一站",
      music: "轻快 city pop 与精致电子鼓组，带夜生活律动，转场使用短促 whoosh 和环境声",
    },
    citywalk: {
      concept: "把零散收藏点，变成一条可以直接出发的 Citywalk 路线。",
      destinationScene: "阳光城市街区、咖啡店、展览空间、公园与自然行走的人物",
      sceneTransformation: "手机地图上的路线向前延展，match cut 成真实街道中的光影边缘",
      productAction: "收藏点按距离与停留节奏重新排序，路线与真实街景自然叠合",
      finalScene: "人物收起手机走进街区，镜头横移带出下一站",
      music: "松弛但有节奏的 indie electronic，轻脚步与城市环境声参与转场",
    },
    family: {
      concept: "把景点推荐变成一条照顾孩子节奏的家庭一日路线。",
      destinationScene: "亲子家庭、博物馆、公园、动物或互动展览、午后自然光",
      sceneTransformation: "地图路线从孩子点亮的收藏点延伸，match cut 到公园小路和奔跑方向",
      productAction: "路线综合步行距离、停留时间、用餐与返程，能力通过家庭动作自然体现",
      finalScene: "一家人沿着轻松路线继续出发，孩子回头挥手，城市远景收束",
      music: "温暖明亮的原声乐器与轻电子节拍，节奏活泼但不过度幼稚",
    },
    travel: {
      concept: "把旅行收藏夹里的地点，变成一条落地后可以直接出发的城市路线。",
      destinationScene: "具有目的地辨识度的城市天际线、地标、街区与旅行人物",
      sceneTransformation: "发光路线从数字地图穿出，match cut 到真实道路、建筑轮廓与人物运动",
      productAction: "地点按时间、距离和实时变化排序，手机路线画面只在动作中短暂出现",
      finalScene: "旅行者走入城市，远景中路线光效通向下一处地标",
      music: "电影感电子氛围与渐进鼓点，开场克制、目的地段落打开空间感",
    },
    commute: {
      concept: "把每天习惯的通勤选择，变成一条根据实时变化重新生成的路线。",
      destinationScene: "清晨城市、地铁入口、真实通勤人流与快速变化的街道光影",
      sceneTransformation: "两条路线在手机上交汇，其中一条光线顺势变成列车或道路运动轨迹",
      productAction: "时间、换乘与实时路况在一次抬手查看中完成比较，不停留展示复杂 UI",
      finalScene: "人物从容进入地铁或街道，镜头跟随后拉远",
      music: "精准电子节拍与城市环境声，节奏利落，节点切换有轻量脉冲音效",
    },
    culture: {
      concept: "把分散的文化地标，串成一条能真正走进城市历史的路线。",
      destinationScene: "古城、博物馆、历史街区、河边步道与克制的人文旅行画面",
      sceneTransformation: "路线光效沿古建筑线条延展，match cut 到屋檐、河岸与真实街巷",
      productAction: "文化点位按顺路关系和实时路况排列，手机只作为连接真实场景的媒介",
      finalScene: "人物从老街走向下一处文化地标，夕阳远景完成收束",
      music: "现代人文氛围音乐，融合轻打击乐和环境采样，情绪高级克制",
    },
  };
  const config = themeConfig[theme];
  const styleDirection = "官方品牌广告质感，cinematic lifestyle，premium commercial，丝滑 match cut，稳定推进与横移镜头，青绿色路线光效只作为连接数字地图和真实世界的视觉线索";
  const commonNegative = "low fidelity map cards, PPT infographic, rigid template layout, excessive UI labels, readable generated text, random letters, subtitles burned into image, logo, watermark, distorted hands, deformed faces, flicker, jitter, frame warping, abrupt cuts, oversaturated neon, cheap stock footage, cluttered composition";
  const shotRanges = createVideoTimeRanges(durationSeconds, 5);
  const shots: DouyinVideoCreativeShot[] = [
    {
      timeRange: shotRanges[0],
      sceneGoal: "强 Hook：两秒内看懂路线正在自动生成",
      visualDescription: "竖屏手机地图上散落的收藏点依次亮起，一只手指或一束光轻触中心点，青绿色路线快速连接全部目的地。画面干净，只保留一个明确动作。",
      cameraMovement: "快速微距推近，路线亮起时做轻微环绕和焦点拉移",
      transition: "路线末端冲出屏幕形成光线擦镜，进入下一镜头",
      overlayText: hook,
      voiceover: hook,
      imagePrompt: "9:16 cinematic macro shot, hand touching a clean digital map, scattered saved places lighting up, glowing cyan route connects them instantly, premium commercial lighting, dark clean background, no readable text, no logo, no watermark",
      videoPrompt: "Fast macro camera push-in toward a hand touching a clean digital map; saved locations light up one by one and a glowing cyan route connects them within two seconds; subtle depth of field, polished commercial motion, no readable text or logo.",
    },
    {
      timeRange: shotRanges[1],
      sceneGoal: "路线变成真实场景",
      visualDescription: config.sceneTransformation,
      cameraMovement: "跟随路线向前高速滑行，落地真实场景后减速稳定",
      transition: "route line transformation + directional match cut，保持运动方向连续",
      overlayText: "零散收藏，自动串成路线",
      voiceover: "想去的地方不用再一个个拼，路线已经顺好了。",
      imagePrompt: `9:16 transition frame, glowing cyan route crossing from a digital map into ${config.destinationScene}, seamless match cut composition, premium brand commercial, realistic light, no text, no logo`,
      videoPrompt: `Follow a glowing cyan route as it leaves the digital map and seamlessly transforms into ${config.destinationScene}; smooth directional match cut, continuous motion, realistic lighting, premium travel commercial.` ,
    },
    {
      timeRange: shotRanges[2],
      sceneGoal: "目的地大片：打开品牌广告的视觉空间",
      visualDescription: config.destinationScene,
      cameraMovement: "稳定器缓慢推进后横移，前景掠过形成自然景深",
      transition: "利用建筑边缘、人物经过或水面反光做遮挡转场",
      overlayText: isDragonBoat ? "过一个有文化感的夏天" : "路线抵达真实世界",
      voiceover: isDragonBoat ? "古城、龙舟和老街，顺着这条路线慢慢逛。" : "少一点来回切换，多一点真正走进城市。",
      imagePrompt: `9:16 cinematic destination hero shot, ${config.destinationScene}, editorial travel photography, premium commercial color grading, realistic people, subtle cyan route reflection, no text, no logo, no watermark`,
      videoPrompt: `A cinematic stabilized push-in and gentle lateral move through ${config.destinationScene}; foreground parallax, realistic people and light, premium destination campaign, polished color grading, subtle cyan route reflection only.` ,
    },
    {
      timeRange: shotRanges[3],
      sceneGoal: "产品能力自然植入，不做功能说明书",
      visualDescription: config.productAction,
      cameraMovement: "从真实场景中的人物动作自然推到手机，再迅速拉焦回到前方道路",
      transition: "手机中的路线与真实道路中心线对齐，match dissolve 回到场景",
      overlayText: "少绕路 · 看路况 · 顺路打卡",
      voiceover: "收藏点、路线和实时变化，一次帮你理顺。",
      imagePrompt: "9:16 over-the-shoulder lifestyle shot, person briefly checking a clean route on a phone while standing in a real city scene, interface intentionally unreadable, premium product placement, no text, no logo, no UI labels",
      videoPrompt: "Move naturally from the traveler's action to a brief over-the-shoulder phone route view, then rack focus back to the real road; interface remains abstract and unreadable; premium product integration, no hard sell.",
    },
    {
      timeRange: shotRanges[4],
      sceneGoal: "最终出发：用人物行动完成情绪收束",
      visualDescription: config.finalScene,
      cameraMovement: "跟拍两步后缓慢升高或拉远，留下标题与 CTA 安全区",
      transition: "青绿色路线轻轻延伸到远景后自然淡出，不出现生成 Logo",
      overlayText: cta,
      voiceover: cta,
      imagePrompt: `9:16 cinematic closing shot, ${config.finalScene}, emotional but clean, premium brand campaign, subtle glowing cyan route leading forward, large negative space for post-production copy, no text, no logo, no watermark`,
      videoPrompt: `Follow the traveler for two steps, then slowly crane up or pull back to reveal ${config.finalScene}; a subtle cyan route leads forward and fades naturally; clean emotional ending with copy-safe space, no generated text or logo.` ,
    },
  ];
  const promptContext = [
    contentPackage.renderHints.visualMood,
    contentPackage.renderHints.cityMood,
    ...contentPackage.renderHints.keyObjects.slice(0, 4),
    ...contentPackage.visualPrompts.videoKeyframePrompts.slice(0, 2),
  ].filter(Boolean).join(", ");
  const fullVideoPrompt = `9:16 vertical cinematic brand video, ${durationLabel}, ${config.concept} A glowing cyan Amap-inspired route line starts from a clean digital map and smoothly transforms into real city scenes: ${config.destinationScene}. Premium commercial style, smooth match cuts, route line transformation, camera push-in, stabilized lateral movement, realistic people and lighting, polished color grading, high-end travel and lifestyle campaign, emotional but clean. Product capability appears naturally through a brief abstract phone route view, never as a hard UI demo. Visual context: ${promptContext}. Keep generous safe areas for post-production overlay copy. No generated text, no subtitles, no logo, no watermark, no readable UI labels.`;
  const transitionPlan = shots.slice(0, -1).map((shot, index) => `Shot ${index + 1} → ${index + 2}：${shot.transition}`);
  const overlayCopy = shots.map((shot) => shot.overlayText);
  const voiceover = shots.map((shot) => shot.voiceover);
  const subtitles = voiceover;
  const shotPromptText = shots.map((shot, index) => `Shot ${index + 1} ${shot.timeRange}: ${shot.videoPrompt}`).join("\n");
  const copyReadyPrompt = `${fullVideoPrompt}\n\nSHOT PLAN\n${shotPromptText}\n\nMUSIC\n${config.music}\n\nNEGATIVE PROMPT\n${commonNegative}`;

  return {
    concept: config.concept,
    styleDirection,
    duration: durationLabel,
    aspectRatio: "9:16",
    creativeHook: hook,
    shotList: shots,
    transitionPlan,
    overlayCopy,
    voiceover,
    subtitles,
    musicDirection: config.music,
    fullVideoPrompt,
    negativePrompt: commonNegative,
    copyReadyPrompt,
  };
}

function normalizeVideoCreativePack(
  value: unknown,
  fallback: DouyinVideoCreativePack,
): DouyinVideoCreativePack {
  const record = value && typeof value === "object" ? value as Partial<DouyinVideoCreativePack> : {};
  const providedShots = Array.isArray(record.shotList) ? record.shotList : [];
  const sourceShots = providedShots.length >= 5 ? providedShots.slice(0, 10) : fallback.shotList;
  const shotList = sourceShots.map((sourceShot, index): DouyinVideoCreativeShot => {
    const fallbackShot = fallback.shotList[index] ?? fallback.shotList.at(-1)!;
    const shot = sourceShot as Partial<DouyinVideoCreativeShot> | undefined;
    return {
      timeRange: normalizeString(shot?.timeRange, fallbackShot.timeRange),
      sceneGoal: normalizeString(shot?.sceneGoal, fallbackShot.sceneGoal),
      visualDescription: normalizeString(shot?.visualDescription, fallbackShot.visualDescription),
      cameraMovement: normalizeString(shot?.cameraMovement, fallbackShot.cameraMovement),
      transition: normalizeString(shot?.transition, fallbackShot.transition),
      overlayText: normalizeString(shot?.overlayText, fallbackShot.overlayText),
      voiceover: normalizeString(shot?.voiceover, fallbackShot.voiceover),
      imagePrompt: normalizeString(shot?.imagePrompt, fallbackShot.imagePrompt),
      videoPrompt: normalizeString(shot?.videoPrompt, fallbackShot.videoPrompt),
    };
  });
  const fullVideoPrompt = normalizeString(record.fullVideoPrompt, fallback.fullVideoPrompt);
  const negativePrompt = normalizeString(record.negativePrompt, fallback.negativePrompt);
  const musicDirection = normalizeString(record.musicDirection, fallback.musicDirection);
  const copyReadyPrompt = normalizeString(
    record.copyReadyPrompt,
    `${fullVideoPrompt}\n\nSHOT PLAN\n${shotList.map((shot, index) => `Shot ${index + 1} ${shot.timeRange}: ${shot.videoPrompt}`).join("\n")}\n\nMUSIC\n${musicDirection}\n\nNEGATIVE PROMPT\n${negativePrompt}`,
  );

  return {
    concept: normalizeString(record.concept, fallback.concept),
    styleDirection: normalizeString(record.styleDirection, fallback.styleDirection),
    duration: fallback.duration,
    aspectRatio: "9:16",
    creativeHook: normalizeString(record.creativeHook, fallback.creativeHook),
    shotList,
    transitionPlan: normalizeStringArray(record.transitionPlan, fallback.transitionPlan, 10),
    overlayCopy: normalizeStringArray(record.overlayCopy, shotList.map((shot) => shot.overlayText), 10),
    voiceover: normalizeStringArray(record.voiceover, shotList.map((shot) => shot.voiceover), 10),
    subtitles: normalizeStringArray(record.subtitles, shotList.map((shot) => shot.voiceover), 10),
    musicDirection,
    fullVideoPrompt,
    negativePrompt,
    copyReadyPrompt,
  };
}

function normalizeDouyinPublishPackage(
  value: unknown,
  contentPackage: ContentPackage,
  sourceContext = "",
): DouyinPublishPackage | undefined {
  const asset = contentPackage.platformAssets.douyin;
  if (!asset) return undefined;

  const record = value && typeof value === "object" ? value as Partial<DouyinPublishPackage> : {};
  const theme = detectCreativeTheme(contentPackage, sourceContext);
  const campaignText = joinCampaignText(contentPackage, sourceContext);
  const isDragonBoat = /端午|龙舟|粽/.test(campaignText);
  const hashtags = normalizeHashtags(record.hashtags, asset.hashtags.length ? asset.hashtags : douyinFallbackHashtags, 8);
  const titleCandidates = normalizeStringArray(
    record.titleCandidates,
    isDragonBoat
      ? [
          "端午还没想好去哪？这条文化路线直接抄作业 🐉",
          "别再临时翻攻略了，高德把端午路线串好了",
          "想过一个有文化感的端午？先把这条路线收藏",
        ]
      : asset.titleCandidates ?? defaultDouyinTitleCandidates(theme, asset.title),
    3,
  );
  const hookCandidates = normalizeStringArray(
    record.hookCandidates,
    isDragonBoat
      ? ["端午还没想好去哪？这条文化路线直接抄作业。", "古城、龙舟、老街，一条路线刚好串起来。"]
      : asset.hookCandidates ?? defaultDouyinHookCandidates(theme, asset.hook),
    2,
  );
  const title = normalizeString(record.title, titleCandidates[0] ?? asset.title);
  const hook = normalizeString(record.hook, hookCandidates[0] ?? asset.hook);
  const cta = normalizeString(record.cta, defaultDouyinCta(theme));
  const durationSeconds = inferVideoDurationSeconds(sourceContext);
  const script15s = normalizeDouyinScript(record.script15s, asset.script15s, theme, hook, durationSeconds);
  const storyboard = normalizeDouyinStoryboard(record.storyboard, script15s, asset.storyboard);
  const subtitles = normalizeString(record.subtitles, buildSubtitles(script15s));
  const caption = normalizeString(record.caption, buildDouyinCaption({ hook, cta, theme, hashtags }));
  const copyReadyText = normalizeString(
    record.copyReadyText,
    `${title}

${caption}`,
  );
  const videoCreativePack = normalizeVideoCreativePack(
    record.videoCreativePack,
    createVideoCreativePack(contentPackage, sourceContext, hook, cta),
  );

  return {
    titleCandidates,
    hookCandidates,
    title,
    caption,
    hook,
    cta,
    coverVisualPrompt: normalizeString(
      record.coverVisualPrompt,
      contentPackage.visualPrompts.videoKeyframePrompts[0] ?? asset.visualStyle,
    ),
    script15s,
    storyboard,
    subtitles,
    hashtags,
    copyReadyText,
    videoCreativePack,
  };
}

function shouldBuild(selectedPlatforms: Platform[] | undefined, platform: Platform) {
  return !selectedPlatforms?.length || selectedPlatforms.includes(platform);
}

export function ensurePublishPackages(
  contentPackage: ContentPackage,
  selectedPlatforms?: Platform[],
  sourceContext = "",
): ContentPackage {
  const publishPackages = {
    ...(contentPackage.publishPackages ?? {}),
  };

  if (shouldBuild(selectedPlatforms, "xiaohongshu")) {
    const xiaohongshu = normalizeXiaohongshuPublishPackage(
      publishPackages.xiaohongshu,
      contentPackage,
      sourceContext,
    );
    if (xiaohongshu) publishPackages.xiaohongshu = xiaohongshu;
  }

  if (shouldBuild(selectedPlatforms, "douyin")) {
    const douyin = normalizeDouyinPublishPackage(
      publishPackages.douyin,
      contentPackage,
      sourceContext,
    );
    if (douyin) publishPackages.douyin = douyin;
  }

  return {
    ...contentPackage,
    publishPackages,
  };
}

export function createPublishPackageMarkdown(title: string, body: string) {
  return `# ${title}

${body}`;
}
