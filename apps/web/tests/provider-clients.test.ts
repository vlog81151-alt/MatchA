import { afterEach, describe, expect, it, vi } from "vitest";

async function loadProviderClients() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.matcha.test/api");

  const [notificationClient, profileClient] = await Promise.all([
    import("../lib/notification-client"),
    import("../lib/profile-client")
  ]);

  return {
    notificationClient,
    profileClient
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("provider clients", () => {
  it("registers push tokens through the notification API", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        pushToken: {
          createdAt: "2026-06-30T09:00:00.000Z",
          deviceId: "browser-1",
          id: "push_1",
          lastSeenAt: "2026-06-30T09:00:00.000Z",
          platform: "WEB",
          revokedAt: null,
          updatedAt: "2026-06-30T09:00:00.000Z",
          userAgent: "MatchA Web"
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const { notificationClient } = await loadProviderClients();

    await expect(
      notificationClient.registerPushToken({
        deviceId: "browser-1",
        token: "fcm-token-for-browser-device-1234567890",
        userAgent: "MatchA Web"
      })
    ).resolves.toMatchObject({
      pushToken: {
        id: "push_1",
        platform: "WEB"
      }
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.matcha.test/api/notifications/push-tokens",
      expect.objectContaining({
        body: JSON.stringify({
          deviceId: "browser-1",
          token: "fcm-token-for-browser-device-1234567890",
          userAgent: "MatchA Web"
        }),
        method: "POST"
      })
    );
  });

  it("requests Cloudinary upload signatures through the profile API", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        upload: {
          apiKey: "cloudinary-key",
          cloudName: "matcha",
          folder: "matcha/verification/user_1",
          maxFileSizeBytes: 8000000,
          publicId: "verification_evidence-123",
          resourceType: "image",
          signature: "signed",
          timestamp: 1782800400,
          uploadUrl: "https://api.cloudinary.com/v1_1/matcha/image/upload"
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const { profileClient } = await loadProviderClients();

    await expect(
      profileClient.getProfilePhotoUploadSignature({
        purpose: "VERIFICATION_EVIDENCE"
      })
    ).resolves.toMatchObject({
      upload: {
        cloudName: "matcha",
        resourceType: "image"
      }
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.matcha.test/api/profile/photos/upload-signature",
      expect.objectContaining({
        body: JSON.stringify({
          purpose: "VERIFICATION_EVIDENCE"
        }),
        method: "POST"
      })
    );
  });
});
