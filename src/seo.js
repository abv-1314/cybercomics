#!/usr/bin/env node
/* SEO и GEO для собранного сайта CyberComics.
 * Дописывает в готовые страницы dist/ (или preview/) то, что нужно поисковикам и ИИ-ответам:
 *   - короткие title (до 60 символов) и description (до 160) для каждой страницы;
 *   - canonical, Open Graph, Twitter, robots (в PREVIEW — noindex на всех страницах);
 *   - JSON-LD: Organization + WebSite на главной, Article/LearningResource + BreadcrumbList
 *     (+ FAQPage по видимому конспекту) на выпусках;
 *   - sitemap.xml с настоящими датами изменений, robots.txt, llms.txt, noindex на 404.
 * Обычно запускается из src/prerender.js. Можно и отдельно:
 *   node src/seo.js                  → обработать dist/ (PREVIEW=1 → preview/)
 *   node src/seo.js ping             → после выкладки отправить адреса в IndexNow (Яндекс)
 * Подтверждение прав (мета-тег только на главной): YANDEX_VERIFICATION (Яндекс.Вебмастер), GOOGLE_VERIFICATION (Search Console).
 * Адрес сайта: SITE_URL. Если не задан, ставится заглушка https://cybercomics.invalid
 * и в консоли печатается предупреждение: такую сборку выкладывать нельзя.
 * IndexNow: INDEXNOW_KEY (8–128 символов: буквы, цифры, «-»). Тогда в корень кладётся <ключ>.txt. */
"use strict";
const fs = require("fs");
const path = require("path");

const PLACEHOLDER = "https://cybercomics.invalid";
const BRAND = "CyberComics";
const LEVEL = { 1: "начальный", 2: "средний", 3: "продвинутый" };

