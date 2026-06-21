import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const defaultArkBaseUrl = "https://ark.cn-beijing.volces.com/api/v3";
const port = Number(process.env.PORT || 10000);
const host = "0.0.0.0";
const requestTimeoutMs = Number(process.env.REQUEST_TIMEOUT_MS || 300000);
const arkRetryAttempts = Number(process.env.ARK_RETRY_ATTEMPTS || 4);
const arkRetryBaseDelayMs = Number(process.env.ARK_RETRY_BASE_DELAY_MS || 2500);
const arkImageRequestGapMs = Number(process.env.ARK_IMAGE_REQUEST_GAP_MS || 2500);

let imageRequestQueue = Promise.resolve();
const arkResponseJobs = new Map();
const arkResponseJobTtlMs = 10 * 60 * 1000;

function pruneArkResponseJobs() {
  const cutoff = Date.now() - arkResponseJobTtlMs;
  for (const [jobId, job] of arkResponseJobs.entries()) {
    if (job.updatedAt < cutoff) arkResponseJobs.delete(jobId);
  }
}

const jobCleanupTimer = setInterval(pruneArkResponseJobs, 60000);
jobCleanupTimer.unref();

function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGIN || process.env.ALLOWED_ORIGINS || "*";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getCorsHeaders(req) {
  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = req.headers.origin;
  const allowAny = allowedOrigins.includes("*");
  const allowedOrigin = allowAny
    ? "*"
    : requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0] || "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function sendJson(req, res, statusCode, body) {
  const headers = {
    ...getCorsHeaders(req),
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };

  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(body));
}

function createJsonKeepAliveResponse(req, res) {
  const headers = {
    ...getCorsHeaders(req),
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Accel-Buffering": "no",
  };

  res.writeHead(200, headers);
  res.write(" ");

  const heartbeat = setInterval(() => {
    if (!res.destroyed && !res.writableEnded) {
      res.write(" ");
    }
  }, 12000);

  return (body) => {
    clearInterval(heartbeat);
    if (!res.destroyed && !res.writableEnded) {
      res.end(JSON.stringify(body));
    }
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(value) {
  if (!value) return 0;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const dateMs = Date.parse(value);
  return Number.isFinite(dateMs) ? Math.max(0, dateMs - Date.now()) : 0;
}

function isRetryableArkStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

async function fetchArkWithRetry(url, init, label, attempts = arkRetryAttempts) {
  let lastResponse = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, init);
    lastResponse = response;

    if (!isRetryableArkStatus(response.status) || attempt >= attempts) {
      return response;
    }

    const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
    const backoffMs = retryAfterMs || arkRetryBaseDelayMs * attempt;
    const detail = await response.text().catch(() => "");
    console.warn(`[${label}] retryable status ${response.status}; retry ${attempt}/${attempts - 1} in ${backoffMs}ms`, {
      detail: detail.slice(0, 500),
    });
    await wait(backoffMs);
  }

  return lastResponse;
}

async function runQueuedImageRequest(task) {
  const run = imageRequestQueue.catch(() => undefined).then(task);
  imageRequestQueue = run.catch(() => undefined).then(() => wait(arkImageRequestGapMs));
  return run;
}

