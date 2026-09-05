import {test,expect} from "@playwright/test";
test.setTimeout(90000);

test("shader pixels are seek-stable and only one active canvas survives",async({page,request})=>{
  const response=await request.post("/api/graphics/plans",{data:{script:"Click the button to continue. Choose the next button.",provider:"preset"}});
  expect(response.ok()).toBe(true);let {plan,job}=await response.json();
  await expect.poll(async()=> (await (await request.get(`/api/graphics/jobs/${job.id}`)).json()).status,{timeout:60000}).toBe('complete');
  plan=await (await request.get(`/api/graphics/plans/${plan.id}`)).json();
  let revision=plan.revision;
  for(const scene of plan.scenes){const edited=await request.patch(`/api/graphics/plans/${plan.id}/scenes/${scene.id}`,{data:{revision,scene:{...scene,style:{...scene.style,material:'metal'}}}});expect(edited.ok()).toBe(true);revision=(await edited.json()).revision;}
  await page.goto(`/api/graphics/plans/${plan.id}/preview`,{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.__graphics?.ready && (document.querySelector("canvas")?.width || 0)>100);
  const state=await page.evaluate(()=>{
    const pixels=(t:number)=>{window.__graphics.seek(t);return document.querySelector("canvas")!.toDataURL();};
    const a=pixels(1.1),b=pixels(2.4),c=pixels(1.1);
    window.__graphics.seek(4.4);const active=document.querySelectorAll("canvas").length;
    window.__graphics.seek(1.1);const returned=document.querySelectorAll("canvas").length;
    window.__graphics.dispose();return {same:a===c,animated:a!==b,active,returned,disposed:document.querySelectorAll("canvas").length};
  });
  expect(state).toEqual({same:true,animated:true,active:1,returned:1,disposed:0});
});

test("missing WebGL is an explicit readable preview fallback",async({page,request})=>{
  let {plan,job}=await (await request.post("/api/graphics/plans",{data:{script:"Click the button to continue.",provider:"preset"}})).json();
  await expect.poll(async()=> (await (await request.get(`/api/graphics/jobs/${job.id}`)).json()).status,{timeout:60000}).toBe('complete');
  plan=await (await request.get(`/api/graphics/plans/${plan.id}`)).json();
  const scene=plan.scenes[0];await request.patch(`/api/graphics/plans/${plan.id}/scenes/${scene.id}`,{data:{revision:plan.revision,scene:{...scene,style:{...scene.style,material:'metal'}}}});
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]){if(type.startsWith("webgl"))return null;return Reflect.apply(original,this,[type,...args]);} as typeof original;});
  await page.goto(`/api/graphics/plans/${plan.id}/preview`,{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.__graphics?.ready);
  await page.evaluate(()=>window.__graphics.seek(1));
  await expect(page.getByRole("heading",{name:"Click the button to continue."})).toBeVisible();
  expect(await page.evaluate(()=>!!window.__graphics.error)).toBe(true);
  await expect(page.locator("canvas")).toHaveCount(0);
});
