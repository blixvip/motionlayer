import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
test.setTimeout(120000);
test('reference palette reaches the plan and the real preview',async({page})=>{
  await page.route('**/api/graphics/plans',async route=>route.continue({postData:JSON.stringify({...route.request().postDataJSON(),provider:'preset'})}));
  await page.goto('/');
  await page.getByLabel('Color reference image').setInputFiles('03-assets/refs/palette-and-spatial-type.webp');
  await expect(page.getByText('Sampled from your image')).toBeVisible();
  await page.getByRole('textbox',{name:'Script',exact:true}).fill('Every idea deserves a clear visual story.');
  const result=page.waitForResponse(r=>r.url().endsWith('/api/graphics/plans') && r.request().method()==='POST');
  await page.getByRole('button',{name:'Build editable graphics'}).click();
  const {plan}=await (await result).json();expect(plan.generation.note).toContain('reference ');
  await expect(page.frameLocator('iframe[title="Live graphics preview"]').getByRole('heading')).toBeVisible({timeout:60000});
  await expect(page.frameLocator('iframe[title="Live graphics preview"]').locator('.mg-hero img')).toBeVisible();
});
test('studio specimen is real playable output and workbench fits its screens',async({page})=>{
  await page.goto('/');await expect(page.getByRole('textbox',{name:'Script',exact:true})).toBeEnabled();
  await expect.poll(()=>page.locator('video').evaluate((video:HTMLVideoElement)=>video.readyState)).toBeGreaterThanOrEqual(1);
  expect(await page.locator('video').evaluate((video:HTMLVideoElement)=>video.duration)).toBeCloseTo(13,0);
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['user-1920',1920,1080]] as const){
    await page.setViewportSize({width,height});await expect.poll(()=>page.evaluate(()=>innerWidth)).toBe(width);
    await page.screenshot({path:`.impeccable/review/motion-v2/${name}.png`,fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.getByRole('heading',{name:'Give your words a visual voice.'})).toBeVisible();
    await expect(page.getByText('Example render · 16:9',{exact:true})).toBeVisible();
  }
});
test('native scene frames are readable and seek-stable',async({page})=>{
  for(const format of ['landscape','short-form']){
    await page.goto(`/api/graphics/plans/gp_studio_v2_${format}/preview`);
    await page.waitForFunction(()=>window.__graphics?.ready);
    await page.setViewportSize(format==='landscape'?{width:1920,height:1080}:{width:1080,height:1920});
    for(const [index,time] of [2,6.8,11].entries()){
      await page.evaluate(t=>window.__graphics.seek(t),time);
      await page.screenshot({path:`.impeccable/review/motion-v2/${format}-frame-${index}.png`});
      expect(await page.locator('h1').innerText()).not.toBe('');
    }
    await page.evaluate(()=>window.__graphics.seek(2));const a=await page.screenshot();await page.evaluate(()=>{window.__graphics.seek(11);window.__graphics.seek(2);});const b=await page.screenshot();
    if(!a.equals(b)){
      await writeFile(`.impeccable/review/motion-v2/${format}-seek-before.png`,a);await writeFile(`.impeccable/review/motion-v2/${format}-seek-after.png`,b);
      const aa=await sharp(a).raw().toBuffer(),bb=await sharp(b).raw().toBuffer();let differences=0,total=0,max=0;for(let i=0;i<aa.length;i++){const delta=Math.abs(aa[i]-bb[i]);if(delta>0)differences++;total+=delta;max=Math.max(max,delta);}console.log({format,differences,ratio:differences/aa.length,mean:total/aa.length,max});
    }
    expect(createHash('sha256').update(b).digest('hex'),format).toEqual(createHash('sha256').update(a).digest('hex'));
  }
});
