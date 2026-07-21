import { z } from "zod";

const healthSchema = z.object({
  service: z.string(),
  status: z.literal("ok"),
  timestamp: z.string()
});

export type HealthResponse = z.infer<typeof healthSchema>;

function getServerApiUrl(): string {
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }

  if (publicApiUrl?.startsWith("http")) {
    return publicApiUrl;
  }

  return "http://localhost:5000/api";
}

export async function getHealth(): Promise<HealthResponse> {
  const baseUrl = getServerApiUrl();
  const response = await fetch(`${baseUrl}/health`, {
    headers: {
      Accept: "application/json"
    },
    next: {
      revalidate: 30
    }
  });

  if (!response.ok) {
    throw new Error("Unable to reach MatchA API");
  }

  return healthSchema.parse(await response.json());
}
