import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

const configDir = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(configDir, "../.env") });
config({ path: resolve(configDir, ".env"), override: false });

export default defineConfig({
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL")
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  schema: "prisma/schema.prisma"
});
