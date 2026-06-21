import type {
  CarouselCard,
  ContentPackage,
  Platform,
  RenderHints,
  StoryboardFrame,
} from "../types/campaign";
import { ensurePublishPackages } from "../utils/publishPackageUtils";

type ScenarioKey = "travel" | "citywalk" | "commute" | "localLife" | "holiday";

interface ScenarioContent {
  key: ScenarioKey;
  coreConcept: string;
  painPoints: string[];
  sellingPoints: string[];
  contentAngles: string[];
  renderHints: RenderHints;
  tiktokHook: string;
  douyinHook: string;
  coverTitle: string;
  postBody: string;
  cardTitles: Array<[string, string, string]>;
  instagramSlides: Array<[string, string, string]>;
  pushTitle: string;
  pushBody: string;
  bannerTitle: string;
  bannerSubtitle: string;
  cta: string;
  hashtags: string[];
  visualPrompts: {
    video: string[];
    xiaohongshu: string;
    instagram: string;
    banner: string;
    styleKeywords: string[];
  };
}

const allPlatforms: Platform[] = ["douyin", "tiktok", "xiaohongshu", "instagram", "push_banner"];

function detectScenario(rawRequirement = ""): ScenarioKey {
  const text = rawRequirement.toLowerCase();
  if (/通勤|commute|上班|地铁|早高峰|晚高峰/.test(text)) return "commute";
  if (/本地生活|榜单|餐厅|food|restaurant|local life|咖啡|吃饭/.test(text)) return "localLife";
  if (/节假日|假期|出行|春节|五一|十一|端午|龙舟|粽|holiday|vacation|dragon boat/.test(text)) return "holiday";
  if (/城市探索|citywalk|city walk|漫游|周末/.test(text)) return "citywalk";
  if (/海外|travel|traveler|trip|旅行|tourist|游客/.test(text)) return "travel";
  return "citywalk";
}

