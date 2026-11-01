#!/usr/bin/env node
/* Сборка сайта CyberComics из макета.
 *   node src/build.js            → папка dist/ (без предварительной отрисовки)
 *   node src/prerender.js        → вписывает готовую разметку в dist/ для поисковиков
 * Адрес сайта для sitemap.xml и canonical: переменная окружения SITE_URL
 * (например SITE_URL=https://твой-домен.ru). Каналы: TELEGRAM_URL (основной) и VK_URL (по желанию).
 * Подвал и данные: CONTACT_EMAIL (почта для связи), METRIKA_ID (номер счётчика Яндекс.Метрики;
 * без него Метрики и окна про cookie нет), OPERATOR (кто оператор данных в политике; без него
 * «владелец сайта» и домен). Тексты страниц /privacy/, /soglasie/ — src/legal/*.html.
 * Не задан ни один канал — на главной вместо кнопки неактивная плашка «Канал скоро». */
"use strict";
const fs = require("fs");
const path = require("path");

const SRC = __dirname;
const DIST = path.join(SRC, "..", process.env.PREVIEW ? "preview" : "dist");
const SITE_URL = (process.env.SITE_URL || "").replace(/\/$/, "");
const TELEGRAM_URL = process.env.TELEGRAM_URL || "";
const VK_URL = process.env.VK_URL || "";
const CONTACT_EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(process.env.CONTACT_EMAIL || "") ? process.env.CONTACT_EMAIL : "";
const METRIKA_ID = /^\d{5,12}$/.test(process.env.METRIKA_ID || "") ? process.env.METRIKA_ID : "";
const OPERATOR = (process.env.OPERATOR || "").trim();
// Ссылку на канал принимаем только https:// — иначе считаем, что канала нет.
const okUrl = (u) => (/^https:\/\/[^\s"'<>]+$/.test(u) ? u : "");

const read = (p) => fs.readFileSync(path.join(SRC, p), "utf8");
function write(rel, content) {
  const p = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    const a = path.join(from, f), b = path.join(to, f);
    if (fs.statSync(a).isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------- 1. Разбор страниц макета ----------
function parsePage(name) {
  const html = read("pages/" + name + ".dc.html");
  const body = html.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1];
  const helmet = (body.match(/<helmet>([\s\S]*?)<\/helmet>/) || ["", ""])[1];
  const template = body.replace(/<helmet>[\s\S]*?<\/helmet>/, "").trim();
  const styles = (helmet.match(/<style>([\s\S]*?)<\/style>/g) || []).map((s) => s.replace(/<\/?style>/g, "")).join("\n");
  const logic = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
  return { name, template, styles, logic };
}

function patch(obj, field, from, to) {
  if (obj[field].indexOf(from) === -1) throw new Error("Не нашёл в " + obj.name + "." + field + ": " + from.slice(0, 80));
  obj[field] = obj[field].split(from).join(to);
}

const NAMES = ["Main", "IssueReader", "Review", "Shop", "Arcade", "Slide", "VillainArt", "Manual"];
const P = {};
NAMES.forEach((n) => { P[n] = parsePage(n); });

// ---------- 2. Данные выпусков ----------
const issuesSrc = P.IssueReader.logic.match(/const ISSUES = (\{[\s\S]*?\n    \});\n/)[1];
const ISSUES = (0, eval)("(" + issuesSrc + ")");

const SLUGS = { 1: "http", 2: "idor", 3: "sql-injection", 4: "xss", 5: "csrf", 6: "ssrf", 7: "jwt", 8: "sekrety-v-git", 9: "owasp-top-10-2025" };
const SEO = {
  1: "HTTP простыми словами: запрос, ответ, коды 401 и 403, cookie",
  2: "IDOR простыми словами: Broken Access Control на примере",
  3: "SQL-инъекция простыми словами: пример атаки и защита",
  4: "XSS простыми словами: reflected, stored и DOM-based",
  5: "CSRF простыми словами: SameSite, токены и при чём тут CORS",
  6: "SSRF простыми словами: как сервер атакует свою же сеть",
  7: "JWT простыми словами: структура, подпись, атаки и хранение",
  8: "Секреты в Git и DevSecOps-пайплайн простыми словами",
  9: "OWASP Top 10:2025 на русском: все 10 категорий с примерами"
};

// ---------- 2б. Новые выпуски Фундамента (10–22) из паспортов ----------
// Паспорт concepts/issues/<slug>.meta.json (формат: concepts/issues/META.md) + фрагмент <slug>.html.
// Нет паспорта или фрагмента, паспорт битый — выпуска на сайте просто ещё нет (кирпич остаётся «скоро»).
// IX_DIR можно переопределить (например, для теста с временным фрагментом).
const IX_DIR = process.env.IX_DIR ? path.resolve(process.env.IX_DIR) : path.join(SRC, "..", "concepts", "issues");
// [номер, slug, подпись кирпича в FOUND на главной («Шаг N» — порядок чтения новичка, не номер выпуска), тема]
const FOUNDATION = [
  [10, "internet", "Шаг 1. Как работает интернет", "Как работает интернет"],
  [11, "osi", "Шаг 2. Модели OSI и TCP/IP", "Модели OSI и TCP/IP"],
  [12, "ip", "Шаг 3. Сети и IP-адреса", "Сети и IP-адреса"],
  [13, "tcp-udp-porty", "Шаг 4. TCP, UDP и порты", "TCP, UDP и порты"],
  [14, "dns", "Шаг 5. DNS", "DNS"],
  [15, "https-tls", "Шаг 7. HTTPS и TLS", "HTTPS и TLS"],
  [16, "api", "Шаг 8. Клиент, сервер и API", "Клиент, сервер и API"],
  [17, "linux", "Шаг 9. Linux и терминал", "Linux и терминал"],
  [18, "git", "Шаг 10. Git", "Git"],
  [19, "bash", "Шаг 11. Bash", "Bash"],
  [20, "python", "Шаг 12. Python", "Python"],
  [21, "sql-bazy", "Шаг 13. SQL и базы данных", "SQL и базы данных"],
  [22, "kriptografiya", "Шаг 14. Криптография", "Криптография"]
];
function loadPassport(n, slug) {
  const mf = path.join(IX_DIR, slug + ".meta.json"), hf = path.join(IX_DIR, slug + ".html");
  if (!fs.existsSync(mf)) return null;
  const skip = (why) => { console.warn("  пропускаю выпуск №" + n + " " + slug + ": " + why); return null; };
  if (!fs.existsSync(hf) || !fs.readFileSync(hf, "utf8").trim()) return skip("нет фрагмента " + slug + ".html");
  let m;
  try { m = JSON.parse(fs.readFileSync(mf, "utf8")); } catch (e) { return skip("паспорт не читается (" + e.message + ")"); }
  const str = (v) => typeof v === "string" && v.trim() !== "";
  const bad = [];
  ["villain", "title", "sub", "motto", "seo", "emblem"].forEach((k) => { if (!str(m[k])) bad.push(k); });
  if (!/^#[0-9a-fA-F]{3,8}$/.test(m.color || "")) bad.push("color");
  if (!(Number(m.minutes) > 0)) bad.push("minutes");
  if (![1, 2, 3].includes(Number(m.diff))) bad.push("diff");
  if (!Array.isArray(m.learn) || !m.learn.length || !m.learn.every(str)) bad.push("learn");
  if (!Array.isArray(m.fn) || !m.fn.every((f) => Array.isArray(f) && str(f[0]) && str(f[1]))) bad.push("fn");
  if (!Array.isArray(m.quiz) || !m.quiz.length || !m.quiz.every((q) => q && str(q.q) && Array.isArray(q.o) && q.o.length >= 2 &&
    Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length && typeof q.w === "string")) bad.push("quiz");
  if (!m.iv || !str(m.iv.q) || !str(m.iv.a)) bad.push("iv");
  if (bad.length) return skip("в паспорте нет или неверны поля: " + bad.join(", "));
  if (m.n !== undefined && Number(m.n) !== n) console.warn("  выпуск " + slug + ": в паспорте n=" + m.n + ", беру " + n);
  return {
    villain: m.villain.trim(), title: m.title.trim(), sub: m.sub.trim(), color: m.color, minutes: Number(m.minutes), diff: Number(m.diff),
    district: "Фундамент", art: "poster", emblem: m.emblem.trim(), motto: m.motto.trim(), learn: m.learn,
    blocks: [["p", m.sub.trim()]], fn: m.fn, quiz: m.quiz.map((q) => ({ q: q.q, o: q.o, a: q.a, w: q.w })),
    iv: { q: m.iv.q, a: m.iv.a }, seo: m.seo.trim()
  };
}
const EXTRA = {};
FOUNDATION.forEach(([n, slug]) => { const d = loadPassport(n, slug); if (d) EXTRA[n] = d; });
const EXTRA_N = Object.keys(EXTRA).map(Number).sort((a, b) => a - b);
EXTRA_N.forEach((n) => {
  const d = Object.assign({}, EXTRA[n]); const seo = d.seo; delete d.seo;
  ISSUES[n] = d; SLUGS[n] = FOUNDATION.find((f) => f[0] === n)[1]; SEO[n] = seo;
});

const LINKS = { Main: "", Review: "povtorenie/", Shop: "baraholka/", Arcade: "arkada/" };
// Барахолка: методички и шпаргалки. Тело — фрагмент concepts/manuals/<file>.html, страница — компонент Manual.
// [ключ ссылки в макете (MGit.dc.html), id товара в каталоге Shop, адрес, файл фрагмента, заголовок для поиска, описание]
const MANUALS = [
  ["MGit", "git", "baraholka/git/", "git", "Git: тетрадь выживания — методичка CyberComics",
    "Git простыми словами в формате тетради: репозиторий, коммит, ветка, merge, remote, push и pull, .gitignore, как откатить ошибку и почему секреты нельзя коммитить. Шпаргалка команд с разбором флагов."],
  ["MOwasp", "owasp", "baraholka/owasp/", "owasp", "OWASP Top 10:2025 — конспект в тетради — CyberComics",
    "Конспект OWASP Top 10:2025 на русском: все 10 категорий — смысл одной фразой, пример, как защититься и чем не путать с соседней категорией."],
  ["MHttp", "http", "baraholka/http-kody/", "http-kody", "HTTP-коды ответов: шпаргалка — CyberComics",
    "Шпаргалка по кодам ответа HTTP: 2xx, 3xx, 4xx, 5xx, чем 401 отличается от 403 и что коды говорят о безопасности."],
  ["MPorts", "ports", "baraholka/porty/", "porty", "Порты TCP и UDP: шпаргалка — CyberComics",
    "Шпаргалка по портам: 22 SSH, 53 DNS, 80 и 443 HTTP/HTTPS, порты баз данных, диапазоны портов и какие порты нельзя открывать в интернет."],
  ["MLinux", "linux", "baraholka/linux/", "linux", "Команды Linux на каждый день: шпаргалка — CyberComics",
    "Шпаргалка по командам Linux: файлы, поиск, права, процессы, диск и сеть — с объяснением каждого флага."]
];
const MAN_DIR = path.join(SRC, "..", "concepts", "manuals");
MANUALS.forEach((m) => {
  if (fs.existsSync(path.join(MAN_DIR, m[3] + ".html"))) LINKS[m[0]] = m[2];
  else console.warn("  нет методички concepts/manuals/" + m[3] + ".html — страница " + m[2] + " пропущена");
});
Object.keys(SLUGS).forEach((n) => { LINKS["Issue" + n] = "vypuski/" + SLUGS[n] + "/"; });
// PREVIEW=1: ссылки ведут прямо на index.html (для просмотра без веб-сервера).
const PREVIEW = !!process.env.PREVIEW;
const href = (route) => (PREVIEW ? route + "index.html" : route);
const HREFS = {}; Object.keys(LINKS).forEach((k) => { HREFS[k] = href(LINKS[k]); });

// Правильные ответы квизов: по ним считаются биты.
const ANSWERS = {};
Object.keys(ISSUES).forEach((n) => { ANSWERS[n] = {}; ISSUES[n].quiz.forEach((q, i) => { ANSWERS[n][i] = q.a; }); });

// Портреты злодеев: id картинки в макете → файл на сайте.
const BLOBS = {};
const blobMap = P.IssueReader.logic.match(/const BLOB = (\{[^}]*\})/)[1];
const BL = (0, eval)("(" + blobMap + ")");
Object.keys(BL).forEach((k) => { BLOBS[BL[k]] = "assets/img/villain-" + k.slice(1) + ".webp"; });
// Уменьшенные копии портретов (src/static/img/villain-N-360.webp и -540.webp): ключи «хеш-360», «хеш-540».
// Через них srcset выбирает файл по ширине карточки, а не всегда 720 px.
const IMG_W = [360, 540];
Object.keys(BL).forEach((k) => IMG_W.forEach((w) => {
  const rel = "assets/img/villain-" + k.slice(1) + "-" + w + ".webp";
  if (fs.existsSync(path.join(SRC, "static", "img", path.basename(rel)))) BLOBS[BL[k] + "-" + w] = rel;
}));
// Натуральный размер webp (VP8, VP8L, VP8X) — для width/height, чтобы место под картинку было известно заранее.
function webpSize(file) {
  try {
    const b = fs.readFileSync(file), t = b.toString("ascii", 12, 16);
    if (t === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (t === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (t === "VP8L") { const n = b.readUInt32LE(21); return [(n & 0x3fff) + 1, ((n >>> 14) & 0x3fff) + 1]; }
  } catch (e) { /* нет файла — размер не ставим */ }
  return null;
}
const imgFile = (rel) => path.join(SRC, "static", rel.replace(/^assets\//, ""));
const dimAttrs = (rel) => { const s = webpSize(imgFile(rel)); return s ? 'width="' + s[0] + '" height="' + s[1] + '" ' : ""; };
// srcset для портрета по хешу из макета; sizes — выражение шаблона или готовая строка.
function blobSrcset(hash, sizes) {
  const v = IMG_W.filter((w) => BLOBS[hash + "-" + w]);
  if (!v.length) return "";
  const full = webpSize(imgFile(BLOBS[hash])) || [720];
  return 'srcset="' + v.map((w) => "/_blob/" + hash + "-" + w + " " + w + "w").join(", ") + ", /_blob/" + hash + " " + full[0] + 'w" sizes="' + sizes + '" ';
}

// ---------- 3. Правки макета для настоящего сайта ----------
// Прогресс читателя берётся из браузера, а не из демо-данных макета.
patch(P.Main, "logic", "    const DN = {", "    A.forEach((a) => { a.read = CC.isRead(a.issue); });\n    const DN = {");
// Карусель и кнопки «Читать первый выпуск» / «Начни отсюда» берут выпуск из пути новичка (CC.nextIssue в src/runtime/cc.js).
// Каналы: VK_URL и TELEGRAM_URL. Нет ни одного — на главной неактивная плашка «Канал скоро».
patch(P.Main, "logic", "/*CC_CHANNELS*/{ vk: '', tg: '' }", JSON.stringify({ vk: okUrl(VK_URL), tg: okUrl(TELEGRAM_URL) }));

// Выпуск: ответы сохраняются, выпуск отмечается прочитанным после квиза, в шапке — биты.
patch(P.IssueReader, "logic", "    const st = Object.assign({ ans: {}, iv: false }, this.state || {});",
  "    if (!this._loaded) { this._loaded = true; this.state = Object.assign({}, this.state, { ans: CC.getAns(n) }); }\n" +
  "    const st = Object.assign({ ans: {}, iv: false }, this.state || {});\n    CC.saveAns(n, st.ans);");
patch(P.IssueReader, "logic", "    const done = d.quiz.every((_, i) => st.ans[i] !== undefined);",
  "    const done = d.quiz.every((_, i) => st.ans[i] !== undefined);\n    if (done) CC.markRead(n);");
patch(P.IssueReader, "logic", "    return {\n      d, num: n, blocks, quiz,", "    return {\n      bitsLabel: CC.bits() + ' бит',\n      d, num: n, blocks, quiz,");
// Барахолка: список вышедших выпусков (зачётка и «где заработать биты»).
patch(P.Shop, "logic", "/*CC_ISSUES*/[]", JSON.stringify(Object.keys(ISSUES).map(Number).sort((a, b) => a - b).map((n) => ({ n, t: ISSUES[n].title, v: ISSUES[n].villain }))));
// Серии дней пока не считаем: убираем демо-цифру.
P.Review.template = P.Review.template.replace(/\n\s*<div[^\n]*<span>Серия дней<\/span>[^\n]*<\/div>/, "");
// «Профиль» пока никуда не ведёт.
NAMES.forEach((n) => { P[n].template = P[n].template.replace(/\n\s*<a href="#"[^>]*>Профиль<\/a>/, ""); });
// Шрифты Google не грузим: они лежат на сайте.
NAMES.forEach((n) => { P[n].styles = P[n].styles.replace(/@import[^;]+;/g, ""); });

// ---------- 3а. Новые выпуски из паспортов: читалка, главная, повторение ----------
// Данные выпусков дописываются в ISSUES читалки; номер выпуска берётся только из существующих,
// «предыдущий/следующий» — по списку вышедших выпусков.
patch(P.IssueReader, "logic", "\n      }\n    };\n\n    const n = Math.min(9, Math.max(1, parseInt(this.props.issue ?? '2', 10) || 2));",
  "\n      }" + EXTRA_N.map((n) => { const d = Object.assign({}, ISSUES[n]); return ",\n      " + n + ": " + JSON.stringify(d); }).join("") +
  "\n    };\n\n    const n0 = parseInt(this.props.issue ?? '2', 10);\n    const n = ISSUES[n0] ? n0 : 2;");
// «Предыдущий/следующий» — по пути новичка (CC.path): Фундамент по шагам, потом Веб-квартал. У первого и последнего — «ко всем выпускам».
patch(P.IssueReader, "logic", "const prev = n > 1 ? n - 1 : 9, next = n < 9 ? n + 1 : 1;",
  "const KEYS = Object.keys(ISSUES).map(Number).sort((x, y) => x - y);\n" +
  "    const PATH = (window.CC && CC.path ? CC.path() : KEYS).filter((x) => ISSUES[x]); KEYS.forEach((x) => { if (PATH.indexOf(x) === -1) PATH.push(x); });\n" +
  "    const ki = PATH.indexOf(n), prev = ki > 0 ? PATH[ki - 1] : 0, next = ki < PATH.length - 1 ? PATH[ki + 1] : 0;");
patch(P.IssueReader, "logic", "prevHref: 'Issue' + prev + '.dc.html', prevLabel: '← №' + prev + ' ' + ISSUES[prev].villain,",
  "prevHref: prev ? 'Issue' + prev + '.dc.html' : 'Main.dc.html#vypuski', prevLabel: prev ? '← №' + prev + ' ' + ISSUES[prev].villain : '← Все выпуски',");
patch(P.IssueReader, "logic", "nextHref: 'Issue' + next + '.dc.html', nextLabel: '№' + next + ' ' + ISSUES[next].villain + ' →'",
  "nextHref: next ? 'Issue' + next + '.dc.html' : 'Main.dc.html#vypuski', nextLabel: next ? 'Дальше: №' + next + ' ' + ISSUES[next].villain + ' →' : 'Все выпуски →'");
// Главная: карточки и карусель (A), кирпичи Фундамента, список «скоро» района.
patch(P.Main, "logic", "read: false }\n    ];\n",
  "read: false }" + EXTRA_N.map((n) => { const d = ISSUES[n];
    return ",\n      " + JSON.stringify({ issue: n, dist: "base", villain: d.villain, title: d.title, subtitle: d.sub, diff: d.diff, minutes: d.minutes,
      color: d.color, read: false, art: "poster", emblem: d.emblem, motto: d.motto, plain: d.title }); }).join("") + "\n    ];\n");
EXTRA_N.forEach((n) => { const f = FOUNDATION.find((x) => x[0] === n); patch(P.Main, "logic", "['" + f[2] + "', 0]", "['" + f[2] + "', " + n + "]"); });
// Прокачаться и Разминка сами берут выпуски и биты из CC (src/runtime/cc.js): правок из сборки не нужно.

// ---------- 3в. Вес и доступность ----------
// Портреты злодеев грузятся лениво (кроме первого экрана: шапка выпуска и карусель на главной — eager="1").
// width/height — натуральный размер файла, чтобы место под картинку было известно заранее.
// srcset: карточки берут 360/540 px по ширине; у eager-портретов sizes="720px" — тот же файл 720 px, что и картинки
// во фрагменте выпуска (иначе один портрет качался бы дважды). fetchpriority="high" — только у шапки выпуска (prio="high"):
// это её LCP-картинка. Атрибут со значением undefined движок не ставит.
{
  let cnt = 0;
  P.VillainArt.template = P.VillainArt.template.replace(/<img class="va-img([^"]*)" src="\/_blob\/(\w+)"/g, (all, cls, h) => {
    cnt++;
    return '<img loading="{{imgLoading}}" fetchpriority="{{imgPrio}}" decoding="async" ' + (BLOBS[h] ? dimAttrs(BLOBS[h]) : 'width="720" height="960" ') +
      blobSrcset(h, "{{imgSizes}}") + 'class="va-img' + cls + '" src="/_blob/' + h + '"';
  });
  if (!cnt) throw new Error("Не нашёл портреты <img class=\"va-img\"> в VillainArt");
}
patch(P.VillainArt, "logic", "      ghost: k === 'v4',", "      imgLoading: this.props.eager ? 'eager' : 'lazy',\n" +
  "      imgPrio: this.props.prio === 'high' ? 'high' : undefined,\n" +
  "      imgSizes: this.props.eager ? '720px' : '(max-width: 760px) 92vw, 400px',\n      ghost: k === 'v4',");
patch(P.Slide, "template", 'fit="square" hint-size', 'fit="square" eager="1" hint-size');
patch(P.IssueReader, "template", '<dc-import name="VillainArt" kind="{{d.art}}" vname="{{d.villain}}" emblem="{{d.emblem}}" color="{{d.color}}" hint-size',
  '<dc-import name="VillainArt" kind="{{d.art}}" vname="{{d.villain}}" emblem="{{d.emblem}}" color="{{d.color}}" eager="1" prio="high" hint-size');
// Барахолка: обложки-галереи 75–112 px шириной — берут 360-px копии вместо 720.
P.Shop.template = P.Shop.template.replace(/width="720" height="960" src="\/_blob\/(\w+)"/g, (all, h) =>
  (BLOBS[h] ? dimAttrs(BLOBS[h]) : 'width="720" height="960" ') + blobSrcset(h, "120px") + 'src="/_blob/' + h + '"');
// Главная: на телефоне (постер) и на компьютере (обложка) в макете два <h1>, один из них всегда скрыт CSS.
// Поисковикам нужен один: заголовок постера становится div с role="heading" aria-level="1" (вид и озвучка те же).
// Мягкая правка: если макет уже поменяли, ничего не делаем. Лучше поправить прямо в src/pages/Main.dc.html.
if (/<h1 class="cc-poster-h1">[\s\S]*?<\/h1>/.test(P.Main.template) && (P.Main.template.match(/<h1[\s>]/g) || []).length > 1)
  P.Main.template = P.Main.template.replace(/<h1 class="cc-poster-h1">([\s\S]*?)<\/h1>/, '<div class="cc-poster-h1" role="heading" aria-level="1">$1</div>');
// Красная кнопка «Читать» и плашка «Следующий» — фирменный #ff3b3b, как в живой v6 (владелец просил вернуть цвета).
// Текст на них крупный и жирный (Russo One 18 px / 14 px), цвет не трогаем.
// Мелкие подписи карточки-карусели (12 px) → 14 px: это бейджи и подписи, а не текст для чтения.
P.Slide.template = P.Slide.template.split("font-size: 12px").join("font-size: 14px");
P.Slide.logic = P.Slide.logic.split("font-size:12px").join("font-size:14px");

// ---------- 3б. Тела выпусков из фрагментов ----------
// Фрагмент concepts/issues/<slug>.html (контракт: concepts/issues/CONTRACT.md) читается прямо
// оттуда при каждой сборке, без копии в src. Нет файла — у выпуска остаётся старое тело из ISSUES.
// IX_DIR задаётся выше (раздел 2б).
const FRAGS = {};
Object.keys(SLUGS).forEach((n) => {
  const f = path.join(IX_DIR, SLUGS[n] + ".html");
  if (!fs.existsSync(f)) return;
  const html = fs.readFileSync(f, "utf8").trim();
  if (!html) return;
  if ((html.match(/<template[\s>]/gi) || []).length !== (html.match(/<\/template>/gi) || []).length) { console.warn("  пропускаю фрагмент " + SLUGS[n] + ": несбалансированный <template>"); return; }
  FRAGS[n] = html;
});
// Выпуск с фрагментом: тело — одна игрушка 'ix' (она клонирует <template id="ix-fragment">),
// а свои квиз, вопрос с собеседования и сноски сайт не рисует: они есть во фрагменте.
// Данные ISSUES (и квизы для биты/повторения) не меняются.
patch(P.IssueReader, "logic", "    const d = ISSUES[n];",
  "    const ix = typeof document !== 'undefined' && !!document.getElementById('ix-fragment');\n" +
  "    const d = ix ? Object.assign({}, ISSUES[n], { blocks: [['toy', 'ix']] }) : ISSUES[n];");
patch(P.IssueReader, "logic", "      d, num: n, blocks, quiz,", "      d, num: n, blocks, quiz, noIx: !ix,");
patch(P.IssueReader, "template", '      <section aria-label="Проверь себя"', '      <sc-if value="{{noIx}}">\n      <section aria-label="Проверь себя"');
patch(P.IssueReader, "template", '      <nav aria-label="Другие выпуски"', '      </sc-if>\n\n      <nav aria-label="Другие выпуски"');

// ---------- 4. Файлы движка ----------
copyDir(path.join(SRC, "static"), path.join(DIST, "assets"));
let comps = "/* Сгенерировано src/build.js из макета. Не редактировать вручную. */\n";
NAMES.forEach((n) => {
  comps += "DC.define(" + JSON.stringify(n) + ", " + JSON.stringify(P[n].template) + ", (function () {\n" + P[n].logic + "\nreturn Component;\n})());\n";
});
write("assets/js/components.js", comps);
// Каждой странице — только её компоненты (и вложенные через dc-import), а не все восемь (~490 КБ).
// Замер 01.11 (Pixel 7, CPU ×4): разбор и компиляция всего components.js держали главный поток
// до первого рабочего нажатия; на главной нужен ~120 КБ из 490. Shop нужен методичкам (window.CCShop).
const DEPS = { Manual: ["Shop"] };
function compDeps(name, seen) {
  seen = seen || [];
  if (seen.indexOf(name) !== -1) return seen;
  (DEPS[name] || []).concat((P[name].template.match(/<dc-import name="([A-Za-z]+)"/g) || []).map((m) => m.slice(17, -1)))
    .forEach((d) => { if (P[d]) compDeps(d, seen); });
  seen.push(name);
  return seen;
}
const COMP_FILE = {};
NAMES.forEach((n) => {
  if (n === "Slide" || n === "VillainArt") return;
  let js = "/* Сгенерировано src/build.js из макета: компоненты страницы " + n + ". Не редактировать вручную. */\n";
  compDeps(n).forEach((c) => { js += "DC.define(" + JSON.stringify(c) + ", " + JSON.stringify(P[c].template) + ", (function () {\n" + P[c].logic + "\nreturn Component;\n})());\n"; });
  COMP_FILE[n] = "assets/js/components-" + n.toLowerCase() + ".js";
  write(COMP_FILE[n], js);
});
write("assets/js/dc.js", read("runtime/dc.js"));
// Иконки, которые браузеры и Яндекс ищут в корне сайта.
["favicon.ico", "apple-touch-icon.png"].forEach((f) => { if (fs.existsSync(path.join(SRC, "static", f))) fs.copyFileSync(path.join(SRC, "static", f), path.join(DIST, f)); });
write("assets/js/cc.js", read("runtime/cc.js"));
write("assets/js/legal.js", read("runtime/legal.js"));
const css = "/* Сгенерировано src/build.js из стилей макета. */\n" + NAMES.map((n) => "/* " + n + " */\n" + P[n].styles.trim()).join("\n\n") +
  "\n/* Без привязки прокрутки: когда выше меняется высота (шрифты, замена запечённой разметки фрагмента),\n   браузер не должен сдвигать страницу — иначе липкое кино «прыгает» на середину. */\nhtml,body{overflow-anchor:none}\nhtml{-webkit-text-size-adjust:100%}\nbody{margin:0;background:#fff7e3}\n#app{min-height:100vh}\n" +
  "/* Шапка на телефоне: логотип и биты (или «Войти») в первой строке, меню — одной строкой, листается вбок. */\n" +
  "@media (max-width:600px){header:has(>nav[aria-label=\"Основная навигация\"]){padding:8px 16px !important;gap:8px 10px !important}" +
  "header>nav[aria-label=\"Основная навигация\"]{order:9;flex:0 0 calc(100% + 32px) !important;max-width:none;margin:0 -16px;padding:0 16px 7px;box-sizing:border-box;flex-wrap:nowrap !important;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}" +
  "header>nav[aria-label=\"Основная навигация\"]::-webkit-scrollbar{display:none}" +
  "header>nav[aria-label=\"Основная навигация\"]>a{flex:none;white-space:nowrap}" +
  "header:has(>nav[aria-label=\"Основная навигация\"])>:first-child{margin-right:auto}}\n" +
  "/* Логотип в шапке — тап-зона не ниже 44 px. */\nheader:has(>nav[aria-label=\"Основная навигация\"])>a:first-child{display:inline-flex;align-items:center;min-height:44px;box-sizing:border-box}\n";
write("assets/site.css", css);

// ---------- 5. Страницы ----------
// Страница всегда открывается с шапки (если в адресе нет #якоря): браузер или окно-хозяин
// (например, просмотрщик артефактов) не должны восстанавливать прокрутку с прошлой страницы.
// Затем «resize», чтобы кино во фрагментах пересчитало кадр по реальной позиции.
const SCROLL_TOP = "<script>(function(){try{if('scrollRestoration' in history)history.scrollRestoration='manual'}catch(e){}" +
  "function top(){if(location.hash.length>1)return;try{window.scrollTo(0,0);document.documentElement.scrollIntoView({block:'start'})}catch(e){}}" +
  "function sync(){top();try{window.dispatchEvent(new Event('resize'))}catch(e){}}" +
  "top();document.addEventListener('DOMContentLoaded',top);window.addEventListener('load',function(){sync();setTimeout(top,0)});" +
  "window.addEventListener('pageshow',function(e){if(e.persisted)sync();else top()});})();</script>";
// Нажатия до запуска скриптов: страница приходит уже нарисованной, кнопки видны раньше, чем загрузится JS.
// Запоминаем последнее нажатие на кнопку в #app (путь в дереве и текст); src/static/js/toys.js (replayTaps)
// повторит его, когда обработчики будут готовы. Ссылки не трогаем — они работают и без JS.
const EARLY_TAPS = "<script>(function(){var q=window.__ccTapQ=[];document.addEventListener('click',function(e){if(window.__ccLive)return;" +
  "var b=e.target&&e.target.closest&&e.target.closest('button,[role=\\'button\\']'),app=document.getElementById('app');if(!b||!app||!app.contains(b))return;" +
  "var p=[];for(var n=b;n!==app;n=n.parentElement)p.unshift(Array.prototype.indexOf.call(n.parentElement.children,n));" +
  "q.push({p:p,t:(b.textContent||'').replace(/\\s+/g,' ').trim().slice(0,40)});e.preventDefault();e.stopPropagation()},true)})();</script>";
const pages = [];
// Версия файла в адресе (?v=<8 знаков хеша содержимого>): изменился файл — изменился адрес, поэтому nginx может
// отдавать такие адреса с кешем на год (deploy/nginx.conf). В PREVIEW (file://) адрес без версии.
const VER = {};
function asset(root, rel) {
  if (PREVIEW) return root + rel;
  if (!(rel in VER)) { try { VER[rel] = require("crypto").createHash("sha256").update(fs.readFileSync(path.join(DIST, rel))).digest("hex").slice(0, 8); } catch (e) { VER[rel] = ""; } }
  return root + rel + (VER[rel] ? "?v=" + VER[rel] : "");
}
// Подвал (связь, данные, перенос прогресса) и окно про cookie: src/runtime/legal.js.
function legalScripts(root, share) {
  const cfg = { email: CONTACT_EMAIL, metrika: METRIKA_ID, metrikaFrom: process.env.METRIKA_FROM || "", privacy: root + href("privacy/"), soglasie: root + href("soglasie/") };
  // Кнопка «Поделиться» (главная и выпуски): ссылка на страницу, текст для соцсетей.
  if (share) cfg.share = share;
  return "<script>window.CC_LEGAL=" + JSON.stringify(cfg) + ";</script>\n" + '<script src="' + root + 'assets/js/legal.js"></script>\n';
}
// Ссылки фрагментов на другие выпуски («../idor/» или «Issue8.dc.html») → адрес выпуска для этой сборки
// (в PREVIEW — с index.html, чтобы работало через file://). Ссылка на ещё не вышедший выпуск остаётся как есть.
const SLUG_N = {}; Object.keys(SLUGS).forEach((n) => { SLUG_N[SLUGS[n]] = n; });
function fragLinks(html, root, issue) {
  return html.replace(/href="(?:\.\.\/([a-z0-9-]+)\/(?:index\.html)?|Issue(\d+)\.dc\.html)(#[^"]*)?"/g, (all, slug, num, hash) => {
    const n = slug ? SLUG_N[slug] : (SLUGS[num] ? num : undefined);
    if (n === undefined) { console.warn("  выпуск №" + issue + ": ссылка " + all + " ведёт на выпуск, которого ещё нет"); return all; }
    return 'href="' + root + HREFS["Issue" + n] + (hash || "") + '"';
  });
}
// Картинки фрагментов (<img src="IMGROOT/…">): ленивая загрузка, если автор её не поставил.
// width/height сами не ставим: при CSS «max-width:100%» без «height:auto» картинка бы вытянулась.
function fragImgs(html) {
  return html.replace(/<img\b([^>]*?)\bsrc="IMGROOT\/([\w.-]+\.webp)"([^>]*)>/g, (all, a, file, b) => {
    const rest = a + b;
    let add = "";
    if (!/\bloading=/.test(rest)) add += ' loading="lazy"';
    if (!/\bdecoding=/.test(rest)) add += ' decoding="async"';
    return add ? all.replace(/^<img\b/, "<img" + add) : all;
  });
}
// Шрифты, которые грузим заранее (preload): кириллица Russo One (кнопки, меню, подписи) и Rubik Mono One (заголовки).
// Замер 30.10 (телефон, slow 4G, CPU ×4): с ними CLS главной 0.0235 → 0.0013; Rubik 400 приходит вовремя и без preload.
const PRELOAD_FONTS = ["russo-one-cyrillic-400-normal", "rubik-mono-one-cyrillic-400-normal"];
function page({ file, route, title, description, comp, props, image, jsonld, noindex, frag, issue, extra }) {
  const depth = route.split("/").filter(Boolean).length;
  const root = depth ? "../".repeat(depth) : "./";
  const url = SITE_URL ? SITE_URL + "/" + route : "";
  const img = image ? (SITE_URL ? SITE_URL + "/" + image : root + image) : "";
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    SCROLL_TOP,
    EARLY_TAPS,
    "<title>" + esc(title) + "</title>",
    '<meta name="description" content="' + esc(description) + '">',
    noindex ? '<meta name="robots" content="noindex">' : "",
    url ? '<link rel="canonical" href="' + esc(url) + '">' : "",
    '<meta property="og:type" content="' + (jsonld ? "article" : "website") + '">',
    '<meta property="og:site_name" content="CyberComics">',
    '<meta property="og:title" content="' + esc(title) + '">',
    '<meta property="og:description" content="' + esc(description) + '">',
    url ? '<meta property="og:url" content="' + esc(url) + '">' : "",
    img ? '<meta property="og:image" content="' + esc(img) + '">' : "",
    '<meta name="theme-color" content="#ffd60a">',
    '<meta name="site-root" content="' + root + '">',
    '<link rel="icon" href="' + root + 'assets/favicon.svg" type="image/svg+xml">',
    '<link rel="icon" href="' + root + 'favicon.ico" sizes="48x48">',
    '<link rel="apple-touch-icon" href="' + root + 'assets/apple-touch-icon.png">',
    PREVIEW ? "" : '<link rel="manifest" href="' + root + 'assets/site.webmanifest">',
    // file:// (PREVIEW) не даёт грузить шрифт с crossorigin: preload только для настоящего сайта.
    // Два маленьких кириллических файла первого экрана (~11 КБ вместе); остальные шрифты — по font-display: swap.
    PREVIEW ? "" : PRELOAD_FONTS.map((f) => '<link rel="preload" href="' + root + "assets/fonts/" + f + '.woff2" as="font" type="font/woff2" crossorigin>').join("\n"),
    '<link rel="stylesheet" href="' + asset(root, "assets/fonts.css") + '">',
    '<link rel="stylesheet" href="' + asset(root, "assets/site.css") + '">',
    '<link rel="stylesheet" href="' + asset(root, "assets/toys.css") + '">',
    jsonld ? '<script type="application/ld+json">' + JSON.stringify(jsonld).replace(/</g, "\\u003c") + "</script>" : ""
  ].filter(Boolean).join("\n");
  // Фрагмент выпуска лежит в <template>: браузер не выполняет его скрипты, пока игрушка 'ix'
  // не вставит копию на страницу (один раз). Картинки — относительно корня, чтобы работало и с file://.
  const tpl = frag ? '<template id="ix-fragment" data-issue="' + issue + '">\n' + fragLinks(fragImgs(frag).split("IMGROOT").join(root + "assets/img"), root, issue) + "\n</template>\n" : "";
  const body =
    '<div id="app"></div>\n' + tpl + (extra || "") +
    "<script>window.CC_LINKS=" + JSON.stringify(HREFS) + ";window.CC_BLOBS=" + JSON.stringify(BLOBS) + ";window.CC_ANSWERS=" + JSON.stringify(ANSWERS) + ";</script>\n" +
    '<script src="' + asset(root, "assets/js/dc.js") + '"></script>\n' +
    '<script src="' + asset(root, "assets/js/cc.js") + '"></script>\n' +
    '<script src="' + asset(root, COMP_FILE[comp] || "assets/js/components.js") + '"></script>\n' +
    '<script src="' + asset(root, "assets/js/toys.js") + '"></script>\n' +
    legalScripts(root, comp === "IssueReader" || comp === "Main" ? { url: url, text: comp === "Main" ? "Кибербезопасность в комиксах простыми словами" : title.replace(/ — CyberComics.*$/, "") } : null) +
    "<script>DC.mount(" + JSON.stringify(comp) + ", document.getElementById(\"app\"), " + JSON.stringify(props || {}) + ");CCToys.mountAll();CCLegal.start();CCToys.replayTaps();</script>";
  write(file, "<!doctype html>\n<html lang=\"ru\"" + (frag ? ' class="ix-page"' : "") + ">\n<head>\n" + head + "\n</head>\n<body>\n" + body + "\n</body>\n</html>\n");
  pages.push({ file, route, noindex });
}

