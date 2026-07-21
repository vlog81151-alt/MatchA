import { afterEach, describe, expect, it, vi } from "vitest";

async function loadChatClient() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.matcha.test/api");

  return import("../lib/chat-client");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("chat client", () => {
  it("surfaces rate-limit text responses as usable errors", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("Too many requests. Please wait a minute and try again.", {
        headers: {
          "content-type": "text/plain"
        },
        status: 429
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const { getChats } = await loadChatClient();

    await expect(getChats()).rejects.toThrow(
      "Too many requests. Please wait a minute and try again."
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.matcha.test/api/chats?includeArchived=false",
      expect.objectContaining({
        credentials: "include"
      })
    );
  });

  it("exports the socket origin derived from the API URL", async () => {
    const { SOCKET_URL } = await loadChatClient();

    expect(SOCKET_URL).toBe("https://api.matcha.test");
  });
});
