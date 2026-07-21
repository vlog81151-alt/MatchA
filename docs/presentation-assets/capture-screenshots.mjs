import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const assetDir = "E:/Project/matcha/docs/presentation-assets";
const webUrl = "http://192.168.1.5:3000";
const adminUrl = "http://localhost:3001";
const webApiUrl = "http://192.168.1.5:5000/api";
const adminApiUrl = "http://localhost:5000/api";

await mkdir(assetDir, { recursive: true });

const browser = await chromium.launch({
  headless: true
});

async function waitForSettled(page) {
  await page.waitForLoadState("load", { timeout: 30_000 });
  await page.waitForTimeout(2_000);
}

async function prepareContext(context) {
  await context.route("**/api/**", async (route) => {
    const headers = {
      ...route.request().headers(),
      "cache-control": "no-store",
      pragma: "no-cache"
    };

    delete headers["if-none-match"];
    delete headers["if-modified-since"];

    await route.continue({ headers });
  });
}

async function screenshot(page, name, url, options = {}) {
  await page.goto(url, { waitUntil: "load", timeout: 45_000 });
  await waitForSettled(page);
  await hideDevOverlays(page);
  if (options.waitForText) {
    await page.waitForFunction(
      (text) => document.body.innerText.toLowerCase().includes(text.toLowerCase()),
      options.waitForText,
      { timeout: 30_000 }
    );
    await page.waitForTimeout(800);
  }
  await page.screenshot({
    fullPage: options.fullPage ?? false,
    path: path.join(assetDir, name)
  });
}

async function hideDevOverlays(page) {
  await page
    .addStyleTag({
      content: `
        nextjs-portal,
        [data-nextjs-toast],
        [data-nextjs-dialog-overlay],
        [data-nextjs-dev-tools-button],
        .nextjs-toast {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }
      `
    })
    .catch(() => undefined);
  await page
    .evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((element) => element.remove());
    })
    .catch(() => undefined);
}

async function apiLogin(context, apiUrl, origin, credentials) {
  const response = await context.request.post(`${apiUrl}/auth/login`, {
    data: credentials,
    headers: {
      Origin: origin,
      "Cache-Control": "no-store"
    }
  });

  if (!response.ok()) {
    throw new Error(`Login failed (${response.status()}): ${await response.text()}`);
  }
}

async function loginWeb(context, page) {
  await apiLogin(context, webApiUrl, webUrl, {
    email: "aanya@matcha.local",
    password: "Matcha@2026",
    rememberMe: true
  });
  await page.goto(`${webUrl}/home`, { waitUntil: "load", timeout: 45_000 });
  await page.waitForTimeout(2_500);
}

async function loginAdmin(context, page) {
  await apiLogin(context, adminApiUrl, adminUrl, {
    email: "admin@matcha.local",
    password: "Admin@2026",
    rememberMe: true
  });
  await page.goto(adminUrl, { waitUntil: "load", timeout: 45_000 });
  await page.waitForTimeout(2_500);
}

const desktop = await browser.newContext({
  extraHTTPHeaders: {
    "Cache-Control": "no-store"
  },
  viewport: { height: 900, width: 1440 }
});
await prepareContext(desktop);
const desktopPage = await desktop.newPage();
await screenshot(desktopPage, "01-landing-desktop.png", webUrl);
await screenshot(desktopPage, "02-login-desktop.png", `${webUrl}/login`);
await desktop.close();

const mobile = await browser.newContext({
  extraHTTPHeaders: {
    "Cache-Control": "no-store"
  },
  viewport: { height: 844, width: 390 }
});
await prepareContext(mobile);
const mobilePage = await mobile.newPage();
await loginWeb(mobile, mobilePage);

const mobileScreens = [
  ["03-home-mobile.png", "/home", "vibed"],
  ["04-instant-date-mobile.png", "/instant-date", "choose your vibe"],
  ["05-concert-mode-mobile.png", "/concert-mode", "upcoming for you"],
  ["06-events-mobile.png", "/events", "local plans"],
  ["07-notifications-mobile.png", "/notifications", "notifications"],
  ["08-matches-mobile.png", "/matches", "matches"],
  ["09-chats-mobile.png", "/chats", "chats"],
  ["10-profile-mobile.png", "/profile", "Edit your profile"]
];

for (const [name, route, waitForText] of mobileScreens) {
  await screenshot(mobilePage, name, `${webUrl}${route}`, { waitForText });
  await pagePause();
}
await mobile.close();

const admin = await browser.newContext({
  extraHTTPHeaders: {
    "Cache-Control": "no-store"
  },
  viewport: { height: 900, width: 1440 }
});
await prepareContext(admin);
const adminPage = await admin.newPage();
await loginAdmin(admin, adminPage);
await screenshot(adminPage, "11-admin-dashboard-desktop.png", adminUrl, {
  waitForText: "Review queues"
});
await admin.close();

await browser.close();

console.log(`Captured ${2 + mobileScreens.length + 1} screenshots in ${assetDir}`);

async function pagePause() {
  await new Promise((resolve) => setTimeout(resolve, 1_000));
}