const scenarios: Record<ScenarioKey, ScenarioContent> = {
  travel: {
    key: "travel",
    coreConcept: "From scattered saves to one route — 让高德 AI 把海外旅行收藏变成一条能出发的城市路线。",
    painPoints: [
      "海外年轻旅行者收藏了很多地点，却不知道怎样组合更省时间。",
      "攻略、地图、翻译和交通信息分散，出发前需要频繁切换。",
      "实时路况、开放时间和天气变化会打乱原本计划。",
    ],
    sellingPoints: [
      "AI 路线规划综合时间、兴趣、交通方式与真实城市节点。",
      "实时路况和多模式导航帮助用户动态调整下一站。",
      "地图连接真实世界，让路线、地标和行动建议在同一界面完成。",
    ],
    contentAngles: ["Scattered saves", "One smart route", "Real-world conditions", "Travel without app switching"],
    renderHints: {
      theme: "AI city route travel",
      colorPalette: ["#38bdf8", "#5eead4", "#fb923c", "#0f172a"],
      visualMood: "futuristic night city",
      routeStyle: "cyan glowing route",
      backgroundType: "abstract city map",
      keyObjects: ["saved posts", "landmark pins", "smartphone map", "city skyline"],
      cityMood: "international city at night",
      platformLayout: {
        verticalVideo: "phone map overlay with landmark nodes",
        xiaohongshu: "official brand editorial travel poster with cinematic destination scenes",
        instagram: "lifestyle carousel with glowing route",
        pushBanner: "compact route-ready message",
      },
    },
    tiktokHook: "Stop stitching your trip together from ten different saves.",
    douyinHook: "第一次来这座城，别再用收藏夹拼路线。",
    coverTitle: "第一次逛陌生城市｜用 AI 把收藏夹变成路线",
    postBody: "旅行不缺目的地，缺的是把时间、距离和兴趣放在一起考虑的路线。高德 AI 路线规划帮助你从一堆收藏中得到更清楚的下一步。",
    cardTitles: [
      ["收藏很多，路线却排不出来？", "先别继续存攻略，把想去的地点和可用时间交给 AI。", "scattered save cards"],
      ["输入你的出行条件", "时间、兴趣、交通方式和同行人，是路线规划的四个关键输入。", "input panel with trip mood"],
      ["AI 连接真实地标", "自动判断地点顺序，减少折返，把地图上的点变成可执行行程。", "glowing landmark route"],
      ["路况变化也能调整", "结合实时路况和多模式导航，随时重新安排下一站。", "traffic-aware route fork"],
      ["适合收藏的使用场景", "陌生城市首日、半天空档、Citywalk、临时改计划都适用。", "destination cards"],
      ["出发前最后检查", "确认开放时间、天气与返程交通，再保存你的 AI 路线。", "departure checklist"],
    ],
    instagramSlides: [
      ["Too many saves. No actual route.", "A familiar start to every spontaneous city day.", "saved posts grid"],
      ["Tell AI what your day looks like", "Time, mood, interests and how you want to move.", "AI prompt card"],
      ["See landmarks connect", "The map turns separate places into a route that makes sense.", "route nodes"],
      ["Adjust with the real world", "Traffic and travel modes help the route stay practical.", "live traffic split"],
      ["Save the route. Start exploring.", "Less switching between apps, more time in the city.", "city skyline"],
    ],
    pushTitle: "你的城市路线已由 AI 整理好",
    pushBody: "根据时间和实时路况，看看现在更适合先去哪里。",
    bannerTitle: "一个想法，生成一条能出发的路线",
    bannerSubtitle: "让高德 AI 连接时间、路况与真实目的地。",
    cta: "查看 AI 路线",
    hashtags: ["#AITravel", "#SmartRoute", "#CityGuide", "#TravelTech"],
    visualPrompts: {
      video: [
        "9:16 keyframe, international traveler switching between saved posts and map pins, visible planning overload, dark city environment, cyan interface light.",
        "9:16 keyframe, smartphone map receives time, mood and transit preference, route nodes begin to glow, cinematic product lighting.",
        "9:16 keyframe, three urban landmarks connected by a teal route, walking and metro segments, clear subtitle-safe composition.",
        "9:16 closing keyframe, traveler enters the city while phone shows completed AI route, map connects to the real street.",
      ],
      xiaohongshu: "Xiaohongshu official brand cover, premium travel magazine poster, cinematic destination skyline and real traveler, refined teal light subtly connecting landmarks, strong visual center, bright commercial photography, clean title-safe area, no text, no logo, no UI, no cards, no map pins, no dotted route, no random letters.",
      instagram: "1:1 lifestyle travel carousel, saves-to-route transformation, realistic city textures, teal route motif.",
      banner: "Wide banner, city horizon with glowing route through landmarks, smartphone map UI and CTA-safe negative space.",
      styleKeywords: ["travel", "city route", "cyan glow", "saved places", "night skyline"],
    },
  },
  citywalk: {
    key: "citywalk",
    coreConcept: "把周末灵感变成一条轻松 Citywalk 路线，让 AI 伴你边走边发现。",
    painPoints: [
      "周末想出门，但临时做攻略容易从兴奋变成疲惫。",
      "打卡点之间距离不明，路线容易绕远。",
      "用户想要轻松探索，而不是被复杂行程表压住。",
    ],
    sellingPoints: [
      "根据心情、时间和步行强度生成轻量路线。",
      "用地图节点连接咖啡、展览、公园和街区。",
      "可随时替换下一站，让城市探索更自由。",
    ],
    contentAngles: ["Weekend route", "Mood-based exploration", "Walkable city nodes", "Low-pressure planning"],
    renderHints: {
      theme: "citywalk city route",
      colorPalette: ["#2dd4bf", "#a7f3d0", "#f59e0b", "#0f172a"],
      visualMood: "relaxed glowing city afternoon",
      routeStyle: "soft teal walking route",
      backgroundType: "abstract city blocks",
      keyObjects: ["coffee tag", "gallery pin", "park node", "walking line"],
      cityMood: "warm weekend city",
      platformLayout: {
        verticalVideo: "walking route with soft city labels",
        xiaohongshu: "warm city lifestyle magazine story with distinct poster and editorial pages",
        instagram: "warm lifestyle carousel",
        pushBanner: "weekend route CTA",
      },
    },
    tiktokHook: "Your weekend plan can start with a mood, not a spreadsheet.",
    douyinHook: "周末不想做攻略？让 AI 排一条好走的 Citywalk。",
    coverTitle: "周末 Citywalk｜用 AI 排一条不绕路路线",
    postBody: "不是把城市塞满，而是把想去的点顺成一条轻松路线。适合半天散步、咖啡店、展览和公园串联。",
    cardTitles: [
      ["先选今天的心情", "想放松、想拍照、想逛展，路线会不一样。", "mood chips"],
      ["把收藏点放进地图", "AI 会判断距离和顺路程度。", "pin cluster"],
      ["少绕路，多停留", "把步行强度控制在舒适范围。", "walking route"],
      ["临时想换店也可以", "下一站可以按时间和距离动态替换。", "swap card"],
      ["适合半日路线", "咖啡、展览、公园、街区都能组合。", "local tags"],
      ["保存你的周末路线", "出门前看一眼，就能直接走。", "saved route"],
    ],
    instagramSlides: [
      ["Start with a mood", "A city day can begin softer than a packed itinerary.", "mood card"],
      ["Drop your saved spots", "Let the map understand what can fit together.", "saved pins"],
      ["Walkable beats packed", "Less backtracking, more time in the street.", "walking line"],
      ["Swap a stop anytime", "The route stays flexible when your day changes.", "change node"],
      ["Save it and go", "A small city plan that feels easy to follow.", "weekend city"],
    ],
    pushTitle: "周末 Citywalk 路线已生成",
    pushBody: "按你今天的心情，看看哪一站更适合先去。",
    bannerTitle: "把周末灵感排成一条 Citywalk",
    bannerSubtitle: "咖啡、展览、公园，顺路走更轻松。",
    cta: "生成周末路线",
    hashtags: ["#Citywalk", "#周末去哪儿", "#城市探索", "#AI路线"],
    visualPrompts: {
      video: [
        "9:16 keyframe, warm weekend city blocks with cafe and gallery tags, soft teal walking line, relaxed product feel.",
        "9:16 keyframe, smartphone mood chips generate a walkable city route, bright urban afternoon, subtitle-safe lower area.",
        "9:16 keyframe, coffee shop, gallery and park connected by a glowing pedestrian route, no brand logos.",
      ],
      xiaohongshu: "Xiaohongshu official brand cover, warm citywalk editorial campaign, sunlit street, cafe, gallery and park lifestyle, cinematic commercial photography, subtle teal light motif, strong subject, clean title-safe area, no text, no logo, no UI, no cards, no map pins, no dotted route.",
      instagram: "1:1 lifestyle citywalk carousel, warm gradient city blocks, mood-based route labels, editorial typography.",
      banner: "Wide weekend city route banner, warm teal and amber palette, walking route through local tags.",
      styleKeywords: ["citywalk", "weekend", "warm route", "coffee", "gallery"],
    },
  },
  commute: {
    key: "commute",
    coreConcept: "让通勤路线根据实时变化自动更新，把早晚高峰的不确定变成可选方案。",
    painPoints: [
      "早晚高峰路况变化快，固定路线经常不再最优。",
      "用户需要在时间、换乘、步行距离之间快速取舍。",
      "临出门才发现堵车或延误，容易打乱节奏。",
    ],
    sellingPoints: [
      "AI 结合实时路况和多交通方式给出备选路线。",
      "用时间轴展示到达风险和换乘节点。",
      "在关键时刻通过 Push/Banner 承接打开路线。",
    ],
    contentAngles: ["Rush hour choice", "Route comparison", "Arrival risk", "Commute calmness"],
    renderHints: {
      theme: "commute route comparison",
      colorPalette: ["#60a5fa", "#22d3ee", "#fb7185", "#111827"],
      visualMood: "morning commute control room",
      routeStyle: "dual route comparison with traffic nodes",
      backgroundType: "timeline map",
      keyObjects: ["timeline", "traffic node", "metro icon", "arrival time badge"],
      cityMood: "weekday rush hour",
      platformLayout: {
        verticalVideo: "split route timeline with traffic warning",
        xiaohongshu: "cinematic morning city campaign with restrained product storytelling",
        instagram: "route comparison carousel",
        pushBanner: "time-sensitive route alert",
      },
    },
    tiktokHook: "Your commute changed before you even left.",
    douyinHook: "出门前 3 分钟，路线还能再快一步。",
    coverTitle: "通勤路线别固定｜AI 帮你看实时变化",
    postBody: "固定路线不一定适合今天。用 AI 同时比较时间、拥堵、换乘和步行距离，出门前快速判断怎么走。",
    cardTitles: [
      ["先看今天的到达风险", "早高峰不是只看距离，更要看变化。", "arrival risk badge"],
      ["对比两条路线", "地铁、打车、步行接驳可以放在一起比较。", "dual route"],
      ["关键节点提前提醒", "拥堵、延误、换乘时间都要算进去。", "traffic node"],
      ["临出门也能调整", "路线更新不必等到已经堵在路上。", "live update"],
      ["适合固定通勤人群", "每天一样的目的地，也有不一样的路况。", "commuter card"],
      ["保存你的常用路线", "下次直接看实时推荐。", "saved commute"],
    ],
    instagramSlides: [
      ["Rush hour is not static", "Your best route can change before you leave.", "traffic timeline"],
      ["Compare options fast", "Time, transfers and walking distance in one view.", "comparison cards"],
      ["Spot the risky segment", "Traffic nodes make the tradeoff visible.", "risk node"],
      ["Switch before it hurts", "A better route matters most before departure.", "route switch"],
      ["Commute with less guessing", "A calmer start to the workday.", "morning city"],
    ],
    pushTitle: "通勤路线有变化",
    pushBody: "当前路线预计变慢，查看更合适的出发方案。",
    bannerTitle: "早高峰路线，出门前再看一眼",
    bannerSubtitle: "AI 对比时间、拥堵与换乘节点。",
    cta: "查看通勤路线",
    hashtags: ["#通勤路线", "#实时路况", "#AI出行", "#早高峰"],
    visualPrompts: {
      video: [
        "9:16 split-screen commute keyframe, left route turns red with traffic node, right route glows cyan with better ETA.",
        "9:16 keyframe, timeline map UI comparing metro and driving routes, arrival time badges, morning city light.",
        "9:16 keyframe, commuter checks phone before leaving, AI route updates traffic nodes, subtitle-safe composition.",
      ],
      xiaohongshu: "Xiaohongshu official brand poster, cinematic morning city commute, real commuter in natural light, premium commercial photography, restrained teal route glow integrated into the street, clean title-safe area, no text, no logo, no UI screenshot, no cards, no map pins.",
      instagram: "1:1 route comparison carousel, weekday commute timeline, ETA badges, clean tech layout.",
      banner: "Wide commute banner, dual route lines, traffic warning node, strong CTA-safe area.",
      styleKeywords: ["commute", "timeline", "traffic", "ETA", "route comparison"],
    },
  },
  localLife: {
    key: "localLife",
    coreConcept: "让 AI 把本地生活灵感变成附近可行动的推荐路线，从餐厅榜单到下一站都更顺。",
    painPoints: [
      "用户看到榜单和餐厅推荐后，不知道附近还能顺路去哪。",
      "本地生活内容容易停在收藏，不容易变成一次出门计划。",
      "餐厅、商圈、排队和距离信息分散。",
    ],
    sellingPoints: [
      "AI 将榜单、距离、商圈和路线组合成可行动方案。",
      "用地点标签帮助用户快速理解推荐理由。",
      "适合餐厅、咖啡、商圈和附近活动组合。",
    ],
    contentAngles: ["Local picks", "Nearby route", "Warm recommendation cards", "From list to outing"],
    renderHints: {
      theme: "food local life route",
      colorPalette: ["#fb923c", "#facc15", "#2dd4bf", "#111827"],
      visualMood: "warm local recommendation board",
      routeStyle: "warm glowing route with place tags",
      backgroundType: "recommendation cards",
      keyObjects: ["暖色探店卡片", "榜单热度标识", "商圈路线节点", "附近下一站"],
      cityMood: "warm local evening",
      platformLayout: {
        verticalVideo: "recommendation cards flying into a route",
        xiaohongshu: "premium local lifestyle editorial with restaurant and night street scenes",
        instagram: "warm food route carousel",
        pushBanner: "nearby recommendation CTA",
      },
    },
    tiktokHook: "Your dinner list can become a whole evening route.",
    douyinHook: "收藏了餐厅榜单？AI 顺手帮你排好附近路线。",
    coverTitle: "本地生活路线｜从餐厅榜单到顺路下一站",
    postBody: "不只是看榜单，还能把餐厅、商圈和附近活动串成一次出门。适合周末约饭、临时探店和商圈散步。",
    cardTitles: [
      ["先选今天想吃什么", "榜单只是起点，出门路线才是关键。", "food category cards"],
      ["看附近还能去哪", "餐厅、商圈、咖啡和活动可以顺路组合。", "nearby tags"],
      ["距离和排队一起考虑", "减少临时改计划的成本。", "waiting badge"],
      ["把推荐变成路线", "AI 把收藏点排成一次可执行出门。", "warm route"],
      ["适合探店和约饭", "从一个餐厅延展到一段本地生活路线。", "暖色探店封面"],
      ["保存你的今晚计划", "吃饭、散步、返程都能一起看。", "evening plan"],
    ],
    instagramSlides: [
      ["A list is not a night out", "Turn saved food spots into a route.", "ranking cards"],
      ["Find what is nearby", "Restaurants, cafes and districts can connect.", "local tags"],
      ["Plan around wait time", "Distance and timing change the choice.", "wait badge"],
      ["Make the outing easy", "One route from dinner to the next stop.", "warm city route"],
      ["Save the evening", "Less scrolling, more local life.", "night local"],
    ],
    pushTitle: "附近路线已为你整理好",
    pushBody: "从收藏餐厅出发，看看顺路还能去哪。",
    bannerTitle: "从榜单到路线，本地生活更顺路",
    bannerSubtitle: "餐厅、商圈、咖啡点，一次规划好。",
    cta: "查看附近路线",
    hashtags: ["#本地生活", "#餐厅榜单", "#探店路线", "#AI推荐"],
    visualPrompts: {
      video: [
        "9:16 warm local-life keyframe, food recommendation visuals fold into a glowing city route, orange and teal palette.",
        "9:16 keyframe, cafe, dinner spot and shopping district connected by route, evening city mood.",
        "9:16 keyframe, phone map shows popularity markers and wait-time hints, premium lifestyle composition.",
      ],
      xiaohongshu: "Xiaohongshu official brand cover, premium local lifestyle campaign, refined restaurant, glowing evening street and people enjoying the city, editorial commercial photography, strong focal subject, clean title-safe area, no text, no logo, no UI, no cards, no map pins.",
      instagram: "1:1 warm food route carousel, recommendation cards, local district tags, amber teal accents.",
      banner: "Wide local life banner, food route and local district cues connected by warm glowing route.",
      styleKeywords: ["food", "local life", "warm city route", "evening outing", "nearby route"],
    },
  },
  holiday: {
    key: "holiday",
    coreConcept: "节假日出行不只看目的地，更要让 AI 提前规划路线、避开拥堵和错峰节点。",
    painPoints: [
      "节假日目的地热门，用户担心堵车、排队和临时变动。",
      "亲友同行时，路线需要兼顾时间、距离和停留强度。",
      "用户需要出发前快速确认今天是否适合按原计划走。",
    ],
    sellingPoints: [
      "AI 结合实时路况、热门节点和时间窗口给出出行建议。",
      "用错峰路线和备选点降低节假日不确定性。",
      "Push/Banner 在出发前承接路线确认。",
    ],
    contentAngles: ["Holiday traffic", "Staggered departure", "Family route", "Plan B"],
    renderHints: {
      theme: "holiday travel route",
      colorPalette: ["#38bdf8", "#fb923c", "#fde68a", "#111827"],
      visualMood: "bright holiday mobility map",
      routeStyle: "cyan route with orange congestion alerts",
      backgroundType: "holiday travel map",
      keyObjects: ["traffic alert", "family destination card", "time window", "alternative stop"],
      cityMood: "busy holiday city",
      platformLayout: {
        verticalVideo: "route with congestion alerts and alternate nodes",
        xiaohongshu: "festival brand campaign with cinematic cultural travel posters",
        instagram: "travel planning carousel",
        pushBanner: "departure-time route alert",
      },
    },
    tiktokHook: "Holiday traffic changes the plan before the trip starts.",
    douyinHook: "节假日出门前，先让 AI 看一眼这条路。",
    coverTitle: "节假日出行｜出发前先看 AI 路线",
    postBody: "节假日最怕临时堵车和排队。用 AI 提前看拥堵节点、错峰时间和备选路线，出门更安心。",
    cardTitles: [
      ["先看热门拥堵点", "目的地热门时，路线不只是最短距离。", "traffic alert"],
      ["确认适合出发的时间", "错峰窗口可以减少等待。", "time window"],
      ["准备一个 Plan B", "临时变动时还有备选目的地。", "alternate stop"],
      ["亲友同行更要看强度", "步行距离、停车和返程都要一起考虑。", "family card"],
      ["路线随路况调整", "出发前和途中都可以更新。", "route update"],
      ["保存节假日路线", "把拥堵、时间和下一站都放在一张图里。", "holiday checklist"],
    ],
    instagramSlides: [
      ["Holiday plans need timing", "The route matters before departure.", "traffic map"],
      ["Spot congestion early", "Busy nodes are easier to handle when visible.", "alert node"],
      ["Travel with Plan B", "Alternative stops keep the day flexible.", "plan b card"],
      ["Balance distance and energy", "Especially when traveling with family or friends.", "family route"],
      ["Check once before leaving", "A calmer start to a busy holiday.", "departure check"],
    ],
    pushTitle: "节假日路线建议已更新",
    pushBody: "当前路况有变化，建议查看错峰或备选路线。",
    bannerTitle: "节假日出行，先看路线再出发",
    bannerSubtitle: "AI 帮你识别拥堵节点和备选路线。",
    cta: "查看出行建议",
    hashtags: ["#节假日出行", "#错峰路线", "#AI路线规划", "#出发前检查"],
    visualPrompts: {
      video: [
        "9:16 holiday travel keyframe, city route with orange congestion alerts and cyan alternate path, bright mobility map.",
        "9:16 keyframe, family destination card, departure time window, AI route recommendation, energetic but reliable tone.",
        "9:16 keyframe, route switches from crowded road to alternate stop, no official logos, subtitle-safe composition.",
      ],
      xiaohongshu: "小红书官方品牌号封面视觉，杂志风端午旅行海报，江南水乡、古建筑、龙舟、粽叶、荷花与夏日阳光，青绿色路线光效自然且克制地串联景点，画面高级明亮，精致商业广告质感，强视觉中心，留白用于前端叠加标题，high-end editorial poster, cinematic travel photography, polished illustration, no text, no logo, no watermark, no UI screenshot, no cards, no map pins, no dotted route, no random letters.",
      instagram: "1:1 holiday planning carousel, traffic alerts, plan B cards, bright cyan orange palette.",
      banner: "Wide holiday route banner, congestion alert, alternate path and CTA-safe left area.",
      styleKeywords: ["holiday", "traffic alert", "Plan B", "staggered departure", "route update"],
    },
  },
};

