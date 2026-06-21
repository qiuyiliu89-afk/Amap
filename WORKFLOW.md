# WORKFLOW: AI Content Pipeline

## 2026-06-21 Update: Render Async Text Jobs and Image URL Compatibility

Long Ark text generations no longer depend on one browser-to-Render connection remaining open until completion. The frontend starts an asynchronous Render job with the existing `/api/ark-response` endpoint, receives a `jobId`, and polls `/api/ark-response?job=...` until the Ark result is ready. Jobs remain in Render memory for ten minutes. This prevents long Content Package requests from ending as red `0 B` browser requests when an intermediary closes the original connection.

Render image responses use the camelCase field `imageUrl`. The browser image client now accepts `imageUrl` in addition to Ark-compatible `url` and `image_url`, so a successful Render `200` image response is no longer mislabeled as a visual fallback.

Pipeline state includes a runtime version. After this deployment, a browser holding an older completed fallback run automatically executes the Pipeline once with the new async transport instead of continuing to display stale localStorage output.

Content Package generation now has a compact regeneration pass. If the first Ark JSON and JSON repair both fail parsing or minimum usability checks, the frontend asks Ark for a smaller schema without `publishPackages`; the normalizer then reconstructs publish-ready packages locally. Successful compact regeneration is labeled `ark-content-regenerated` instead of fallback.

## 2026-06-21 Update: Campaign Prompt Completeness Guard

Campaign Prompt generation now requires all six sections to appear in order with usable content: `Role`, `Campaign Context`, `Content Tasks`, `Visual Tasks`, `Quality Criteria`, and `Output Format`. The Ark output budget is increased to avoid truncating the structured result. If JSON repair still produces a partial Prompt, the app sends the original requirement and platform configuration back to Ark for one complete regeneration and labels that result `ark-regenerated`. Only when generation, repair, and regeneration all fail does the app use the complete local Prompt fallback.

When BriefPage loads an older generated Prompt from browser storage, it applies the same six-section validation. Legacy partial results are removed automatically while preserving the raw requirement, so a redeployed frontend cannot keep showing a previously cached half Prompt.

Content Package success now also requires a non-empty `campaignStrategy`, usable assets for every selected platform, and non-empty `visualPrompts`. An empty or severely partial Ark object can no longer be filled entirely with mock defaults and mislabeled as an Ark success.

## 2026-06-21 Update: Repaired JSON Debug State

Content Package generation now treats `ark-content-repaired` as a successful usable result instead of persisting the original parse error as an active error. The debug panel displays a parse diagnostic for repaired legacy results, while new repaired results keep `fallback=false` and no blocking `parseError`. Content Package requests also use a lower generation temperature to reduce malformed JSON.

## 2026-06-21 Update: Netlify Function API Boundary

Browser code no longer reads `VITE_ARK_API_KEY` or directly calls Ark. Text generation requests go through `/.netlify/functions/ark-response`, and image generation requests go through `/.netlify/functions/ark-image`. Netlify Functions read server-only `ARK_*` environment variables with the Functions scope, call Ark, and return only generated text or image URLs to the frontend. If either function is missing, misconfigured, timed out, or rejected by Ark, the existing mock content and Mock Visual Fallback paths still keep the demo runnable.

## 2026-06-21 Update: Render Backend Option

To avoid Netlify Function 504 timeouts during long Ark generation, the project also includes `server/render-ark-server.mjs`. It exposes `/health`, `/api/ark-response`, and `/api/ark-image` as a Render Web Service. The frontend prefers `VITE_ARK_RESPONSE_API_URL` and `VITE_ARK_IMAGE_API_URL` when present, then falls back to the Netlify Function endpoints. Render owns all server-only `ARK_*` secrets and can be deployed independently from the Netlify static frontend.

Render image requests are serialized and retried on Ark rate-limit responses. `ARK_RETRY_ATTEMPTS`, `ARK_RETRY_BASE_DELAY_MS`, and `ARK_IMAGE_REQUEST_GAP_MS` can tune retry count, backoff, and spacing between image requests. The frontend also spaces visual asset requests to avoid sending multiple image generations at once.

Render text requests keep the HTTP connection alive during long Ark calls and wrap Ark failures as JSON so the browser can read the real error body. When Ark returns a 400 caused by optional compatibility fields, the Render backend retries the same request without `thinking`, then without both `response_format` and `thinking` before falling back to mock content. The frontend also recognizes wrapped `{ ok: false }` responses so existing JSON-format and thinking fallback paths still work when Render returns HTTP 200 for keepalive reasons.

