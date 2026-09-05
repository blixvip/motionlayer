import { expect, test } from "@playwright/test";

test("style direction persists and is sent with the graphics request", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/");
  await page.getByRole("button", { name: /Field notes/ }).click();
  await page.getByLabel("Scene density").selectOption("balanced");
  await page.getByLabel("Motion energy").selectOption("expressive");
  await page.getByLabel("Creative note").fill("Documentary pace with imperfect human emphasis.");
  await page.reload();

  await expect(page.getByRole("button", { name: /Field notes/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Scene density")).toHaveValue("balanced");
  await expect(page.getByLabel("Motion energy")).toHaveValue("expressive");

  let requestBody: unknown;
  await page.route("**/api/graphics/plans", async (route) => {
    requestBody = route.request().postDataJSON();
    await route.continue({postData:JSON.stringify({...requestBody as object,provider:"preset"})});
  });
  await page.getByLabel("Script").fill("The old workflow is fast, but every output looks the same. A directed grammar gives every beat a reason to exist.");
  await page.getByRole("button", { name: "Build editable graphics" }).click();
  await expect(page.getByRole("heading", { name: "Graphics studio" })).toBeVisible({timeout:30000});
  expect(requestBody).toMatchObject({ direction: expect.stringContaining("field-notes balanced expressive") });
});

test("style director is legible at desktop and mobile widths", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Script").fill("First define the idea. Then show the proof with 42 real examples. Finish with a clear takeaway.");
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.screenshot({ path: ".impeccable/review/style-director-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".impeccable/review/style-director-mobile.png", fullPage: true });
  await expect(page.getByRole("button", { name: /Editorial proof/ })).toBeVisible();
  await expect(page.getByLabel("Creative note")).toBeVisible();
});