function toCards(items: Array<[string, string, string]>): CarouselCard[] {
  return items.map(([title, body, visualCue], index) => ({
    id: `card-${index + 1}`,
    title,
    body,
    visualCue,
  }));
}

function createDouyinTitleCandidates(scenario: ScenarioContent) {
  const candidates: Record<ScenarioKey, string[]> = {
    travel: [
      "第一次逛陌生城市？收藏夹直接变路线",
      "别再用十个收藏拼旅行路线了",
      "海外旅行第一天，这条 AI 路线先收藏",
    ],
    citywalk: [
      "周末不想做攻略？AI 排一条好走的 Citywalk",
      "半天出门路线，咖啡展览公园顺路走",
      "Citywalk 别绕路，出门前这样排",
    ],
    commute: [
      "出门前 3 分钟，路线还能再快一步",
      "早高峰别硬走老路线，先看这一眼",
      "你的通勤路线，今天可能该换一条",
    ],
    localLife: [
      "收藏了餐厅榜单？AI 顺手排好附近路线",
      "今晚约饭别只看榜单，下一站也排好了",
      "从餐厅到商圈，一条路线直接走",
    ],
    holiday: [
      "节假日出门前，先让 AI 看一眼这条路",
      "热门目的地别硬挤，路线先留 Plan B",
      "假期路线先排好，出门少一点临时崩溃",
    ],
  };

  return candidates[scenario.key];
}

