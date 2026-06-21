const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type ArkResponseRequest = {
  systemPrompt?: string;
  userPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseFormat?: Record<string, unknown>;
  thinking?: Record<string, unknown>;
  stream?: boolean;
};

function json(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  };
}

function getArkConfig() {
  return {
    apiKey: process.env.ARK_API_KEY?.trim(),
    baseUrl: (process.env.ARK_BASE_URL?.trim() || "https://ark.cn-beijing.volces.com/api/v3").replace(/\/$/, ""),
    model: process.env.ARK_MODEL?.trim() || process.env.ARK_TEXT_MODEL?.trim(),
  };
}

function collectOutputText(value: unknown, outputTexts: string[] = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectOutputText(item, outputTexts));
    return outputTexts;
  }

  if (!value || typeof value !== "object") {
    return outputTexts;
  }

  const record = value as Record<string, unknown>;

  if (record.type === "output_text" && typeof record.text === "string") {
    outputTexts.push(record.text);
  }

  Object.values(record).forEach((item) => collectOutputText(item, outputTexts));
  return outputTexts;
}

function extractResponseText(data: unknown) {
  if (!data || typeof data !== "object") {
    return JSON.stringify(data);
  }

  const record = data as Record<string, unknown>;

  if (typeof record.output_text === "string" && record.output_text.trim()) {
    return record.output_text;
  }

  const outputTexts = collectOutputText(record.output);
  if (outputTexts.length > 0) {
    return outputTexts.join("\n").trim();
  }

  return JSON.stringify(data);
}

function getStreamErrorMessage(data: unknown) {
  if (!data || typeof data !== "object") return "Ark streaming request failed.";

  const record = data as Record<string, unknown>;
  const error = record.error && typeof record.error === "object"
    ? record.error as Record<string, unknown>
    : record;

  return typeof error.message === "string" && error.message.trim()
    ? error.message
    : "Ark streaming request failed.";
}

async function extractStreamingResponseText(response: Response) {
  if (!response.body) {
    throw new Error("Ark streaming response did not include a readable body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const output: string[] = [];
  let completedText = "";
  let buffer = "";

  const processEvent = (rawEvent: string) => {
    const dataText = rawEvent
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n")
      .trim();

    if (!dataText || dataText === "[DONE]") return;

    let data: unknown;
    try {
      data = JSON.parse(dataText);
    } catch {
      return;
    }

    if (!data || typeof data !== "object") return;
    const record = data as Record<string, unknown>;

    if (record.type === "error" || record.type === "response.failed") {
      throw new Error(getStreamErrorMessage(record));
    }

    if (record.type === "response.output_text.delta" && typeof record.delta === "string") {
      output.push(record.delta);
      return;
    }

    if (record.type === "response.completed" && record.response) {
      completedText = extractResponseText(record.response);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value?.length) continue;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? "";
    events.forEach(processEvent);
  }

  buffer += decoder.decode();
  if (buffer.trim()) processEvent(buffer);

  const streamedText = output.join("").trim();
  if (streamedText) return streamedText;
  if (completedText.trim()) return completedText.trim();

  throw new Error("Ark streaming response completed without output text.");
}

export async function handler(event: { httpMethod: string; body?: string | null }) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: jsonHeaders, body: "" };
  }

  if (event.httpMethod === "GET") {
    const config = getArkConfig();
    return json(200, {
      function: "ark-response",
      configured: Boolean(config.apiKey && config.baseUrl && config.model),
      env: {
        hasApiKey: Boolean(config.apiKey),
        hasBaseUrl: Boolean(config.baseUrl),
        hasModel: Boolean(config.model),
        modelVariable: process.env.ARK_MODEL?.trim()
          ? "ARK_MODEL"
          : process.env.ARK_TEXT_MODEL?.trim()
            ? "ARK_TEXT_MODEL"
            : "missing",
      },
    });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  let payload: ArkResponseRequest;
  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch {
    return json(400, { error: "Request body must be valid JSON." });
  }

  if (!payload.systemPrompt || !payload.userPrompt) {
    return json(400, { error: "systemPrompt and userPrompt are required." });
  }

  const config = getArkConfig();
  if (!config.apiKey || !config.model) {
    return json(500, {
      error: "Ark server environment variables are incomplete.",
      required: ["ARK_API_KEY", "ARK_MODEL or ARK_TEXT_MODEL"],
    });
  }

  try {
    const response = await fetch(`${config.baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: payload.systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: payload.userPrompt }],
          },
        ],
        temperature: payload.temperature ?? 0.4,
        max_output_tokens: payload.maxOutputTokens ?? 3000,
        ...(payload.responseFormat ? { response_format: payload.responseFormat } : {}),
        ...(payload.thinking ? { thinking: payload.thinking } : {}),
        ...(payload.stream ? { stream: true } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return json(response.status, {
        error: `Ark Responses API request failed: status ${response.status}.`,
        detail,
      });
    }

    const text = payload.stream
      ? await extractStreamingResponseText(response)
      : extractResponseText(await response.json());

    return json(200, { text });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown Ark Responses API error.",
    });
  }
}
