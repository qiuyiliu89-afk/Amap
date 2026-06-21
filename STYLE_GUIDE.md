# STYLE GUIDE: Amap AI Campaign Studio

## 2026-06-19 Update: Assets and Preview Product Structure

AssetsPage should read as a publishing package export workspace: Campaign overview first, then selected-platform packages. Xiaohongshu must use `pagePlan: { pageCount, pages }`, a separately generated official-brand editorial cover, and visually distinct page types: cover, scene, landmark, route, tips, feature, and cta. Strong visual pages use cinematic images; information pages use magazine-style frontend layout. Douyin remains finished-video-first, and Instagram remains lifestyle-carousel-first.

## 1. 设计依据

本文档严格基于 `00_PROJECT_CONTEXT.md`。视觉目标是“高级、有趣、有 AI 产品感”，不是普通后台，也不是普通 AI 文案生成器。项目必须通过 AI Content Pipeline、视觉素材、平台预览、质量评分和导出发布包，让用户感受到这是高德 AI 内容生成工作台。

## 2. 视觉关键词

- 深色科技背景
- 蓝绿色渐变光效
- 地图路线纹理
- 玻璃拟态卡片
- 手机竖屏内容预览
- 视频关键帧
- 内容资产卡片
- AI 内容生产流水线动画
- 平台预览组件
- 地图连接现实世界的概念表达

不得使用高德官方 Logo。可以使用文字 `Amap AI Campaign Studio`。

## 3. 设计原则

1. 信息密度要像内容创作工作台，不做营销式大 hero 页面。
2. 必须有视觉素材和平台预览，不能只展示生成文本。
3. 不同平台的预览形态必须不同，体现 AI Content Pipeline 的平台适配能力。
4. 页面要适合面试演示，重点状态和结果一眼可扫。
5. 不要过度设计，优先保证 Demo 完整、好看、能讲清楚。
6. 不暗示官方上线功能，不使用官方 Logo 或官方背书表达。
7. 不假装真实发布，只展示发布准备和导出发布包。

## 4. 色彩规范

建议色彩方向：

- 背景：深色科技底色，例如深蓝黑、近黑灰。
- 主光效：蓝绿色渐变，用于 AI Content Pipeline、路线连接、关键高亮。
- 强调色：少量橙色或暖色，用于 CTA、评分风险提示、重点状态。
- 信息色：中性蓝灰用于说明、表格、次级标签。
- 风险色：橙 / 红分级，用于风险等级或内容问题提示。

避免大面积单一色系，避免页面只剩深蓝或只剩蓝绿色。卡片圆角控制在 8px 左右。

## 5. 字体与信息层级

- 页面标题：突出当前模块，例如 Home、Brief、Pipeline、Assets、Preview、Batch、Bonus。
- 关键数字：质量评分、生成数量、平台数量、批量矩阵状态需要大号或高对比呈现。
- 说明文字：短句为主，避免长段教育用户。
- 平台标签：用清晰的文本或图标标签标识抖音、TikTok、小红书、Instagram、YouTube Shorts、Push、Banner。
- 英文内容预览要保留真实平台语感，尤其 TikTok 和 Instagram。

## 6. 页面结构

所有页面与顶部导航统一使用同一网页端容器：最大宽度 `1360px`，左右至少保留 `32px`。在常见 `1536px` 桌面视口下，两侧各保留约 `88px`。Brief 在桌面端保持主工作区与右侧实时摘要双栏布局。

产品页面正文和操作按钮以 `15-16px` 为主要阅读字号，辅助信息使用 `13px`，区块标题使用 `20-24px`，页面主标题控制在 `36-48px`。深色背景上的辅助文字需保持清晰对比，避免用过暗灰色承载关键字段。

### Home：首页

建议结构：

- 顶部：Amap AI Campaign Studio 名称和一句话介绍。
- 中部：AI Content Pipeline 流程展示。
- 下方：Publish-ready Package 产出范围。
- 操作区：开始生成、查看示例、查看加分项。

### Brief：Campaign Prompt Engine

建议结构：