function createDouyinHookCandidates(scenario: ScenarioContent) {
  const candidates: Record<ScenarioKey, string[]> = {
    travel: [
      "收藏了十几个地点，最后还是不知道先去哪？",
      "第一次来这座城，别再用收藏夹硬拼路线。",
    ],
    citywalk: [
      "周末想出门，但真的不想再查一小时攻略？",
      "Citywalk 好不好逛，路线顺不顺很关键。",
    ],
    commute: [
      "你每天走的那条路，今天可能已经不是最快了。",
      "出门前 3 分钟，路线真的还能再快一步。",
    ],
    localLife: [
      "餐厅收藏了一堆，今晚到底怎么走才顺？",
      "榜单看完别退出，附近下一站也能一起排。",
    ],
    holiday: [
      "节假日最怕什么？不是远，是出门才发现堵。",
      "热门目的地可以去，但路线别只准备一条。",
    ],
  };

  return candidates[scenario.key];
}

function createInstagramCaption(scenario: ScenarioContent) {
  const captions: Record<ScenarioKey, string> = {
    travel: "Too many saved places, not enough route clarity. Amap AI turns scattered ideas into a city plan you can actually follow, with timing, traffic and next stops in one flow.",
    citywalk: "Start with a mood, not a spreadsheet. A softer weekend route can connect coffee, galleries and parks without turning your day into homework.",
    commute: "Your usual route is not always today's best route. Check timing, transfers and traffic before you leave, then move with a little less guessing.",
    localLife: "A food list becomes more useful when it turns into a real evening plan. Connect dinner, nearby stops and the way home in one warm local route.",
    holiday: "Holiday plans need room to move. Spot busy nodes, keep a Plan B and check the route once before leaving.",
  };

  return `${captions[scenario.key]}\n\nBuilt for an overseas Instagram audience: English caption, lifestyle tone, no random bilingual mixing.`;
}

