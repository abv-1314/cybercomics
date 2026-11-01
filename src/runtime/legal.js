/* CyberComics — подвал (связь, 12+, ссылки на данные), окно про cookie с Яндекс.Метрикой
 * и перенос прогресса на другое устройство без регистрации.
 * Настройки приходят из сборки: window.CC_LEGAL = { email, metrika, privacy, soglasie, parents }.
 *
 * Метрика: без METRIKA_ID при сборке её нет совсем. С ним скрипт mc.yandex.ru
 * не загружается, пока читатель не нажал «Принять». Выбор лежит в 'cc-consent' =
 * {"choice": "accepted" | "declined", "version": "1.0", "date": "ГГГГ-ММ-ДД"}; через 12 месяцев
 * или при смене версии спрашиваем снова. «Отказаться» после «Принять» удаляет cookie _ym_*.
 *
 * Перенос прогресса: все записи сайта в localStorage (ник, выпуски, ответы, биты, Барахолка,
 * Прокачаться, Разминка) упаковываются в код. На другом устройстве код вставляют, и записи
 * восстанавливаются. На сервер ничего не уходит.
 *
 * «Поделиться» (CC_LEGAL.share = { url, text }): блок перед подвалом. Системное меню телефона
 * (navigator.share), Telegram, ВКонтакте и «Скопировать ссылку». Это обычные ссылки, без виджетов
 * и чужих скриптов: соцсети ничего не узнают, пока читатель сам не нажмёт. */
