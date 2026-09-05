import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL, trace: "on-first-retry", channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
  webServer: { command: `npm run dev -- --port ${port}`, url: `${baseURL}/login`, reuseExistingServer: true, timeout: 120_000 },
});
