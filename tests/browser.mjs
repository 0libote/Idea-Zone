import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const browser=await chromium.launch({headless:true,...(fs.existsSync('/usr/bin/google-chrome')?{executablePath:'/usr/bin/google-chrome'}:{})});
const context=await browser.newContext({acceptDownloads:true});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:5173');
 await page.getByRole('button',{name:'Report',exact:true}).click();
 assert.equal(await page.locator('#preview-label').textContent(),'Report · 3 sections');
 let frame=page.frames().find(f=>f.parentFrame());
 assert.equal(await frame.locator('html').getAttribute('data-style'),'report');
 await frame.getByRole('link',{name:'Daily routine',exact:true}).click();
 assert.equal(await frame.locator('section:visible').count(),1);
 assert.match(await frame.locator('section:visible').textContent(),/Handover entry/);
 await frame.getByRole('link',{name:'Read all',exact:true}).click();
 assert.equal(await frame.locator('section:visible').count(),3);
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#download-example').click()]);
 const downloaded=await download.path();
 const output=fs.readFileSync(downloaded,'utf8');
 assert.match(output,/data-style="report"/);
 assert.equal(download.suggestedFilename(),'support-handover-report.html');
 const [zip]=await Promise.all([page.waitForEvent('download'),page.locator('#download-plugin').click()]);
 assert.equal(fs.readFileSync(await zip.path()).subarray(0,2).toString(),'PK');
 for(const width of [375,768,1280]){
  await page.setViewportSize({width,height:820});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Landing page overflows at '+width);
 }
 await page.getByText('What does the reader need?',{exact:true}).click();
 assert.equal(await page.locator('details[open]').count(),1);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'idea-zone-browser-'));
 try{
  fs.writeFileSync(dir+'/idea.html',output);
  await page.goto('file://'+dir+'/idea.html');
  await context.setOffline(true);
  const initialText=await page.locator('article').textContent();
  for(const palette of ['midnight','warm','sage','neutral']){await page.locator('#palette').selectOption(palette);assert.equal(await page.locator('html').getAttribute('data-palette'),palette);assert.equal(await page.locator('html').getAttribute('data-style'),'report');assert.equal(await page.locator('article').textContent(),initialText)}
  assert.equal(await page.locator('select').count(),1,'Only colour can be switched');
  await page.getByRole('link',{name:'Daily routine',exact:true}).click();
  assert.equal(await page.locator('section:visible').count(),1);
  assert.equal(await page.locator('table').count(),1);
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('section:visible').count(),3,'Print includes all pages');
  await page.pdf({path:dir+'/idea.pdf',format:'A4'});
  assert.ok(fs.statSync(dir+'/idea.pdf').size>1000);
  await page.emulateMedia({media:'screen'});
  await page.getByRole('link',{name:'Read all',exact:true}).click();
  assert.equal(await page.locator('section:visible').count(),3);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Export overflows on desktop');
  await page.setViewportSize({width:375,height:812});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Export overflows on mobile');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
 assert.deepEqual(errors,[]);
 console.log('Browser checks passed: layout previews and reader palette switching, page navigation, both downloads, mobile layout, offline HTML, and all-page PDF printing.');
}finally{await browser.close()}