page({ file: "index.html", route: "", comp: "Main",
  title: "CyberComics — кибербезопасность в комиксах",
  description: "Кибербезопасность простыми словами: комиксы про OWASP Top 10, AppSec и DevSecOps. Злодеи-уязвимости, квизы и вопросы с собеседований на русском.",
  image: "assets/img/villain-2.webp" });

Object.keys(ISSUES).forEach((k) => {
  const n = Number(k), d = ISSUES[n];
  const description = d.sub + ". Что узнаешь: " + d.learn.map((s) => s.charAt(0).toLowerCase() + s.slice(1)).join("; ") + ".";
  const title = SEO[n] + " — CyberComics №" + n;
  page({ file: LINKS["Issue" + n] + "index.html", route: LINKS["Issue" + n], comp: "IssueReader", props: { issue: String(n) }, frag: FRAGS[n], issue: n,
    title, description, image: BLOBS[BL[d.art]] || "assets/img/villain-2.webp",
    jsonld: { "@context": "https://schema.org", "@type": "Article", headline: d.title, description, inLanguage: "ru",
      about: SEO[n].split(":")[0], isPartOf: { "@type": "Periodical", name: "CyberComics" }, position: n } });
});

page({ file: "povtorenie/index.html", route: "povtorenie/", comp: "Review",
  title: "Прокачаться — повторение по выпускам — CyberComics",
  description: "Прокачайся по выпускам CyberComics: вопросы возвращаются, пока не запомнятся. Прогресс сохраняется под твоим именем в браузере." });
