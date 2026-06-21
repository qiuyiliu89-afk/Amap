# Codex 指令：首页改用高保真截图素材

当前问题：
之前使用的 clean 素材太简化，和视觉参考图不一致。现在请停止使用 public/assets/clean/ 里的简化素材，改用高保真截图素材。

素材目录：

```text
public/assets/home-snapshot/
```

请严格执行：

## 1. 保留代码实现的部分

以下部分继续用代码：
- Header
- Hero 左侧标题
- Hero 左侧说明
- Hero 左侧按钮
- 页面整体深色背景和容器

## 2. 改成图片实现的部分

以下复杂视觉模块直接用图片，不要再用代码重复绘制：

### Hero 右侧
使用：
`/assets/home-snapshot/hero-right-panel-full.png`

不要再额外叠加：
- AI Content Engine
- Strategy Ready / Assets Ready / Score Ready
- 路线图
- 评分
因为图片里已经包含这些内容。

### Flow Strip
使用：
`/assets/home-snapshot/flow-strip-full.png`

不要再用 lucide-react 重画 8 个图标。

### Feature Cards
四张卡片直接用：
- `/assets/home-snapshot/card-multiplatform-full.png`
- `/assets/home-snapshot/card-visual-assets-full.png`
- `/assets/home-snapshot/card-quality-score-full.png`
- `/assets/home-snapshot/card-export-full.png`

不要再在卡片里叠加代码标题、描述、箭头和图标。

### Bottom Summary
使用：
`/assets/home-snapshot/bottom-summary-full.png`

不要再用代码重复渲染里面的指标和文字。

## 3. 布局要求

- 保持当前已经调好的页面尺寸和间距。
- 图片使用 `width: 100%; height: auto; object-fit: contain; display: block;`
- Feature Cards 一行四列，每张图外层可加 hover glow，但不要遮挡图片。
- Flow Strip 和 Bottom Summary 用整条图片展示。
- 不要让图片变形，不要 object-cover 裁切。

## 4. 禁止

- 不要继续使用 public/assets/clean/ 里的简化图片替代参考视觉。
- 不要把 reference/home-reference-final.png 整页作为背景。
- 不要在带文字图片上重复渲染文字。
- 不要出现 demo、五一、模拟发布、真实发布。

## 5. 完成后输出

请输出：
1. 哪些模块改用了 home-snapshot 图片；
2. 哪些模块仍然使用代码；
3. 是否还存在文字重叠；
4. 是否和参考图更接近。
