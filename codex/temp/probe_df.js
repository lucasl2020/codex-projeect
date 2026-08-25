const path=require('node:path'); const {spawnSync}=require('node:child_process'); const {chromium}=require('playwright-core');
(async()=>{
  const ctx=await chromium.launchPersistentContext(path.join(__dirname,'browser-profile'),{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,viewport:null});
  const ck=await ctx.cookies('https://www.deepflood.com/');
  await ctx.close();
  console.log('deepflood cookies:', ck.map(c=>c.name).join(','));
  const r=spawnSync('D:\devloop-tools\python\python.exe',
    ['cf-attendance-json.py','https://www.deepflood.com/board','--origin','https://www.deepflood.com','--cookies',JSON.stringify(ck),'--timeout','60'],
    {encoding:'utf8',timeout:100000});
  console.log('--- result ---'); console.log(r.stdout||'(no stdout)');
  if(r.stderr) console.log('ERR',r.stderr.slice(0,300));
})().catch(e=>{console.error(e.message);process.exit(1);});