## 2026-06-19 Update: Publish Package Normalization

Content Package normalization now supplements `publishPackages` when Ark JSON is parseable but missing publish-ready fields. `publishPackages.xiaohongshu` contains dynamic 5-9 page planning, title, cover copy, post text, carousel pages, hashtags, comment guide, and copy-ready text. `pagePlan` uses `{ pageCount, pages }`, and each page contains `pageType / title / subtitle / visualStyle / imagePrompt / overlayText / bodyText`. AssetsPage and PreviewPage prefer `publishPackages` and fall back to `platformAssets` only for compatibility.

## 1. 流程依据

本文档严格基于 `00_PROJECT_CONTEXT.md`。核心判断是：Amap AI Campaign Studio 要自动化高德 AI 内容生成的生产过程，最终输出 Publish-ready Package，而不是分析用户上传视频、生成普通文案、只生成脚本和 Prompt，或假装已经发布到社交平台。

## 2. 工作流总览

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

## 3. 输入：Campaign Prompt Engine

输入分为三层：

1. Raw Requirement：创作者用自然语言描述目标、受众、市场、平台、内容与视觉方向。
2. Campaign Prompt：系统将需求编译成包含 Role、Campaign Context、Content Tasks、Visual Tasks、Quality Criteria 和 Output Format 的专业 Prompt。
3. Pipeline Input：确认当前 Prompt，并附带目标平台、视觉素材开关、质量评分开关和每平台输出数量。

平台识别规则：如果 Raw Requirement 中明确出现目标平台，先解析出 resolvedPlatforms，再生成 Campaign Prompt 和 Pipeline Input。resolvedPlatforms 会覆盖默认 UI 平台选择；如果用户在识别后手动修改平台选择，则以后续手动选择为准。`amap_pipeline_input.platforms` 与 `amap_pipeline_input.selectedPlatforms` 必须保存 resolvedPlatforms，避免旧 localStorage 默认多平台污染后续测试。

Prompt 可以复制、编辑、重新生成和优化。Prompt Quality 用六个维度评估其是否足以稳定驱动后续 Pipeline。

## 4. Step 1: Prompt 编译

Pipeline 读取已确认的 Campaign Prompt，将 Role、Campaign Context、平台内容任务、视觉任务、质量约束和输出格式编译为后续步骤可消费的结构化输入。第一版使用本地 Mock Prompt Engine，后续可以替换为文本大模型 API，但保持相同的数据契约。

## 5. Step 2: AI 生成内容策略

Pipeline 第 2 步调用 `generateContentPackageWithArk(pipelineInput)`，使用火山方舟文本大模型从已确认的 Campaign Prompt 生成完整 Content Package。该步骤只调用文本模型 API，不调用生图 API、视频 API 或真实平台发布 API。主生成与 Ark JSON 修复请求优先启用 `response_format: { type: "json_object" }` 约束合法 JSON；如果当前模型或端点明确不支持该参数，则自动退回普通文本输出，并继续使用现有解析、修复与 fallback 链路。请求通过 Responses API 的 SSE 流持续接收 `response.output_text.delta`；连续 60 秒没有流活动才超时。输出预算按平台复杂度动态设置，最高 6500 tokens。短视频时长优先识别原始需求中的秒数或分钟数；未指定时，宣传视频默认 60s，并生成覆盖完整时长的脚本、storyboard 与 6-10 镜头 shotList。抖音选择时允许模型输出完整 `videoCreativePack`，缺失字段由前端根据原始需求、抖音发布包、shotList、visualPrompts 和 renderHints 补齐。JSON 修复请求使用最高 3200 tokens 的紧凑预算。

