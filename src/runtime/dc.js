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
  const EVENTS = { onclick: "click", oninput: "input", onpointerenter: "pointerenter", onpointerleave: "pointerleave", ontouchmove: "touchmove", onchange: "change", onkeydown: "keydown" };
  const BOOL = { disabled: 1, checked: 1, hidden: 1 };

  function build(node, scope, out) {
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
  function setEvents(el, on) {
    if (!el._h) el._h = {};
    Object.keys(el._h).forEach((k) => { if (!on[k]) { el.removeEventListener(k, el._h[k].fn); delete el._h[k]; } });
    Object.keys(on).forEach((k) => {
      if (!el._h[k]) {
        const rec = { cur: on[k], fn: (e) => rec.cur(e) };
        el._h[k] = rec;
        el.addEventListener(k, rec.fn);
      } else el._h[k].cur = on[k];
    });
  }

  function create(v) {
    if (v.text !== undefined) return document.createTextNode(v.text);
    if (v.comp) return mountComp(v);
    const el = v.ns && v.ns !== "http://www.w3.org/1999/xhtml" ? document.createElementNS(v.ns, v.tag) : document.createElement(v.tag);
    patchEl(el, v);
    return el;
  }

  function patchEl(el, v) {
    const want = v.attrs;
    Array.from(el.attributes).forEach((a) => { if (!(a.name in want)) el.removeAttribute(a.name); });
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
    const doms = Array.from(el.childNodes).filter((n) => n.nodeType === 1 || n.nodeType === 3);
    Array.from(el.childNodes).forEach((n) => { if (n.nodeType !== 1 && n.nodeType !== 3) el.removeChild(n); });
    let i = 0;
    for (; i < vs.length; i++) {
      const v = vs[i], d = doms[i];
      if (d && same(d, v)) {
        if (v.text !== undefined) { if (d.nodeValue !== v.text) d.nodeValue = v.text; }
        else if (v.comp) { d._comp.inst.props = v.props; update(d._comp.inst); }
        else patchEl(d, v);
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
    for (; i < doms.length; i++) { unmount(doms[i]); el.removeChild(doms[i]); }
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