function createInstagramTitleCandidates(scenario: ScenarioContent) {
  return scenario.instagramSlides.slice(0, 3).map(([title]) => title);
}

function createInstagramHookCandidates(scenario: ScenarioContent) {
  const hooks: Record<ScenarioKey, string[]> = {
    travel: ["Too many saves, no route yet.", "Turn scattered city ideas into one route."],
    citywalk: ["Start with a mood.", "Make the weekend walkable."],
    commute: ["Your usual route changed.", "Leave with less guessing."],
    localLife: ["A list is not a night out.", "Turn dinner saves into an evening route."],
    holiday: ["Holiday plans need timing.", "Keep a route and a Plan B."],
  };
  return hooks[scenario.key];
}

function createXiaohongshuCardPrompts(scenario: ScenarioContent) {
  return scenario.cardTitles.slice(0, 9).map(([title, , visualCue], index) => (
    index < 2
      ? `Xiaohongshu official brand editorial inner page, cinematic city or cultural travel scene for ${title}, ${visualCue}, one strong real-world subject, commercial photography or polished illustration, subtle teal brand light only, no text, no logo, no UI, no cards, no map pins, no dotted route.`
      : `Xiaohongshu magazine information page background ${index + 1}, ${visualCue}, premium editorial art direction, generous negative space for frontend copy, no text, no logo, no UI screenshot, no low-fidelity infographic.`
  ));
}

