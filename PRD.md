# PRD: Amap AI Campaign Studio

## 2026-06-19 Update: Publish Package Experience

AssetsPage is positioned as a content asset library and publishing package export page, not a raw Content Package field viewer. Xiaohongshu uses a dynamic 5-9 page official-brand package. Douyin uses a short-video publishing package plus a complete `videoCreativePack`: concept, five-shot timeline, transitions, overlay copy, voiceover, subtitles, music direction, full video prompt, negative prompt, and copy-ready production prompt. PreviewPage remains the final platform-effect view and hides implementation fields.

## 1. 文档依据

本文档严格基于 `00_PROJECT_CONTEXT.md`。该文件明确了项目的核心判断：项目名为 `Amap AI Campaign Studio`，中文名可对外表达为 `高德 AI 内容生成工作台`，核心能力是 `AI Content Pipeline / AI 内容生产流水线`。本项目不是普通 AI 文案生成器，不是用户上传视频分析工具，不是只生成脚本和 Prompt 的工具，也不会假装已经真实发布到社交平台。

## 2. 项目背景

项目用于 AI 产品实习岗位作品提交，需要同时展示 AI Coding 作品和自动化内容生成工作流。作业加分项包括：

- 能用 AI 做类似高德地图官方抖音宣传视频的内容。
- 熟悉海外媒体平台运营。
- 擅长基于内容生成需求做 AI 批量自动化开发、模型训练等。

因此，本项目要做成一个结合 AI Coding、内容创作、海外平台、多平台内容生产、视觉素材生成、平台预览和高德 AI 宣传场景的完整作品。

## 3. 产品定位

Amap AI Campaign Studio 是一个面向高德 AI 内容生成场景的自动化工作台。创作者输入一个 Campaign Brief，系统通过 AI Content Pipeline 自动生成 Publish-ready Package，可发布内容包。

目标用户包括：

- 高德 AI 内容生成 / 内容资产同学
- 海外媒体运营同学
- 品牌内容策划同学
- AI 产品运营实习生
- 短视频 / 图文内容创作同学

## 4. 产品目标

1. 降低高德 AI 宣传内容的策划、生成、改写和预览成本。
2. 将“出行场景痛点 + AI 伴行能力 + 地图连接真实世界 + 科技感视觉表达”的内容方法产品化。
3. 根据不同平台自动生成不同内容形态，而不是所有平台都生成视频。
4. 将内容产出从“生成脚本”升级为“生成可发布内容包”。
5. 支持视觉素材生成或 Mock Visual Fallback，让内容可被前端渲染成平台预览。
6. 支持质量评分、优化建议和改写版本，体现内容资产的评估与迭代能力。
7. 支持批量生成多城市、多平台、多语言内容矩阵。

## 5. 非目标

第一版明确不做：

- 不做用户上传视频分析入口。
- 不做普通 AI 文案生成器。
- 不做只生成脚本和 Prompt 的工具。
- 不做所有平台统一生成视频。
- 不假装已经真实发布到社交平台。
- 不接入真实高德服务、真实账号服务或真实内容平台发布接口。
- 不生成真实 MP4。抖音 / TikTok 第一版使用 AI 关键帧 + 字幕 + 前端转场动效形成 9:16 短视频预览。
- 不使用高德官方 Logo，不暗示官方上线功能。

## 6. 核心用户故事

作为高德 AI 内容创作人员，我希望输入一个 Campaign Brief，系统能够自动生成多平台内容、视觉素材、平台预览、质量评分、优化建议和可导出的发布包，从而快速形成可演示、可评审、可批量扩展的 Publish-ready Package。

## 7. 核心工作流

英文工作流：

Natural-language Requirement
→ Campaign Prompt Engine
→ Prompt Quality & Optimization
→ Prompt Compilation
→ AI 生成内容策略
→ AI 生成多平台内容
→ AI 生成视觉 Prompt
→ 生图 API 或 Mock Visual Fallback 生成视觉素材
→ 前端渲染平台预览
→ AI 质量评分
→ AI 优化建议
→ 导出发布包

中文表达：

自然语言需求输入
→ Campaign Prompt 生成与优化
→ Prompt 编译
→ 内容策略生成
→ 多平台内容生成
→ 视觉素材生成
→ 平台预览渲染
→ 质量评分
→ 优化建议
→ 发布准备
→ 导出发布包

## 8. 功能模块

### 8.1 Home：首页

首页展示：

- 项目定位
- AI Content Pipeline 核心流程
- Publish-ready Package 的产出范围
- 作业要求和加分项入口
- 开始演示按钮

### 8.2 Brief：Campaign Prompt Engine

创作者输入一段自然语言内容需求，系统将其编译为专业 Campaign Prompt。Prompt 是自然语言需求和 AI Content Pipeline 之间的核心中间层，不是最终内容产物。