// ---------- Тексты для выдачи: по одному на выпуск ----------
// t — title без бренда (бренд добавляется, если влезает в 60 символов), d — description (до 160),
// term — какой термин из словарика выпуска (fn) считать главным определением, def — своё определение,
// если подходящего термина в словарике нет. Факты сверены с данными выпусков.
const ISSUE_SEO = {
  "http": { t: "HTTP простыми словами: запрос, ответ, коды и cookie", term: "HTTP",
    d: "Что такое HTTP простыми словами: из чего состоят запрос и ответ, чем 401 отличается от 403 и зачем cookie флаги HttpOnly, Secure и SameSite." },
  "idor": { t: "IDOR простыми словами: что это и как защититься", term: "IDOR",
    d: "IDOR — уязвимость из Broken Access Control, №1 в OWASP Top 10:2025. Почему сервер должен проверять владельца объекта и почему UUID не спасает." },
  "sql-injection": { t: "SQL-инъекция простыми словами: пример и защита", topic: "SQL-инъекция",
    def: "атака, при которой ввод пользователя встраивается в текст SQL-запроса и меняет его смысл: база не отличает данные от команды.",
    d: "SQL-инъекция простыми словами: почему склеивать строки в запросе опасно, как параметризованный запрос отделяет код от данных и кто ловит инъекции." },
  "xss": { t: "XSS простыми словами: виды атаки и защита", term: "XSS",
    d: "Что такое XSS: отражённый, хранимый и DOM-based. Почему textContent безопаснее innerHTML, что даёт CSP и чего не даёт. Выпуск-комикс на 11 минут." },
  "csrf": { t: "CSRF простыми словами: SameSite, токены и CORS", term: "CSRF",
    d: "Что такое CSRF и почему браузер может отправить запрос без твоего ведома. Как работают CSRF-токены и SameSite и почему CORS — не защита от CSRF." },
  "ssrf": { t: "SSRF простыми словами: что это и как защититься", term: "SSRF",
    d: "SSRF: как сервер заставляют ходить во внутреннюю сеть и к служебному сервису облака, почему запрет по списку адресов не работает и как защищаться слоями." },
  "jwt": { t: "JWT простыми словами: структура, подпись и атаки", term: "JWT",
    d: "Из чего состоит JWT, почему содержимое токена видно всем, что сервер обязан проверять в каждом запросе и где хранить токен в браузере." },
  "sekrety-v-git": { t: "Секреты в Git: что делать, если утёк ключ", topic: "Утечка секрета в Git", q: "Что делать, если ключ или пароль попал в Git?",
    def: "пароль, токен или ключ попал в коммит. Git хранит все версии файлов, поэтому удалённое в новом коммите остаётся в старых: такой ключ считается раскрытым, его отзывают и заменяют.",
    d: "Почему удалить коммит с ключом недостаточно, что делать в первые минуты после утечки и какие проверки DevSecOps-пайплайна ловят секреты." },
  "owasp-top-10-2025": { t: "OWASP Top 10 2025 на русском: все 10 категорий", topic: "OWASP Top 10",
    def: "список десяти главных рисков веб-приложений от сообщества OWASP. Последняя редакция — 2025 года.",
    d: "Все 10 категорий OWASP Top 10:2025 на русском: смысл, примеры, что изменилось с 2021 года и как отвечать про Top 10 на собеседовании." },
  "internet": { t: "Как работает интернет простыми словами: путь пакета", term: "Пакет", q: "Что такое пакет в сети?",
    d: "Как сообщение режется на пакеты, что такое IP-адрес, роутер и хоп, как работает traceroute, откуда задержка и кто по дороге видит твой трафик." },
  "osi": { t: "Модель OSI и TCP/IP простыми словами", term: "Модель OSI",
    d: "7 уровней OSI и 4 уровня TCP/IP, инкапсуляция, на каком уровне живут ARP-спуфинг, SYN flood, XSS и SQLi и чем фаервол отличается от WAF." },
  "ip": { t: "IP-адрес, маска и NAT простыми словами", term: "IP-адрес",
    d: "Из чего состоит IPv4-адрес и что значит /24, чем частный адрес отличается от публичного, как работают NAT и ARP и что твой IP говорит о тебе." },
  "tcp-udp-porty": { t: "TCP и UDP простыми словами: отличия и порты", term: "Порт",
    d: "Чем TCP отличается от UDP, как проходит рукопожатие SYN, SYN-ACK, ACK, что живёт за портами 22, 53, 80 и 443 и что значат open, closed и filtered." },
  "dns": { t: "Как работает DNS простыми словами: TTL, DNSSEC, DoH", term: "DNS",
    d: "Как резолвер находит IP через корень и зону .ru, что хранят записи A, AAAA, CNAME, MX и TXT, что такое отравление кэша и чем DNSSEC отличается от DoH." },
  "https-tls": { t: "Как работает HTTPS и TLS простыми словами", term: "TLS",
    d: "Что дают TLS и HTTPS, как браузер проверяет сертификат по цепочке до корня, как проходит рукопожатие TLS 1.3 и почему замок не значит «честный сайт»." },
  "api": { t: "Что такое API простыми словами: клиент, сервер, REST", term: "API",
    d: "Чем клиент отличается от сервера и что такое API, как устроен REST: методы, коды ответа и JSON, зачем токены и лимиты и какие дыры бывают в API." },
  "linux": { t: "Linux для начинающих: терминал, права и root", term: "Права rwx", q: "Как устроены права rwx в Linux?",
    d: "Дерево папок Linux, права -rw-r----- и число 640, root и sudo, принцип наименьших привилегий и как найти в журнале попытки подобрать пароль." },
  "git": { t: "Git для начинающих: коммиты, ветки и защита main", term: "Коммит", q: "Что такое коммит в Git?",
    d: "Что такое репозиторий, коммит и ветка, как работают merge, pull и push, почему история Git вечна и как защита ветки и ревью останавливают force push." },
  "bash": { t: "Bash для начинающих: конвейеры, потоки и скрипты", term: "Шелл",
    d: "Терминал и шелл, конвейер grep | awk | sort | uniq -c для поиска атакующего в логе, потоки > и 2>, коды выхода и почему curl | sudo bash опасно." },
  "python": { t: "Python для безопасника: первый скрипт и pip", term: "PyPI",
    d: "Первый скрипт на Python, который ловит подбор пароля в логах: переменные, цикл и словарь. Как устроены pip, PyPI и venv и как защититься от атак через пакеты." },
  "sql-bazy": { t: "SQL и базы данных для начинающих: SELECT и JOIN", term: "Первичный ключ",
    d: "Таблицы, первичный и внешний ключи, SELECT, WHERE и JOIN, почему UPDATE и DELETE без WHERE опасны, транзакции и защита базы: права, хеши, бэкапы 3-2-1." },
  "kriptografiya": { t: "Криптография простыми словами: хеши, ключи, подписи", term: "Хеш-функция",
    d: "Чем кодирование отличается от шифрования и хеширования, почему пароли хранят в Argon2id или bcrypt с солью, а не в MD5, как работают ключи и подпись." }
};
// Остальные страницы по адресу. Нет в списке — остаются title/description из build.js (только обрезаются по длине).
// name — подпись в хлебных крошках и llms.txt; index: true — индексировать, даже если build.js поставил noindex
// (решение Адама 15.10: «Разминка» — готовый раздел, а не заглушка «скоро»).
// kind: "manual" — методичка или шпаргалка Барахолки (LearningResource), parent — адрес родителя в крошках.
const PAGE_SEO = {
  "": { name: "Главная", t: "Кибербезопасность для начинающих в комиксах — CyberComics",
    d: "Кибербезопасность простыми словами для подростков и новичков: комиксы про сети, OWASP Top 10, XSS, SQL-инъекции и JWT. Квизы и вопросы с собеседований." },
  "povtorenie/": { name: "Прокачаться", t: "Прокачаться: вопросы по кибербезопасности — CyberComics",
    d: "Прокачайся после выпусков CyberComics: вопросы из квизов по сетям, вебу и OWASP возвращаются, пока не запомнятся. Прогресс хранится в браузере." },
  "arkada/": { name: "Разминка", index: true, t: "Разминка: кроссворды и игры про IT — CyberComics",
    d: "Кроссворды, вордл, филворд и игры «Правда или миф» по темам кибербезопасности, сетей и веба. Разминка для мозга после выпусков CyberComics." },
  "baraholka/": { name: "Барахолка", t: "Барахолка: методички и шпаргалки по IT — CyberComics",
    d: "Методички в стиле тетради (Git, OWASP Top 10:2025) и шпаргалки по HTTP-кодам, портам и Linux. Открываются за биты, которые зарабатываешь за выпуски." },
  "baraholka/git/": { kind: "manual", parent: "baraholka/", name: "Git: тетрадь выживания", about: "Git",
    t: "Git для начинающих: методичка-тетрадь — CyberComics",
    d: "Git простыми словами: репозиторий, коммит, ветка, merge, push и pull, .gitignore, как откатить ошибку и почему секреты нельзя коммитить. Шпаргалка команд." },
  "baraholka/owasp/": { kind: "manual", parent: "baraholka/", name: "OWASP Top 10:2025 — конспект", about: "OWASP Top 10",
    t: "OWASP Top 10:2025 конспект на русском — CyberComics",
    d: "Конспект OWASP Top 10:2025 на русском: все 10 категорий одной фразой, пример, как защититься и чем не путать с соседней категорией. Методичка-тетрадь." },
  "baraholka/http-kody/": { kind: "manual", parent: "baraholka/", name: "HTTP-коды: шпаргалка", about: "Коды состояния HTTP",
    t: "Коды ответа HTTP: шпаргалка 2xx–5xx — CyberComics",
    d: "Шпаргалка по кодам ответа HTTP: 2xx, 3xx, 4xx и 5xx, чем 401 отличается от 403 и что коды ответа говорят о безопасности сайта." },
  "baraholka/porty/": { kind: "manual", parent: "baraholka/", name: "Порты TCP и UDP: шпаргалка", about: "Порты TCP и UDP",
    t: "Порты TCP и UDP: шпаргалка — CyberComics",
    d: "Шпаргалка по портам: 22 SSH, 53 DNS, 80 и 443 HTTP и HTTPS, порты баз данных, диапазоны портов и какие порты нельзя открывать в интернет." },
  "baraholka/linux/": { kind: "manual", parent: "baraholka/", name: "Команды Linux: шпаргалка", about: "Командная строка Linux",
    t: "Команды Linux для начинающих: шпаргалка — CyberComics",
    d: "Шпаргалка по командам Linux на каждый день: файлы, поиск, права, процессы, диск и сеть, с объяснением каждого флага." }
};
// Кому адресованы материалы (schema.org audience): подростки 12+ и новички.
const AUDIENCE = { "@type": "EducationalAudience", educationalRole: "student", audienceType: "подростки 12+ и начинающие в IT" };
// Подтверждение прав в Яндекс.Вебмастере и Google Search Console (мета-тег на главной): только буквы, цифры, «_» и «-».
const verif = (v) => (/^[A-Za-z0-9_-]{8,100}$/.test(v || "") ? v : "");
const SITE_DESC = "Интерактивные комиксы про кибербезопасность на русском для подростков и новичков: как работают сети и веб, как устроены атаки из OWASP Top 10 и как от них защищаться.";