function readRequestBody(req, maxBytes = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    req.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        reject(new Error("Request body is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}

async function readJsonBody(req) {
  const rawBody = await readRequestBody(req);
  if (!rawBody.trim()) return {};
  return JSON.parse(rawBody);
}

function getArkConfig() {
  return {
    apiKey: process.env.ARK_API_KEY?.trim(),
    baseUrl: (process.env.ARK_BASE_URL?.trim() || defaultArkBaseUrl).replace(/\/$/, ""),
    model: process.env.ARK_MODEL?.trim() || process.env.ARK_TEXT_MODEL?.trim(),
  };
}

function buildArkResponseRequestBody(config, payload, options = {}) {
  const includeResponseFormat = options.includeResponseFormat !== false;
  const includeThinking = options.includeThinking !== false;

  return {
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
    ...(includeResponseFormat && payload.responseFormat ? { response_format: payload.responseFormat } : {}),
    ...(includeThinking && payload.thinking ? { thinking: payload.thinking } : {}),
    ...(payload.stream ? { stream: true } : {}),
  };
}

function getArkResponseFallbackCandidates(payload) {
  const candidates = [
    {
      label: "initial",
      includeResponseFormat: true,
      includeThinking: true,
    },
  ];

  if (payload.thinking) {
    candidates.push({
      label: "without thinking",
      includeResponseFormat: true,
      includeThinking: false,
    });
  }

  if (payload.responseFormat) {
    candidates.push({
      label: "without response_format and thinking",
      includeResponseFormat: false,
      includeThinking: false,
    });
  }

  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = `${candidate.includeResponseFormat}:${candidate.includeThinking}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchCompatibleArkResponse(config, payload) {
  let lastFailure = null;
  const candidates = getArkResponseFallbackCandidates(payload);

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const response = await fetchArkWithRetry(`${config.baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildArkResponseRequestBody(config, payload, candidate)),
    }, `Ark Responses API ${candidate.label}`);

    if (response.ok) {
      return { ok: true, response, fallback: candidate.label };
    }

    const detail = await response.text().catch(() => "");
    lastFailure = { status: response.status, detail, fallback: candidate.label };

    const canTryCompatFallback =
      response.status === 400 &&
      index < candidates.length - 1 &&
      (payload.responseFormat || payload.thinking);

    if (!canTryCompatFallback) break;

    console.warn(`[Ark Responses API] ${candidate.label} failed with status 400; trying compatible payload`, {
      detail: detail.slice(0, 500),
    });
  }

  return {
    ok: false,
    status: lastFailure?.status ?? 500,
    detail: lastFailure?.detail ?? "Ark Responses API request failed before a response was available.",
    fallback: lastFailure?.fallback ?? "none",
  };
}

function getArkImageConfig() {
  return {
    apiKey: process.env.ARK_API_KEY?.trim(),
    baseUrl: (process.env.ARK_BASE_URL?.trim() || defaultArkBaseUrl).replace(/\/$/, ""),
    model: process.env.ARK_IMAGE_MODEL?.trim(),
    size: process.env.ARK_IMAGE_SIZE?.trim() || "2K",
    responseFormat: process.env.ARK_IMAGE_RESPONSE_FORMAT?.trim() || "url",
  };
}

function collectOutputText(value, outputTexts = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectOutputText(item, outputTexts));
    return outputTexts;
  }

  if (!value || typeof value !== "object") {
    return outputTexts;
  }

  if (value.type === "output_text" && typeof value.text === "string") {
    outputTexts.push(value.text);
  }

  Object.values(value).forEach((item) => collectOutputText(item, outputTexts));
  return outputTexts;
}

function extractResponseText(data) {
  if (!data || typeof data !== "object") {
    return JSON.stringify(data);
  }

  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const outputTexts = collectOutputText(data.output);
  if (outputTexts.length > 0) {
    return outputTexts.join("\n").trim();
  }

  return JSON.stringify(data);
}

function getStreamErrorMessage(data) {
  if (!data || typeof data !== "object") return "Ark streaming request failed.";
  const error = data.error && typeof data.error === "object" ? data.error : data;
  return typeof error.message === "string" && error.message.trim()
    ? error.message
    : "Ark streaming request failed.";
}

