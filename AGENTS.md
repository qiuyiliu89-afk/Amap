# Amap AI Campaign Studio 开发协作规则

本文件面向 Codex 后续开发协作使用。所有开发任务必须先读取并遵守 `00_PROJECT_CONTEXT.md`，该文件是 README、PRD、WORKFLOW、页面设计和代码开发的唯一依据。

## 核心判断

后续所有代码、文档和页面都必须遵守以下判断：

1. 不要做成用户上传视频分析工具。
2. 不要做成普通 AI 文案生成器。
3. 不要所有平台都生成视频。
4. 必须体现多平台内容形态差异。
5. 必须体现高德 AI 内容运营场景。
6. 必须体现作业要求和三个加分项。
7. 必须有视觉预览，不能只有纯文字。
8. 必须有 mock fallback，保证演示稳定。
9. 不要过度设计，优先保证 Demo 完整、好看、能讲清楚。
10. 所有页面和文档都要围绕 `00_PROJECT_CONTEXT.md`，不要偏离。

## 项目定位

Amap AI Campaign Studio 是一个面向高德 AI 内容运营场景的内部工作流 Demo。目标用户不是普通 C 端用户，而是高德 AI 内容运营、海外媒体运营、品牌内容策划、AI 产品运营实习生和短视频 / 图文内容运营人员。

用户输入 Campaign Brief 后，系统生成 Campaign Content Kit，包括短视频脚本、分镜表、AI 视频生成 Prompt、小红书图文笔记、Instagram Carousel、TikTok Caption、YouTube Shorts 标题、Push / Banner 文案、Hashtags、内容评分、优化建议和批量内容矩阵。

## 品牌与合规边界

- 高德官方抖音视频只作为内容表达参考，不作为上传分析对象。
- 页面不得出现“高德官方工具”“官方 AI”“官方推荐”“官方上线功能”等误导表达。
- 不使用高德官方 Logo，避免版权问题。
- 可使用文字品牌 `Amap AI Campaign Studio`、`高德 AI 内容多平台生产工作台`。
- 内容表达应围绕“出行场景痛点 + AI 伴行能力 + 地图连接真实世界 + 科技感视觉表达”。
- 禁止夸大 AI 能力，不写“万能”“绝对最强”“彻底解决所有问题”等表述。

## 技术规则

- 使用 React + Vite 实现。
- 页面优先做成可演示 Web Demo，核心体验可按内容运营工作台设计，同时必须包含手机竖屏平台预览组件。
- 数据全部使用本地 mock JSON，不请求真实内容平台、真实高德服务、真实账号或真实视频生成服务。
- 预留大模型文本 API 接入，用于生成内容策略、脚本、分镜、图文笔记、AI 视频 Prompt、标题标签和内容评分。
- 第一版不接入视频生成 API，只输出可用于 AI 视频工具的 Prompt，并预留扩展接口。
- 必须保留 mock fallback：API 失败时展示高质量示例结果。
- 组件命名使用 PascalCase。
- 页面代码进入 `src/pages`，业务组件进入 `src/features`，通用组件进入 `src/components`，mock 数据进入 `src/mocks`。

## 建议目录

```text
src/
├── components/
│  ├── common/
│  ├── layout/
│  └── previews/
├── features/
│  ├── campaign-brief/
│  ├── workflow-runner/
│  ├── content-kit/
│  ├── platform-preview/
│  ├── batch-generation/
│  └── bonus-mapping/
├── mocks/
│  ├── campaignBriefs.json
│  ├── platformRules.json
│  ├── brandRules.json
│  ├── contentKits.json
│  └── batchMatrix.json
├── pages/
├── styles/
└── types/
```

## 核心页面

必须优先完成以下页面：

