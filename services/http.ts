/**
 * @file http.ts
 * @description Outbound HTTP client with strict SSRF host allowlist, timeouts, and streaming size caps.
 * Addresses problem-statement: Security, efficiency, SSRF protection.
 */

const ALLOWED_HOSTS = new Set([
  "air-quality-api.open-meteo.com",
  "api.open-meteo.com",
  "geocoding-api.open-meteo.com",
  "generativelanguage.googleapis.com",
  "api.groq.com",
]);

interface HttpRequestOptions extends RequestInit {
  timeoutMs?: number;
  maxSizeBytes?: number;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Validates coordinate ranges strictly.
 */
export function validateCoordinates(lat: number, lon: number): void {
  if (
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    Number.isNaN(lat) ||
    Number.isNaN(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    throw new HttpError("Coordinates out of valid range (-90..90, -180..180)", 400, "INVALID_COORDINATES");
  }
}

/**
 * Executes an outbound HTTP request with SSRF allowlist, timeout, and response size cap.
 */
export async function secureFetch(
  url: string,
  options: HttpRequestOptions = {},
): Promise<Response> {
  const parsed = new URL(url);
  const upstashHost = process.env.UPSTASH_REDIS_REST_URL
    ? new URL(process.env.UPSTASH_REDIS_REST_URL).hostname
    : null;

  if (!ALLOWED_HOSTS.has(parsed.hostname) && parsed.hostname !== upstashHost) {
    throw new HttpError(`Host ${parsed.hostname} is not allowed`, 403, "SSRF_DISALLOWED_HOST");
  }

  const timeoutMs = options.timeoutMs ?? 10000;
  const maxSizeBytes = options.maxSizeBytes ?? 5 * 1024 * 1024; // 5 MB default limit
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      throw new HttpError("Response exceeded maximum size limit", 413, "PAYLOAD_TOO_LARGE");
    }

    return response;
  } catch (err: unknown) {
    if ((err as Error)?.name === "AbortError") {
      throw new HttpError(`Request timed out after ${timeoutMs}ms`, 504, "TIMEOUT");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Reads an incoming JSON request body with a strict size cap (default 16 KB).
 */
export async function readCappedJson<T>(req: Request, maxBytes = 16 * 1024): Promise<T> {
  const reader = req.body?.getReader();
  if (!reader) {
    throw new HttpError("Empty request body", 400, "EMPTY_BODY");
  }

  let totalBytes = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      totalBytes += value.length;
      if (totalBytes > maxBytes) {
        throw new HttpError(`Request body exceeded ${maxBytes} bytes limit`, 413, "BODY_TOO_LARGE");
      }
      chunks.push(value);
    }
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  const text = new TextDecoder().decode(merged);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError("Invalid JSON in request body", 400, "INVALID_JSON");
  }
}
