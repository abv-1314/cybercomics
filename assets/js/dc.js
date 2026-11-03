/* CyberComics — маленький движок страниц.
 * Шаблоны из макета (sc-for, sc-if, {{...}}, dc-import) превращаются в DOM,
 * а при setState страница не пересоздаётся, а аккуратно обновляется на месте,
 * поэтому анимации и фокус в полях ввода не сбиваются. */
(function () {
  "use strict";

  const ROOT = (document.querySelector('meta[name="site-root"]') || {}).content || "/";
  const LINKS = window.CC_LINKS || {};

  // Ссылки макета (Main.dc.html, Issue3.dc.html…) → адреса настоящего сайта.
  function mapHref(v) {
    if (typeof v !== "string") return v;
    const m = v.match(/^([A-Za-z0-9]+)\.dc\.html(#.*)?$/);
    if (!m) return v;
    const path = LINKS[m[1]];
    if (path === undefined) return v;
    return ROOT + path + (m[2] || "");
  }

  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(patch) {
      this.state = Object.assign({}, this.state, typeof patch === "function" ? patch(this.state) : patch);
      if (this._host) schedule(this);
    }
    renderVals() { return {}; }
  }

  const queue = new Set();
  let pending = false;
  function schedule(inst) {
    queue.add(inst);
    if (pending) return;
    pending = true;
    Promise.resolve().then(() => {
      pending = false;
      const list = Array.from(queue);
      queue.clear();
      list.forEach((i) => i._host && i._host.isConnected && update(i));
    });
  }

  const REGISTRY = {};
  function define(name, template, Logic) {
    const tpl = document.createElement("template");
    tpl.innerHTML = template;
    REGISTRY[name] = { tpl, Logic };
  }

  // ---------- выражения ----------
  function lookup(expr, scope) {
    expr = expr.trim();
    if (expr === "true") return true;
    if (expr === "false") return false;
    if (expr === "null") return null;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    const parts = expr.split(".");
    let cur;
    for (let i = scope.length - 1; i >= 0; i--) {
      if (scope[i] && Object.prototype.hasOwnProperty.call(scope[i], parts[0])) { cur = scope[i][parts[0]]; break; }
    }
    for (let j = 1; j < parts.length && cur !== undefined && cur !== null; j++) cur = cur[parts[j]];
    return cur;
  }
  const WHOLE = /^\s*\{\{([^}]+)\}\}\s*$/;
  function interp(str, scope) {
    const w = str.match(WHOLE);
    if (w) return lookup(w[1], scope);
    return str.replace(/\{\{([^}]+)\}\}/g, (_, e) => {
      const v = lookup(e, scope);
      return v === undefined || v === null ? "" : String(v);
    });
  }

  // ---------- шаблон → виртуальные узлы ----------
  const EVENTS = { onclick: "click", oninput: "input", onpointerenter: "pointerenter", onpointerleave: "pointerleave", ontouchmove: "touchmove", onchange: "change", onkeydown: "keydown", onfocus: "focus" };
  const BOOL = { disabled: 1, checked: 1, hidden: 1 };

  // Статичный узел шаблона: без {{…}}, событий, sc-for/sc-if/dc-import внутри и без полей ввода.
  // Его описание строится один раз и переиспользуется; при обновлении такой узел страницы, уже
  // сверенный с этим описанием, не обходится заново. Замер 01.11 (Pixel 7, CPU ×4): нажатие на главной
  // заново строило и сверяло все ~900 элементов страницы — 120–150 мс скрипта на каждое нажатие.
  const DYN_TAGS = { "sc-for": 1, "sc-if": 1, "dc-import": 1, input: 1, textarea: 1, select: 1 };
  function isStatic(node) {
    if (node._st !== undefined) return node._st;
    let st = true;
    if (node.nodeType === 3) st = node.nodeValue.indexOf("{{") === -1;
    else if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      if (DYN_TAGS[tag]) st = false;
      else {
        for (let a = 0; a < node.attributes.length && st; a++) {
          const at = node.attributes[a];
          if (EVENTS[at.name.toLowerCase()] || at.value.indexOf("{{") !== -1) st = false;
        }
        const kids = tag === "template" ? node.content.childNodes : node.childNodes;
        for (let k = 0; k < kids.length && st; k++) st = isStatic(kids[k]);
      }
    }
    node._st = st;
    return st;
  }

  function build(node, scope, out) {
    if (node.nodeType === 1 && isStatic(node)) {
      if (!node._vn) { const o = []; buildNode(node, [], o); node._vn = o[0]; if (node._vn) node._vn.st = true; }
      if (node._vn) out.push(node._vn);
      return;
    }
    buildNode(node, scope, out);
  }

  function buildNode(node, scope, out) {
    if (node.nodeType === 3) {
      const t = interp(node.nodeValue, scope);
      out.push({ text: t === undefined || t === null || t === false ? "" : String(t) });
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.namespaceURI === "http://www.w3.org/1999/xhtml" ? node.tagName.toLowerCase() : node.tagName;
    if (tag === "sc-for") {
      const list = lookup((node.getAttribute("list") || "").replace(/^\{\{|\}\}$/g, ""), scope) || [];
      const as = node.getAttribute("as") || "item";
      Array.from(list).forEach((item) => {
        const s = scope.concat([{ [as]: item }]);
        node.childNodes.forEach((c) => build(c, s, out));
      });
      return;
    }
    if (tag === "sc-if") {
      const v = lookup((node.getAttribute("value") || "").replace(/^\{\{|\}\}$/g, ""), scope);
      if (v) node.childNodes.forEach((c) => build(c, scope, out));
      return;
    }
    if (tag === "dc-import") {
      const props = {};
      Array.from(node.attributes).forEach((a) => {
        if (a.name === "name" || a.name.indexOf("hint-") === 0) return;
        props[a.name] = interp(a.value, scope);
      });
      out.push({ comp: node.getAttribute("name"), props });
      return;
    }
    const v = { tag, ns: node.namespaceURI, attrs: {}, on: {}, kids: [] };
    Array.from(node.attributes).forEach((a) => {
      const n = a.name.toLowerCase();
      if (n.indexOf("hint-") === 0) return;
      if (EVENTS[n]) { const f = interp(a.value, scope); if (typeof f === "function") v.on[EVENTS[n]] = f; return; }
      let val = interp(a.value, scope);
      if (BOOL[n]) { if (val && val !== "false") v.attrs[n] = ""; return; }
      if (val === undefined || val === null || val === false) return;
      if (n === "href") val = mapHref(String(val));
      if (n === "src" && typeof val === "string" && val.indexOf("/_blob/") === 0) val = (window.CC_BLOBS || {})[val.slice(7)] ? ROOT + window.CC_BLOBS[val.slice(7)] : val;
      // srcset портретов: «/_blob/<хеш>-360 360w, …» → пути к уменьшенным копиям (их кладёт src/build.js в CC_BLOBS).
      if (n === "srcset" && typeof val === "string") val = val.replace(/\/_blob\/([\w-]+)/g, (m, k) => ((window.CC_BLOBS || {})[k] ? ROOT + window.CC_BLOBS[k] : m));
      v.attrs[a.name] = String(val);
    });
    const kidsSrc = tag === "template" ? node.content.childNodes : node.childNodes;
    kidsSrc.forEach((c) => build(c, scope, v.kids));
    out.push(v);
  }

  // ---------- обновление настоящего DOM ----------
  const PASSIVE = { touchmove: 1, touchstart: 1 };
  function setEvents(el, on) {
    if (!el._h) el._h = {};
    Object.keys(el._h).forEach((k) => { if (!on[k]) { el.removeEventListener(k, el._h[k].fn); delete el._h[k]; } });
    Object.keys(on).forEach((k) => {
      if (!el._h[k]) {
        const rec = { cur: on[k], fn: (e) => rec.cur(e) };
        el._h[k] = rec;
        // touchmove/touchstart без preventDefault: пассивный обработчик не задерживает прокрутку пальцем.
        el.addEventListener(k, rec.fn, PASSIVE[k] ? { passive: true } : false);
      } else el._h[k].cur = on[k];
    });
  }

  function create(v) {
    if (v.text !== undefined) return document.createTextNode(v.text);
    if (v.comp) return mountComp(v);
    const el = v.ns && v.ns !== "http://www.w3.org/1999/xhtml" ? document.createElementNS(v.ns, v.tag) : document.createElement(v.tag);
    patchEl(el, v);
    if (v.st) el._vn = v;
    return el;
  }

  function patchEl(el, v) {
    const want = v.attrs;
    // data-rt-*: служебные пометки скриптов страницы (например, «анимации на паузе вне экрана»), их не снимаем.
    Array.from(el.attributes).forEach((a) => { if (!(a.name in want) && a.name.indexOf("data-rt-") !== 0) el.removeAttribute(a.name); });
    Object.keys(want).forEach((k) => { if (el.getAttribute(k) !== want[k]) el.setAttribute(k, want[k]); });
    if (v.tag === "input" || v.tag === "textarea") {
      const val = want.value === undefined ? "" : want.value;
      if (el.value !== val && document.activeElement !== el) el.value = val;
    }
    setEvents(el, v.on);
    // data-keep: содержимое рисует отдельный скрипт (интерактивы), движок его не трогает
    if (want["data-keep"] !== undefined) return;
    patchKids(el, v.kids);
  }

  function same(dom, v) {
    if (v.text !== undefined) return dom.nodeType === 3;
    if (v.comp) return dom.nodeType === 1 && dom._comp && dom._comp.name === v.comp;
    return dom.nodeType === 1 && !dom._comp && (dom.namespaceURI === "http://www.w3.org/1999/xhtml" ? dom.tagName.toLowerCase() : dom.tagName) === v.tag;
  }

  function patchKids(el, kids) {
    // склеиваем соседние текстовые узлы, как это сделал бы браузер
    const vs = [];
    kids.forEach((k) => {
      if (k.text === "") return;
      if (k.text !== undefined && vs.length && vs[vs.length - 1].text !== undefined) vs[vs.length - 1] = { text: vs[vs.length - 1].text + k.text };
      else vs.push(k);
    });
    // Блоки, которые вставил не движок (подвал и «Поделиться» из legal.js), не трогаем.
    const doms = Array.from(el.childNodes).filter((n) => n.nodeType === 3 || (n.nodeType === 1 && !foreign(n)));
    Array.from(el.childNodes).forEach((n) => { if (n.nodeType !== 1 && n.nodeType !== 3) el.removeChild(n); });
    // Узлы сопоставляются по порядку. Если на месте нет точного совпадения (тег + id + class),
    // ищем его на несколько шагов вперёд: блок появился (sc-if, sc-for) — вставляем, исчез — убираем.
    // Без этого открытие «Входа» вверху главной сдвигало все секции на одну позицию и движок
    // переписывал всю страницу (замер 01.11: ~120 изменений DOM на одно нажатие вместо одной вставки).
    const AHEAD = 8;
    let i = 0, j = 0;
    for (; i < vs.length; i++) {
      const v = vs[i];
      let d = doms[j];
      if (d && !exact(d, v) && (d.nodeType === 1 || v.text === undefined)) {
        let ins = 0, del = 0;
        if (d.nodeType === 1) for (let k = 1; k <= AHEAD && i + k < vs.length; k++) if (exact(d, vs[i + k])) { ins = k; break; }
        if (v.text === undefined) for (let k = 1; k <= AHEAD && j + k < doms.length; k++) if (exact(doms[j + k], v)) { del = k; break; }
        if (ins && (!del || ins <= del)) {
          // перед d появились ins новых узлов
          for (let t = 0; t < ins; t++) el.insertBefore(create(vs[i + t]), d);
          i += ins - 1;
          continue;
        }
        if (del) {
          // del старых узлов исчезли
          for (let t = 0; t < del; t++) { unmount(doms[j + t]); el.removeChild(doms[j + t]); }
          j += del;
          d = doms[j];
        }
      }
      j++;
      if (d && same(d, v)) {
        if (v.text !== undefined) { if (d.nodeValue !== v.text) d.nodeValue = v.text; }
        else if (v.comp) { d._comp.inst.props = v.props; update(d._comp.inst); }
        else if (!(v.st && d._vn === v)) { patchEl(d, v); if (v.st) d._vn = v; }
      } else if (v.comp && d && d.nodeType === 1 && !d._comp && d.tagName === "DC-IMPORT" && d.getAttribute("name") === v.comp) {
        // Вложенный компонент из заранее отрисованной разметки: оживляем на месте, а не пересоздаём.
        // Иначе картинки и текст первого экрана рисуются второй раз (LCP сдвигается на момент запуска JS).
        mountComp(v, d);
      } else {
        const n = create(v);
        if (d) el.replaceChild(n, d); else el.appendChild(n);
        if (d) unmount(d);
      }
    }
    for (; j < doms.length; j++) { unmount(doms[j]); el.removeChild(doms[j]); }
  }

  function foreign(n) { return n.hasAttribute("data-ccs") || n.hasAttribute("data-ccl"); }

  // Точное совпадение узла и описания: тот же тег и те же id и class (для компонента — то же имя).
  function exact(d, v) {
    if (v.comp) return same(d, v) || (d.nodeType === 1 && !d._comp && d.tagName === "DC-IMPORT" && d.getAttribute("name") === v.comp);
    if (!same(d, v)) return false;
    if (v.text !== undefined) return true;
    return (d.getAttribute("id") || "") === (v.attrs.id || "") && (d.getAttribute("class") || "") === (v.attrs.class || "");
  }

  function unmount(d) {
    if (d.nodeType !== 1) return;
    if (d._comp && d._comp.inst.componentWillUnmount) d._comp.inst.componentWillUnmount();
    d.querySelectorAll && d.querySelectorAll("dc-import").forEach((x) => x._comp && x._comp.inst.componentWillUnmount && x._comp.inst.componentWillUnmount());
  }

  function mountComp(v, host) {
    const def = REGISTRY[v.comp];
    if (!host) {
      host = document.createElement("dc-import");
      host.setAttribute("name", v.comp);
      host.style.display = "contents";
    }
    if (!def) return host;
    const inst = new def.Logic(v.props || {});
    inst._host = host;
    host._comp = { name: v.comp, inst };
    update(inst);
    return host;
  }

  function update(inst) {
    const def = REGISTRY[inst._host._comp.name];
    const vals = inst.renderVals() || {};
    const out = [];
    def.tpl.content.childNodes.forEach((c) => build(c, [vals], out));
    patchKids(inst._host, out);
  }

  // Запуск страницы: host — элемент, в котором уже лежит заранее отрисованная
  // версия (для поисковиков); движок «оживляет» её на месте.
  function mount(name, host, props) {
    mountComp({ comp: name, props: props || {} }, host);
  }

  window.DC = { DCLogic, define, mount, mapHref, ROOT };
  window.DCLogic = DCLogic;
})();