function createStoryboard(scenario: ScenarioContent): StoryboardFrame[] {
  return [
    {
      id: "scene-01",
      scene: "0-6s",
      visualCue: scenario.renderHints.keyObjects.slice(0, 2).join(" + "),
      copy: scenario.douyinHook,
    },
    {
      id: "scene-02",
      scene: "6-14s",
      visualCue: scenario.renderHints.backgroundType,
      copy: "从真实出行痛点切入：收藏很多地点，却很难安排成一条真正能走的路线。",
    },
    {
      id: "scene-03",
      scene: "14-22s",
      visualCue: scenario.renderHints.routeStyle,
      copy: "输入时间、偏好和当前位置，AI 开始连接关键节点。",
    },
    {
      id: "scene-04",
      scene: "22-30s",
      visualCue: scenario.renderHints.backgroundType,
      copy: "距离、开放时间与实时路况共同参与路线排序。",
    },
    {
      id: "scene-05",
      scene: "30-39s",
      visualCue: scenario.renderHints.cityMood,
      copy: "路线从数字地图延伸到真实城市，让每个目的地自然衔接。",
    },
    {
      id: "scene-06",
      scene: "39-48s",
      visualCue: scenario.renderHints.routeStyle,
      copy: "条件变化时及时调整，减少绕路和临时切换应用。",
    },
    {
      id: "scene-07",
      scene: "48-56s",
      visualCue: scenario.renderHints.keyObjects.slice(1, 4).join(" + "),
      copy: "把规划时间留给 AI，把更多时间留给真实的城市体验。",
    },
    {
      id: "scene-08",
      scene: "56-60s",
      visualCue: scenario.renderHints.cityMood,
      copy: "保存路线，直接出发。",
    },
  ];
}

