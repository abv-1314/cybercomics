/* CyberComics — профиль и прогресс читателя: имя, прочитанные выпуски, ответы в квизах, биты.
 * Всё хранится только в этом браузере (localStorage). Если хранилище недоступно
 * (приватный режим, запрет cookie), сайт работает, но прогресс не сохраняется.
 *
 * Имя: ключ 'cc-user' = {"name": "..."} (как в v6). Войти можно только на главной.
 * Прогресс лежит под именем: 'cybercomics.v2::<имя>', 'cc-review-v4::<имя>', 'cc-arcade-v3::<имя>'.
 * Гость: 'cybercomics.v2' (старый ключ, данные не теряются), 'cc-review-v4::гость', 'cc-arcade-v3::гость'.
 * Барахолка: 'cc-shop:<имя>' (гость — 'cc-shop:guest') = {"owned": {id: время}, "spent": N, "badge": "..."}.
 * Когда под именем ещё ничего нет, туда копируется прогресс гостя (сам гость остаётся как был).
 * Биты: доступно = заработано (выпуски, ответы, Разминка) − потрачено в Барахолке.
 * Путь новичка: CC.path() — порядок чтения (сначала Фундамент по шагам 1–14, потом Веб-квартал и Завод).
 * Номера выпусков (№) в нём не меняются: шаг — это порядок чтения, № — номер выпуска в адресе. */