- 左侧主工作区依次展示自然语言需求、Campaign Prompt Engine、Prompt Quality 和 Pipeline Input Summary。
- Prompt 使用大面积等宽字体编辑区，六个结构段落清晰可见，避免呈现为传统字段表单。
- Prompt 操作包含复制、重新生成、优化和设为 Pipeline 输入，并对每次操作提供反馈。
- Prompt Quality 使用六个独立评分条，突出优化前后的变化。
- Pipeline Input Summary 只保留目标平台、视觉素材、质量评分和输出数量等少量配置。
- 当自然语言需求明确提到目标平台时，在目标平台区域显示“识别到目标平台：...”的小提示，帮助面试演示时确认平台路由没有被默认多平台污染。
- 右侧信息栏展示 Prompt 状态、Pipeline Ready 状态、内容资产路由和九步 Pipeline Preview。
- 页面底部操作栏提供保存草稿和提交进入 Pipeline 两个明确动作。

### Pipeline：自动运行完整内容生产流水线

建议结构：

- 左侧是 AI 内容生产控制台，顶部显示总进度，下面纵向排列九个自动执行步骤。
- 每个步骤同时展示状态、说明和输出摘要；运行中使用蓝绿色 glow，完成后使用 check 状态。
- 右侧固定展示 Campaign Prompt 摘要、目标平台、Prompt Quality、内容资产清单和当前 Pipeline 状态。
- Pipeline 需要展示 Content Package 来源状态：`Ark Content Package mode`、`Ark repaired Content Package mode` 或 `Fallback Content Package mode`；同时单独显示 `API returned, JSON parse failed` 与 `API request failed` 等失败原因。页面底部 Debug 区只展示 source、fallback、错误信息、解析错误和原始响应前 2000 字符，不展示 API Key 或任何敏感配置。
- 完成后提供查看 Assets、查看 Preview 和返回 Prompt Engine 三个动作。

必须展示 Prompt 编译、内容策略生成、多平台内容生成、视觉 Prompt、视觉素材、平台预览渲染、质量评分、优化建议和导出发布包。

### Assets：多平台内容资产

建议结构：

- 顶部：Campaign Strategy 摘要。
- 中部：按平台展示资产卡片。
- 侧边或底部：质量评分、优化建议、改写版本。
- 操作区：复制、导出 Markdown、导出 JSON、导出 CSV、查看预览。

资产页必须遵循“成品优先，生产信息其次”：平台模块先展示视觉成品预览，再展示可直接复制发布的文案、标签、CTA 或评论引导；Prompt、storyboard、pagePlan、render hints 和 generation source 放入折叠区。

### Preview：平台视觉预览

建议结构：

- 平台切换 tabs。
- 抖音 / TikTok：9:16 手机短视频预览；抖音下方增加简洁的 AI 视频 Prompt 就绪提示，不显示内部技术字段。
- 小红书：官方品牌级动态图文预览，第一屏突出大封面，缩略图横向切页；封面、场景、地标、路线、功能、Tips、结尾页必须使用不同视觉结构。
- Instagram：Carousel 预览，顶部展示多页生活方式图片，下方展示可直接发布 caption 和 hashtags。
- Push：通知卡片预览。
- Banner：横幅预览。
- Prompt 面板：AI Video Prompt 和视觉素材来源。

### Batch：批量内容矩阵生成

建议结构：

- 示例数据入口或 CSV 导入占位。
- 多城市、多平台、多语言矩阵表。
- 状态标签：待生成、生成中、已完成、需优化、已导出。
- 批量导出按钮。

### Bonus：加分项说明

建议结构：

- 作业要求映射。
- 三个加分项映射。
- 轻量 Prompt Skill Pack 说明。
- API 和 Mock Fallback 说明。
- Publish-ready Package 示例说明。
- 开发环境可临时显示单图 API 测试卡，必须明确标注 Development Test，并完整展示 generating、API Generated 或错误状态；生产构建不显示该入口。

## 7. 组件规范

建议组件：

