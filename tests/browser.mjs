import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const browser=await chromium.launch({headless:true,...(fs.existsSync('/usr/bin/google-chrome')?{executablePath:'/usr/bin/google-chrome'}:{})});
const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'idea-zone-reader-'));
try{
 await page.goto('http://localhost:5173');
 for(const width of [375,768,1280]){await page.setViewportSize({width,height:850});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
 await page.locator('[data-demo-palette="midnight"]').click();
 await page.locator('[data-demo-font="serif"]').click();
 assert.equal(await page.locator('#reading-sample').getAttribute('data-font'),'serif');
 for(const style of ['brief','editorial','report']){
  const [doc]=await Promise.all([page.waitForEvent('popup'),page.locator('a.example-card[data-example="'+style+'"]').click()]);
  await doc.waitForLoadState('load');
  assert.equal(await doc.locator('html').getAttribute('data-style'),style);
  assert.ok(await doc.locator('article img').count()>0);
  const before=await doc.locator('article').textContent();
  await doc.locator('#appearance summary').click();
  for(const font of ['sans','serif','mono','default']){await doc.locator('[data-font-choice="'+font+'"]').click();assert.equal(await doc.locator('html').getAttribute('data-font'),font)}
  for(const palette of ['warm','sage','midnight','neutral']){await doc.locator('[data-palette-choice="'+palette+'"]').click();assert.equal(await doc.locator('html').getAttribute('data-palette'),palette)}
  assert.equal(await doc.locator('article').textContent(),before);
  await doc.keyboard.press('Escape');
  await doc.locator('nav a[href="#page-2"]').click();
  assert.equal(await doc.locator('article>.document-section:visible').count(),1);
  await doc.locator('#all').click();
  assert.equal(await doc.locator('article>.document-section:visible').count(),3);
  await doc.emulateMedia({media:'print'});
  assert.equal(await doc.locator('article>.document-section:visible').count(),3);
  await doc.pdf({path:path.join(directory,style+'.pdf'),format:'A4'});
  await doc.emulateMedia({media:'screen'});
  for(const width of [375,768,1280]){await doc.setViewportSize({width,height:850});assert.equal(await doc.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  if(style==='brief'){
   await doc.locator('#appearance summary').click();await doc.locator('[data-palette-choice="midnight"]').click();await doc.locator('[data-font-choice="serif"]').click();
   const [download]=await Promise.all([doc.waitForEvent('download'),doc.locator('#save').click()]);
   await download.saveAs(path.join(directory,'saved.html'));
   assert.match(fs.readFileSync(path.join(directory,'saved.html'),'utf8'),/data-palette="midnight" data-font="serif"/);
  }
  await doc.close();
 }
 const [zip]=await Promise.all([page.waitForEvent('download'),page.locator('#download-plugin').click()]);assert.equal(fs.readFileSync(await zip.path()).subarray(0,2).toString(),'PK');
 await context.setOffline(true);
 await page.goto('file://'+path.join(directory,'saved.html'));
 await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('html').getAttribute('data-font'),'serif');
 await page.locator('nav a[href="#page-3"]').click();assert.equal(await page.locator('article>.document-section:visible').count(),1);
 await page.locator('#all').click();await page.locator('article img').first().scrollIntoViewIfNeeded();
 assert.equal(await page.locator('article img').first().evaluate(i=>i.complete&&i.naturalWidth>0),true);
 assert.deepEqual(errors,[]);
 console.log('Browser checks passed: all examples open in new tabs, fonts and colours work, saved choices persist offline, images and navigation work, and PDF printing includes all sections.');
}finally{await browser.close();fs.rmSync(directory,{recursive:true,force:true})}
