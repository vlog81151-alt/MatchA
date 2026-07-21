import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";

describe("health routes", () => {
  const app = createApp();

  it("returns API health status", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.body).toMatchObject({
      service: "matcha-api",
      status: "ok"
    });
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });

  it("returns readiness checks", async () => {
    const response = await request(app).get("/api/ready").expect(200);

    expect(response.body).toMatchObject({
      checks: {
        api: "ok"
      },
      service: "matcha-api",
      status: "ok"
    });
  });
});