(function () {
  "use strict";
  const USER_KEY = "cc-user";
  const MAIN = "cybercomics.v2";
  const GUEST = "гость";
  const PREFIXES = ["cc-review-v4", "cc-arcade-v3"];
  const SHOP = "cc-shop:";
  const BITS = { read: 50, right: 10 };
  // Шаги Фундамента 1–14 (номера выпусков) и дальше Веб-квартал и Завод.
  const STEPS = [10, 11, 12, 13, 14, 1, 15, 16, 17, 18, 19, 20, 21, 22];
  const PATH = STEPS.concat([2, 3, 4, 5, 6, 7, 8, 9]);

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* без хранилища — работаем в памяти */ } }
  function del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }

  function cleanName(n) { return String(n || "").replace(/\s+/g, " ").trim().slice(0, 20); }
  function readUser() {
    try { const u = JSON.parse(get(USER_KEY) || "null"); return u && cleanName(u.name) ? cleanName(u.name) : null; } catch (e) { return null; }
  }
  const mainKey = (u) => (u ? MAIN + "::" + u : MAIN);
  const prefKey = (p, u) => p + "::" + (u || GUEST);
  const shopKey = (u) => SHOP + (u || "guest"); // как в обёртке Барахолки (Shop.dc.html)

  // Первый вход под именем: забираем прогресс гостя (копией), чтобы ничего не пропало.
  function adopt(u) {
    if (!u) return;
    if (get(mainKey(u)) === null && get(MAIN) !== null) set(mainKey(u), get(MAIN));
    PREFIXES.forEach((p) => { if (get(prefKey(p, u)) === null && get(prefKey(p, null)) !== null) set(prefKey(p, u), get(prefKey(p, null))); });
    // траты и покупки переезжают вместе с битами, иначе гостевые биты потратились бы дважды
    if (get(shopKey(u)) === null && get(shopKey(null)) !== null) set(shopKey(u), get(shopKey(null)));
  }

  function blank() { return { read: {}, ans: {}, extra: 0 }; }
  let user = readUser();
  let st = blank();
  function load() {
    adopt(user);
    st = blank();
    try { const raw = get(mainKey(user)); if (raw) st = Object.assign(blank(), JSON.parse(raw)); } catch (e) { st = blank(); }
  }
  function save() { set(mainKey(user), JSON.stringify(st)); }
  load();

  // Барахолка: читаем и пишем целиком, сохраняя чужие поля (например, выбранный значок).
  const shopMem = {};
  function shopLoad() {
    let s = null;
    try { s = JSON.parse(get(shopKey(user)) || "null"); } catch (e) { s = null; }
    if (!s || typeof s !== "object") s = shopMem[shopKey(user)] || {};
    if (!s.owned || typeof s.owned !== "object") s.owned = {};
    s.spent = Number(s.spent) > 0 ? Math.round(Number(s.spent)) : 0;
    return s;
  }
  function shopSave(s) { shopMem[shopKey(user)] = s; set(shopKey(user), JSON.stringify(s)); }
  function earned() {
    let r = 0;
    try { r = Object.keys(st.read).length * BITS.read + window.CC.rightCount() * BITS.right + (Number(st.extra) || 0); } catch (e) { r = 0; }
    return Math.max(0, r);
  }

  window.CC = {
    // профиль
    getUser() { return user; },
    setUser(name) {
      const n = cleanName(name);
      if (!n) return null;
      set(USER_KEY, JSON.stringify({ name: n }));
      user = n; load();
      return n;
    },
    logout() { del(USER_KEY); user = null; load(); },
    // ключ хранилища страницы под текущим именем: CC.key('cc-review-v4') → 'cc-review-v4::Соня'
    key(prefix) { return prefKey(prefix, user); },
    // выпуски и квизы
    isRead(n) { return !!st.read[n]; },
    markRead(n) { if (!st.read[n]) { st.read[n] = Date.now(); save(); } },
    getAns(n) { return Object.assign({}, st.ans[n] || {}); },
    saveAns(n, ans) {
      const cur = JSON.stringify(st.ans[n] || {});
      if (cur !== JSON.stringify(ans || {})) { st.ans[n] = Object.assign({}, ans); save(); }
    },
    rightCount() {
      const Q = window.CC_ANSWERS || {};
      let c = 0;
      Object.keys(st.ans).forEach((n) => Object.keys(st.ans[n]).forEach((qi) => { if (Q[n] && Q[n][qi] === st.ans[n][qi]) c++; }));
      return c;
    },
    // путь новичка: только вышедшие выпуски (есть ссылка в CC_LINKS), по порядку чтения
    path() { const L = window.CC_LINKS; return PATH.filter((n) => !L || L["Issue" + n] !== undefined); },
    // шаг Фундамента для выпуска (1–14) или 0, если выпуск не из Фундамента
    step(n) { return STEPS.indexOf(Number(n)) + 1; },
    // куда звать читателя: первый непрочитанный выпуск на пути (всё прочитано — первый на пути)
    nextIssue() { const p = this.path(); for (let i = 0; i < p.length; i++) if (!st.read[p[i]]) return p[i]; return p[0]; },
    readCount() { return Object.keys(st.read).length; },
    // биты: за выпуски и ответы + заработанные в Разминке − потраченные в Барахолке
    earned() { return earned(); },
    bits() { try { return Math.max(0, earned() - shopLoad().spent); } catch (e) { return 0; } },
    addBits(n) { try { n = Math.round(Number(n) || 0); if (n > 0) { st.extra = (Number(st.extra) || 0) + n; save(); } } catch (e) { /* ignore */ } return this.bits(); },
    // Барахолка
    spent() { try { return shopLoad().spent; } catch (e) { return 0; } },
    spend(n) {
      try {
        n = Math.round(Number(n) || 0);
        if (n <= 0 || n > this.bits()) return false;
        const s = shopLoad(); s.spent += n; shopSave(s);
        return true;
      } catch (e) { return false; }
    },
    owned(id) { try { return !!shopLoad().owned[String(id)]; } catch (e) { return false; } },
    buy(id, price) {
      try {
        id = String(id); price = Math.round(Number(price) || 0);
        if (!id || price < 0) return false;
        const s = shopLoad();
        if (s.owned[id]) return true;
        if (price > this.bits()) return false;
        s.owned[id] = Date.now(); s.spent += price; shopSave(s);
        return true;
      } catch (e) { return false; }
    }
  };
})();
