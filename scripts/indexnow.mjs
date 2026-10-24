// Tells Bing (and Yandex, Seznam, Naver) about every URL in the live sitemap via IndexNow, so new
// and changed pages are crawled within hours. Bing's index also feeds ChatGPT search and Copilot.
// Run after a deploy to www.vocom.ai: node scripts/indexnow.mjs
// The key file public/5aac4306c8f508c7081346c9091fb957.txt must stay published at https://www.vocom.ai/5aac4306c8f508c7081346c9091fb957.txt
const KEY = "5aac4306c8f508c7081346c9091fb957";
const HOST = "www.vocom.ai";
const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.startsWith(`https://${HOST}/`));
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});
console.log(`IndexNow: ${urlList.length} URLs, HTTP ${res.status}`);
