/* CyberComics — история выпуска с интерактивами.
 * Движок страниц оставляет пустой <div data-toy="имя">, этот файл рисует в нём историю.
 * Всё работает в браузере, без сети. */
(function () {
  "use strict";
  var ROOT = (document.querySelector('meta[name="site-root"]') || {}).content || "/";
  var VIMG = ROOT + "assets/img/villain-1.webp";

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function say(who, text) {
    var av = who === "villain" ? '<img src="' + VIMG + '" alt="">' : '<i class="' + who + '">' + (who === "kai" ? "С" : "ДМ") + "</i>";
    var name = { villain: "Перехватчик", kai: "Соня", hero: "Дядя Миша" }[who];
    return '<div class="st-say' + (who === "villain" ? " v r" : "") + '"><div class="st-who">' + av + name + '</div><p class="st-b">' + text + "</p></div>";
  }
  function chapter(n, title, inner) {
    return '<section class="st-ch" aria-labelledby="st-h' + n + '"><div class="st-chh"><span class="st-n" aria-hidden="true">' + n + '</span><h2 id="st-h' + n + '">' + title + "</h2></div>" + inner + "</section>";
  }
  function mem(text) { return '<p class="st-mem"><span>' + text + "</span></p>"; }

  // ---------- игрушка 1: письмо и ответ ----------
  var LETTERS = [
    { id: "a", label: "Открыть каталог", path: "/skates", cookie: false, code: 200, text: "OK", said: "Вот каталог: «Молния» — 4 990 ₽." },
    { id: "b", label: "Мои заказы, не войдя", path: "/orders", cookie: false, code: 401, text: "Unauthorized", said: "А ты кто? Сначала войди." },
    { id: "c", label: "Мои заказы после входа", path: "/orders", cookie: true, code: 200, text: "OK", said: "Привет, Соня! «Молния» уже в пути." },
    { id: "d", label: "Зайти в админку", path: "/admin", cookie: true, code: 403, text: "Forbidden", said: "Знаю, что ты Соня. Но тебе сюда нельзя." }
  ];
  function letter(el) {
    var cur = "b";
    function draw() {
      var L = LETTERS.filter(function (l) { return l.id === cur; })[0];
      var mail = "GET " + L.path + " HTTP/1.1\nHost: shop.example\n" + (L.cookie ? "<mark>Cookie: session=8f3a…</mark>" : '<span class="dim">(номерка нет)</span>');
      el.innerHTML = '<div class="st-toy"><p class="st-ask">Что делает Соня?</p><div class="st-pills" role="group" aria-label="Что делает Соня">' +
        LETTERS.map(function (l) { return '<button type="button" class="st-pill" data-l="' + l.id + '" aria-pressed="' + (l.id === cur) + '">' + l.label + "</button>"; }).join("") +
        '</div><div class="st-res" aria-live="polite"><pre class="st-mail">' + mail + '</pre><div class="st-ans"><span class="st-code ' + (L.code < 300 ? "ok" : "no") + '">' + L.code + "<small>" + L.text + "</small></span><p>«" + L.said + "»</p></div></div></div>";
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-l]"); if (!b) return;
      cur = b.getAttribute("data-l"); draw();
      var nb = el.querySelector('[data-l="' + cur + '"]'); if (nb) nb.focus();
    });
    draw();
  }

  // ---------- игрушка 2: глазами Перехватчика ----------
  function road(el) {
    var https = false;
    function blur(s) { return s.replace(/[^\s]/g, "▒"); }
    function draw() {
      var body = "POST /login HTTP/1.1\nCookie: session=8f3a…\n\nlogin=sonya&password=molniya2010";
      var mail = '<span class="dim">куда:</span> shop.example\n' + (https ? '<span class="dim">' + blur(body) + "</span>" : esc(body));
      el.innerHTML = '<div class="st-toy"><p class="st-ask">Соня входит в аккаунт с вокзала. Как едет письмо?</p>' +
        '<div class="st-sw" role="group" aria-label="Как едет письмо"><button type="button" class="http" data-m="0" aria-pressed="' + !https + '">http://</button><button type="button" class="https" data-m="1" aria-pressed="' + https + '">https://</button></div>' +
        '<pre class="st-mail" aria-live="polite">' + mail + "</pre>" +
        '<p class="st-verdict"><img src="' + VIMG + '" alt="Перехватчик">' + (https ? "«Вижу только, что она пишет в shop.example. Остальное — каша.»" : "«Логин sonya, пароль molniya2010. Спасибо, Соня!»") + "</p></div>";
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-m]"); if (!b) return;
      https = b.getAttribute("data-m") === "1"; draw();
      var nb = el.querySelector('[data-m="' + (https ? 1 : 0) + '"]'); if (nb) nb.focus();
    });
    draw();
  }

  // ---------- игрушка 3: перепиши письмо ----------
  var PRICE = 4990;
  function rub(n) { return n.toLocaleString("ru-RU") + " ₽"; }
  function tamper(el) {
    var price = String(PRICE), sent = false;
    function draw() {
      var out = "";
      if (sent) {
        var raw = price.trim(), num = /^-?\d+$/.test(raw) ? Number(raw) : NaN;
        var naive = isNaN(num)
          ? '<p>Не смог посчитать «' + esc(raw || "пусто") + '» и упал.</p><strong>500</strong>'
          : '<p>К оплате:</p><strong>' + esc(rub(num)) + "</strong>" + (num < PRICE ? '<span class="st-stamp r">ВЗЛОМ</span>' : "");
        var good = '<p>Цена из базы:</p><strong>' + rub(PRICE) + "</strong>" + (raw !== String(PRICE) ? '<span class="st-stamp g">ОТБИТО</span>' : "");
        out = '<div class="st-two" aria-live="polite"><div class="st-rec"><h4>Наивный сервер верит письму</h4>' + naive + '</div><div class="st-rec"><h4>Правильный сервер смотрит в базу</h4>' + good + "</div></div>";
      }
      el.innerHTML = '<div class="st-toy"><div class="st-buy"><b>Скейт «Молния», 4 990 ₽</b><span class="st-lock">🔒 HTTPS</span></div>' +
        '<pre class="st-mail">POST /checkout HTTP/1.1\nHost: shop.example\n\nitem=molniya&amp;price=<input class="st-in" id="st-price" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" aria-label="Цена в письме" value="' + esc(price) + '"></pre>' +
        (sent ? "" : '<p class="st-hint">Сотри 4990, впиши 1 и отправь.</p>') +
        '<button type="button" class="st-go" data-a="send">Отправить письмо</button>' + out + "</div>";
    }
    el.addEventListener("input", function (e) { if (e.target.id === "st-price") price = e.target.value; });
    el.addEventListener("keydown", function (e) { if (e.target.id === "st-price" && e.key === "Enter") { e.preventDefault(); sent = true; draw(); var f = el.querySelector("[data-a]"); if (f) f.focus(); } });
    el.addEventListener("click", function (e) {
      if (!e.target.closest("[data-a]")) return;
      sent = true; draw();
      var f = el.querySelector("[data-a]"); if (f) f.focus();
    });
    draw();
  }

  // ---------- история выпуска №1 ----------
  function httpStory(el) {
    el.innerHTML = '<div class="st">' +
      '<p class="st-intro">Каждый раз, когда ты открываешь сайт, браузер отправляет серверу письмо. Перехватчик охотится за этими письмами. У него три хода.</p>' +
      chapter(1, "Письмо",
        '<p class="st-txt">Письмо браузера называется <b>запрос</b>, письмо сервера — <b>ответ</b>. Правила переписки — это HTTP. В первой строке ответа три цифры: по ним сразу ясно, что произошло.</p>' +
        '<div data-part="letter"></div>' +
        mem("401 — «ты кто?». 403 — «знаю тебя, но нельзя».")) +
      chapter(2, "Прочитать",
        say("villain", "Бесплатный Wi-Fi на вокзале — мой. Все письма идут через меня.") +
        '<div data-part="road"></div>' +
        '<p class="st-txt" style="margin-top:22px">HTTPS упаковывает письмо в шифрованный канал TLS: видно только, куда оно едет. Подменить его тоже не выйдет, браузер заметит.</p>' +
        mem("Замочек прячет письмо. Но не доказывает, что сайт честный: у фальшивого сайта он тоже бывает.")) +
      chapter(3, "Украсть номерок",
        '<p class="st-txt">После входа сервер выдаёт <b>cookie</b> — номерок, как в гардеробе. Браузер прикладывает его к каждому письму, и сервер узнаёт Соню.</p>' +
        say("villain", "Номерок у меня — значит, для сервера я это ты.") +
        '<p class="st-txt">Сайт защищает номерок тремя флагами:</p>' +
        '<div class="st-flags">' +
          '<div class="st-flag"><code>HttpOnly</code><b>Скрипт на странице не прочитает номерок</b><span>Но если вредный скрипт уже на странице, он может действовать от имени Сони.</span></div>' +
          '<div class="st-flag"><code>Secure</code><b>Номерок едет только по HTTPS</b><span>По http:// браузер его просто не приложит.</span></div>' +
          '<div class="st-flag"><code>SameSite</code><b>Чужой сайт не отправит форму с номерком</b><span>Режим Lax пропускает номерок только при обычном переходе по ссылке, Strict — вообще никогда.</span></div>' +
        "</div>") +
      chapter(4, "Переписать",
        say("kai", "HTTPS включён, флаги стоят. Мы победили?") +
        say("villain", "Зачем мне чужие письма? Я напишу своё. Мой браузер — моя территория.") +
        '<p class="st-txt">Перехватчик заходит в магазин как обычный покупатель и правит письмо до отправки. Попробуй сам:</p>' +
        '<div data-part="tamper"></div>' +
        '<div style="margin-top:26px">' + say("kai", "Стоп. Замочек же горел всё время!") +
        say("hero", "Вот именно. HTTPS охраняет дорогу. А письмо переписали дома, до отправки.") + "</div>") +
      '<p class="st-rule"><span>Всё, что пришло от клиента, клиент мог изменить.</span></p>' +
      '<p class="st-rule-sub">Скрытые поля, цены, cookie, заголовки. Проверка в браузере — удобство для честных. Решает только сервер: цену он берёт из своей базы.</p>' +
      '<p class="st-foot"><b>Где пробовать по-настоящему.</b> Чужие сайты без разрешения трогать нельзя, даже «просто посмотреть». Для тренировки есть picoCTF, PortSwigger Web Security Academy и OWASP Juice Shop: их сделали, чтобы ломать.</p>' +
      "</div>";
    letter(el.querySelector('[data-part="letter"]'));
    road(el.querySelector('[data-part="road"]'));
    tamper(el.querySelector('[data-part="tamper"]'));
  }

  // ---------- тело выпуска из фрагмента (concepts/issues/<slug>.html) ----------
  // build.js кладёт фрагмент в <template id="ix-fragment">. Здесь копия вставляется в игрушку,
  // а <script> пересоздаются, чтобы выполниться ровно один раз (скрипты из innerHTML/cloneNode
  // браузер не запускает). После запуска тег <script> убирается из DOM, поэтому prerender не
  // запекает его в статичный HTML. В конце фрагмента — метка: дочитал до неё — выпуск прочитан.
  function ix(el) {
    var tpl = document.getElementById("ix-fragment");
    if (!tpl || !tpl.content) return;
    var frag = document.importNode(tpl.content, true);
    // Подменяем скрипты, пока копия ещё не в документе: иначе часть браузеров запустит
    // импортированный скрипт сама, а потом ещё раз — наш.
    var scripts = Array.prototype.map.call(frag.querySelectorAll("script"), function (old) {
      var s = document.createElement("script");
      Array.prototype.forEach.call(old.attributes, function (a) { s.setAttribute(a.name, a.value); });
      s.text = old.textContent;
      old.parentNode.replaceChild(s, old);
      return s;
    });
    el.appendChild(frag); // здесь встроенные скрипты выполняются по порядку, по одному разу
    scripts.forEach(function (s) { if (s.parentNode) s.parentNode.removeChild(s); });
    var n = tpl.getAttribute("data-issue");
    var end = document.createElement("div");
    end.className = "ix-end";
    end.setAttribute("aria-hidden", "true");
    el.appendChild(end);
    function done() { if (window.CC && n) window.CC.markRead(n); }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); done(); }
      });
      io.observe(end);
    } else done();
  }

  var TOYS = { "http-story": httpStory, letter: letter, road: road, tamper: tamper, ix: ix };
  function mountAll() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-toy]"), function (el) {
      var name = el.getAttribute("data-toy");
      if (el._toy === name || !TOYS[name]) return;
      el._toy = name;
      el.innerHTML = "";
      TOYS[name](el);
    });
  }
  window.CCToys = { mountAll: mountAll };
})();
