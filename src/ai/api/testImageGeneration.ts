import { generateImageWithArk } from "./generateImageWithArk";

export const imageGenerationTestPrompt =
  "深色科技风的端午文化城市旅行路线视觉，小红书封面图，高德地图路线规划灵感，青绿色发光路线，城市夜景，传统文化元素，粽叶纹理，现代 UI 质感，干净高级，适合内容创作活动封面。";

export function testImageGeneration() {
  return generateImageWithArk(imageGenerationTestPrompt);
}
