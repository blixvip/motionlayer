import { expect, test } from "@playwright/test";

test("creator library stays usable and copies the full script archive", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/styles");

  await expect(page.getByRole("heading", { name: "Creator Style Library" })).toBeVisible();
  await expect(page.getByLabel("5 creators and 103 transcripts")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("creator-library-desktop.png"), fullPage: false });

  const insiderForce = page.getByRole("article").filter({ hasText: "InsiderForce" });
  await insiderForce.scrollIntoViewIfNeeded();
  await expect(insiderForce.getByRole("button", { name: "Copy all scripts" })).toBeVisible();
  await insiderForce.getByRole("button", { name: "Copy all scripts" }).click();
  await expect(insiderForce.getByRole("button", { name: "Copied" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("# InsiderForce");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByLabel("5 creators and 103 transcripts")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("creator-library-mobile.png"), fullPage: false });
});