- `HomeOverview`
- `PipelineMap`
- `CampaignBriefForm`
- `PlatformSelector`
- `PipelineTimeline`
- `PipelineStepCard`
- `ContentAssetCard`
- `VisualAssetCard`
- `ScoreBreakdown`
- `RewriteSuggestionPanel`
- `PhoneVideoPreview`
- `CarouselPreview`
- `PushPreview`
- `BannerPreview`
- `ExportPackagePanel`
- `BatchMatrixTable`
- `BonusMappingPanel`

组件应具备明确状态：默认、选中、生成中、API 成功、Fallback、完成、警告、需要优化、已导出。

## 8. 内容资产卡片规范

内容资产卡片应包含：

- 平台
- 内容形态
- 核心 Hook 或标题
- 适配原因
- 关键输出
- 视觉素材状态
- 发布时间建议
- 质量评分
- 风险或注意事项
- 下一步动作

卡片不能只展示一段生成文本，必须说明平台适配逻辑和发布准备状态。

## 9. 视觉素材规范

视觉素材包括：

- 封面图
- 小红书轮播背景图
- Instagram Carousel 视觉素材
- 视频关键帧
- Banner 图

素材来源必须可见：

- API Generated：生图 API 成功生成。
- Visual draft fallback：生图 API 失败或没有可用图片 URL 时使用前端视觉草图。

Mock Visual Fallback 不能是空白图。小红书 fallback 应呈现水乡、桥、城市街区、地标或生活方式等场景化海报，不得退回低保真信息卡、虚线圆点路线或 UI 占位图形。

AI 生成图片只作为背景层。小红书标题与卡片正文、短视频 Hook 与字幕、Instagram Caption、Push / Banner 文案和 CTA 必须由前端组件叠加，不能依赖图片模型生成文字。图片 URL 加载失败时，组件自动露出同位置的 CSS / SVG 视觉草图，页面不得出现破图。

## 10. 预览组件规范

预览组件必须模拟平台使用场景：

- 竖屏短视频：9:16 手机框，主画面只保留首帧、强 Hook、字幕、少量平台互动按钮和标签。抖音 AI 视频生产包独立成段，五镜头时间轴按时间、画面、运镜、转场、后期叠字和口播组织，完整 Prompt 与 Negative Prompt 使用可复制代码区。
- 小红书：先展示大封面，再展示横向缩略图、生活化正文、话题标签与互动引导；强视觉页使用独立图片，信息页采用杂志排版，生产字段只进入折叠区。
- Instagram：Carousel 或 Reels 风格，展示多页生活方式视觉、可发布 Caption、Hashtags 和语言策略。
- Push：通知样式，标题和正文要短。
- Banner：横幅样式，主标题、副标题、视觉图和 CTA 清晰。
- AI Video Prompt：展示 Prompt 原文、场景元素和视觉可执行性评分。

TikTok / 抖音视频预览第一版不生成真实 MP4。它使用 AI 关键帧 + 字幕 + 前端转场动效形成 9:16 短视频预览；抖音生产包只声明“Prompt 已生成，可用于外部工具制作成片”。

## 11. 动效规范

动效服务于工作流理解：

- Pipeline 步骤推进可以有轻量进度动画。
- 视觉素材生成可以展示 API / Fallback 状态切换。
- 9:16 短视频预览可以使用关键帧切换、字幕浮现和轻量镜头推进。
- 平台预览切换要快速，不要拖慢演示。
- 不做喧宾夺主的装饰动效。

## 12. 文案语气

文案应符合高德 AI 内容创作场景：

- 可靠
- 聪明
- 轻松
- 有科技感
- 不硬广

禁止夸大 AI 能力，不写“万能”“绝对最强”“彻底解决所有问题”等表达。海外平台文案要注意本地化，TikTok 不默认用户知道中国节日或中国本地语境。

平台文风需要区分：

- 小红书：生活化、种草感、亲切，可适度使用 emoji 和自然分段。
- 抖音：短促、有节奏、强 Hook、像口播，适合前 3 秒抓人。
- Instagram：lifestyle、自然、轻松，英文或双语策略必须明确，不无策略混杂。