// ---------- Вспомогательное ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Текст из данных выпуска: всё экранируем, кроме простых тегов <b>, <i>, <code>, <strong>, <em>.
const rich = (s) => esc(s).replace(/&lt;(\/?)(b|i|code|strong|em)&gt;/g, "<$1$2>");
const plain = (s) => String(s).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const len = (s) => Array.from(s).length;
function clip(s, max) {
  s = plain(s);
  if (len(s) <= max) return s;
  const cut = Array.from(s).slice(0, max - 1).join("");
  return cut.replace(/[\s,;:—–-]+\S*$/, "").replace(/[\s,;:—–-]+$/, "") + "…";
}
function withBrand(t) {
  const full = t + " — " + BRAND;
  return len(full) <= 60 ? full : clip(t, 60);
}
const mtime = (p) => { try { return fs.statSync(p).mtime; } catch (e) { return null; } };
const day = (d) => d.toISOString().slice(0, 10);
const maxDate = (list) => list.filter(Boolean).reduce((a, b) => (a && a > b ? a : b), null);

// ---------- Данные выпусков: те же источники, что у build.js ----------
function loadIssues(srcDir, ixDir) {
  const out = {};
  try {
    const html = fs.readFileSync(path.join(srcDir, "pages", "IssueReader.dc.html"), "utf8");
    const logic = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
    const I = (0, eval)("(" + logic.match(/const ISSUES = (\{[\s\S]*?\n    \});\n/)[1] + ")");
    Object.keys(I).forEach((n) => { out[n] = I[n]; });
  } catch (e) { console.warn("  seo: не прочитал ISSUES из IssueReader.dc.html (" + e.message + ")"); }
  if (fs.existsSync(ixDir)) {
    fs.readdirSync(ixDir).filter((f) => f.endsWith(".meta.json")).forEach((f) => {
      try { const m = JSON.parse(fs.readFileSync(path.join(ixDir, f), "utf8")); if (m.n) out[m.n] = Object.assign({}, out[m.n], m); } catch (e) { /* битый паспорт build.js и так пропустит */ }
    });
  }
  return out;
}

