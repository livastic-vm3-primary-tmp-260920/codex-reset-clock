#!/usr/bin/env node
/**
 * Real Chrome, ephemeral 127.0.0.1-only smoke test for Codex Limit Clock.
 * No public site visit, account login, Adsterra calls, fake traffic or clicks.
 * No Selenium/Playwright dependencies; uses Node 22 native WebSocket + CDP.
 */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {createServer} from "node:http";
import {readFile, mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, extname, resolve} from "node:path";
import {setTimeout as sleep} from "node:timers/promises";

const ROOT=resolve("docs");
const SAFE_PATHS=new Map([
  ["/","index.html"],["/index.html","index.html"],
  ["/ko/","ko/index.html"],["/ko/index.html","ko/index.html"],
  ["/assets/style.css","assets/style.css"],
  ["/assets/app.mjs","assets/app.mjs"],
  ["/assets/core.mjs","assets/core.mjs"],
  ["/sitemap.xml","sitemap.xml"]
]);
const requests=[];
const errors=[];
const server=createServer(async(req,res)=>{
  try {
    const pathname=new URL(req.url||"/","http://localhost").pathname;
    requests.push(pathname);
    const relative=SAFE_PATHS.get(pathname);
    if (!relative) {res.writeHead(404);res.end("");return;}
    const data=await readFile(join(ROOT,relative));
    const type=relative.endsWith(".mjs")?"text/javascript;charset=utf-8":
      relative.endsWith(".css")?"text/css;charset=utf-8":
      relative.endsWith(".xml")?"application/xml":
      "text/html;charset=utf-8";
    res.writeHead(200,{"content-type":type,"cache-control":"no-store",
      "Content-Security-Policy":"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'self' data:; form-action 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'"});
    res.end(data);
  } catch(err) {errors.push(String(err));res.writeHead(500);res.end("");}
});

async function waitUntil(probe,ms=12500) {
  const end=Date.now()+ms;
  while(Date.now()<end) {
    try {const value=await probe();if(value)return value;}
    catch { /* polling only for localhost setup */ }
    await sleep(90);
  }
  throw new Error("Timed out waiting for local-only Chrome smoke assertion");
}

class CDP {
  constructor(socket) {
    this.socket=socket;
    this.nextId=0;
    this.pending=new Map();
    socket.addEventListener("message",(event)=>{
      const message=JSON.parse(String(event.data));
      if(message.method==="Runtime.exceptionThrown") errors.push("RUNTIME_EXCEPTION");
      if(message.method==="Log.entryAdded" && message.params?.entry?.level==="error"){
        errors.push("CHROME_LOG_ERROR: "+String(message.params.entry.text).slice(0,270));
      }
      if (!message.id) return;
      const state=this.pending.get(message.id);
      if(!state)return;
      this.pending.delete(message.id);
      if(message.error)state.reject(new Error(JSON.stringify(message.error)));
      else state.resolve(message.result);
    });
  }
  async call(method,params={}) {
    const id=++this.nextId;
    const result=new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}));
    this.socket.send(JSON.stringify({id,method,params}));
    return await result;
  }
  async eval(script) {
    const out=await this.call("Runtime.evaluate",{
      expression:script,returnByValue:true,awaitPromise:true
    });
    if(out.exceptionDetails) throw new Error("Browser expression failed: "+JSON.stringify(out.exceptionDetails));
    return out.result.value;
  }
  async navigate(address) {
    const result=await this.call("Page.navigate",{url:address});
    if(result.errorText)throw new Error(result.errorText);
    return await waitUntil(async()=>{
      const snapshot=await this.eval("({ready:document.readyState,boot:document.getElementById('device-now')?.textContent,lang:document.documentElement.lang})");
      return snapshot?.ready==="complete" && snapshot.boot &&
         snapshot.boot!=="—" && snapshot.boot.trim().length>5 && snapshot;
    });
  }
  close(){this.socket.close();}
}

