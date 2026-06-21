type LlmEnv = {
  VITE_LLM_API_KEY?: string;
  VITE_LLM_BASE_URL?: string;
  VITE_LLM_MODEL?: string;
};

type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

interface CompleteJsonOptions {
  messages: LlmMessage[];
  temperature?: number;
}

const env = ((import.meta as ImportMeta & { env?: LlmEnv }).env ?? {}) as LlmEnv;

function getConfig() {
  const apiKey = env.VITE_LLM_API_KEY?.trim();
  const baseUrl = env.VITE_LLM_BASE_URL?.trim();
  const model = env.VITE_LLM_MODEL?.trim();
  return { apiKey, baseUrl, model };
}

export function isLlmConfigured() {
  const { apiKey, baseUrl, model } = getConfig();
  return Boolean(apiKey && baseUrl && model);
}

function resolveChatEndpoint(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) return fenced[1].trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) return trimmed.slice(firstBrace, lastBrace + 1);
  return trimmed;
}

export async function completeJson<T>({ messages, temperature = 0.7 }: CompleteJsonOptions): Promise<T> {
  const { apiKey, baseUrl, model } = getConfig();

  if (!apiKey || !baseUrl || !model) {
    throw new Error("LLM environment variables are not configured.");
  }

  const response = await fetch(resolveChatEndpoint(baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`LLM request failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("LLM response did not include JSON content.");
  }

  return JSON.parse(extractJson(content)) as T;
}

