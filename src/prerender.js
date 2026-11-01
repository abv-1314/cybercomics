#!/usr/bin/env node
/* Вписывает в dist/ готовую разметку каждой страницы, чтобы Яндекс, Google и ИИ-поиск
 * видели текст выпусков без выполнения JavaScript. Нужен Chromium и Playwright.
 *   node src/build.js && node src/prerender.js
 * Заодно:
 *   - добавляет в каждый выпуск свёрнутый текстовый конспект (src/seo.js → injectKonspekt);
 *   - снимает картинки для соцсетей 1200×630 в assets/og/ (кроме PREVIEW и страниц с noindex);
 *   - в конце вызывает src/seo.js: title/description, canonical, OG, JSON-LD, sitemap, robots, llms.txt. */
"use strict";
const fs = require("fs");
const path = require("path");
const http = require("http");
const seo = require("./seo");
let chromium;
try { ({ chromium } = require("playwright")); } catch (e) { ({ chromium } = require("/opt/node22/lib/node_modules/playwright")); }

const PREVIEW = !!process.env.PREVIEW;
const DIST = path.join(__dirname, "..", PREVIEW ? "preview" : "dist");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png" };

const server = http.createServer((req, res) => {
  let p = path.join(DIST, decodeURIComponent(req.url.split("?")[0]));
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (!fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});

server.listen(0, async () => {
  const port = server.address().port;
  const pages = JSON.parse(fs.readFileSync(path.join(DIST, "pages.json"), "utf8"));
  const ctx = seo.context(DIST);
  // Конспект кладём в шаблон фрагмента до отрисовки: так он попадёт и в запечённый HTML, и в живую страницу.
  pages.forEach((p) => seo.injectKonspekt(path.join(DIST, p.file), ctx));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const shot = PREVIEW ? null : await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const og = {};
  for (const p of pages) {
    await page.goto("http://127.0.0.1:" + port + "/" + p.route, { waitUntil: "networkidle" });
    // Тело выпуска из фрагмента: запекаем чистую разметку из <template> без <script>
    // (текст виден поисковикам), а не состояние после работы его JS. При загрузке игрушка 'ix'
    // заменит это содержимое свежей копией и запустит скрипты ровно один раз.
    await page.$$eval('#app .toy-host[data-toy="ix"]', (hosts) => {
      const tpl = document.getElementById("ix-fragment");
      hosts.forEach((h) => {
        h.textContent = "";
        if (!tpl) return;
        const frag = document.importNode(tpl.content, true);
        frag.querySelectorAll("script").forEach((s) => s.remove()); // до вставки, чтобы не выполнились
        h.appendChild(frag);
      });
    });
    const inner = await page.$eval("#app", (el) => el.innerHTML);
    // Картинка для соцсетей: верх страницы (шапка выпуска) 1200×630, JPEG.
    if (shot && !(p.noindex && !(seo.PAGE_SEO[p.route] || {}).index)) {
      try {
        await shot.goto("http://127.0.0.1:" + port + "/" + p.route, { waitUntil: "networkidle" });
        await shot.evaluate(() => document.fonts && document.fonts.ready);
        const name = (p.route.replace(/\/$/, "").replace(/\//g, "-") || "home") + ".jpg";
        fs.mkdirSync(path.join(DIST, "assets", "og"), { recursive: true });
        // У выпуска кадр начинается с обложки (без меню сверху): от h1 вверх до блока во всю ширину.
        const y = p.route ? await shot.evaluate(() => {
          let el = document.querySelector("#app h1");
          while (el && el.parentElement && el.getBoundingClientRect().width < 1000) el = el.parentElement;
          return el ? Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY) - 16) : 0;
        }) : 0;
        const h = await shot.evaluate(() => document.documentElement.scrollHeight);
        await shot.screenshot({ path: path.join(DIST, "assets", "og", name), type: "jpeg", quality: 78, fullPage: y + 630 > 630,
          clip: { x: 0, y: Math.min(y, Math.max(0, h - 630)), width: 1200, height: 630 } });
        og[p.route] = "assets/og/" + name;
      } catch (e) { console.warn("  не снял картинку для " + p.route + ": " + e.message); }
    }
    const file = path.join(DIST, p.file);
    const html = fs.readFileSync(file, "utf8").replace('<div id="app"></div>', '<div id="app">' + inner + "</div>");
    fs.writeFileSync(file, html);
    console.log("  " + p.route + "  " + Math.round(inner.length / 1024) + " КБ");
  }
  await browser.close();
  server.close();
  fs.unlinkSync(path.join(DIST, "pages.json"));
  seo.apply(DIST, { og });
  if (errors.length) { console.error("Ошибки на страницах:\n" + errors.join("\n")); process.exit(1); }
  console.log("Предварительная отрисовка готова.");
});
