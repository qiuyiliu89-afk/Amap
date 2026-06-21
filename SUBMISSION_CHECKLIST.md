# SUBMISSION CHECKLIST

## 1. 检查依据

本清单严格基于 `00_PROJECT_CONTEXT.md`。最终作业必须证明：Amap AI Campaign Studio 是一个面向高德 AI 内容生成场景的自动化工作台，核心能力是 AI Content Pipeline / AI 内容生产流水线，最终产出是 Publish-ready Package / 可发布内容包。

项目不得被讲成：

- 普通 AI 文案生成器
- 用户上传视频分析工具
- 只生成脚本和 Prompt 的工具
- 假装已经真实发布到社交平台的工具

## 2. 基础交付物

提交前确认以下内容已完成：

- [ ] 可运行 Web Demo
- [ ] GitHub / Gitee 代码仓库
- [ ] README
- [ ] PRD / 项目说明文档
- [ ] WORKFLOW / AI Content Pipeline 说明
- [ ] STYLE_GUIDE / 视觉与组件规范
- [ ] Demo 录屏
- [ ] 项目截图
- [ ] API 配置说明
- [ ] Mock Fallback 说明
- [ ] Publish-ready Package 导出示例
- [ ] 加分项对应说明

## 3. 作业要求覆盖

- [ ] 能展示 AI Coding 作品，而不是只有文档。
- [ ] 能展示用 Claude 或 Codex 制作的自动化做内容工作流。
- [ ] 能从 Campaign Brief 自动生成 Publish-ready Package。
- [ ] 能展示 AI Content Pipeline 运行过程，而不是只展示最终文案。
- [ ] 能说明 `/api/generate-content-package` 和 `/api/generate-visual-assets` 的 API 设计。
- [ ] 两个 API 都有 Mock Fallback。
- [ ] 能在没有真实 API 的情况下稳定演示。

## 4. Publish-ready Package 检查

可发布内容包应包含：

- [ ] 抖音 / TikTok 短视频脚本
- [ ] 抖音 `videoCreativePack`，包含 concept、五镜头 shotList、transitionPlan、overlayCopy、voiceover、subtitles、musicDirection、fullVideoPrompt、negativePrompt 和 copyReadyPrompt
- [ ] 9:16 短视频预览
- [ ] 视频关键帧
- [ ] 字幕
- [ ] 封面标题
- [ ] 小红书官方品牌级图文发布包，包含 5-9 页 `pagePlan.pageCount / pages`、独立封面和差异化页面视觉
- [ ] Instagram Carousel，包含多页生活方式预览、caption、hashtags 和语言策略
- [ ] Push 通知
- [ ] Banner 横幅
- [ ] Caption
- [ ] Hashtags
- [ ] 发布时间建议
- [ ] 质量评分
- [ ] 优化建议
- [ ] 改写版本
- [ ] Markdown / JSON / CSV 导出包

## 5. 三个加分项覆盖

### 加分项 1：类似高德地图官方抖音宣传视频的内容

- [ ] 内容逻辑体现“出行场景痛点 + AI 伴行能力 + 地图连接真实世界 + 科技感视觉表达”。
- [ ] 已参考 `public/references/amap_douyin_reference.mp4` 的地图触发、路线形态转场、实景大片、产品能力短暂植入和真实世界收束节奏，不复用具体素材、文案或 Logo。
- [ ] Visual Prompt 包含地图界面、用户点击地图、地图连接真实地标、城市地标、手机导航界面和真实出行场景。
- [ ] 有视频关键帧和 9:16 短视频预览。
- [ ] 项目没有做成用户上传视频分析工具。

### 加分项 2：熟悉海外媒体平台运营

- [ ] TikTok 输出英文口语化 Caption 和 Hashtags。
- [ ] Instagram 输出 Reels / Carousel、Caption、Hashtags、语言策略和视觉素材。
- [ ] YouTube Shorts 输出搜索友好标题和清楚的功能解释。
- [ ] 海外内容不默认用户知道中国节日或中国本地语境。
- [ ] 有海外本地化程度评分。

### 加分项 3：AI 批量自动化开发、模型训练等能力

- [ ] 有 Batch 批量内容矩阵生成页。
- [ ] 能展示多城市、多平台、多语言内容矩阵。
- [ ] 有轻量 Prompt Skill Pack 规则说明。
- [ ] 有质量评分和自动优化建议。
- [ ] 核心评分低于 4 分时能生成优化建议和改写版本。
- [ ] 有未来接入视频生成 API 的预留说明。

## 6. 视觉素材和平台预览检查

