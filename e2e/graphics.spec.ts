import { test, expect } from "@playwright/test";
test.setTimeout(120000);

test("script storyboard edits, alternatives, and durable reload", async ({page})=>{
  test.setTimeout(120000);
  await page.route("**/api/graphics/plans",async route=>{
    if(route.request().method()!=="POST")return route.continue();
    const input=route.request().postDataJSON();
    await route.continue({postData:JSON.stringify({...input,provider:"preset"})});
  });
  await page.goto("/",{waitUntil:"domcontentloaded"});
  await page.getByRole("textbox",{name:"Script",exact:true}).fill("The process takes 3 seconds. Click the button to continue.");
  await expect(page.getByRole("button",{name:"Build editable graphics"})).toBeEnabled();
  await page.getByRole("button",{name:"Build editable graphics"}).click();
  await expect(page.getByRole("heading",{name:"Graphics studio"})).toBeVisible({timeout:30000});
  await expect(page.getByRole("textbox",{name:"Headline",exact:true})).toBeEnabled({timeout:60000});
  await expect(page.getByRole("region",{name:"Job status"})).toContainText("Complete",{timeout:60000});
  await page.getByRole("textbox",{name:"Headline",exact:true}).fill("");
  await page.getByRole("button",{name:"Discard changes",exact:true}).click();
  await expect(page.getByRole("textbox",{name:"Headline",exact:true})).toHaveValue("The process takes 3 seconds.");
  await page.getByRole("button",{name:/02 3.5/}).click();
  await page.getByRole("button",{name:/01 0.0/}).click();
  await page.setViewportSize({width:1440,height:1000});
  await expect(page.frameLocator('iframe[title="Live graphics preview"]').getByRole("heading")).toBeVisible();
  await page.screenshot({path:".impeccable/review/graphics/desktop.png",fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>innerWidth)).toBe(390);
  await page.screenshot({path:".impeccable/review/graphics/mobile.png",fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole("textbox",{name:"Headline",exact:true}).fill("A clear, repeatable workflow");
  await expect(page.frameLocator('iframe[title="Live graphics preview"]').getByRole("heading",{name:"A clear, repeatable workflow"})).toBeVisible();
  await page.getByRole("button",{name:"Save scene",exact:true}).click();
  await expect(page.getByRole("button",{name:"Save scene",exact:true})).toBeDisabled();
  await page.getByLabel("content lock").check();
  await page.getByRole("button",{name:"Save scene",exact:true}).click();
  await expect(page.getByRole("button",{name:"Save scene",exact:true})).toBeDisabled();
  await page.reload({waitUntil:"domcontentloaded"});
  await page.getByRole("button",{name:"Resume saved graphics"}).click();
  await expect(page.getByRole("textbox",{name:"Headline",exact:true})).toHaveValue("A clear, repeatable workflow");
  await expect(page.getByRole("textbox",{name:"Headline",exact:true})).toBeDisabled();
  await page.getByRole("combobox",{name:"Generation",exact:true}).selectOption("preset");
  await page.getByRole("button",{name:"Explore alternatives",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Explore alternatives"})).toBeVisible({timeout:60000});
});

test("portrait preview preserves aspect ratio on short screens",async({page})=>{
  await page.route("**/api/graphics/plans",async route=>route.continue({postData:JSON.stringify({...route.request().postDataJSON(),provider:"preset"})}));
  await page.goto("/",{waitUntil:"domcontentloaded"});
  await page.getByRole("textbox",{name:"Script",exact:true}).fill("A clear idea deserves room to breathe.");
  await page.getByRole("button",{name:"9:16 Shorts / Reels / TikTok"}).click();
  await page.getByRole("button",{name:"Build editable graphics"}).click();
  await expect(page.getByRole("region",{name:"Job status"})).toContainText("Complete",{timeout:60000});
  await page.setViewportSize({width:800,height:600});
  await expect(page.frameLocator('iframe[title="Live graphics preview"]').getByRole("heading")).toBeVisible();
  const box=await page.locator(".gw-stage").boundingBox();
  expect(box).not.toBeNull();expect(box!.height/box!.width).toBeCloseTo(16/9,1);expect(box!.height).toBeLessThanOrEqual(451);
  await page.screenshot({path:".impeccable/review/graphics/portrait-short-screen.png",fullPage:true});
});