async function extractStreamingResponseText(response) {
  if (!response.body) {
    throw new Error("Ark streaming response did not include a readable body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const output = [];
  let completedText = "";
  let buffer = "";

  const processEvent = (rawEvent) => {
    const dataText = rawEvent
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n")
      .trim();

    if (!dataText || dataText === "[DONE]") return;

    let data;
    try {
      data = JSON.parse(dataText);
    } catch {
      return;
    }

    if (!data || typeof data !== "object") return;

    if (data.type === "error" || data.type === "response.failed") {
      throw new Error(getStreamErrorMessage(data));
    }

    if (data.type === "response.output_text.delta" && typeof data.delta === "string") {
      output.push(data.delta);
      return;
    }

    if (data.type === "response.completed" && data.response) {
      completedText = extractResponseText(data.response);
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

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function extractImageUrl(payload) {
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

function getImageErrorDetail(rawText, payload) {
  if (isRecord(payload)) {
    const error = isRecord(payload.error) ? payload.error : undefined;
    const message = getString(error?.message ?? payload.message ?? payload.error);
    if (message) return message.slice(0, 2000);
  }

  return rawText.trim().slice(0, 2000) || "Ark image generation returned an empty error response.";
}

function getRequestSummary(config) {
  return {
    hasApiKey: Boolean(config.apiKey),
    hasBaseUrl: Boolean(config.baseUrl),
    hasModel: Boolean(config.model),
  };
}

async function runArkResponseRequest(config, payload) {
  const arkResult = await fetchCompatibleArkResponse(config, payload);

  if (!arkResult.ok) {
    return {
      ok: false,
      status: arkResult.status,
      error: `Ark Responses API request failed: status ${arkResult.status}.`,
      detail: arkResult.detail,
      fallback: arkResult.fallback,
    };
  }

  const text = payload.stream
    ? await extractStreamingResponseText(arkResult.response)
    : extractResponseText(await arkResult.response.json());

  return { ok: true, text, compatibility: arkResult.fallback };
}

function startArkResponseJob(config, payload) {
  pruneArkResponseJobs();
  const jobId = randomUUID();
  const now = Date.now();
  arkResponseJobs.set(jobId, {
    jobStatus: "running",
    createdAt: now,
    updatedAt: now,
  });

  void runArkResponseRequest(config, payload)
    .then((result) => {
      arkResponseJobs.set(jobId, {
        jobStatus: "complete",
        result,
        createdAt: now,
        updatedAt: Date.now(),
      });
    })
    .catch((error) => {
      arkResponseJobs.set(jobId, {
        jobStatus: "complete",
        result: {
          ok: false,
          status: 500,
          error: error instanceof Error ? error.message : "Unknown Ark response job error.",
        },
        createdAt: now,
        updatedAt: Date.now(),
      });
    });

  return jobId;
}

function sendArkResponseJob(req, res, jobId) {
  pruneArkResponseJobs();
  const job = arkResponseJobs.get(jobId);
  if (!job) {
    sendJson(req, res, 404, {
      ok: false,
      status: 404,
      error: "Ark response job was not found or has expired.",
    });
    return;
  }
  if (job.jobStatus === "running") {
    sendJson(req, res, 200, { ok: true, jobId, jobStatus: "running" });
    return;
  }

  sendJson(req, res, 200, {
    ...job.result,
    jobId,
    jobStatus: "complete",
  });
}

async function handleArkResponse(req, res) {
  const config = getArkConfig();

  if (req.method === "GET") {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const jobId = url.searchParams.get("job")?.trim();
    if (jobId) {
      sendArkResponseJob(req, res, jobId);
      return;
    }

    sendJson(req, res, 200, {
      service: "render-ark-backend",
      endpoint: "ark-response",
      configured: Boolean(config.apiKey && config.baseUrl && config.model),
      env: {
        ...getRequestSummary(config),
        modelVariable: process.env.ARK_MODEL?.trim()
          ? "ARK_MODEL"
          : process.env.ARK_TEXT_MODEL?.trim()
            ? "ARK_TEXT_MODEL"
            : "missing",
      },
    });
    return;
  }

  const payload = await readJsonBody(req);
  if (!payload.systemPrompt || !payload.userPrompt) {
    sendJson(req, res, 400, { error: "systemPrompt and userPrompt are required." });
    return;
  }

  if (!config.apiKey || !config.model) {
    sendJson(req, res, 500, {
      error: "Ark server environment variables are incomplete.",
      required: ["ARK_API_KEY", "ARK_MODEL or ARK_TEXT_MODEL"],
      env: getRequestSummary(config),
    });
    return;
  }

  if (payload.async) {
    const jobId = startArkResponseJob(config, payload);
    sendJson(req, res, 202, { ok: true, jobId, jobStatus: "running" });
    return;
  }

  const finishJson = createJsonKeepAliveResponse(req, res);
  finishJson(await runArkResponseRequest(config, payload));
}

async function handleArkImage(req, res) {
  const config = getArkImageConfig();

  if (req.method === "GET") {
    sendJson(req, res, 200, {
      service: "render-ark-backend",
      endpoint: "ark-image",
      configured: Boolean(config.apiKey && config.baseUrl && config.model),
      env: {
        hasApiKey: Boolean(config.apiKey),
        hasBaseUrl: Boolean(config.baseUrl),
        hasModel: Boolean(config.model),
        hasSize: Boolean(config.size),
        hasResponseFormat: Boolean(config.responseFormat),
      },
    });
    return;
  }

  const payload = await readJsonBody(req);
  const prompt = payload.prompt?.trim();
  if (!prompt) {
    sendJson(req, res, 400, { error: "prompt is required." });
    return;
  }

  if (!config.apiKey || !config.model) {
    sendJson(req, res, 500, {
      error: "Ark image environment variables are incomplete.",
      required: ["ARK_API_KEY", "ARK_IMAGE_MODEL"],
      env: {
        hasApiKey: Boolean(config.apiKey),
        hasModel: Boolean(config.model),
      },
    });
    return;
  }

  const response = await runQueuedImageRequest(() => fetchArkWithRetry(
    `${config.baseUrl}/images/generations`,
    {
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
    },
    "Ark image generation",
  ));

  const rawText = await response.text();
  let responsePayload = null;
  try {
    responsePayload = rawText ? JSON.parse(rawText) : null;
  } catch {
    responsePayload = null;
  }

  if (!response.ok) {
    sendJson(req, res, response.status, {
      error: `Ark image generation request failed with HTTP ${response.status}.`,
      detail: getImageErrorDetail(rawText, responsePayload),
    });
    return;
  }

  const imageUrl = extractImageUrl(responsePayload);
  if (!imageUrl) {
    sendJson(req, res, 502, {
      error: "Ark image generation succeeded but no image URL was found in the response.",
    });
    return;
  }

  sendJson(req, res, 200, {
    imageUrl,
    status: response.status,
    model: config.model,
  });
}

async function route(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, getCorsHeaders(req));
    res.end();
    return;
  }

  if (url.pathname === "/health" || url.pathname === "/") {
    sendJson(req, res, 200, {
      service: "render-ark-backend",
      ok: true,
      endpoints: ["/api/ark-response", "/api/ark-image"],
    });
    return;
  }

  if (url.pathname === "/api/ark-response" && (req.method === "GET" || req.method === "POST")) {
    await handleArkResponse(req, res);
    return;
  }

  if (url.pathname === "/api/ark-image" && (req.method === "GET" || req.method === "POST")) {
    await handleArkImage(req, res);
    return;
  }

  sendJson(req, res, 404, { error: "Not found." });
}

const server = createServer((req, res) => {
  route(req, res).catch((error) => {
    console.error("[render-ark-server]", error);
    sendJson(req, res, 500, {
      error: error instanceof Error ? error.message : "Unknown server error.",
    });
  });
});

server.requestTimeout = requestTimeoutMs;
server.headersTimeout = requestTimeoutMs + 5000;

server.listen(port, host, () => {
  console.log(`Render Ark backend listening on http://${host}:${port}`);
});
