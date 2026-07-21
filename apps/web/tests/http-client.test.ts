import { afterEach, describe, expect, it, vi } from "vitest";

async function loadClient() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.matcha.test/api");

  return import("../lib/http-client");
}

function mockFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("http client", () => {
  it("sends JSON requests with credentials", async () => {
    const { requestJson } = await loadClient();
    const fetchMock = mockFetch(
      new Response(JSON.stringify({ status: "ok" }), {
        headers: {
          "content-type": "application/json"
        },
        status: 200
      })
    );

    await expect(requestJson<{ status: "ok" }>("/health")).resolves.toEqual({
      status: "ok"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.matcha.test/api/health",
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        })
      })
    );
  });

  it("returns undefined for no-content responses", async () => {
    const { requestJson } = await loadClient();

    mockFetch(new Response(null, { status: 204 }));

    await expect(requestJson<void>("/auth/logout")).resolves.toBeUndefined();
  });

  it("throws JSON API error messages", async () => {
    const { requestJson } = await loadClient();

    mockFetch(
      new Response(
        JSON.stringify({
          error: {
            message: "Authentication is required"
          }
        }),
        {
          headers: {
            "content-type": "application/json"
          },
          status: 401
        }
      )
    );

    await expect(requestJson("/profile/me")).rejects.toThrow("Authentication is required");
  });

  it("throws plain-text API error messages without JSON parse noise", async () => {
    const { requestJson } = await loadClient();

    mockFetch(
      new Response("Too many requests. Please wait a minute and try again.", {
        headers: {
          "content-type": "text/plain"
        },
        status: 429
      })
    );

    await expect(requestJson("/chats")).rejects.toThrow(
      "Too many requests. Please wait a minute and try again."
    );
  });

  it("reports invalid JSON responses clearly", async () => {
    const { requestJson } = await loadClient();

    mockFetch(
      new Response("not-json", {
        headers: {
          "content-type": "application/json"
        },
        status: 500
      })
    );

    await expect(requestJson("/matching/recommendations")).rejects.toThrow(
      "Invalid JSON response from MatchA API (500)"
    );
  });

  it("builds stable search strings and drops empty values", async () => {
    const { buildSearchParams } = await loadClient();

    expect(
      buildSearchParams({
        cursor: undefined,
        limit: 20,
        q: "",
        unread: false
      })
    ).toBe("?limit=20&unread=false");
  });
});
