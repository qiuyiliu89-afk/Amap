# Amap AI Campaign Studio 项目总上下文

本文档是本项目后续所有 README、PRD、WORKFLOW、页面设计和代码开发的唯一依据。所有页面、文档、数据结构、交互流程和演示内容都必须围绕本文档展开，不得偏离为普通 AI 文案生成器、用户上传视频分析工具、只生成脚本和 Prompt 的工具，或假装已经真实发布到社交平台的工具。

## 2026-06-19 表述更新：多平台内容生成体验

对外页面和 Demo 讲述中，尽量使用“内容生成”“内容创作”“内容资产”“AI Creative Workflow”等自然表达，减少高频出现“内容运营”。项目仍然围绕高德 AI 出行场景、多平台内容资产生成、视觉预览和 Publish-ready Package 展开。

## 2026-06-19 小红书升级：官方品牌级图文发布包

小红书输出不再以功能卡片、流程图或低保真路线示意图为视觉目标，而是生成官方品牌号质感的图文发布包。系统根据主题动态规划 5-9 页，区分封面、场景、地标等强视觉页，以及路线、Tips、功能、收藏引导等信息排版页。封面必须独立生成，优先采用杂志风旅行海报、节日营销视觉、商业摄影或精致插画，图片模型只生成背景和主体，标题、副标题、品牌文字和标签由前端清晰叠加。地图路线只作为克制的品牌线索，不能成为简陋圆点、虚线或 UI 占位图形的集合。

## 2026-06-20 抖音升级：AI 视频生产包

第一版仍不接真实视频生成 API，也不声称已经生成 MP4。抖音 Publish-ready Package 新增 `videoCreativePack`，输出视频创意、风格方向、五镜头分镜、转场计划、后期叠字、口播、字幕、音乐方向、完整视频 Prompt、Negative Prompt 和可复制生产 Prompt，可直接交给可灵、即梦、Runway、Pika 等视频 AI 工具继续制作。镜头语言以“地图或收藏点触发路线 → 路线光效自然变成真实场景 → 目的地大片 → 产品能力融入动作 → 人物出发”展开，强调官方品牌广告感、丝滑转场和地图连接真实世界，不复用参考视频的具体画面、文案、Logo 或素材。

## 一、项目背景

我正在应聘 AI 产品实习岗位，需要提交一个 AI Coding 作品和一个自动化内容生成工作流。作业要求是：

1. 如果有自己用 AI Coding 做的作品，可以提交偏技术类 coding 作品。
2. 同时需要做一个用 Claude 或 Codex 制作的“自动化做内容”的工作流。
3. 加分项包括：
   - 能用 AI 做类似高德地图官方抖音宣传视频的内容；
   - 熟悉海外媒体平台运营；
   - 擅长基于内容运营需求做 AI 批量自动化开发、模型训练等。

因此，本项目不能只是普通 AI 文案生成器，也不能只是普通网页 Demo，而应该是一个结合 AI Coding、内容运营、海外平台、多平台内容生产、视觉素材生成、平台预览和高德 AI 宣传场景的完整作品。

## 二、项目名称

英文名：

Amap AI Campaign Studio

中文名：

高德 AI 内容运营自动化工作台

项目核心能力：

AI Content Pipeline / AI 内容生产流水线

## 三、项目定位

这是一个面向高德 AI 内容运营场景的内部自动化工作台 Demo。

目标用户不是普通 C 端用户，而是：

- 高德 AI 内容运营同学
- 海外媒体运营同学
- 品牌内容策划同学
- AI 产品运营实习生
- 短视频 / 图文内容运营同学

运营人员先输入自然语言内容运营需求，Campaign Prompt Engine 将需求编译成可查看、复制、编辑和优化的高质量 Campaign Prompt。该 Prompt 是驱动 AI Content Pipeline 的核心中间层，不是最终产物。Pipeline 再自动生成 Publish-ready Package，可发布内容包，包括：

- 抖音 / TikTok 短视频脚本
- 9:16 短视频预览
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
- Markdown / JSON / CSV 导出包

## 四、重要理解：不要做成“用户上传视频分析工具”

高德官方抖音视频只是本项目的风格参考和内容样例，不是用户上传入口。

正确理解是：

官方视频用于拆解高德 AI 宣传内容的表达方式，例如：