Campaign Prompt 必须包含 Role、Campaign Context、Content Tasks、Visual Tasks、Quality Criteria 和 Output Format。用户可以查看、复制、编辑、重新生成、优化并确认当前 Prompt。

当自然语言需求明确提到目标平台时，系统必须以用户输入为准自动收敛目标平台。例如“宣传到小红书”只生成小红书任务，“发布到 TikTok 和 Instagram”只生成 TikTok 与 Instagram 任务。只有用户未明确提到平台时，才使用页面当前选择的平台；用户之后手动修改平台选择时，以手动选择为准。

页面展示 Prompt Quality，包括需求完整度、平台适配度、输出结构清晰度、视觉生成可执行性、评分约束完整度和风险控制清晰度。Improve Prompt 使用本地 mock 逻辑增强约束并提高评分。

页面只保留目标平台、视觉素材、质量评分和每平台输出数量等少量配置，并通过 Pipeline Input Summary 和右侧状态栏说明即将进入 Pipeline 的输入、资产路由和执行步骤。

### 8.3 Pipeline：自动运行完整内容生产流水线

展示流水线状态：

- Prompt 编译
- AI 生成内容策略
- AI 生成多平台内容
- AI 生成视觉 Prompt
- 生图 API 或 Mock Visual Fallback 生成视觉素材
- 前端渲染平台预览
- AI 质量评分
- AI 优化建议
- 导出发布包

PipelinePage 只读取 `amap_pipeline_input`，进入页面后自动执行九个步骤。步骤状态为 waiting、running、done；运行中步骤显示蓝绿色 glow，完成后展示输出摘要。完成后保存 Content Package、Visual Assets、Pipeline Status 和 Export Package。Step 5 根据 `selectedPlatforms` 从 `contentPackage.visualPrompts` 路由视觉背景，每个平台最多调用一次火山方舟生图；失败资产降级为前端视觉草图，不中断后续步骤。

Pipeline 第 2 步调用火山方舟文本大模型生成 Content Package。该接口只生成结构化文本 JSON，不接入生图 API、视频 API 或真实平台发布 API。模型输出必须严格按 `selectedPlatforms` 生成平台资产；例如只选择小红书时，只允许生成 `platformAssets.xiaohongshu`。Ark 请求失败或 JSON 解析失败时，必须自动使用本地 mock Content Package fallback，并继续跑完 9/9。

### 8.4 Assets：展示多平台内容资产、评分、优化建议和导出

展示 Publish-ready Package：

- 抖音 / TikTok 短视频脚本
- 抖音 AI 视频生产包：创意方向、需求驱动时长、6-10 镜头 shotList、转场、口播、字幕、音乐、完整 Prompt 与 Negative Prompt；未指定时长时宣传视频默认 60s
- 9:16 短视频预览所需的视频关键帧
- 字幕
- 封面标题
- 小红书图文卡片
- Instagram Carousel
- Push 通知
- Banner 横幅
- Caption
- Hashtags
- 发布时间建议
- 质量评分
- 优化建议和改写版本
- Markdown / JSON / CSV 导出包

Assets 页要能说明每个资产为什么适合对应平台，而不是只展示生成文案。

Assets 页采用“成品优先，生产信息其次”的结构。每个平台模块先展示视觉成品预览和可直接复制的发布文案，再展示标签、CTA、评论引导；Prompt、storyboard、pagePlan、render hints 和 generation source 放入折叠区。

### 8.5 Preview：展示平台视觉预览

展示：

- 抖音 / TikTok 9:16 短视频预览
- 小红书图文轮播预览
- Instagram Carousel 预览
- Push 通知预览
- Banner 横幅预览
- AI Video Prompt 预览
- Mock Visual Fallback 视觉素材占位

预览模块是项目区别于普通文案生成器和纯脚本工具的关键，必须优先实现。

### 8.6 Batch：批量内容矩阵生成

支持 CSV 或示例数据批量生成多城市、多平台、多语言内容矩阵。矩阵至少展示：

- 城市 / 市场
- 语言
- 平台
- 内容形态
- Hook / Caption
- 视觉素材状态
- 质量评分
- 优化状态
- 导出状态

### 8.7 Bonus：说明作业要求和加分项对应

明确说明项目如何对应：

- AI Coding 作品
- 自动化内容生成工作流
- 高德官方 AI 宣传视频类内容
- 海外媒体平台运营
- AI 批量自动化开发
- 轻量 Prompt Skill Pack

## 9. 平台内容形态

