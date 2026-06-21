type ArkEnv = {
  VITE_ARK_RESPONSE_API_URL?: string;
  VITE_ARK_RESPONSE_FUNCTION_URL?: string;
};

export type ArkResponseTextParams = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseFormat?: Record<string, unknown>;
  thinking?: Record<string, unknown>;
  stream?: boolean;
  onStreamActivity?: () => void;
  signal?: AbortSignal;
  asyncJob?: boolean;
};

export class ArkResponseFormatUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArkResponseFormatUnsupportedError";
  }
}

export class ArkThinkingUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArkThinkingUnsupportedError";
  }
}

const env = ((import.meta as ImportMeta & { env?: ArkEnv }).env ?? {}) as ArkEnv;
const defaultArkResponseEndpoint = "/.netlify/functions/ark-response";

function getArkResponseEndpoint() {
  return env.VITE_ARK_RESPONSE_API_URL?.trim()
    || env.VITE_ARK_RESPONSE_FUNCTION_URL?.trim()
    || defaultArkResponseEndpoint;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function waitForPoll(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(new DOMException("Ark response job polling aborted", "AbortError"));
    }, { once: true });
  });
}

async function pollArkResponseJob(
  jobId: string,
  options: {
    responseFormat?: Record<string, unknown>;
    thinking?: Record<string, unknown>;
    onStreamActivity?: () => void;
    signal?: AbortSignal;
  },
) {
  const deadline = Date.now() + 330000;
  const endpoint = new URL(getArkResponseEndpoint(), window.location.href);
  endpoint.searchParams.set("job", jobId);

  while (Date.now() < deadline) {
    await waitForPoll(1800, options.signal);
    const response = await fetch(endpoint.toString(), { signal: options.signal });
    const rawText = await response.text();
    options.onStreamActivity?.();

    let payload: unknown = null;
    try {
      payload = rawText ? JSON.parse(rawText) : null;
    } catch {
      payload = rawText;
    }

    if (!response.ok) {
      throw createArkRequestError(
        getErrorDetail(rawText),
        response.status,
        { responseFormat: options.responseFormat, thinking: options.thinking },
      );
    }
    if (isRecord(payload) && payload.jobStatus === "running") continue;
    return payload;
  }

  throw new Error("Ark response job timed out after 330000ms.");
}

function flattenErrorValue(value: unknown, parts: string[] = []) {
  if (!value) return parts;

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return parts;

    parts.push(text);
    if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
      try {
        flattenErrorValue(JSON.parse(text), parts);
      } catch {
        // Keep the original string when Ark returns a non-JSON detail.
      }
    }
    return parts;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    parts.push(String(value));
    return parts;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => flattenErrorValue(item, parts));
    return parts;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    [
      record.code,
      record.type,
      record.param,
      record.message,
      record.error,
      record.detail,
    ].forEach((item) => flattenErrorValue(item, parts));
  }

  return parts;
}

function getPayloadErrorDetail(payload: Record<string, unknown>) {
  const parts = flattenErrorValue(payload);
  return Array.from(new Set(parts)).join(" ").trim();
}

function createArkRequestError(
  detail: string,
  status: number | string,
  options: {
    responseFormat?: Record<string, unknown>;
    thinking?: Record<string, unknown>;
  },
) {
  const statusLabel = status ? `status ${status}. ` : "";
  const errorText = detail.trim() || "Ark Responses API request failed.";

  if (options.responseFormat && /response[_\s-]?format|json[_\s-]?object|json object/i.test(errorText)) {
    return new ArkResponseFormatUnsupportedError(
      `Ark Responses API does not support the requested response_format: ${statusLabel}${errorText}`,
    );
  }

  if (options.thinking && /thinking|reasoning/i.test(errorText)) {
    return new ArkThinkingUnsupportedError(
      `Ark Responses API does not support the requested thinking option: ${statusLabel}${errorText}`,
    );
  }

  return new Error(`${statusLabel}${errorText}`.trim());
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

function extractResponseText(
  data: unknown,
  options: {
    responseFormat?: Record<string, unknown>;
    thinking?: Record<string, unknown>;
  } = {},
) {
  if (!data || typeof data !== "object") {
    return JSON.stringify(data);
  }

  const record = data as Record<string, unknown>;

  if (record.ok === false || typeof record.error === "string") {
    const status = typeof record.status === "number" || typeof record.status === "string"
      ? record.status
      : "";
    throw createArkRequestError(getPayloadErrorDetail(record), status, options);
  }

  if (typeof record.text === "string" && record.text.trim()) {
    return record.text;
  }

  if (typeof record.output_text === "string" && record.output_text.trim()) {
    return record.output_text;
  }

  const outputTexts = collectOutputText(record.output);
  if (outputTexts.length > 0) {
    return outputTexts.join("\n").trim();
  }

  return JSON.stringify(data);
}

function getErrorDetail(rawText: string) {
  try {
    const payload = JSON.parse(rawText) as Record<string, unknown>;
    return getPayloadErrorDetail(payload) || rawText;
  } catch {
    return rawText;
  }
}

export async function arkResponseText({
  systemPrompt,
  userPrompt,
  temperature,
  maxOutputTokens,
  responseFormat,
  thinking,
  stream,
  onStreamActivity,
  signal,
  asyncJob,
}: ArkResponseTextParams): Promise<string> {
  let heartbeat = 0;

  if (stream && onStreamActivity) {
    onStreamActivity();
    heartbeat = window.setInterval(onStreamActivity, 8000);
  }

  try {
    const response = await fetch(getArkResponseEndpoint(), {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemPrompt,
        userPrompt,
        temperature,
        maxOutputTokens,
        responseFormat,
        thinking,
        stream,
        async: asyncJob,
      }),
    });

    const rawText = await response.text();

    if (!response.ok) {
      const detail = getErrorDetail(rawText);
      throw createArkRequestError(detail, response.status, { responseFormat, thinking });
    }

    let data: unknown = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = rawText;
    }

    if (asyncJob && isRecord(data)) {
      const jobId = getString(data.jobId);
      if (jobId) {
        data = await pollArkResponseJob(jobId, {
          responseFormat,
          thinking,
          onStreamActivity,
          signal,
        });
      }
    }

    return extractResponseText(data, { responseFormat, thinking });
  } finally {
    if (heartbeat) window.clearInterval(heartbeat);
  }
}