(function () {
  "use strict";
  const CFG = window.CC_LEGAL || {};
  const CONSENT_KEY = "cc-consent";
  const CONSENT_VER = "1.0";
  const YEAR = 365 * 24 * 3600 * 1000;
  const KEEP = /^(cc-|cybercomics)/; // какие записи переносятся с прогрессом
  const CODE_PREFIX = "CC1.";

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function el(tag, attrs, kids) {
    const n = document.createElement(tag);
    Object.keys(attrs || {}).forEach((k) => { if (k === "text") n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]); });
    (kids || []).forEach((c) => n.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return n;
  }

  // ---------- стили ----------
  const CSS =
    ".ccl-foot{margin-top:10px;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px 14px;font-size:16px}" +
    ".ccl-foot a,.ccl-foot button{font:inherit;color:#141414;background:none;border:0;padding:0;text-decoration:underline;text-underline-offset:3px;cursor:pointer;min-height:44px;display:inline-flex;align-items:center}" +
    ".ccl-age{display:inline-flex;align-items:center;justify-content:center;min-width:40px;height:30px;border:2px solid #141414;font-weight:700;font-family:'Russo One',Rubik,sans-serif}" +
    ".ccl-banner{position:fixed;left:12px;right:12px;bottom:12px;z-index:1000;max-width:640px;margin:0 auto;background:#fff;color:#141414;border:3px solid #141414;box-shadow:6px 6px 0 #141414;padding:16px;font:17px/1.45 Rubik,system-ui,sans-serif;box-sizing:border-box}" +
    ".ccl-banner h2{margin:0 0 6px;font:20px/1.2 'Russo One',Rubik,sans-serif}" +
    ".ccl-banner p{margin:0 0 8px}" +
    ".ccl-banner a{color:#141414}" +
    ".ccl-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}" +
    ".ccl-btn{font:18px 'Russo One',Rubik,sans-serif;min-height:52px;padding:10px 14px;border:3px solid #141414;background:#ffd60a;color:#141414;cursor:pointer;box-sizing:border-box}" +
    ".ccl-btn:focus-visible,.ccl-foot a:focus-visible,.ccl-foot button:focus-visible{outline:3px solid #ff2e93;outline-offset:2px}" +
    ".ccl-long{display:none}@media (min-width:600px){.ccl-long{display:block}.ccl-short{display:none}}" +
    ".ccl-dlg{border:3px solid #141414;box-shadow:8px 8px 0 #141414;padding:20px;max-width:min(560px,calc(100vw - 32px));width:100%;box-sizing:border-box;font:17px/1.45 Rubik,system-ui,sans-serif;color:#141414;background:#fff}" +
    ".ccl-dlg::backdrop{background:rgba(20,20,20,.55)}" +
    ".ccl-dlg h2{margin:0 0 8px;font:22px/1.2 'Russo One',Rubik,sans-serif}" +
    ".ccl-dlg h3{margin:16px 0 6px;font:18px/1.2 'Russo One',Rubik,sans-serif}" +
    ".ccl-dlg p{margin:0 0 8px}" +
    ".ccl-dlg textarea{width:100%;min-height:96px;box-sizing:border-box;font:15px/1.4 ui-monospace,Menlo,Consolas,monospace;border:2px solid #141414;padding:8px;word-break:break-all}" +
    ".ccl-dlg .ccl-row{grid-template-columns:1fr}@media (min-width:480px){.ccl-dlg .ccl-row{grid-template-columns:1fr 1fr}}" +
    ".ccl-msg{min-height:1.4em;font-weight:700}" +
    ".ccl-share{max-width:1160px;margin:0 auto;padding:28px 16px 32px;box-sizing:border-box;text-align:center;font-family:Rubik,system-ui,sans-serif;color:#141414}" +
    ".ccl-share h2{margin:0 0 12px;font:22px/1.2 'Russo One',Rubik,sans-serif}" +
    ".ccl-share-row{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}" +
    ".ccl-share-row a,.ccl-share-row button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:10px 18px;box-sizing:border-box;font:17px 'Russo One',Rubik,sans-serif;color:#141414;text-decoration:none;background:#fff;border:3px solid #141414;box-shadow:4px 4px 0 #141414;cursor:pointer}" +
    ".ccl-share-row .ccl-main{background:#ffd60a}" +
    ".ccl-share-row a:focus-visible,.ccl-share-row button:focus-visible{outline:3px solid #ff2e93;outline-offset:2px}" +
    ".ccl-x{position:absolute;top:8px;right:8px;width:44px;height:44px;border:0;background:none;font-size:28px;cursor:pointer}";
  function addCss() {
    if (document.getElementById("ccl-css")) return;
    const s = el("style", { id: "ccl-css" }); s.textContent = CSS; document.head.appendChild(s);
  }

  // ---------- согласие и Метрика ----------
  function readConsent() {
    try {
      const c = JSON.parse(get(CONSENT_KEY) || "null");
      if (!c || c.version !== CONSENT_VER || !c.date) return null;
      if (Date.now() - new Date(c.date).getTime() > YEAR) return null;
      return c.choice === "accepted" || c.choice === "declined" ? c.choice : null;
    } catch (e) { return null; }
  }
  function saveConsent(choice) {
    set(CONSENT_KEY, JSON.stringify({ choice, version: CONSENT_VER, date: new Date().toISOString().slice(0, 10) }));
  }
  let ymLoaded = false;
  function loadMetrika() {
    const id = Number(CFG.metrika);
    if (!id || ymLoaded || location.protocol === "file:") return;
    ymLoaded = true;
    /* Официальный код счётчика Яндекс.Метрики, без Вебвизора и карты кликов. */
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    window.ym(id, "init", { webvisor: false, clickmap: false, trackLinks: true, accurateTrackBounce: true });
  }
  function dropYmCookies() {
    const host = location.hostname;
    const domains = ["", host, "." + host, "." + host.split(".").slice(-2).join(".")];
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      if (!/^_ym/.test(name)) return;
      domains.forEach((d) => { document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + (d ? "; domain=" + d : ""); });
    });
    try { Object.keys(localStorage).forEach((k) => { if (/^_ym/.test(k)) localStorage.removeItem(k); }); } catch (e) { /* ignore */ }
  }

  let banner = null;
  function showBanner() {
    if (!CFG.metrika) return;
    if (banner) { banner.querySelector(".ccl-btn").focus(); return; }
    const links = () => el("p", {}, [el("a", { href: CFG.soglasie, text: "Согласие на статистику" }), " · ", el("a", { href: CFG.privacy, text: "Политика данных" })]);
    const yes = el("button", { type: "button", class: "ccl-btn", text: "Принять" });
    const no = el("button", { type: "button", class: "ccl-btn", text: "Отказаться" });
    banner = el("section", { class: "ccl-banner", role: "dialog", "aria-label": "Статистика посещений" }, [
      el("h2", { text: "Можно считать посещения?" }),
      el("div", { class: "ccl-long" }, [
        el("p", { text: "Мы хотим понимать, какие выпуски читают, чтобы делать новые. Для этого нужна Яндекс.Метрика: она ставит cookie и узнаёт тип устройства, город по IP и какие страницы ты открыл. Ник мы туда не передаём." }),
        el("p", { text: "Если тебе меньше 14 лет, спроси родителей или просто нажми «Отказаться», сайт работает полностью." })
      ]),
      el("div", { class: "ccl-short" }, [
        el("p", { text: "Для статистики нужна Яндекс.Метрика, она ставит cookie. Если тебе меньше 14, спроси родителей или жми «Отказаться», сайт работает и так." })
      ]),
      links(),
      el("div", { class: "ccl-row" }, [yes, no])
    ]);
    yes.addEventListener("click", () => { saveConsent("accepted"); hideBanner(); loadMetrika(); });
    no.addEventListener("click", () => {
      const was = ymLoaded;
      saveConsent("declined"); hideBanner(); dropYmCookies();
      if (was) location.reload(); // уже загруженный скрипт Метрики так не выгрузить
    });
    document.body.appendChild(banner);
  }
  function hideBanner() { if (banner) { banner.remove(); banner = null; } }

  // ---------- перенос прогресса ----------
  function b64enc(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64dec(str) { return decodeURIComponent(escape(atob(str))); }
  function makeCode() {
    const data = {};
    try { Object.keys(localStorage).forEach((k) => { if (KEEP.test(k) && k !== CONSENT_KEY) data[k] = localStorage.getItem(k); }); } catch (e) { return ""; }
    return CODE_PREFIX + b64enc(JSON.stringify({ v: 1, d: new Date().toISOString().slice(0, 10), data }));
  }
  function applyCode(code) {
    code = String(code || "").replace(/\s+/g, "");
    if (code.indexOf(CODE_PREFIX) !== 0) return "Это не похоже на код прогресса CyberComics.";
    let p;
    try { p = JSON.parse(b64dec(code.slice(CODE_PREFIX.length))); } catch (e) { return "Код повреждён. Скопируй его ещё раз целиком."; }
    if (!p || p.v !== 1 || !p.data || typeof p.data !== "object") return "Код повреждён. Скопируй его ещё раз целиком.";
    const keys = Object.keys(p.data).filter((k) => KEEP.test(k) && k !== CONSENT_KEY && typeof p.data[k] === "string");
    if (!keys.length) return "В коде нет прогресса.";
    for (let i = 0; i < keys.length; i++) if (!set(keys[i], p.data[keys[i]])) return "Браузер не даёт сохранить прогресс (возможно, приватный режим).";
    return "";
  }
  let dlg = null;
  function openTransfer() {
    if (!dlg) {
      const out = el("textarea", { readonly: "", "aria-label": "Код твоего прогресса" });
      const inp = el("textarea", { "aria-label": "Вставь код прогресса", placeholder: "Вставь сюда код, начинается с CC1." });
      const msg1 = el("p", { class: "ccl-msg", "aria-live": "polite" });
      const msg2 = el("p", { class: "ccl-msg", "aria-live": "polite" });
      const copy = el("button", { type: "button", class: "ccl-btn", text: "Скопировать" });
      const save = el("button", { type: "button", class: "ccl-btn", text: "Сохранить файлом" });
      const load = el("button", { type: "button", class: "ccl-btn", text: "Восстановить" });
      const close = el("button", { type: "button", class: "ccl-x", "aria-label": "Закрыть", text: "×" });
      dlg = el("dialog", { class: "ccl-dlg", "aria-label": "Перенести прогресс" }, [
        close,
        el("h2", { text: "Перенести прогресс" }),
        el("p", { text: "Регистрации нет, поэтому прогресс живёт только в этом браузере. Чтобы продолжить на другом телефоне или компьютере, сохрани код и вставь его там." }),
        el("h3", { text: "1. Код с этого устройства" }),
        out, el("div", { class: "ccl-row" }, [copy, save]), msg1,
        el("h3", { text: "2. Вставить код с другого устройства" }),
        inp, el("div", { class: "ccl-row" }, [load]), msg2,
        el("p", { text: "Код никуда не отправляется. Не публикуй его: по нему любой сможет продолжить под твоим ником." })
      ]);
      close.addEventListener("click", () => dlg.close());
      copy.addEventListener("click", () => {
        const done = () => { msg1.textContent = "Скопировано."; };
        try { navigator.clipboard.writeText(out.value).then(done, () => { out.select(); document.execCommand("copy"); done(); }); }
        catch (e) { out.select(); try { document.execCommand("copy"); done(); } catch (e2) { msg1.textContent = "Выдели код и скопируй вручную."; } }
      });
      save.addEventListener("click", () => {
        const a = el("a", { href: URL.createObjectURL(new Blob([out.value], { type: "text/plain" })), download: "cybercomics-progress.txt" });
        document.body.appendChild(a); a.click(); a.remove();
        msg1.textContent = "Файл сохранён. Открой его на другом устройстве и вставь текст ниже.";
      });
      load.addEventListener("click", () => {
        const err = applyCode(inp.value);
        if (err) { msg2.textContent = err; return; }
        msg2.textContent = "Готово, загружаем прогресс…";
        setTimeout(() => location.reload(), 600);
      });
      document.body.appendChild(dlg);
      dlg._out = out; dlg._msgs = [msg1, msg2];
    }
    dlg._out.value = makeCode();
    dlg._msgs.forEach((m) => { m.textContent = ""; });
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }

  // ---------- подвал ----------
  function footExtras() {
    const box = el("div", { class: "ccl-foot", "data-ccl": "1" });
    box.appendChild(el("span", { class: "ccl-age", title: "Для читателей от 12 лет", text: "12+" }));
    if (CFG.email) box.appendChild(el("span", {}, ["Связь: ", el("a", { href: "mailto:" + CFG.email, text: CFG.email })]));
    box.appendChild(el("a", { href: CFG.privacy, text: CFG.metrika ? "Политика данных" : "Данные и приватность" }));
    box.appendChild(el("a", { href: CFG.parents, text: "Родителям" }));
    const tr = el("button", { type: "button", text: "Перенести прогресс" });
    tr.addEventListener("click", openTransfer);
    box.appendChild(tr);
    if (CFG.metrika) {
      const cs = el("button", { type: "button", text: "Настройки cookie" });
      cs.addEventListener("click", showBanner);
      box.appendChild(cs);
    }
    box.appendChild(el("span", { style: "flex-basis:100%;font-size:14px;opacity:.8", text: "Названия чужих продуктов и сервисов принадлежат их владельцам. Проект с ними не связан." }));
    return box;
  }
  // ---------- поделиться ----------
  function shareUrl() { return (CFG.share && CFG.share.url) || location.href.split("#")[0]; }
  function shareBox() {
    const url = shareUrl(), text = (CFG.share && CFG.share.text) || document.title;
    const msg = el("p", { class: "ccl-msg", "aria-live": "polite", style: "margin:10px 0 0" });
    const row = el("div", { class: "ccl-share-row" });
    if (navigator.share) {
      const sys = el("button", { type: "button", class: "ccl-main", text: "Поделиться" });
      sys.addEventListener("click", () => { navigator.share({ title: text, text, url }).catch(() => {}); });
      row.appendChild(sys);
    }
    row.appendChild(el("a", { href: "https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text), target: "_blank", rel: "noopener", class: navigator.share ? "" : "ccl-main", text: "Telegram" }));
    row.appendChild(el("a", { href: "https://vk.com/share.php?url=" + encodeURIComponent(url) + "&title=" + encodeURIComponent(text), target: "_blank", rel: "noopener", text: "ВКонтакте" }));
    const cp = el("button", { type: "button", text: "Скопировать ссылку" });
    cp.addEventListener("click", () => {
      const ok = () => { msg.textContent = "Ссылка скопирована."; };
      try { navigator.clipboard.writeText(url).then(ok, () => { msg.textContent = url; }); } catch (e) { msg.textContent = url; }
    });
    row.appendChild(cp);
    return el("section", { class: "ccl-share", "aria-label": "Поделиться", "data-ccs": "1" }, [el("h2", { text: "Понравилось? Поделись с другом" }), row, msg]);
  }

  function decorate() {
    if (CFG.share) {
      const f = document.querySelector("#app footer");
      if (f) {
        const old = f.parentNode.querySelector(':scope > [data-ccs="1"]');
        if (!(old && old._live && old.nextElementSibling === f)) {
          if (old) old.remove();
          const box = shareBox(); box._live = true; f.parentNode.insertBefore(box, f);
        }
      }
    }
    document.querySelectorAll("footer").forEach((f) => {
      const old = f.querySelector('[data-ccl="1"]');
      if (old && old._live) return;
      if (old) old.remove(); // запечённая при пререндере копия без обработчиков
      const box = footExtras(); box._live = true; f.appendChild(box);
    });
  }

  function start() {
    addCss();
    decorate();
    const app = document.getElementById("app");
    if (app && typeof MutationObserver !== "undefined") new MutationObserver(decorate).observe(app, { childList: true, subtree: true });
    if (CFG.metrika) { const c = readConsent(); if (c === "accepted") loadMetrika(); else if (!c) showBanner(); }
  }
  window.CCLegal = { start, openTransfer, showBanner };
})();