- [ ] 生图 API 成功时，可以展示封面图、轮播背景图、视频关键帧、Banner 图。
- [ ] 生图 API 失败时，可以使用 Mock Visual Fallback。
- [ ] Mock Visual Fallback 不是空白占位。
- [ ] 小红书图文是前端真实渲染的预览效果。
- [ ] 小红书封面为杂志海报或商业摄影方向，图片不生成文字、Logo、UI 或随机字母。
- [ ] 小红书强视觉页与路线、Tips、功能、CTA 信息页使用不同生成和排版策略。
- [ ] Instagram Carousel 是前端真实渲染的预览效果。
- [ ] Assets 页按“成品优先，生产信息其次”展示：先看视觉预览和可发布文案，再展开 Prompt、storyboard、pagePlan。
- [ ] 抖音资产页优先展示封面 / 首帧、Hook 标题、发布文案、字幕、标签和 CTA。
- [ ] 抖音资产页可复制完整视频 Prompt、Negative Prompt、五镜头分镜和全部视频生产包。
- [ ] Push 是前端真实渲染的通知预览。
- [ ] Banner 是前端真实渲染的横幅预览。
- [ ] TikTok / 抖音第一版不生成真实 MP4，而是使用 AI 关键帧 + 字幕 + 前端转场动效形成 9:16 短视频预览。
- [ ] Preview 只提示 AI 视频 Prompt 已生成，不声称已经完成真实成片。

## 7. 页面结构检查

- [ ] Home：首页，展示项目定位和核心流程。
- [ ] Brief：输入 Campaign Brief。
- [ ] Pipeline：自动运行完整内容生产流水线。
- [ ] Assets：展示多平台内容资产、评分、优化建议和导出。
- [ ] Preview：展示平台视觉预览。
- [ ] Batch：批量内容矩阵生成。
- [ ] Bonus：说明作业要求和加分项对应。

## 8. 质量评分检查

评分维度必须包括：

- [ ] Hook 强度
- [ ] 平台适配度
- [ ] 高德品牌一致性
- [ ] 用户痛点清晰度
- [ ] 视觉可执行性
- [ ] 海外本地化程度
- [ ] 内容新鲜感
- [ ] 风险等级

如果核心评分低于 4 分：

- [ ] 生成优化建议。
- [ ] 生成改写版本。
- [ ] 标明需要优化的平台和原因。

## 9. 产品方向检查

- [ ] 页面没有写成普通 AI 文案生成器。
- [ ] 页面没有用户上传视频入口。
- [ ] 页面没有只停留在脚本和 Prompt。
- [ ] 页面没有假装真实发布到社交平台。
- [ ] 页面明确体现高德 AI 内容生成 / 内容资产场景。
- [ ] 页面明确体现 AI Content Pipeline。
- [ ] 页面明确体现 Publish-ready Package。
- [ ] 页面明确体现多平台内容形态差异。
- [ ] 页面有视觉素材和平台预览。
- [ ] 页面有 Mock Fallback。
- [ ] 页面没有使用高德官方 Logo。
- [ ] 页面没有暗示这是官方上线功能。

## 10. Demo 录屏检查

录屏建议顺序：

1. 项目一句话介绍。
2. 说明项目不是上传视频分析工具，而是高德 AI 内容生成工作台。
3. 展示 Home 的 AI Content Pipeline。
4. 输入或选择 Campaign Brief。
5. 展示 Pipeline 自动执行。
6. 展示 Assets 的 Publish-ready Package。
7. 展示 Preview 的平台视觉预览。
8. 展示质量评分、优化建议和改写版本。
9. 展示 Batch 批量内容矩阵。
10. 展示 Bonus 加分项覆盖。

## 11. 文档一致性检查

- [ ] `00_PROJECT_CONTEXT.md` 是唯一总上下文。
- [ ] `README.md` 说明项目定位、运行方式和提交方式。
- [ ] `PRD.md` 说明产品方案。
- [ ] `WORKFLOW.md` 说明 AI Content Pipeline。
- [ ] `STYLE_GUIDE.md` 说明视觉风格和组件规范。
- [ ] 所有文档都引用并遵守 `00_PROJECT_CONTEXT.md` 的核心判断。

## 12. 最终讲解要点

最终提交时要讲清楚：

- 为什么做：AI 产品实习岗位作业需要 AI Coding 作品和自动化内容生成工作流。
- 做了什么：面向高德 AI 内容生成场景的自动化工作台。
- 核心能力是什么：AI Content Pipeline / AI 内容生产流水线。
- 最终产出是什么：Publish-ready Package / 可发布内容包。
- 怎么演示：Home、Brief、Pipeline、Assets、Preview、Batch、Bonus。
- 体现什么能力：产品抽象、内容创作理解、海外平台适配、视觉素材生成、AI 自动化工作流设计、Demo 开发和稳定演示能力。