page({ file: "baraholka/index.html", route: "baraholka/", comp: "Shop",
  title: "Барахолка — методички и шпаргалки за биты — CyberComics",
  description: "Ночной рынок Сетеграда: методички в стиле тетради (Git, OWASP Top 10:2025), шпаргалки по HTTP-кодам, портам и Linux, значки. Покупаются только за биты, заработанные за чтение выпусков." });
// Методички и шпаргалки: тело из concepts/manuals/<file>.html кладётся в <template id="mn-src">.
MANUALS.forEach(([key, id, route, fileName, title, description]) => {
  if (!LINKS[key]) return;
  const f = path.join(MAN_DIR, fileName + ".html");
  const depth = route.split("/").filter(Boolean).length;
  const root = "../".repeat(depth);
  const html = fragLinks(fragImgs(fs.readFileSync(f, "utf8").trim()).split("IMGROOT").join(root + "assets/img"), root, "методичка " + id);
  page({ file: route + "index.html", route, comp: "Manual", props: { id }, title, description,
    extra: '<template id="mn-src" data-id="' + id + '">\n' + html + "\n</template>\n" });
});
// Старой Лавки (/lavka/) больше нет: её заменила Барахолка. Старые закладки ведут на /baraholka/ (страница-переезд, noindex).
fs.rmSync(path.join(DIST, "lavka"), { recursive: true, force: true });
{
  const to = "../" + HREFS.Shop;
  const canon = SITE_URL ? '<link rel="canonical" href="' + esc(SITE_URL + "/" + LINKS.Shop) + '">' : "";
  write("lavka/index.html", '<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Барахолка переехала — CyberComics</title><meta name="robots" content="noindex,follow">' + canon +
    '<meta http-equiv="refresh" content="0; url=' + to + '">' +
    '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fff7e3;font:18px/1.5 Rubik,system-ui,sans-serif;color:#141414;padding:16px;box-sizing:border-box}' +
    'a{display:inline-flex;align-items:center;min-height:44px;font-weight:700;color:#141414;padding:8px 16px;background:#ffd60a;border:3px solid #141414}</style></head>' +
    '<body><main><p>Магазин теперь называется «Барахолка» и живёт по новому адресу.</p><p><a href="' + to + '">Перейти в Барахолку →</a></p></main></body></html>\n');
}
page({ file: "arkada/index.html", route: "arkada/", comp: "Arcade",
  title: "Разминка — кроссворды и игры — CyberComics", description: "Разминка CyberComics: кроссворды и мини-игры по темам выпусков про кибербезопасность. За игры начисляются биты." });