- 地图界面
- 用户点击地图
- 地图展开 / 连接真实地标
- 城市地标出现
- 手机导航界面
- 真实出行场景
- 高德 AI 伴行概念收束

它代表的内容逻辑是：

“出行场景痛点 + AI 伴行能力 + 地图连接真实世界 + 科技感视觉表达”。

本项目要把这种内容生产方法自动化，而不是让用户上传视频。

## 五、核心产品思路

本项目不是单纯生成一个视频，也不是只生成脚本和 Prompt，而是通过 AI Content Pipeline 生成一套可预览、可评分、可优化、可导出的 Publish-ready Package。

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

## 六、为什么不是所有平台都生成视频

不同平台内容形态不同：

1. 抖音 / TikTok / YouTube Shorts

适合生成：

- 3 秒 Hook
- 需求驱动的视频脚本；需求未指定时长时，宣传视频默认 60s
- 分镜表
- 字幕
- 旁白
- AI 视频 Prompt
- 视频关键帧
- 9:16 短视频预览
- 封面标题
- Hashtags

2. 小红书

适合生成：

- 图文笔记
- 封面标题
- 正文
- 5-7 页图文轮播卡片
- 每页配图 Prompt
- 轮播背景图
- 话题标签
- 评论区互动引导

3. Instagram

适合生成：

- Reels 脚本
- Carousel 每页文案
- Carousel 视觉素材
- Caption
- Hashtags
- 图片 Prompt

4. Push / Banner

适合生成：

- Push 标题
- Push 正文
- Banner 主标题
- Banner 副标题
- Banner 图
- CTA
- A/B 测试版本

因此，本项目需要设计内容形态路由逻辑，而不是所有平台都输出同一种内容。

## 七、核心功能模块

### 1. Home：首页

展示项目定位、AI Content Pipeline 核心流程、作业要求和演示入口。

### 2. Brief：Campaign Prompt Engine

用户输入自然语言内容运营需求，系统生成包含 Role、Campaign Context、Content Tasks、Visual Tasks、Quality Criteria 和 Output Format 的专业 Campaign Prompt。用户可以复制、编辑、重新生成和优化 Prompt，并查看 Prompt Quality。页面只保留目标平台、视觉素材、质量评分和每平台输出数量等少量 Pipeline 配置。

### 3. Pipeline：自动运行完整内容生产流水线

展示自动化内容生成流程：

- Prompt 编译
- AI 生成内容策略
- AI 生成多平台内容
- AI 生成视觉 Prompt
- 生图 API 或 Mock Visual Fallback 生成视觉素材
- 前端渲染平台预览
- AI 质量评分
- AI 优化建议
- 导出发布包

### 4. Assets：展示多平台内容资产、评分、优化建议和导出

展示 Publish-ready Package：

- 抖音 / TikTok 短视频脚本
- 9:16 短视频预览所需的关键帧与字幕
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

### 5. Preview：展示平台视觉预览

用视觉化方式展示：

- 抖音 / TikTok 9:16 短视频预览
- 小红书图文轮播预览
- Instagram Carousel 预览
- Push 通知预览
- Banner 横幅预览
- AI Video Prompt 预览
- Mock Visual Fallback 视觉素材占位

### 6. Batch：批量内容矩阵生成

支持 CSV 或示例数据批量生成多城市、多平台、多语言内容矩阵，并可导出 Markdown / JSON / CSV。

### 7. Bonus：说明作业要求和加分项对应

明确说明项目如何对应：

- AI Coding 作品
- 自动化内容生成工作流
- 高德官方 AI 宣传视频类内容
- 海外媒体平台运营
- AI 批量自动化开发
- 轻量 Prompt Skill Pack

## 八、轻量 Prompt Skill Pack

我不具备从零开发复杂 skill 插件的能力，所以本项目采用轻量 Prompt Skill Pack。

它不是复杂插件，而是项目内部的规则文件和 Prompt 模板，用于提升生成质量。

需要包括：

### 1. 高德品牌风格规则

- 高德是 AI 出行助手，不只是地图工具
- 核心关键词：AI 伴行、地图连接真实世界、路线规划、城市探索、出行搭子
- 语气：可靠、聪明、轻松、有科技感，不要硬广
- 禁止夸大：不要说万能、绝对最强、彻底解决所有问题

### 2. 平台内容规则