| 平台 | 内容形态 | 主要输出 |
| --- | --- | --- |
| 抖音 | 9:16 短视频预览 + AI 视频生产包 | 视频封面 / 首帧、标题与 Hook 候选、发布文案、字幕、CTA、需求驱动的 6-10 镜头 shotList、转场计划、口播、音乐方向、fullVideoPrompt、negativePrompt、copyReadyPrompt；未指定时长时宣传视频默认 60s |
| TikTok | 9:16 短视频预览 | 英文口语化 Hook、短视频脚本、关键帧、Caption、Hashtags |
| YouTube Shorts | 短视频内容包 | 搜索友好标题、功能解释脚本、字幕、描述、Hashtags |
| 小红书 | 官方品牌级图文发布包 | `pagePlan.pageCount`、`pagePlan.pages`、封面独立 Prompt、5-9 页差异化图文、生活化正文、话题标签、评论引导 |
| Instagram | Reels / Carousel | Reels 脚本、Carousel 每页文案、Carousel 视觉素材、可直接发布 Caption、Hashtags、语言策略 |
| Push | 通知 | Push 标题、正文、CTA、A/B 测试版本 |
| Banner | 横幅 | 主标题、副标题、Banner 图、CTA、A/B 测试版本 |

## 10. 视觉素材与预览

生成视觉素材：

- 接入生图 API 时，可以真实生成封面图、轮播背景图、视频关键帧、Banner 图。
- 生图 API 失败时，使用 Mock Visual Fallback。

渲染平台预览：

- 小红书图文、Instagram Carousel、Push、Banner 是前端真实渲染的预览效果。
- TikTok / 抖音视频预览第一版不生成真实 MP4。抖音同时生成可复制到可灵、即梦、Runway、Pika 的 AI 视频生产包；前端只使用关键帧、字幕和动效进行 9:16 发布前预览。
- 后续可接入视频生成 API 输出完整视频文件。

## 11. 质量评分与优化建议

必须保留质量评分和优化建议。评分维度包括：

- Hook 强度
- 平台适配度
- 高德品牌一致性
- 用户痛点清晰度
- 视觉可执行性
- 海外本地化程度
- 内容新鲜感
- 风险等级

如果核心评分低于 4 分，需要生成优化建议和改写版本。

## 12. API 与 Mock Fallback

### `/api/generate-content-package`

文本大模型 API，生成结构化内容包：

- 内容策略
- 多平台内容
- Caption
- Hashtags
- 发布时间建议
- 质量评分
- 优化建议
- 改写版本
- 导出所需结构化字段

第一版通过 `generateContentPackageWithArk(pipelineInput)` 调用火山方舟 Responses API，不使用 `response_format`，而是通过强 Prompt 要求只返回 JSON。失败时使用 mock fallback，保证 Assets、Preview 和 Batch 仍可演示。

Content Package 响应先经过 `safeParseJSONFromLLM`，依次兼容纯 JSON、```json 代码块和首尾花括号截取。可解析但字段不完整时由 `normalizeContentPackage` 自动补齐，并继续视为 Ark 成功；完全无法解析时先执行本地 JSON repair pass，修复尾逗号、漏逗号、未闭合对象 / 数组、字符串中的未转义英文引号和原始换行，本地仍失败再调用一次 `repairContentPackageJSON`。任一修复成功标记为 `ark-content-repaired`，请求失败或双重修复失败才使用 mock fallback。小红书输出使用 `pagePlan: { pageCount, pages }` 动态决定 5-9 页，页面类型为 `cover / scene / landmark / route / tips / feature / cta`；封面单独规划，强视觉页与信息排版页使用不同生成和渲染策略，Markdown 摘要不超过 300 字。

### `/api/generate-visual-assets`

生图 API，生成视觉素材：

- 封面图
- 轮播背景图
- 视频关键帧
- Banner 图

两个 API 都必须有 Mock Fallback，保证演示稳定。

BonusPage 的开发模式临时入口保留为火山方舟 `/images/generations` 单图诊断工具，只生成一张端午文化小红书封面，不写入正式工作流状态。

正式 Pipeline Step 5 已使用同一图片客户端生成平台视觉背景。小红书封面优先使用 `publishPackages.xiaohongshu.coverVisualPrompt`，并为最多两个 `scene / landmark` 强视觉内页分别使用 `imagePrompt` 生图；其他平台仍每个平台最多生成一张图。图片模型不得生成文字、Logo、水印或 UI 文案，标题、正文、标签、按钮及平台 UI 始终由前端叠加。不接视频 API 和真实发布 API。

## 13. 验收标准

项目第一版完成时，应满足：

- 能从 Home 进入完整演示。
- 能从 Brief 启动 AI Content Pipeline。
- 能生成 Publish-ready Package，而不是只生成脚本。
- 能展示视觉素材生成或 Mock Visual Fallback。
- 能前端渲染小红书、Instagram、Push、Banner 预览。
- 能用关键帧、字幕和前端转场形成抖音 / TikTok 9:16 短视频预览。
- 能展示质量评分、优化建议和改写版本。
- 能演示批量内容矩阵。
- 能导出 Markdown / JSON / CSV。
- 能清楚对应 AI Coding 作品、自动化内容生成工作流和三个加分项。
