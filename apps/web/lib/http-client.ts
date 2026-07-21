export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

export type RequestOptions = RequestInit & { body?: BodyInit | null };

export function buildSearchParams<TParams extends object>(params: TParams): string {
  const query = new URLSearchParams();

  Object.entries(params as Record<string, boolean | number | string | undefined>).forEach(
    ([key, value]) => {
      if (value !== undefined && value !== "") {
        query.set(key, String(value));
      }
    }
  );

  const value = query.toString();

  return value ? `?${value}` : "";
}

async function parseResponse<TResponse>(
  response: Response
): Promise<(TResponse & ApiErrorPayload) | undefined> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as TResponse & ApiErrorPayload;
    } catch {
      return {
        error: {
          message: `Invalid JSON response from MatchA API (${response.status})`
        }
      } as TResponse & ApiErrorPayload;
    }
  }

  return {
    error: {
      message: text
    }
  } as TResponse & ApiErrorPayload;
}

export async function requestJson<TResponse>(
  path: string,
  options: RequestOptions = {},
  fallbackMessage = "Request failed"
): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });

  const payload = await parseResponse<TResponse>(response);

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? fallbackMessage);
  }

  return payload as TResponse;
}