1. Campaign Brief 输入页：运营人员输入产品功能、活动主题、内容目标、目标平台、目标用户、目标市场、语言、内容风格和输出数量。
2. AI Workflow 执行页：展示解析 brief、读取品牌规则、匹配平台规则、内容形态路由、生成策略、生成资产、评分和优化建议。
3. Content Kit 结果页：展示 Strategy、Video Kit、Graphic Kit、Captions、Visual Prompts、Score & Rewrite 和 Export。
4. Platform Preview 平台预览页：展示抖音 / TikTok 竖屏、小红书图文轮播、Instagram Carousel、Push、Banner、AI Video Prompt 和 AI 视觉样片占位。
5. Batch Generation 批量生成页：支持示例数据或 CSV 生成多城市、多平台、多语言内容矩阵。
6. Bonus 加分项说明页：解释项目如何对应 AI Coding、自动化内容生成工作流、高德官方 AI 宣传视频类内容、海外媒体平台运营、AI 批量自动化开发和轻量 Prompt Skill Pack。

## Content Format Router 规则

不要所有平台都生成视频。平台输出必须体现差异：

- 抖音 / TikTok / YouTube Shorts：生成 Hook、短视频脚本、分镜、字幕、旁白、AI 视频 Prompt、封面文案和 Hashtags。
- 小红书：生成图文笔记、封面标题、正文、5-7 页轮播卡片、配图 Prompt、话题标签和评论互动引导。
- Instagram：生成 Reels 脚本、Carousel 文案、Caption、Hashtags 和图片 Prompt。
- Push / Banner：生成 Push 标题、Push 正文、Banner 主标题、Banner 副标题、CTA 和 A/B 测试版本。

## 轻量 Prompt Skill Pack

项目内部需要用规则文件和 Prompt 模板提升生成质量，不开发复杂插件。至少包含：

- 高德品牌风格规则：AI 出行助手、AI 伴行、地图连接真实世界、路线规划、城市探索、出行搭子。
- 平台内容规则：抖音、TikTok、小红书、Instagram、YouTube Shorts、Push / Banner 的内容差异。
- 内容形态路由规则：根据平台决定视频、图文、轮播、Push 或 Banner。
- 内容评分规则：Hook 强度、平台适配度、品牌一致性、用户痛点清晰度、视觉可执行性、海外本地化程度、内容新鲜感和风险等级。

如果核心评分低于 4 分，必须展示优化建议。

## 视觉与交互规则

- 整体风格应高级、有趣、有 AI 产品感，不做普通后台。
- 视觉关键词：深色科技背景、蓝绿色渐变光效、地图路线纹理、玻璃拟态卡片、手机竖屏内容预览、内容资产卡片、AI 工作流动画、平台预览组件、地图连接现实世界。
- 需要有可视化预览，不能只有文本生成结果。
- 每个核心模块都要有明确起点、过程、结果和下一步动作。
- 所有演示按钮需要有合理反馈，例如流程状态推进、结果刷新、预览切换、导出提示、评分重算或任务完成反馈。

## Mock 数据规范

mock 数据必须支撑真实演示，不写空泛占位文案。建议字段包括：

- Campaign Brief：`productFeature`、`campaignTheme`、`contentGoal`、`targetPlatforms`、`targetAudience`、`targetMarket`、`language`、`contentStyle`、`outputCount`
- Platform Rule：`platform`、`preferredFormats`、`tone`、`contentRules`、`avoidList`
- Content Kit：`strategy`、`videoKit`、`graphicKit`、`captions`、`visualPrompts`、`score`、`rewriteSuggestions`
- Batch Matrix：`city`、`market`、`language`、`platform`、`format`、`hook`、`caption`、`prompt`、`score`

## 文档维护规则

- 修改项目方向、核心判断或交付边界时，必须先更新 `00_PROJECT_CONTEXT.md`。
- 修改产品功能时，同步更新 `PRD.md`。
- 修改自动化流程、路由规则、评分规则或 fallback 逻辑时，同步更新 `WORKFLOW.md`。
- 修改页面视觉、组件样式或预览形态时，同步更新 `STYLE_GUIDE.md`。
- 修改最终交付内容时，同步更新 `SUBMISSION_CHECKLIST.md`。
- 每个阶段完成后，优先保证 Demo 可运行、主流程可演示，再补充次级细节。

## 质量检查

完成任何开发任务后都需要检查：

- 页面是否仍然体现高德 AI 内容运营场景。
- 是否仍然从 Campaign Brief 生成 Campaign Content Kit。
- 是否体现平台内容形态差异。
- 是否包含视觉预览。
- API 失败时是否仍可用 mock fallback 完成演示。
- 是否能说明作业要求和三个加分项。
