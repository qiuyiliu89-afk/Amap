const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type ArkImageRequest = {
  prompt?: string;
  size?: string;
  responseFormat?: string;
};

function json(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  };
}

function getArkImageConfig() {
  return {
    apiKey: process.env.ARK_API_KEY?.trim(),
    baseUrl: (process.env.ARK_BASE_URL?.trim() || "https://ark.cn-beijing.volces.com/api/v3").replace(/\/$/, ""),
    model: process.env.ARK_IMAGE_MODEL?.trim(),
    size: process.env.ARK_IMAGE_SIZE?.trim() || "2K",
    responseFormat: process.env.ARK_IMAGE_RESPONSE_FORMAT?.trim() || "url",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function extractImageUrl(payload: unknown) {
  if (!isRecord(payload)) return "";

  const data = Array.isArray(payload.data) ? payload.data : [];
  const firstDataItem = isRecord(data[0]) ? data[0] : undefined;
  const output = Array.isArray(payload.output) ? payload.output : [];
  const firstOutputItem = isRecord(output[0]) ? output[0] : undefined;
  const result = isRecord(payload.result) ? payload.result : undefined;
  const resultData = result && Array.isArray(result.data) ? result.data : [];
  const firstResultItem = isRecord(resultData[0]) ? resultData[0] : undefined;

  const candidates = [
    firstDataItem?.url,
    firstDataItem?.image_url,
    firstOutputItem?.url,
    firstOutputItem?.image_url,
    firstResultItem?.url,
    firstResultItem?.image_url,
    result?.url,
    result?.image_url,
    payload.url,
    payload.image_url,
  ];

  for (const candidate of candidates) {
    const url = getString(candidate);
    if (url) return url;
  }

  const base64 = getString(firstDataItem?.b64_json ?? firstOutputItem?.b64_json);
  return base64 ? `data:image/png;base64,${base64}` : "";
}

function getErrorDetail(rawText: string, payload: unknown) {
  if (isRecord(payload)) {
    const error = isRecord(payload.error) ? payload.error : undefined;
    const message = getString(error?.message ?? payload.message ?? payload.error);
    if (message) return message.slice(0, 2000);
  }

  return rawText.trim().slice(0, 2000) || "Ark image generation returned an empty error response.";
}

export async function handler(event: { httpMethod: string; body?: string | null }) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: jsonHeaders, body: "" };
  }

  if (event.httpMethod === "GET") {
    const config = getArkImageConfig();
    return json(200, {
      function: "ark-image",
      configured: Boolean(config.apiKey && config.baseUrl && config.model),
      env: {
        hasApiKey: Boolean(config.apiKey),
        hasBaseUrl: Boolean(config.baseUrl),
        hasModel: Boolean(config.model),
        hasSize: Boolean(config.size),
        hasResponseFormat: Boolean(config.responseFormat),
      },
    });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  let payload: ArkImageRequest;
  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch {
    return json(400, { error: "Request body must be valid JSON." });
  }

  const prompt = payload.prompt?.trim();
  if (!prompt) {
    return json(400, { error: "prompt is required." });
  }

  const config = getArkImageConfig();
  if (!config.apiKey || !config.model) {
    return json(500, {
      error: "Ark image environment variables are incomplete.",
      required: ["ARK_API_KEY", "ARK_IMAGE_MODEL"],
    });
  }

  try {
    const response = await fetch(`${config.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        prompt,
        sequential_image_generation: "disabled",
        response_format: payload.responseFormat ?? config.responseFormat,
        size: payload.size ?? config.size,
        stream: false,
        watermark: false,
      }),
    });

    const rawText = await response.text();
    let responsePayload: unknown = null;
    try {
      responsePayload = rawText ? JSON.parse(rawText) : null;
    } catch {
      responsePayload = null;
    }

    if (!response.ok) {
      return json(response.status, {
        error: `Ark image generation request failed with HTTP ${response.status}.`,
        detail: getErrorDetail(rawText, responsePayload),
      });
    }

    const imageUrl = extractImageUrl(responsePayload);
    if (!imageUrl) {
      return json(502, {
        error: "Ark image generation succeeded but no image URL was found in the response.",
      });
    }

    return json(200, {
      imageUrl,
      status: response.status,
      model: config.model,
    });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown Ark image generation error.",
    });
  }
}