function shouldInclude(platforms: Platform[], platform: Platform) {
  return platforms.includes(platform);
}

export function createMockContentPackage(rawRequirement = "", selectedPlatforms: Platform[] = allPlatforms): ContentPackage {
  const scenario = scenarios[detectScenario(rawRequirement)];
  const platforms = selectedPlatforms.length ? selectedPlatforms : allPlatforms;
  const storyboard = createStoryboard(scenario);
  const carouselCards = toCards(scenario.cardTitles);
  const instagramSlides = toCards(scenario.instagramSlides);
  const platformNames = platforms.join(", ");
  const douyinTitleCandidates = createDouyinTitleCandidates(scenario);
  const douyinHookCandidates = createDouyinHookCandidates(scenario);

  const platformAssets: ContentPackage["platformAssets"] = {};
  if (shouldInclude(platforms, "tiktok") || shouldInclude(platforms, "youtube_shorts")) {
    platformAssets.tiktok = {
      title: scenario.tiktokHook,
      hook: scenario.tiktokHook,
      script15s: storyboard.map((item) => `${item.scene}: ${item.copy}`),
      script30s: storyboard.map((item) => `${item.scene}: ${item.copy}`),
      storyboard,
      subtitles: [scenario.tiktokHook, "AI turns scattered intent into a route.", "Check the route before you go."],
      caption: `${scenario.tiktokHook} Amap AI turns intent, timing and real-world conditions into a route you can follow.`,
      hashtags: scenario.hashtags,
      visualStyle: scenario.renderHints.visualMood,
      previewType: "vertical-video",
    };
  }
  if (shouldInclude(platforms, "douyin")) {
    platformAssets.douyin = {
      title: douyinTitleCandidates[0],
      hook: douyinHookCandidates[0],
      titleCandidates: douyinTitleCandidates,
      hookCandidates: douyinHookCandidates,
      script15s: storyboard.map((item) => `${item.scene}：${item.copy}`),
      storyboard,
      subtitles: [douyinHookCandidates[0], "AI 已帮你连接下一站。", "看路线，再出发。"],
      coverCopy: scenario.coverTitle,
      hashtags: scenario.hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)),
      visualStyle: scenario.renderHints.visualMood,
      previewType: "vertical-video",
    };
  }
  if (shouldInclude(platforms, "xiaohongshu")) {
    platformAssets.xiaohongshu = {
      coverTitle: scenario.coverTitle,
      postBody: scenario.postBody,
      carouselCards,
      hashtags: scenario.hashtags,
      commentGuide: "你会把哪一站交给 AI 先排？评论区留一个目的地，我帮你看路线逻辑。",
      previewType: "note-carousel",
    };
  }
  if (shouldInclude(platforms, "instagram")) {
    platformAssets.instagram = {
      carouselSlides: instagramSlides,
      caption: createInstagramCaption(scenario),
      hashtags: scenario.hashtags,
      reelsScript: storyboard.map((item) => `${item.scene}: ${item.copy}`),
      titleCandidates: createInstagramTitleCandidates(scenario),
      hookCandidates: createInstagramHookCandidates(scenario),
      captionLanguageStrategy: "English caption for overseas Instagram audience; keep Chinese context out of the publish copy unless the brief explicitly requests bilingual output.",
      previewType: "instagram-carousel",
    };
  }
  if (shouldInclude(platforms, "push_banner")) {
    platformAssets.pushBanner = {
      pushTitle: scenario.pushTitle,
      pushBody: scenario.pushBody,
      bannerTitle: scenario.bannerTitle,
      bannerSubtitle: scenario.bannerSubtitle,
      cta: scenario.cta,
      abVersions: [
        `${scenario.pushTitle}｜${scenario.cta}`,
        `${scenario.bannerTitle}｜立即查看`,
      ],
      previewType: "notification-banner",
    };
  }

  const contentPackage: ContentPackage = {
    campaignStrategy: {
      coreConcept: scenario.coreConcept,
      userPainPoints: scenario.painPoints,
      productSellingPoints: scenario.sellingPoints,
      contentAngles: scenario.contentAngles,
      platformStrategy: {
        selectedPlatforms: `本轮重点平台：${platformNames}`,
        verticalVideo: "短视频负责快速建立痛点冲突与路线变化记忆点。",
        xiaohongshu: "小红书负责官方品牌级封面、场景大片与可收藏信息页的连续叙事。",
        instagram: "Instagram 负责生活方式视觉和连续叙事。",
        pushBanner: "Push / Banner 负责即时行动转化。",
      },
    },
    platformAssets,
    visualPrompts: {
      videoKeyframePrompts: scenario.visualPrompts.video,
      xiaohongshuCoverPrompt: scenario.visualPrompts.xiaohongshu,
      xiaohongshuCardPrompts: createXiaohongshuCardPrompts(scenario),
      instagramCarouselPrompt: scenario.visualPrompts.instagram,
      bannerPrompt: scenario.visualPrompts.banner,
      styleKeywords: scenario.visualPrompts.styleKeywords,
    },
    renderHints: scenario.renderHints,
    qualityScore: {
      total: 4.6,
      totalScore: 92,
      hookStrength: scenario.key === "localLife" ? 4.4 : 4.6,
      platformFit: 4.7,
      brandConsistency: 4.6,
      painPointClarity: scenario.key === "commute" ? 4.9 : 4.7,
      visualFeasibility: 4.5,
      localization: scenario.key === "travel" ? 4.5 : 4.3,
      freshness: 4.5,
      riskLevel: 4.8,
      dimensions: [
        { label: "Hook 强度", score: 4.6, note: "从具体场景痛点切入，前三秒冲突明确。" },
        { label: "平台适配度", score: 4.7, note: "短视频、图文、Carousel 与通知形态区分明确。" },
        { label: "高德品牌一致性", score: 4.6, note: "围绕 AI 出行助手和地图连接真实世界。" },
        { label: "用户痛点清晰度", score: 4.8, note: "路线、时间、节点和行动建议都有具体承接。" },
        { label: "视觉可执行性", score: 4.5, note: "renderHints 明确了背景、路线、节点和关键物件。" },
        { label: "海外本地化程度", score: scenario.key === "travel" ? 4.5 : 4.2, note: "按平台保留中英文语气差异。" },
        { label: "内容新鲜感", score: 4.5, note: "从场景需求到路线结果的叙事具有记忆点。" },
        { label: "风险等级", score: 4.8, note: "无夸大承诺，未暗示超出产品能力边界。" },
      ],
    },
    rewriteSuggestions: {
      issuesFound: [
        "部分平台首屏仍可进一步增加具体时间或距离损失，让冲突更强。",
        "视觉 Prompt 可继续补充平台安全区和字体层级要求。",
      ],
      suggestions: [
        "为 TikTok / 抖音补充更具画面感的前三秒对比。",
        "小红书最后一页加入“保存前检查”，增强收藏价值。",
        "Banner 文案保持单一行动，不要承载过多说明。",
      ],
      improvedHook: scenario.key === "commute"
        ? "Your usual route just got slower — AI found the better one before you left."
        : scenario.tiktokHook,
      improvedCaption: `${scenario.coreConcept} Check the route, compare the next stop, and move with less guessing.`,
      improvedVisualPrompt: `${scenario.renderHints.visualMood}, ${scenario.renderHints.routeStyle}, ${scenario.renderHints.keyObjects.join(", ")}, platform-safe typography, no official logos.`,
    },
    exportPackage: {
      markdownSummary: `# Amap AI Campaign Package\n\n## Core Concept\n${scenario.coreConcept}\n\n## Platforms\n${platformNames}\n\n## Render Hints\n${scenario.renderHints.theme} / ${scenario.renderHints.visualMood}\n\n## Quality Score\n92/100`,
      csvRows: Object.entries(platformAssets).map(([platform, asset]) => ({
        platform,
        format: asset.previewType,
        title:
          "hook" in asset
            ? asset.hook
            : "coverTitle" in asset
              ? asset.coverTitle
              : "carouselSlides" in asset
                ? asset.carouselSlides[0]?.title ?? "Instagram Carousel"
                : asset.bannerTitle,
        score: 92,
      })),
      jsonReady: true,
      assetsChecklist: [
        "内容策略",
        "平台内容资产",
        "视觉 Prompt",
        "renderHints",
        "质量评分",
        "优化建议",
        "Markdown / JSON / CSV 导出包",
      ],
      generatedAt: new Date().toISOString(),
    },
  };

  return ensurePublishPackages(contentPackage, platforms, rawRequirement);
}

export const mockContentPackage: ContentPackage = createMockContentPackage();