function keyTerm(d, cfg) {
  if (cfg.def) return { term: cfg.topic, def: cfg.def };
  const fn = Array.isArray(d.fn) ? d.fn : [];
  const want = (cfg.term || "").toLowerCase();
  const hit = fn.find((f) => f[0].toLowerCase() === want) || fn.find((f) => want && f[0].toLowerCase().startsWith(want)) || fn[0];
  if (!hit) return null;
  const def = hit[1].trim();
  // «Протокол, …» → «протокол, …», но «Cross-Site Scripting», «Python Package Index», «TLS» не трогаем.
  const low = /^[А-ЯЁ][а-яё]/.test(def) ? def.charAt(0).toLowerCase() + def.slice(1) : def;
  return { term: hit[0], def: low };
}

// ---------- Конспект выпуска: видимый текст без JS ----------
// Кладётся в конец <template id="ix-fragment"> (до метки «прочитано»), поэтому он есть и в запечённом
// HTML, и после запуска JS. Свёрнут в <details>: не спойлерит «Подумай сам» и не мешает истории.
const KONSPEKT_CSS =
  ".cc-konspekt{max-width:860px;margin:56px auto 24px;padding:0 16px;box-sizing:border-box;font-family:Rubik,system-ui,sans-serif;color:#141414}" +
  ".cc-konspekt details{background:#fff;border:3px solid #141414;box-shadow:6px 6px 0 #141414}" +
  ".cc-konspekt summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:12px;min-height:56px;padding:12px 18px;box-sizing:border-box;font-family:'Russo One',sans-serif;font-size:20px;line-height:1.25;background:#ffd60a;border-bottom:3px solid transparent}" +
  ".cc-konspekt summary::-webkit-details-marker{display:none}" +
  ".cc-konspekt summary::after{content:'+';margin-left:auto;font-size:28px;line-height:1}" +
  ".cc-konspekt details[open] summary{border-bottom-color:#141414}" +
  ".cc-konspekt details[open] summary::after{content:'−'}" +
  ".cc-konspekt summary:focus-visible{outline:3px solid #ff2e93;outline-offset:3px}" +
  ".cc-konspekt .kb{padding:8px 20px 24px;font-size:18px;line-height:1.6}" +
  ".cc-konspekt h2{margin:28px 0 10px;font-family:'Russo One',sans-serif;font-size:22px;line-height:1.25}" +
  ".cc-konspekt h3{margin:0 0 8px;font-family:Rubik,system-ui,sans-serif;font-weight:700;font-size:19px;line-height:1.4}" +
  ".cc-konspekt p,.cc-konspekt dd,.cc-konspekt li{margin:0 0 12px}" +
  ".cc-konspekt dl{margin:0}.cc-konspekt dt{font-weight:700;margin-top:14px}.cc-konspekt dd{margin-left:0}" +
  ".cc-konspekt ul{padding-left:22px;margin:0}" +
  ".cc-konspekt .lead{font-size:20px}" +
  ".cc-konspekt .note{font-size:18px;color:#2a2a2a;border-top:2px solid #141414;padding-top:14px;margin-top:24px}";

// Главный вопрос выпуска: «Что такое коммит?», но «Что такое XSS?» (строчная — только для обычных русских слов).
function mainQuestion(kt, cfg) {
  if (cfg.q) return cfg.q;
  const t = /^[А-ЯЁ][а-яё]/.test(kt.term) ? kt.term.charAt(0).toLowerCase() + kt.term.slice(1) : kt.term;
  return "Что такое " + t + "?";
}

function konspekt(d, cfg) {
  const kt = keyTerm(d, cfg);
  const parts = [];
  if (kt) parts.push("<h2>" + esc(mainQuestion(kt, cfg)) + '</h2><p class="lead"><b>' + esc(kt.term) + "</b> — " + rich(kt.def) + "</p>");
  if (Array.isArray(d.learn) && d.learn.length) parts.push("<h2>О чём выпуск</h2><ul>" + d.learn.map((s) => "<li>" + rich(s) + "</li>").join("") + "</ul>");
  if (Array.isArray(d.fn) && d.fn.length) parts.push("<h2>Словарик</h2><dl>" + d.fn.map((f) => "<dt>" + rich(f[0]) + "</dt><dd>" + rich(f[1]) + "</dd>").join("") + "</dl>");
  if (d.iv && d.iv.q) parts.push("<h2>Вопрос с собеседования</h2><h3>" + rich(d.iv.q) + "</h3><p>" + rich(d.iv.a) + "</p>");
  parts.push('<p class="note">Практиковаться можно только там, где это разрешено: picoCTF, PortSwigger Web Security Academy, OWASP Juice Shop. Чужие сайты без разрешения трогать нельзя.</p>');
  return '<aside class="cc-konspekt" aria-label="Конспект выпуска" data-seo="konspekt"><style>' + KONSPEKT_CSS + "</style>" +
    "<details><summary>Конспект выпуска: главное текстом</summary><div class=\"kb\">" + parts.join("") + "</div></details></aside>";
}