Ark 返回后先使用 `safeParseJSONFromLLM` 解析纯 JSON、```json 代码块或首尾花括号之间的 JSON。只要 JSON 可以解析，即使缺少部分字段，也由 `normalizeContentPackage` 使用平台范围内的默认字段补齐，不直接 fallback。首次解析失败时，系统先执行本地 JSON repair pass，修复尾逗号、漏逗号、未闭合对象 / 数组、字符串中的未转义英文引号和原始换行；本地仍无法解析时，再调用一次 `repairContentPackageJSON`。repair 不逐字重写整包，而是删除截断字段并返回可归一化的紧凑部分 JSON。任一修复成功时来源标记为 `ark-content-repaired`。只有请求失败或本地 / Ark 双重修复后仍无法解析时才使用本地 mock Content Package fallback，并继续执行后续步骤，保证 Pipeline 跑完 9/9。

Content Package 调试状态只保存并展示 `source`、`fallback`、`errorMessage`、`parseError` 和模型原始响应前 2000 字符，不展示 API Key。状态区分为 `ark-content-success`、`ark-content-repaired`、`ark-content-parse-failed`、`ark-content-request-failed` 和 `fallback`。生成约束为：小红书通过 `pagePlan.pageCount` 和 `pagePlan.pages` 动态生成 5-9 页，封面独立为品牌海报，`scene / landmark` 使用强视觉生图，`route / tips / feature / cta` 使用前端杂志排版；每个平台提供 3 个标题候选、2 个 Hook 候选和 1 个可直接发布文案。

PipelinePage 发现 localStorage 中仍是旧版 Content Package 状态名时会自动重跑一次，避免历史 fallback 结果阻止新版 Ark 链路验证；新版状态不会因普通刷新而重复请求。如果当前结果因请求失败或解析失败使用 fallback，完成区会显示“重新请求 Ark”按钮，用户可以保留原 Pipeline Input 直接发起新一轮请求。

策略至少包含：

- Campaign 主张
- 目标用户洞察
- 核心痛点
- AI 能力映射
- 平台分发策略
- 视觉表达方向
- 本地化注意事项
- 风险和合规边界

品牌规则来自轻量 Prompt Skill Pack：

- 高德是 AI 出行助手，不只是地图工具。
- 核心关键词：AI 伴行、地图连接真实世界、路线规划、城市探索、出行搭子。
- 语气：可靠、聪明、轻松、有科技感，不要硬广。
- 禁止夸大：不要说万能、绝对最强、彻底解决所有问题。

## 6. Step 3: AI 生成多平台内容

系统根据平台规则决定内容形态：

| 平台 | 生成内容 |
| --- | --- |
| 抖音 | 视频封面 / 首帧、标题与 Hook 候选、发布文案、字幕、CTA、五镜头 Video Creative Pack、转场计划、完整视频 Prompt、Negative Prompt、Hashtags |
| TikTok | 英文 Hook、视频脚本、Caption、Hashtags、字幕、封面标题 |
| YouTube Shorts | 搜索友好标题、短视频脚本、字幕、描述、Hashtags |
| 小红书 | 官方品牌级图文、`pagePlan.pageCount`、`pagePlan.pages`、封面独立 Prompt、5-9 页差异化轮播、话题标签、评论区互动引导 |
| Instagram | Reels 脚本、Carousel 每页文案、可发布 Caption、Hashtags、语言策略 |
| Push | Push 标题、Push 正文、CTA、A/B 测试版本 |
| Banner | Banner 主标题、Banner 副标题、CTA、A/B 测试版本 |

该步骤必须防止“所有平台都生成视频”。

平台内容资产来自 Step 2 生成的同一个 Content Package。后续步骤不得重新扩展平台：`selectedPlatforms = ["xiaohongshu"]` 时，只允许存在 `platformAssets.xiaohongshu`；包含 TikTok 才允许存在 `platformAssets.tiktok`；包含 Instagram 才允许存在 `platformAssets.instagram`；包含 Push / Banner 才允许存在 `platformAssets.pushBanner`。

## 7. Step 4: AI 生成视觉 Prompt

视觉 Prompt 必须体现高德 AI 宣传内容的表达方式：

- 地图界面
- 用户点击地图
- 地图展开 / 连接真实地标
- 城市地标出现
- 手机导航界面
- 真实出行场景
- 高德 AI 伴行概念收束

不同资产需要不同视觉 Prompt：

- 封面图 Prompt
- 小红书轮播背景图 Prompt
- Instagram Carousel 视觉 Prompt
- 视频关键帧 Prompt
- Banner 图 Prompt

## 8. Step 5: 生图 API 或 Mock Visual Fallback 生成视觉素材

如果接入 `/api/generate-visual-assets`，可以真实生成：

- 封面图
- 轮播背景图
- 视频关键帧
- Banner 图

如果生图 API 失败，使用 Mock Visual Fallback：

- 本地 mock 图片
- 前端生成的地图路线视觉
- 渐变光效背景
- 预设城市地标素材占位
- 预设手机导航界面占位

Mock Visual Fallback 不能是空白占位，必须能支撑平台预览演示。

正式实现由 `generateVisualAssetsFromContentPackage(contentPackage, selectedPlatforms)` 完成，绝不直接使用 `campaignPrompt.promptText` 生图：

- 小红书优先使用 `publishPackages.xiaohongshu.coverVisualPrompt` 生成 `xiaohongshuCover`；再选取最多两个 `scene / landmark` 页面，使用各自 `imagePrompt` 生成 `xiaohongshuPageVisuals`。
- TikTok / 抖音使用 `videoKeyframePrompts[0]`，生成共享的 `verticalVideoKeyframe`。
- Instagram 使用 `instagramCarouselPrompt`，生成 `instagramCarouselCover`。
- Push / Banner 使用 `bannerPrompt`，生成 `bannerVisual`。
- 对应 visualPrompt 缺失时，才根据 `renderHints + platformAssets` 补充视觉语义。
- 除小红书外每个平台最多生成一张图；小红书生成独立封面和最多两个强视觉内页，多个任务并行请求以控制总等待时间。
- 调用前会清理 Prompt 中对文字、Logo、标题等内容的正向要求，并追加 `no text, no typography, no logo, no watermark, no UI text, background visual only` 等硬约束。
- 单项失败只把该项标记为 `fallback` 并保留前端视觉草图；整体状态为 `success`、`partial` 或 `fallback`，Pipeline 始终继续执行。

结果保存到 `amap_visual_assets`，结构包含 `source: "ark-image"`、整体状态、生成时间和按平台命名的 assets。Step 5 摘要分别显示 `AI image generated`、`AI image partially generated` 或 `Fallback visual draft`。

## 9. Step 6: 前端渲染平台预览

预览实现方式：

- 小红书图文、Instagram Carousel、Push、Banner 是前端真实渲染的预览效果。
- 小红书预览先展示图片流，再展示可复制标题、正文、话题标签和评论引导；`pagePlan`、视觉 Prompt、render hints 放在生产信息折叠区。
- Instagram Carousel 顶部展示多页生活方式图片，下方展示可直接发布的 caption 和 hashtags，并明确英文 / 双语策略。
- TikTok / 抖音视频预览第一版不生成真实 MP4。抖音 Assets 页新增明显的“AI 视频生产包”，依次展示创意、风格、五镜头时间轴、转场、口播字幕、完整 Prompt、Negative Prompt 和复制操作；Preview 页明确提示 Prompt 可用于外部视频 AI 工具制作成片。
- 后续可接入视频生成 API 输出完整视频文件。

预览类型：

- 抖音 / TikTok：9:16 手机短视频预览。
- 小红书：图文轮播预览。
- Instagram：Carousel 或 Reels 风格预览。
- Push：通知卡片预览。
- Banner：横幅预览。
- AI Video Prompt：Prompt 和关键帧预览。

## 10. Step 7: AI 质量评分

评分维度：

- Hook 强度
- 平台适配度
- 高德品牌一致性
- 用户痛点清晰度
- 视觉可执行性
- 海外本地化程度
- 内容新鲜感
- 风险等级

评分结果需要展示：

- 总分
- 各维度分
- 主要扣分项
- 风险等级
- 是否需要改写

## 11. Step 8: AI 优化建议

如果核心评分低于 4 分，需要生成：

- 优化建议
- 改写版本
- 改写原因
- 影响的平台
- 预计提升的评分维度

优化建议应指出具体问题，例如 Hook 不够强、平台语气不匹配、海外用户理解成本高、视觉 Prompt 不可执行、品牌表达过硬广等。

## 12. Step 9: 发布准备

发布准备不等于真实发布。系统只准备可导出的发布包，不调用真实平台发布接口。

发布准备包括：

- 标准化平台字段
- 整理 Caption 和 Hashtags
- 生成发布时间建议
- 标记视觉素材来源：API 生成或 Mock Visual Fallback
- 标记内容评分和改写状态
- 整理导出文件结构

## 13. Step 10: 导出发布包

导出 Publish-ready Package：

- Markdown：适合人工查看和面试展示。
- JSON：适合开发联调和结构化读取。
- CSV：适合批量内容矩阵和运营排期。

导出内容包括：

- 抖音 / TikTok 短视频脚本
- 9:16 短视频预览配置
- 视频关键帧
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
- 优化建议
- 改写版本

## 14. API 方案

### `/api/generate-content-package`

文本大模型 API，输入 Campaign Brief，输出结构化内容包。失败时使用本地 Content Package Mock Fallback。

线上 Netlify 部署时，前端通过 `/.netlify/functions/ark-response` 请求服务端函数，函数读取 `ARK_API_KEY`、`ARK_BASE_URL` 和 `ARK_MODEL` 后调用火山方舟 Responses API；如果部署环境中已经使用 `ARK_TEXT_MODEL`，函数也会兼容读取。浏览器端只保留 `VITE_ARK_RESPONSE_FUNCTION_URL` 这类非密钥配置，不再暴露真实 API Key。

如果使用 Render 后端，则前端通过 `VITE_ARK_RESPONSE_API_URL` 指向 `https://<render-service>.onrender.com/api/ark-response`，不再走 Netlify Function。Render 后端启动命令为 `npm run render:start`，读取同一组 server-only `ARK_*` 变量。

