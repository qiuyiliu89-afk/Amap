type ArkImageEnv = {
  DEV?: boolean;
  VITE_ARK_IMAGE_API_URL?: string;
  VITE_ARK_IMAGE_FUNCTION_URL?: string;
  VITE_ARK_IMAGE_SIZE?: string;
  VITE_ARK_IMAGE_RESPONSE_FORMAT?: string;
};

export interface ArkImageGenerationResult {
  imageUrl: string;
  status: number;
  model: string;
}

export class ArkImageGenerationError extends Error {
  status?: number;
  detail?: string;

  constructor(message: string, options: { status?: number; detail?: string } = {}) {
    super(message);
    this.name = "ArkImageGenerationError";
    this.status = options.status;
    this.detail = options.detail;
  }
}

const env = ((import.meta as ImportMeta & { env?: ArkImageEnv }).env ?? {}) as ArkImageEnv;
const defaultArkImageEndpoint = "/.netlify/functions/ark-image";

function getArkImageEndpoint() {
  return env.VITE_ARK_IMAGE_API_URL?.trim()
    || env.VITE_ARK_IMAGE_FUNCTION_URL?.trim()
    || defaultArkImageEndpoint;
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
    result?.imageUrl,
    payload.url,
    payload.image_url,
    payload.imageUrl,
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
    const message = getString(payload.detail ?? payload.error ?? payload.message);
    if (message) return message.slice(0, 2000);
  }

  return rawText.trim().slice(0, 2000) || "Ark image generation returned an empty error response.";
}

export async function generateImageWithArk(prompt: string): Promise<ArkImageGenerationResult> {
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) {
    throw new ArkImageGenerationError("Image prompt cannot be empty.");
  }

  const response = await fetch(getArkImageEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: normalizedPrompt,
      size: env.VITE_ARK_IMAGE_SIZE?.trim() || "2K",
      responseFormat: env.VITE_ARK_IMAGE_RESPONSE_FORMAT?.trim() || "url",
    }),
  });

  const rawText = await response.text();
  let payload: unknown = null;
  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = getErrorDetail(rawText, payload);
    if (env.DEV) {
      console.warn("[Ark image] request failed", { status: response.status, detail });
    }
    throw new ArkImageGenerationError(
      `Ark image generation request failed with HTTP ${response.status}. ${detail}`,
      { status: response.status, detail },
    );
  }

  const imageUrl = extractImageUrl(payload);
  if (env.DEV) {
    console.debug("[Ark image] response", {
      status: response.status,
      imageUrlFound: Boolean(imageUrl),
    });
  }

  if (!imageUrl) {
    throw new ArkImageGenerationError(
      "Ark image generation succeeded but no image URL was found in the response.",
      { status: response.status },
    );
  }

  const model = isRecord(payload) ? getString(payload.model) : "";

  return {
    imageUrl,
    status: response.status,
    model: model || "ark-image",
  };
}
