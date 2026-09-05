import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
for (const [name, width, height, pathname] of [
  ["desktop", 1440, 900, "/projects/demo"],
  ["mobile", 390, 844, "/dashboard"],
]) {
  const context = await browser.newContext({ viewport: { width, height } });
  await context.addCookies([{ name: "motionlayer_session", value: "demo-workspace", domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:3110${pathname}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `.impeccable/review/${name}.png`, fullPage: true });
  const dimensions = await page.locator("body").evaluate((element) => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
  console.log(JSON.stringify({ name, title: await page.title(), dimensions }));
  await context.close();
}
await browser.close();