// Вставить конспект в <template id="ix-fragment"> файла. Вызывается prerender.js ДО отрисовки.
// Повторный вызов ничего не дублирует.
function injectKonspekt(file, ctx) {
  let html = fs.readFileSync(file, "utf8");
  if (html.indexOf('data-seo="konspekt"') !== -1) return false;
  const m = html.match(/<template id="ix-fragment" data-issue="(\d+)">/);
  if (!m) return false;
  const n = m[1], d = ctx.issues[n], slug = issueSlug(file, ctx.dist);
  if (!d || !slug) return false;
  const cfg = ISSUE_SEO[slug] || {};
  // Конец нашего шаблона: последний </template> перед скриптами сайта (во фрагменте бывают свои <template>).
  const tail = html.indexOf("<script>window.CC_LINKS", m.index);
  const at = html.lastIndexOf("</template>", tail === -1 ? html.length : tail);
  if (at < m.index) return false;
  html = html.slice(0, at) + konspekt(d, cfg) + "\n" + html.slice(at);
  fs.writeFileSync(file, html);
  return true;
}

function issueSlug(file, dist) {
  const rel = path.relative(dist, file).split(path.sep).join("/");
  const m = rel.match(/^vypuski\/([a-z0-9-]+)\/index\.html$/);
  return m ? m[1] : null;
}

// ---------- Контекст сборки ----------
function context(dist, opts) {
  opts = opts || {};
  const src = opts.src || __dirname;
  const ixDir = opts.ixDir || (process.env.IX_DIR ? path.resolve(process.env.IX_DIR) : path.join(src, "..", "concepts", "issues"));
  const siteUrl = (opts.siteUrl !== undefined ? opts.siteUrl : process.env.SITE_URL || "").replace(/\/$/, "");
  const preview = opts.preview !== undefined ? !!opts.preview : !!process.env.PREVIEW;
  return { dist, src, ixDir, preview, real: !!siteUrl, base: siteUrl || PLACEHOLDER, issues: loadIssues(src, ixDir), og: opts.og || {} };
}

// Все страницы сборки: каждый index.html вне assets/.
function listPages(dist) {
  const out = [];
  (function walk(dir, route) {
    fs.readdirSync(dir).forEach((f) => {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) { if (f !== "assets") walk(p, route + f + "/"); }
      else if (f === "index.html") out.push({ file: p, route });
    });
  })(dist, "");
  return out.sort((a, b) => a.route.localeCompare(b.route));
}

