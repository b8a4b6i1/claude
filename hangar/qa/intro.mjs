import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', headless:true, args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true }); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:4180/index.html'); await p.waitForFunction(()=>window.__dioramaReady,null,{timeout:120000});
const u=()=>p.evaluate(()=>{const c=window.__diorama.camera;return [c.view.offsetX.toFixed(0), document.getElementById('hint').className]});
for (let i=0;i<5;i++){ console.log(await u()); if(i==1) await p.screenshot({path:'qa/shots/intro.png'}); await p.waitForTimeout(3000); }
await p.mouse.click(200,400); await p.waitForTimeout(1500); console.log('after touch', await u()); await p.waitForTimeout(3000); console.log(await u());
console.log(errs); await b.close();