### `/api/generate-visual-assets`

生图 API，输入视觉 Prompt，输出封面图、轮播背景图、视频关键帧和 Banner 图。失败时使用 Mock Visual Fallback。

线上 Netlify 部署时，前端通过 `/.netlify/functions/ark-image` 请求服务端函数，函数读取 `ARK_API_KEY`、`ARK_BASE_URL`、`ARK_IMAGE_MODEL`、`ARK_IMAGE_SIZE` 和 `ARK_IMAGE_RESPONSE_FORMAT` 后调用火山方舟图片 API。单项图片生成失败时仍按原规则标记为 fallback，不阻塞 Pipeline。

如果使用 Render 后端，则前端通过 `VITE_ARK_IMAGE_API_URL` 指向 `https://<render-service>.onrender.com/api/ark-image`。

两个 API 都必须有 fallback，保证演示稳定。

开发环境仍可使用 `generateImageWithArk(prompt)` 与 `testImageGeneration()` 单独验证火山方舟 `POST /images/generations`。临时入口位于 BonusPage，只测试一张小红书封面并展示 generating、成功图片或错误原因；该独立测试不写入 Pipeline 状态，也不影响文本模型请求。正式工作流则由 Step 5 调用同一图片客户端。

### 第一版本地演示闭环

- Brief 使用本地 Mock Prompt Engine 将自然语言需求编译为 Campaign Prompt，并支持重新生成与优化。
- 提交 Prompt 后，Pipeline 只读取 `amap_pipeline_input`，不读取旧 Campaign Brief。
- `runPromptPipeline` 以约 700ms 间隔自动执行 Prompt 编译、Ark Content Package 生成、平台内容拆分、视觉 Prompt、前端视觉草图、预览数据、质量评分、优化建议和导出九个步骤。
- Pipeline 持续更新 waiting、running、done 状态和输出摘要；完成时保存 `amap_content_package`、`amap_visual_assets`、`amap_pipeline_status` 和 `amap_export_package`。
- `amap_pipeline_status` 至少保存 `completed: true`、`stepsCompleted: 9`、`source`、`fallback`、`contentPackageStatus` 和 `generatedAt`。`source` 为 `ark-content-success`、`ark-content-repaired` 或 `fallback`；失败原因由 `contentPackageStatus` 单独记录。
- Assets 与 Preview 只读取当前 Campaign 的已保存结果，并按照已选平台显示对应内容形态。
- Markdown、JSON、CSV 按钮会下载当前发布包，不使用固定示例结果。

## 15. Batch Generation

批量生成支持：

- 示例城市数据
- 示例平台组合
- 多语言配置
- CSV 导入预留
- Markdown / JSON / CSV 导出

矩阵字段建议：

- 城市
- 市场
- 语言
- 平台
- 内容形态
- Hook / 标题
- Caption / 正文
- 视觉素材状态
- Score
- Rewrite Suggestion
- 发布时间建议
- 导出状态

## 16. 演示顺序

建议面试演示顺序：

1. 说明项目不是上传视频分析工具，而是高德 AI 内容生成工作台。
2. 进入 Home，说明 AI Content Pipeline。
3. 在 Brief 输入或选择一个 Campaign Brief。
4. 展示 Pipeline 自动执行。
5. 展示 Assets 中的 Publish-ready Package。
6. 展示 Preview 中的平台视觉预览。
7. 展示质量评分、优化建议和改写版本。
8. 展示 Batch 批量内容矩阵。
9. 展示 Bonus 页面，说明作业要求和加分项覆盖情况。