// ---------- Данные и согласие ----------
// Простые страницы без компонентов: текст из src/legal/*.html, подстановки {{...}} из переменных сборки.
{
  const domain = SITE_URL ? SITE_URL.replace(/^https?:\/\//, "") : "CyberComics";
  const today = new Date().toISOString().slice(0, 10).split("-").reverse().join(".");
  const operator = OPERATOR ? esc(OPERATOR) : "владелец сайта " + esc(domain);
  const mail = CONTACT_EMAIL ? '<a href="mailto:' + esc(CONTACT_EMAIL) + '">' + esc(CONTACT_EMAIL) + "</a>" : "";
  function legalPage(route, title, fileName, extraSubs) {
    const depth = route.split("/").filter(Boolean).length;
    const root = "../".repeat(depth);
    const subs = Object.assign({
      DATE: today, DOMAIN: esc(domain), OPERATOR: operator,
      EMAIL_LINK: mail || "почта появится на сайте позже", EMAIL_TEXT: CONTACT_EMAIL ? esc(CONTACT_EMAIL) : "указан в подвале сайта",
      EMAIL_OR_SOON: mail ? "пишите на " + mail + "." : "почта для связи скоро появится внизу страницы.",
      CONTACT: mail ? "<p>Вопросы о данных: " + mail + ".</p>" : "",
      PRIVACY: root + href("privacy/"), SOGLASIE: root + href("soglasie/"),
      METRIKA_PARENTS: METRIKA_ID ? "<p>Статистику посещений (Яндекс.Метрика) мы включаем только после нажатия «Принять». Детей младше 14 лет мы просим нажимать «Отказаться» или звать родителя. Сайт полностью работает без статистики.</p>" : ""
    }, extraSubs || {});
    const body = read("legal/" + fileName + ".html").replace(/\{\{(\w+)\}\}/g, (m, k) => (k in subs ? subs[k] : m));
    write(route + "index.html", '<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
      "<title>" + esc(title) + " — CyberComics</title>\n" + '<meta name="description" content="' + esc(title) + ' на сайте CyberComics.">\n<meta name="robots" content="noindex,follow">\n' +
      '<meta name="theme-color" content="#ffd60a">\n<link rel="icon" href="' + root + 'assets/favicon.svg" type="image/svg+xml">\n<link rel="stylesheet" href="' + root + 'assets/fonts.css">\n' +
      "<style>body{margin:0;background:#fff7e3;color:#141414;font:18px/1.6 Rubik,system-ui,sans-serif}" +
      ".lg-top{display:flex;align-items:center;min-height:56px;padding:6px 16px;border-bottom:3px solid #141414;background:#ffd60a}" +
      ".lg-top a{font:20px 'Russo One',sans-serif;color:#141414;text-decoration:none;display:inline-flex;align-items:center;min-height:44px}" +
      "main{max-width:760px;margin:0 auto;padding:24px 16px 40px;box-sizing:border-box}" +
      "h1{font:clamp(26px,7vw,38px)/1.15 'Russo One',sans-serif;margin:8px 0 14px}h2{font:22px/1.25 'Russo One',sans-serif;margin:28px 0 8px}" +
      ".lead{font-size:20px;font-weight:700}ul,ol{padding-left:22px}li{margin:6px 0}a{color:#141414;text-underline-offset:3px}.date{color:#555;margin-top:28px}" +
      "footer{border-top:3px solid #141414;background:#ffd60a;padding:14px 16px;font-size:16px;line-height:1.4;text-align:center}</style>\n</head>\n<body>\n" +
      '<header class="lg-top"><a href="' + root + (PREVIEW ? "index.html" : "") + '">← CyberComics</a></header>\n<main>\n' + body + "\n</main>\n" +
      "<footer>CyberComics · кибербезопасность в комиксах · все атаки — только в лабораториях и на своих системах.</footer>\n" +
      legalScripts(root) + "<script>CCLegal.start();</script>\n</body>\n</html>\n");
  }
  ["privacy", "soglasie", "roditelyam"].forEach((r) => fs.rmSync(path.join(DIST, r), { recursive: true, force: true }));
  legalPage("privacy/", METRIKA_ID ? "Политика обработки персональных данных" : "Данные и приватность", METRIKA_ID ? "privacy-metrika" : "privacy-basic");
  if (METRIKA_ID) legalPage("soglasie/", "Согласие на статистику посещений", "soglasie");
}

// 404: пути от корня сайта (/assets/…), потому что страница показывается по любому адресу. noindex ставит seo.js.
write("404.html", '<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Страница не найдена — CyberComics</title>' +
  '<meta name="description" content="Такой страницы на CyberComics нет. Все выпуски про кибербезопасность — на главной.">' +
  '<meta name="theme-color" content="#ffd60a"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="48x48">' +
  '<link rel="stylesheet" href="/assets/fonts.css"><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fff7e3;font-family:Rubik,system-ui,sans-serif;color:#141414;padding:16px;box-sizing:border-box}main{max-width:520px;background:#fff;border:3px solid #141414;box-shadow:8px 8px 0 #141414;padding:28px}h1{margin:0 0 12px;font-family:"Rubik Mono One",sans-serif;font-size:34px;color:#ff2e93;-webkit-text-stroke:2px #141414;paint-order:stroke fill;text-shadow:4px 4px 0 #141414}a{display:inline-block;margin-top:12px;font-family:"Russo One",sans-serif;color:#141414;text-decoration:none;padding:12px 18px;background:#ffd60a;border:3px solid #141414;box-shadow:4px 4px 0 #141414}</style></head>' +
  '<body><main><h1>404</h1><p>Злодеи утащили эту страницу. Возможно, её никогда и не было.</p><a href="/">На главную</a> <a href="/#vypuski">Все выпуски</a></main></body></html>\n');

write("robots.txt", "User-agent: *\nAllow: /\n" + (SITE_URL ? "Sitemap: " + SITE_URL + "/sitemap.xml\n" : ""));
if (SITE_URL) {
  const today = new Date().toISOString().slice(0, 10);
  write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages.filter((p) => !p.noindex).map((p) => "  <url><loc>" + SITE_URL + "/" + p.route + "</loc><lastmod>" + today + "</lastmod></url>").join("\n") + "\n</urlset>\n");
}
write("pages.json", JSON.stringify(pages, null, 2));
// SEO: title/description, canonical, OG, JSON-LD, sitemap.xml, robots.txt, llms.txt, конспект выпусков (src/seo.js).
// prerender.js вызывает его ещё раз, уже с картинками для соцсетей; повторный запуск ничего не дублирует.
require("./seo").apply(DIST);
console.log("Новые выпуски из паспортов: " + (EXTRA_N.map((n) => n + " " + SLUGS[n]).join(", ") || "нет"));
console.log("Фрагменты выпусков: " + (Object.keys(FRAGS).map((n) => SLUGS[n]).join(", ") || "нет"));
console.log("Готово: " + pages.length + " страниц в " + DIST + (SITE_URL ? "" : " (SITE_URL не задан: в canonical и sitemap.xml заглушка, не выкладывать)"));