// ---------- Обработка одной страницы ----------
function processPage(pg, ctx) {
  let html = fs.readFileSync(pg.file, "utf8");
  // Страница-переадресация (старый адрес /lavka/): не трогаем, в sitemap не кладём.
  if (/http-equiv="refresh"/.test(html)) return { route: pg.route, redirect: true, noindex: true };
  const get = (re) => { const m = html.match(re); return m ? m[1] : ""; };
  const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const oldTitle = unesc(get(/<title>([^<]*)<\/title>/));
  const oldDesc = unesc(get(/<meta name="description" content="([^"]*)">/));
  const cfgPage = PAGE_SEO[pg.route];
  const noindex = ctx.preview || (!(cfgPage && cfgPage.index) && /<meta name="robots" content="[^"]*noindex/.test(html));
  const mount = html.match(/DC\.mount\("(\w+)", document\.getElementById\("app"\), (\{[^}]*\})\)/);
  const comp = mount ? mount[1] : "";
  const props = mount ? JSON.parse(mount[2]) : {};
  const slug = issueSlug(pg.file, ctx.dist);
  const n = comp === "IssueReader" ? String(props.issue || "") : "";
  const d = n ? ctx.issues[n] : null;
  const url = ctx.base + "/" + pg.route;
  const root = pg.route ? "../".repeat(pg.route.split("/").filter(Boolean).length) : "./";

  let title, desc;
  if (d && slug) {
    const cfg = ISSUE_SEO[slug];
    title = cfg ? withBrand(cfg.t) : withBrand(clip(oldTitle.replace(/\s+—\s+CyberComics.*$/, ""), 60));
    desc = cfg ? cfg.d : clip(d.sub + ". " + (d.learn || []).join("; "), 160);
  } else if (PAGE_SEO[pg.route]) { title = PAGE_SEO[pg.route].t; desc = PAGE_SEO[pg.route].d; }
  else { title = clip(oldTitle, 60); desc = clip(oldDesc, 160); }
  if (len(title) > 60) console.warn("  seo: title длиннее 60: " + pg.route);
  if (len(desc) > 160) console.warn("  seo: description длиннее 160: " + pg.route);

  // Картинка для соцсетей: скриншот 1200×630 из prerender.js, иначе картинка из build.js.
  const ogRel = ctx.og[pg.route] || (get(/<meta property="og:image" content="([^"]*)">/).replace(/^(\.\.\/|\.\/)+/, "").replace(/^https?:\/\/[^/]+\//, "") || "assets/img/villain-2.webp");
  const ogAbs = ctx.base + "/" + ogRel;
  const ogIsShot = !!ctx.og[pg.route] || /^assets\/og\//.test(ogRel); // снимок 1200×630 (и при повторном запуске seo.js)

  // Дата изменения: по исходникам этой страницы (не дата сборки — иначе поисковики перестают верить lastmod).
  const pageSrc = comp ? path.join(ctx.src, "pages", comp + ".dc.html") : null;
  let lastmod;
  if (d && slug) lastmod = maxDate([mtime(path.join(ctx.ixDir, slug + ".html")), mtime(path.join(ctx.ixDir, slug + ".meta.json"))]) || mtime(pageSrc);
  else if (pg.route === "") lastmod = maxDate([mtime(pageSrc)].concat(Object.keys(ISSUE_SEO).map((s) => mtime(path.join(ctx.ixDir, s + ".html")))));
  else if (comp === "Manual" && props.id) {
    const mf = (html.match(/<template id="mn-src"/) && cfgPage) ? pg.route.split("/").filter(Boolean).pop() : "";
    lastmod = maxDate([mtime(pageSrc), mtime(path.join(ctx.src, "..", "concepts", "manuals", mf + ".html"))]);
  } else lastmod = mtime(pageSrc);
  lastmod = lastmod || new Date();

  // JSON-LD
  const mail = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(process.env.CONTACT_EMAIL || "") ? process.env.CONTACT_EMAIL : "";
  const org = { "@type": "Organization", "@id": ctx.base + "/#org", name: BRAND, url: ctx.base + "/",
    logo: { "@type": "ImageObject", url: ctx.base + "/assets/icon-512.png", width: 512, height: 512 }, email: mail || undefined };
  const site = { "@type": "WebSite", "@id": ctx.base + "/#website", name: BRAND, url: ctx.base + "/", inLanguage: "ru", description: SITE_DESC, publisher: { "@id": org["@id"] } };
  let graph = null;
  const crumbList = (items) => ({ "@type": "BreadcrumbList", "@id": url + "#breadcrumbs",
    itemListElement: items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })) });
  if (pg.route === "") graph = [org, site];
  else if (cfgPage && !noindex) {
    const chain = [[BRAND, ctx.base + "/"]];
    if (cfgPage.parent && PAGE_SEO[cfgPage.parent]) chain.push([PAGE_SEO[cfgPage.parent].name, ctx.base + "/" + cfgPage.parent]);
    chain.push([cfgPage.name || title, url]);
    graph = [org, site];
    if (cfgPage.kind === "manual") graph.push({
      "@type": "LearningResource", "@id": url + "#resource", url, mainEntityOfPage: url, name: cfgPage.name, description: desc,
      inLanguage: "ru", dateModified: day(lastmod), author: { "@id": org["@id"] }, publisher: { "@id": org["@id"] }, isPartOf: { "@id": site["@id"] },
      learningResourceType: /шпаргалка/i.test(cfgPage.name) ? "шпаргалка" : "методичка", about: { "@type": "Thing", name: cfgPage.about },
      educationalLevel: "начальный", typicalAgeRange: "12-", audience: AUDIENCE, image: [ogAbs] });
    graph.push(crumbList(chain));
  }
  else if (d && slug) {
    const cfg = ISSUE_SEO[slug] || {};
    const art = {
      "@type": ["Article", "LearningResource"], "@id": url + "#article", url, mainEntityOfPage: url,
      headline: clip(d.title, 110), name: d.title, alternativeHeadline: cfg.t || undefined, description: desc, inLanguage: "ru", image: [ogAbs],
      dateModified: day(lastmod), author: { "@id": org["@id"] }, publisher: { "@id": org["@id"] },
      isPartOf: { "@id": site["@id"] }, position: Number(n), isAccessibleForFree: true,
      learningResourceType: "интерактивный комикс", educationalLevel: LEVEL[d.diff] || undefined,
      timeRequired: d.minutes ? "PT" + d.minutes + "M" : undefined, teaches: d.learn,
      about: { "@type": "Thing", name: cfg.topic || cfg.term || plain(d.title).split(":")[0] },
      typicalAgeRange: "12-", audience: AUDIENCE
    };
    const crumbs = { "@type": "BreadcrumbList", "@id": url + "#breadcrumbs", itemListElement: [
      { "@type": "ListItem", position: 1, name: BRAND, item: ctx.base + "/" },
      { "@type": "ListItem", position: 2, name: d.title, item: url }] };
    graph = [org, site, art, crumbs];
    // FAQPage — только если на странице есть видимый конспект с этими же вопросами.
    if (html.indexOf('data-seo="konspekt"') !== -1) {
      const kt = keyTerm(d, cfg), qa = [];
      if (kt) qa.push([mainQuestion(kt, cfg), kt.term + " — " + plain(kt.def)]);
      if (d.iv && d.iv.q) qa.push([plain(d.iv.q), plain(d.iv.a)]);
      if (qa.length) graph.push({ "@type": "FAQPage", "@id": url + "#faq", mainEntity: qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
    }
  }

  const robots = noindex ? (ctx.preview ? "noindex, nofollow" : "noindex, follow") : "index, follow, max-image-preview:large, max-snippet:-1";
  const tags = [
    "<!-- seo -->",
    "<title>" + esc(title) + "</title>",
    '<meta name="description" content="' + esc(desc) + '">',
    '<meta name="robots" content="' + robots + '">',
    pg.route === "" && !ctx.preview && verif(process.env.YANDEX_VERIFICATION) ? '<meta name="yandex-verification" content="' + verif(process.env.YANDEX_VERIFICATION) + '">' : "",
    pg.route === "" && !ctx.preview && verif(process.env.GOOGLE_VERIFICATION) ? '<meta name="google-site-verification" content="' + verif(process.env.GOOGLE_VERIFICATION) + '">' : "",
    noindex ? "" : '<link rel="canonical" href="' + esc(url) + '">',
    '<meta property="og:type" content="' + (d ? "article" : "website") + '">',
    '<meta property="og:site_name" content="' + BRAND + '">',
    '<meta property="og:locale" content="ru_RU">',
    '<meta property="og:title" content="' + esc(title) + '">',
    '<meta property="og:description" content="' + esc(desc) + '">',
    '<meta property="og:url" content="' + esc(url) + '">',
    '<meta property="og:image" content="' + esc(ogAbs) + '">',
    ogIsShot ? '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">' : "",
    '<meta property="og:image:alt" content="' + esc(d ? d.title : title) + '">',
    d ? '<meta property="article:modified_time" content="' + day(lastmod) + '">' : "",
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + esc(title) + '">',
    '<meta name="twitter:description" content="' + esc(desc) + '">',
    '<meta name="twitter:image" content="' + esc(ogAbs) + '">',
    graph ? '<script type="application/ld+json">' + JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") + "</script>" : "",
    "<!-- /seo -->"
  ].filter(Boolean).join("\n");

  // Убираем то, что написал build.js (или прошлый запуск), и ставим новое после viewport.
  html = html.replace(/<!-- seo -->[\s\S]*?<!-- \/seo -->\n?/, "")
    .replace(/<title>[^<]*<\/title>\n?/, "")
    .replace(/<meta name="(description|robots|twitter:[a-z:]+|yandex-verification|google-site-verification)" content="[^"]*">\n?/g, "")
    .replace(/<link rel="canonical" href="[^"]*">\n?/g, "")
    .replace(/<meta property="(og|article):[a-z_:]+" content="[^"]*">\n?/g, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, "");
  html = html.replace(/(<meta name="viewport"[^>]*>\n?)/, "$1" + tags + "\n");
  fs.writeFileSync(pg.file, html);
  return { route: pg.route, url, title, desc, noindex, lastmod: day(lastmod), n, slug, d };
}

// ---------- Вся сборка ----------
function apply(dist, opts) {
  const ctx = context(dist, opts);
  // Конспект (если prerender.js его ещё не вставил): тогда он появится после запуска JS.
  listPages(dist).forEach((pg) => injectKonspekt(pg.file, ctx));
  const done = listPages(dist).map((pg) => processPage(pg, ctx)).filter((p) => !p.redirect);
  const live = done.filter((p) => !p.noindex);

  // 404: не индексировать.
  const f404 = path.join(dist, "404.html");
  if (fs.existsSync(f404)) {
    let h = fs.readFileSync(f404, "utf8");
    if (h.indexOf('name="robots"') === -1) { h = h.replace(/(<meta charset="utf-8">)/, '$1<meta name="robots" content="noindex">'); fs.writeFileSync(f404, h); }
  }

  // robots.txt. Страницы «скоро» не закрываем Disallow: иначе робот не увидит их noindex.
  const robots = ctx.preview
    ? "# Превью-сборка: не для поиска.\nUser-agent: *\nDisallow: /\n"
    : "# CyberComics: поисковики и ИИ-поиск — welcome.\nUser-agent: *\nAllow: /\n\n" +
      "# Яндекс: метки рекламы и соцсетей не создают новых страниц.\nUser-agent: Yandex\nAllow: /\nClean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&gclid&fbclid&from\n\n" +
      "Sitemap: " + ctx.base + "/sitemap.xml\n";
  fs.writeFileSync(path.join(dist, "robots.txt"), robots);

  // sitemap.xml: только индексируемые страницы, lastmod по исходникам.
  const sm = path.join(dist, "sitemap.xml");
  if (ctx.preview) { if (fs.existsSync(sm)) fs.unlinkSync(sm); }
  else fs.writeFileSync(sm, '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    live.map((p) => "  <url><loc>" + esc(p.url) + "</loc><lastmod>" + p.lastmod + "</lastmod></url>").join("\n") + "\n</urlset>\n");

  // llms.txt: краткая карта сайта для ИИ-ассистентов (формат llmstxt.org).
  const issues = live.filter((p) => p.d).sort((a, b) => Number(a.n) - Number(b.n));
  const group = (name, list) => list.length ? "\n## " + name + "\n\n" + list.map((p) => "- [№" + p.n + ". " + plain(p.d.title) + "](" + p.url + "): " + plain(p.desc)).join("\n") + "\n" : "";
  const found = issues.filter((p) => p.d.district === "Фундамент"), web = issues.filter((p) => p.d.district !== "Фундамент");
  const llms = "# CyberComics\n\n> " + SITE_DESC + "\n\n" +
    "Каждый выпуск — интерактивный комикс на 9–13 минут: история с наставником Дядей Мишей и стажёркой Соней, битва со злодеем-уязвимостью, вопрос с собеседования junior AppSec с сильным ответом и шпаргалка. В конце выпуска есть текстовый конспект: определение, словарик и ответ на вопрос с собеседования. " +
    "Атаки объясняются как «как это работает и как защититься», без инструкций для чужих систем; для практики сайт советует picoCTF, PortSwigger Web Security Academy и OWASP Juice Shop. Язык — русский.\n" +
    group("Фундамент: сети, системы и инструменты", found) + group("Веб-уязвимости и AppSec", web) +
    "\n## Разделы\n\n- [Главная](" + ctx.base + "/): все выпуски и карта районов города Сетеград\n" +
    live.filter((p) => PAGE_SEO[p.route] && p.route && !PAGE_SEO[p.route].kind).map((p) => "- [" + PAGE_SEO[p.route].name + "](" + p.url + "): " + plain(p.desc) + "\n").join("") +
    (live.some((p) => PAGE_SEO[p.route] && PAGE_SEO[p.route].kind === "manual") ? "\n## Методички и шпаргалки (Барахолка)\n\nПервый разворот каждой методички открыт всем, остальное открывается за биты, заработанные чтением выпусков.\n\n" +
      live.filter((p) => PAGE_SEO[p.route] && PAGE_SEO[p.route].kind === "manual").map((p) => "- [" + PAGE_SEO[p.route].name + "](" + p.url + "): " + plain(p.desc) + "\n").join("") : "");
  if (!ctx.preview) fs.writeFileSync(path.join(dist, "llms.txt"), llms);

  // IndexNow: файл ключа в корне.
  const key = process.env.INDEXNOW_KEY || "";
  if (key && !ctx.preview) {
    if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) console.warn("  seo: INDEXNOW_KEY должен быть 8–128 символов: буквы, цифры, «-»");
    else fs.writeFileSync(path.join(dist, key + ".txt"), key);
  }

  console.log("SEO: " + done.length + " страниц, в sitemap " + (ctx.preview ? 0 : live.length) + (ctx.preview ? " (PREVIEW: noindex везде, robots закрыт)" : ""));
  if (!ctx.real && !ctx.preview) {
    console.warn("\n  !!! SITE_URL не задан: в canonical, og:url, sitemap.xml, robots.txt и llms.txt стоит заглушка " + PLACEHOLDER + ".\n" +
      "  !!! Такую сборку НЕ выкладывать. Пересобери: SITE_URL=https://твой-домен.ru node src/build.js && node src/prerender.js\n");
  }
  return done;
}

// ---------- IndexNow: сообщить Яндексу (и Bing) об адресах после выкладки ----------
function ping(dist) {
  const key = process.env.INDEXNOW_KEY || "", site = (process.env.SITE_URL || "").replace(/\/$/, "");
  if (!key || !site) { console.error("Нужны SITE_URL и INDEXNOW_KEY (тот же, что при сборке)."); process.exit(1); }
  const xml = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
  const urlList = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1].replace(/&amp;/g, "&"));
  const body = JSON.stringify({ host: new URL(site).host, key, keyLocation: site + "/" + key + ".txt", urlList });
  if (process.env.DRY_RUN) { console.log(body); return; }
  const req = require("https").request("https://yandex.com/indexnow", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) } },
    (res) => { console.log("IndexNow (Яндекс): HTTP " + res.statusCode + " — отправлено адресов: " + urlList.length + (res.statusCode === 200 || res.statusCode === 202 ? "" : ". 403 — ключ не найден на сайте, 422 — адреса не с этого домена.")); });
  req.on("error", (e) => console.error("IndexNow: " + e.message));
  req.end(body);
}

module.exports = { apply, injectKonspekt, context, listPages, ISSUE_SEO, PAGE_SEO, PLACEHOLDER };

if (require.main === module) {
  const dist = path.join(__dirname, "..", process.env.PREVIEW ? "preview" : "dist");
  if (process.argv[2] === "ping") ping(dist);
  else apply(dist);
}