- 抖音：强 Hook、快节奏、短视频
- TikTok：英文口语化、适合海外用户，不默认知道中国节日
- 小红书：攻略感、清单感、收藏价值、图文轮播
- Instagram：视觉感、生活方式、Reels / Carousel
- YouTube Shorts：搜索友好标题、功能解释清楚
- Push / Banner：短转化文案、CTA、A/B 测试

### 3. 内容形态路由规则

根据平台自动决定生成短视频、图文、轮播、Push 或 Banner，并决定需要哪些视觉素材。

### 4. 内容评分规则

评分维度：

- Hook 强度
- 平台适配度
- 高德品牌一致性
- 用户痛点清晰度
- 视觉可执行性
- 海外本地化程度
- 内容新鲜感
- 风险等级

如果核心评分低于 4 分，需要生成优化建议和改写版本。

## 九、视觉素材和平台预览原则

生成视觉素材：

- 如果接入生图 API，则可以真实生成封面图、轮播背景图、视频关键帧、Banner 图。
- 如果生图 API 失败，则使用 Mock Visual Fallback。
- Mock Visual Fallback 必须是高质量示例素材或前端可渲染视觉占位，不能是空白占位。

渲染平台预览：

- 小红书图文、Instagram Carousel、Push、Banner 是前端真实渲染的预览效果。
- TikTok / 抖音视频预览第一版不生成真实 MP4，而是使用 AI 关键帧 + 字幕 + 前端转场动效形成 9:16 短视频预览。
- 后续可接入视频生成 API 输出完整视频文件。

## 十、API 设计原则

第一版建议接入两个 API，并且都必须有 Mock Fallback，保证演示稳定。

### 1. `/api/generate-content-package`

文本大模型 API，用于生成结构化内容包：

- 内容策略
- 多平台内容
- 短视频脚本
- 小红书图文卡片
- Instagram Carousel 文案
- Push / Banner 文案
- Caption
- Hashtags
- 发布时间建议
- 质量评分
- 优化建议
- 改写版本

### 2. `/api/generate-visual-assets`

生图 API，用于生成视觉素材：

- 封面图
- 轮播背景图
- 视频关键帧
- Banner 图

如果任一 API 失败，必须使用对应 Mock Fallback，保证 Pipeline、Assets、Preview、Batch 都能稳定演示。

## 十一、视觉风格

整体风格应该高级、有趣、有 AI 产品感，而不是普通后台。

视觉关键词：

- 深色科技背景
- 蓝绿色渐变光效
- 地图路线纹理
- 玻璃拟态卡片
- 手机竖屏内容预览
- 内容资产卡片
- AI 内容生产流水线动画
- 平台预览组件
- 地图连接现实世界的概念表达

不要使用高德官方 Logo，避免版权问题。可以使用文字 Amap AI Campaign Studio。

## 十二、最终交付物

项目最终需要提交：

- 可运行 Web Demo
- GitHub / Gitee 代码仓库
- README
- PRD / 项目说明文档
- WORKFLOW / AI 内容生产流水线说明
- STYLE_GUIDE / 视觉与组件规范
- Demo 录屏
- 项目截图
- API 配置说明
- Mock Fallback 说明
- 加分项对应说明
- Publish-ready Package 导出示例

## 十三、项目一句话介绍

Amap AI Campaign Studio 是一个面向高德 AI 内容运营场景的自动化工作台，可以从一个 Campaign Brief 自动生成多平台内容、视觉素材、平台预览、质量评分、优化建议和可导出的发布包。

## 十四、开发原则

后续所有代码和文档必须遵守：

1. 不要做成用户上传视频分析工具。
2. 不要做成普通 AI 文案生成器。
3. 不要做成只生成脚本和 Prompt 的工具。
4. 不要假装已经真实发布到社交平台。
5. 不要所有平台都生成视频。
6. 必须体现多平台内容形态差异。
7. 必须体现高德 AI 内容运营场景。
8. 必须体现作业要求和加分项。
9. 必须有视觉素材生成或 Mock Visual Fallback。
10. 必须有平台视觉预览，不能只有纯文字。
11. 必须保留质量评分和优化建议。
12. 必须有 mock fallback，保证演示稳定。
13. 不要过度设计，优先保证 Demo 完整、好看、能讲清楚。
14. 所有页面和文档都要围绕本文件，不要偏离。