let chrome;
let profile;
let cdp;
try {
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const port=server.address().port;
  profile=await mkdtemp(join(tmpdir(),"codex-clock-owner-local-chrome-"));
  const chromium="/usr/bin/google-chrome";
  chrome=spawn(chromium,[
    "--headless=new","--no-sandbox","--disable-gpu",
    "--disable-background-networking","--disable-sync",
    "--disable-default-apps","--disable-extensions","--no-first-run",
    "--no-default-browser-check","--window-size=390,844",
    "--user-data-dir="+profile,
    "--remote-debugging-port=0","about:blank"
  ],{stdio:"ignore"});
  const endpoint=await waitUntil(async()=>{
    const file=await readFile(join(profile,"DevToolsActivePort"),"utf8");
    const line=file.split(/\r?\n/);
    return Number(line[0])>0?Number(line[0]):null;
  });
  const target=await waitUntil(async()=>{
    const response=await fetch("http://127.0.0.1:"+String(endpoint)+"/json/list");
    const pages=await response.json();
    return pages.find(page=>page.type==="page"&&page.webSocketDebuggerUrl);
  });
  const socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    socket.addEventListener("open",resolve,{once:true});
    socket.addEventListener("error",reject,{once:true});
  });
  cdp=new CDP(socket);
  await cdp.call("Page.enable");
  await cdp.call("Runtime.enable");
  await cdp.call("Log.enable");
  const origin="http://127.0.0.1:"+String(port);
  const en=await cdp.navigate(origin+"/");
  assert.equal(en.lang,"en");
  assert.equal(await cdp.eval("document.querySelectorAll('[data-window]').length"),3);
  assert.equal(await cdp.eval("document.querySelectorAll('button[data-calendar]:disabled').length"),3);
  assert.equal(await cdp.eval("document.getElementById('time-five').value"),"");
  assert.ok((await cdp.eval("document.title")).includes("Codex"));

  // Convert a real timezone-aware timestamp; never infer a global reset.
  const conversion=await cdp.eval("(()=>{const input=document.getElementById('utc-converter');input.value='2026-10-28T17:00Z';document.getElementById('convert').click();return document.getElementById('convert-result').textContent;})()");
  assert.ok(conversion.includes("UTC:"));
  assert.ok(conversion.includes("2026"));
  await cdp.eval("document.getElementById('zone').value='Asia/Seoul';document.getElementById('zone').dispatchEvent(new Event('change',{bubbles:true}));");
  const customZone=await cdp.eval("document.getElementById('zone').value");
  assert.equal(customZone,"Asia/Seoul");

  // Input a future personal window. Save ONLY after voluntary checkbox.
  const after=await cdp.eval("(()=>{const d=new Date(Date.now()+65*60000);d.setSeconds(0,0);const p=n=>String(n).padStart(2,'0');const local=d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes());const input=document.getElementById('time-five');input.value=local;input.dispatchEvent(new Event('input',{bubbles:true}));return {state:document.getElementById('window-five').dataset.state,count:document.querySelector('#window-five [data-count]').textContent,calDisabled:document.querySelector('#window-five [data-calendar]').disabled};})()");
  assert.equal(after.state,"future");
  assert.ok(after.count.includes("h"),after.count);
  assert.equal(after.calDisabled,false);
  assert.equal(await cdp.eval("localStorage.length"),0);
  const stored=await cdp.eval("(()=>{const x=document.getElementById('remember');x.checked=true;x.dispatchEvent(new Event('change',{bubbles:true}));return JSON.parse(localStorage.getItem('codex-limit-clock-consented-local-v1'));})()");
  assert.ok(stored?.times?.five);
  assert.equal(stored.zone,"Asia/Seoul");
  await cdp.navigate(origin+"/");
  const restored=await cdp.eval("({remember:document.getElementById('remember').checked,five:document.getElementById('time-five').value,zone:document.getElementById('zone').value})");
  assert.equal(restored.remember,true);
  assert.equal(restored.five,stored.times.five);
  assert.equal(restored.zone,"Asia/Seoul");

  // A fictional demo must never be saved or presented as a verified reset.
  const demo=await cdp.eval("(()=>{document.getElementById('demo').click();return {mode:document.getElementById('window-five').dataset.state,message:document.getElementById('feedback').textContent,remember:document.getElementById('remember').checked,storage:localStorage.getItem('codex-limit-clock-consented-local-v1')};})()");
  assert.equal(demo.mode,"demo");
  assert.match(demo.message,/DEMO ONLY/);
  assert.equal(demo.remember,false);
  assert.equal(demo.storage,null);
  const reset=await cdp.eval("(()=>{document.getElementById('clear').click();return {state:document.getElementById('window-five').dataset.state,five:document.getElementById('time-five').value,storage:localStorage.length};})()");
  assert.equal(reset.state,"unset");
  assert.equal(reset.five,"");
  assert.equal(reset.storage,0);

  // Estimate 5 elapsed hours, clearly labeled as approximate.
  const estimate=await cdp.eval("(()=>{const d=new Date();d.setSeconds(0,0);const p=n=>String(n).padStart(2,'0');const local=d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes());document.getElementById('start-five').value=local;document.getElementById('estimate').click();return {five:document.getElementById('time-five').value,warning:document.getElementById('feedback').textContent};})()");
  assert.ok(estimate.five);
  assert.match(estimate.warning,/Estimate only/);

  // A user may not infer real reset announcements from the demo.
  const ko=await cdp.navigate(origin+"/ko/");
  assert.equal(ko.lang,"ko");
  assert.ok((await cdp.eval("document.querySelector('h1').textContent")).includes("Codex"));
  assert.ok((await cdp.eval("document.title")).includes("초기화"));
  const koDemo=await cdp.eval("(()=>{document.getElementById('demo').click();return document.getElementById('feedback').textContent;})()");
  assert.match(koDemo,/데모/);
  const remote=await cdp.eval("performance.getEntriesByType('resource').map(x=>x.name)");
  assert.ok(remote.every(url=>url.startsWith(origin+"/")),remote.join("\n"));
  assert.ok(requests.includes("/"));
  assert.ok(requests.includes("/ko/"));
  assert.ok(requests.includes("/assets/app.mjs"));
  assert.ok(requests.includes("/assets/core.mjs"));
  assert.ok(requests.includes("/assets/style.css"));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({
    result:"REAL_LOCAL_CHROME_INTERACTION_PASS",
    english:"loaded, precise timestamp conversion, timezone and countdown",
    optInStorage:"explicit save and reload then demo clears correctly",
    calendar:"future enabled; .ics core independently tested",
    estimate:"marked as approximate",
    korean:"locale, clock and demo translated",
    publicSiteRequested:false,externalOriginRequests:0,
    advertiserCalls:0,publisherTrafficCreated:0,
    localRequestCount:requests.length
  },null,2));
} finally {
  if(cdp)cdp.close();
  if(chrome&&!chrome.killed)chrome.kill("SIGTERM");
  await new Promise(resolve=>server.close(resolve));
  if(profile)await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:120});
}
