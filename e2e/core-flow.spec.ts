import { expect, test } from "@playwright/test";

test("approve, revise, and open export QC", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter workspace/i }).click();
  await page.getByRole("link", { name: /Motion with intention/i }).click();
  await expect(page.getByText("SOURCE EDIT LOCKED")).toBeVisible();
  await page.getByRole("button", { name: /Step list/i }).last().click();
  await page.getByRole("textbox", { name: /Try:/i }).fill("Make this calmer and more premium");
  const revise = page.getByRole("button", { name: /Generate revision/i });
  await expect(revise).toBeEnabled({ timeout: 3_000 });
  await revise.click();
  await expect(page.getByRole("textbox", { name: /Try:/i })).toHaveValue("", { timeout: 60_000 });
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await expect(page.getByText("Ready for master render")).toBeVisible();
  await page.getByRole("button", { name: "Start master render" }).click();
  await expect(page.getByRole("link", { name: "Download verified MP4" })).toBeVisible();
});
