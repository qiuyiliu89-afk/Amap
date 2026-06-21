import { arkResponseText } from "./arkClient";

export async function testArkConnection() {
  return arkResponseText({
    systemPrompt: "你是一个简洁的中文助手。",
    userPrompt: "请只返回一句话：火山方舟 API 已成功连接。",
    temperature: 0.2,
  });
}
