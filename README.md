# Amap AI Campaign Studio

高德 AI 内容运营自动化工作台。

Amap AI Campaign Studio 是一个面向高德 AI 内容运营场景的自动化工作台，可以从一个 Campaign Brief 自动生成多平台内容、视觉素材、平台预览、质量评分、优化建议和可导出的发布包。

## 项目依据

本项目的唯一总上下文是 `00_PROJECT_CONTEXT.md`。后续 README、PRD、WORKFLOW、页面设计和代码开发都必须遵守其中的核心判断：

- 项目名保持为 `Amap AI Campaign Studio`。
- 中文名为 `高德 AI 内容运营自动化工作台`。
- 核心能力是 `AI Content Pipeline / AI 内容生产流水线`。
- 最终产出是 `Publish-ready Package / 可发布内容包`，不是单条脚本。
- 本项目不是普通 AI 文案生成器。
- 本项目不是用户上传视频分析工具。
- 本项目不是只生成脚本和 Prompt 的工具。
- 本项目不会假装已经真实发布到社交平台。
- 本项目必须有质量评分、优化建议、视觉素材生成或 Mock Visual Fallback、平台预览和导出能力。

## 项目背景

本项目用于 AI 产品实习岗位作品提交，需要同时覆盖：

1. AI Coding 作品：用 React + Vite 开发一个可运行、可演示的 Web Demo。
2. 自动化内容生成工作流：用 Claude 或 Codex 制作一个能够批量生产内容资产的 AI Content Pipeline。
3. 加分项：能做类似高德地图官方抖音 AI 宣传视频的内容、理解海外媒体平台运营、体现基于内容运营需求的 AI 批量自动化开发能力。

因此，项目方向不是做单点生成工具，而是做一套从 Campaign Brief 到 Publish-ready Package 的内容运营自动化工作台。

## 核心工作流

英文工作流：

Campaign Brief 输入
→ AI 解析内容需求
→ AI 生成内容策略
→ AI 生成多平台内容
→ AI 生成视觉 Prompt
→ 生图 API 或 Mock Visual Fallback 生成视觉素材
→ 前端渲染平台预览
→ AI 质量评分
→ AI 优化建议
→ 导出发布包

中文表达：

Brief 输入
→ 内容策略生成
→ 多平台内容生成
→ 视觉素材生成
→ 平台预览渲染
→ 质量评分
→ 优化建议
→ 发布准备
→ 导出发布包

## Publish-ready Package

最终产出不是脚本，而是可发布内容包，包含：

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

## 页面结构

- Home：首页，展示项目定位和核心流程。
- Brief：输入 Campaign Brief。
- Pipeline：自动运行完整内容生产流水线。
- Assets：展示多平台内容资产、评分、优化建议和导出。
- Preview：展示平台视觉预览。
- Batch：批量内容矩阵生成。
- Bonus：说明作业要求和加分项对应。

## 视觉素材和平台预览

生成视觉素材：

- 如果接入生图 API，则可以真实生成封面图、轮播背景图、视频关键帧、Banner 图。
- 如果生图 API 失败，则使用 Mock Visual Fallback。

渲染平台预览：

- 小红书图文、Instagram Carousel、Push、Banner 是前端真实渲染的预览效果。
- TikTok / 抖音视频预览第一版不生成真实 MP4，而是使用 AI 关键帧 + 字幕 + 前端转场动效形成 9:16 短视频预览。
- 后续可接入视频生成 API 输出完整视频文件。

## API 设计

第一版建议预留两个 API：

- `/api/generate-content-package`：文本大模型 API，生成结构化内容包。
- `/api/generate-visual-assets`：生图 API，生成视觉素材。

Netlify 部署时，真实火山方舟请求走服务端函数：

- `/.netlify/functions/ark-response`：读取 `ARK_API_KEY` / `ARK_MODEL`，调用 Responses API。
- `/.netlify/functions/ark-image`：读取 `ARK_API_KEY` / `ARK_IMAGE_MODEL`，调用图片生成 API。
- 前端只保留 `VITE_ARK_RESPONSE_FUNCTION_URL`、`VITE_ARK_IMAGE_FUNCTION_URL` 等非密钥配置，不把真实 API Key 打进浏览器包。

Netlify 环境变量中，文本模型变量优先使用 `ARK_MODEL`；如果已经配置为 `ARK_TEXT_MODEL`，服务端函数也会兼容读取。

如果 Netlify Functions 因长时间生成出现 504，可以把火山方舟请求迁移到 Render Web Service：

- Render Start Command：`npm run render:start`
- Render 后端健康检查：`https://<render-service>.onrender.com/health`
- 文本接口：`https://<render-service>.onrender.com/api/ark-response`
- 图片接口：`https://<render-service>.onrender.com/api/ark-image`
- Render 环境变量：`ARK_API_KEY`、`ARK_BASE_URL`、`ARK_MODEL`、`ARK_IMAGE_MODEL`、`ARK_IMAGE_SIZE`、`ARK_IMAGE_RESPONSE_FORMAT`
- Netlify 前端环境变量：`VITE_ARK_RESPONSE_API_URL=https://<render-service>.onrender.com/api/ark-response`，`VITE_ARK_IMAGE_API_URL=https://<render-service>.onrender.com/api/ark-image`

Render 后端负责读取密钥并调用火山方舟；Netlify 前端只请求 Render API。

图片生成接口会对 `429 Too Many Requests`、408 和 5xx 自动退避重试，并串行处理同一后端实例里的图片请求。可选 Render 环境变量：`ARK_RETRY_ATTEMPTS=4`、`ARK_RETRY_BASE_DELAY_MS=2500`、`ARK_IMAGE_REQUEST_GAP_MS=2500`。如果方舟账号限额很低，可以把 `ARK_IMAGE_REQUEST_GAP_MS` 调到 `4000` 或更高。

两个 API 都必须有 Mock Fallback：

- 内容 API 失败时，展示本地高质量结构化内容包。
- 生图 API 失败时，展示 Mock Visual Fallback 视觉素材。
- 保证面试演示时 Pipeline、Assets、Preview、Batch 都可稳定运行。

## 质量评分与优化建议

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

## 技术方向

- 前端：React + Vite
- 数据：本地 mock JSON
- 文本 API：`/api/generate-content-package`
- 生图 API：`/api/generate-visual-assets`
- Fallback：文本内容和视觉素材都必须有 Mock Fallback
- 视频：第一版不生成真实 MP4，仅生成 AI 关键帧 + 字幕 + 前端转场形成 9:16 预览

## 运行方式

如果项目已经完成 React + Vite 初始化，使用：

```bash
npm install
npm run dev
```

如果当前仓库仍处于文档规划阶段，应先完成 Vite 项目初始化和页面开发，再执行以上命令。运行后需要能演示主流程：Home、Brief、Pipeline、Assets、Preview、Batch 和 Bonus。

## 目录说明

```text
Amap AI Campaign Studio/
├── 00_PROJECT_CONTEXT.md
├── README.md
├── PRD.md
├── AGENTS.md
├── WORKFLOW.md
├── STYLE_GUIDE.md
├── SUBMISSION_CHECKLIST.md
├── public/
└── src/
   ├── components/
   ├── features/
   ├── mocks/
   ├── pages/
   ├── styles/
   └── types/
```

## 提交说明

最终提交应包含：

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
- Publish-ready Package 导出示例
- 加分项对应说明

项目中不得使用高德官方 Logo，也不得暗示这是官方上线功能。页面品牌统一使用 `Amap AI Campaign Studio` 或 `高德 AI 内容运营自动化工作台`，并明确这是基于内容运营场景的概念 Demo。
