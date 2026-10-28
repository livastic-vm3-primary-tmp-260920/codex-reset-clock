import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, statSync} from "node:fs";
import {execFileSync} from "node:child_process";

const root="https://livastic-vm3-primary-tmp-260920.github.io/codex-reset-clock/";
const preferred="https://devtools.trendbridged.com/codex-limit-clock/";
const preferredKo="https://devtools.trendbridged.com/ko/codex-limit-clock/";
const html={
 en:readFileSync("docs/index.html","utf8"),
 ko:readFileSync("docs/ko/index.html","utf8")
};
const app=readFileSync("docs/assets/app.mjs","utf8");
const css=readFileSync("docs/assets/style.css","utf8");
const sitemap=readFileSync("docs/sitemap.xml","utf8");

test("bilingual SEO pages are genuine, unique, canonical and reproducible",()=>{
 const output=execFileSync("python3",["scripts/build_pages.py","--check"],{
  encoding:"utf8",timeout:7000
 });
 assert.match(output,/EN_AND_KO_CANONICAL_PAGES_PRIVACY_SAFE/);
 assert.equal(output.match(/VERIFIED /g)?.length,5);
 for(const [lang,body] of Object.entries(html)){
  assert.ok(body.length>11_000);
  assert.ok(body.includes('<html lang="'+lang+'">'));
  assert.equal(body.match(/<h1 /g)?.length,1);
  assert.equal(body.match(/<title>/g)?.length,1);
  assert.equal(body.match(/rel="canonical"/g)?.length,1);
  assert.ok(body.includes('<link rel="canonical" href="'+(lang==="ko"?preferredKo:preferred)+'">'));
  assert.ok(body.includes('hreflang="en" href="'+preferred+'"'));
  assert.ok(body.includes('hreflang="ko" href="'+preferredKo+'"'));
  assert.ok(body.includes('hreflang="x-default" href="'+preferred+'"'));
  assert.equal(body.match(/rel="alternate"/g)?.length,3);
  assert.ok(body.includes('content="index,follow,max-snippet:-1"'));
  assert.ok(body.includes('name="description"'));
  assert.ok(body.includes('hreflang="en"'));
  assert.ok(body.includes('hreflang="ko"'));
  assert.ok(body.includes('href="'+root+'"'));
  assert.ok(body.includes('href="'+root+'ko/"'));
  assert.ok(body.includes('content="no-referrer"'));
  assert.equal(body.match(/data-window="/g)?.length,3);
  assert.equal(body.match(/data-calendar="/g)?.length,3);
  assert.equal(body.match(/type="datetime-local"/g)?.length,4);
  assert.ok(body.includes('id="remember"'));
  assert.ok(body.includes('id="utc-converter"'));
  assert.ok(body.includes('id="feedback"'));
  assert.ok(body.includes('id="demo"'));
  assert.ok(body.includes('id="clear"'));
 }
 assert.notEqual(html.en.match(/<title>(.*?)<\/title>/)[1],
   html.ko.match(/<title>(.*?)<\/title>/)[1]);
 assert.ok(html.ko.includes("초기화"));
 assert.ok(html.en.includes("banked"));
 assert.ok(html.ko.includes("보관된 초기화권"));
 assert.ok(html.en.includes('src="assets/app.mjs"'));
 assert.ok(html.ko.includes('src="../assets/app.mjs"'));
 assert.equal(statSync("docs/.nojekyll").size,0);
});

test("site has zero third-party asset requests and no ads or fake usage dates",()=>{
 for(const body of [html.en,html.ko]){
  for(const forbidden of [
    "googletagmanager","google-analytics","adsbygoogle","adsterra",
    "bauval.org","abscloud.org","araplhn.org","facebook.net",
    "cloudflareinsights","pixel.","<iframe","<form",
    'onclick="','onerror="','<img src="https://',
    "OAuth","API token","apiKey","<base href",
    "automatic global reset happens","global resets every","guaranteed reset"
  ])assert.ok(!body.toLowerCase().includes(forbidden.toLowerCase()),forbidden);
  assert.ok(body.includes("connect-src 'none'"));
  assert.ok(body.includes("script-src 'self'"));
  assert.ok(body.includes("frame-src 'none'"));
  assert.ok(body.includes("form-action 'none'"));
  assert.equal(body.match(/<script /g)?.length,1);
  assert.ok(!body.includes('type="date" value='));
  assert.ok(!body.includes('type="datetime-local" value='));
  assert.ok(body.includes("status.openai.com"));
  assert.ok(body.includes("help.openai.com"));
  assert.ok(body.includes("not")||body.includes("없"));
 }
 assert.ok(!app.includes("fetch("));
 assert.ok(!app.includes("XMLHttpRequest"));
 assert.ok(!app.includes("navigator.sendBeacon"));
 assert.ok(!app.includes("google-analytics"));
 assert.ok(!app.includes("window.location.search"));
 assert.ok(!app.includes("adsterra"));
 assert.ok(app.includes('get("remember")'));
 assert.ok(app.includes("setInterval(render,1000)"));
 assert.ok(app.includes("makeCalendarEvent"));
});

test("cross-site mirror sitemap points ONLY to primary verified branded canonical EN/KO URLs",()=>{
 const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 assert.deepEqual(urls,[preferred,preferredKo]);
 assert.ok(urls.every(u=>u.startsWith('https://devtools.trendbridged.com/')));
 assert.ok(sitemap.includes("<lastmod>2026-10-28</lastmod>"));
 assert.ok(!sitemap.includes("google_vignette"));
 assert.ok(urls.every(url=>!url.includes("?")));
 assert.ok(sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
});

test("published pure time core is byte-identical to source and no secrets bundled",()=>{
 const source=readFileSync("src/core.mjs");
 const publicModule=readFileSync("docs/assets/core.mjs");
 assert.deepEqual(source,publicModule);
 assert.ok(source.length>6000);
 assert.ok(css.length>8000);
 assert.ok(css.includes("@media(max-width:600px)"));
 assert.ok(css.includes(":focus-visible"));
 const repoReadme=readFileSync("README.md","utf8");
 for(const text of ["not affiliated with OpenAI","ad-free","global","localStorage"]){
  assert.ok(repoReadme.toLowerCase().includes(text.toLowerCase()),text);
 }
 assert.ok(!repoReadme.includes("publisher API token:"));
});
