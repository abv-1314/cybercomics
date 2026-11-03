/* Сгенерировано src/build.js из макета: компоненты страницы Shop. Не редактировать вручную. */
DC.define("Shop", "<div class=\"bh\">\n\n  <header class=\"bh-hd\">\n    <a class=\"bh-logo\" href=\"Main.dc.html\">Cyber<span>Comics</span></a>\n    <nav class=\"bh-nav\" aria-label=\"Основная навигация\">\n      <a href=\"Main.dc.html#vypuski\">Выпуски</a>\n      <a href=\"Main.dc.html\">Город</a>\n      <a href=\"Review.dc.html\">Прокачаться</a>\n      <a href=\"Arcade.dc.html\">Разминка</a>\n      <a href=\"Shop.dc.html\" aria-current=\"page\">Барахолка</a>\n    </nav>\n    <div class=\"bh-me\">\n      <sc-if value=\"{{hi}}\"><span class=\"bh-hi\">{{hi}}</span></sc-if>\n      <span class=\"bh-chip\">{{bitsLabel}}</span>\n    </div>\n  </header>\n\n  <div class=\"bh-sky\">\n    <div class=\"bh-lights\" aria-hidden=\"true\" style=\"top: 6px; height: 70px\">\n      <svg viewBox=\"0 0 100 64\" preserveAspectRatio=\"none\" style=\"height: 64px\"><path d=\"M0 0 Q50 64 100 0\" fill=\"none\" stroke=\"#3a3a4d\" stroke-width=\"2\" vector-effect=\"non-scaling-stroke\"></path></svg>\n      <sc-for list=\"{{bulbs}}\" as=\"b\" hint-placeholder-count=\"17\"><i class=\"bh-bulb\" style=\"{{b.style}}\"></i></sc-for>\n    </div>\n\n    <section class=\"bh-hero\" aria-labelledby=\"bh-title\">\n      <div>\n        <p class=\"bh-kick\">Сетеград. Полночь. Под мостом зажглись фонари…</p>\n        <div class=\"bh-sign\">\n          <h1 id=\"bh-title\" aria-label=\"Барахолка\"><span style=\"--i:0\" aria-hidden=\"true\">Б</span><span style=\"--i:1\" aria-hidden=\"true\">А</span><span style=\"--i:2\" aria-hidden=\"true\">Р</span><span style=\"--i:3\" aria-hidden=\"true\">А</span><span style=\"--i:4\" class=\"bh-buzz\" aria-hidden=\"true\">Х</span><span style=\"--i:5\" aria-hidden=\"true\">О</span><span style=\"--i:6\" aria-hidden=\"true\">Л</span><span style=\"--i:7\" aria-hidden=\"true\">К</span><span style=\"--i:8\" aria-hidden=\"true\">А</span></h1>\n          <span class=\"bh-sub\">ночной рынок Сетеграда</span>\n        </div>\n        <p class=\"bh-lead\">Рубли тут не берут. Только <b>биты</b>, которые ты заработал за чтение выпусков и верные ответы. Купил — твоё навсегда.</p>\n        <nav class=\"bh-jump\" aria-label=\"Прилавки\">\n          <a href=\"#tetradi\">Тетради</a>\n          <a href=\"#shpargalki\">Шпаргалки</a>\n          <a href=\"#znachki\">Значки</a>\n          <a href=\"#zachetka\">Зачётка</a>\n          <a href=\"#skoro\">Скоро</a>\n        </nav>\n      </div>\n\n      <div style=\"display: grid; gap: 40px\">\n        <div class=\"bh-feature\">\n          <a class=\"nb\" href=\"MGit.dc.html\" style=\"--cv: #ff8c1a\" aria-label=\"Git: тетрадь выживания — полистать превью\">\n            <span class=\"nb-no\" aria-hidden=\"true\">Тетрадь №1</span>\n            <span class=\"nb-label\" aria-hidden=\"true\"><b>Git</b><span>тетрадь выживания</span></span>\n            <span class=\"nb-st s1\" aria-hidden=\"true\">не делай --force</span>\n            <span class=\"nb-st s2\" aria-hidden=\"true\">+ шпаргалка команд</span>\n          </a>\n          <span class=\"bh-tag\" aria-hidden=\"true\"><b>{{gitPrice}} бит</b><small>{{gitTagNote}}</small></span>\n        </div>\n\n        <section class=\"bh-receipt\" aria-labelledby=\"bh-wallet\">\n          <h2 id=\"bh-wallet\">Твой кошелёк</h2>\n          <div class=\"{{bigCls}}\"><b>{{dispBits}}</b><span>бит в кармане</span></div>\n          <sc-if value=\"{{hasBreak}}\">\n            <div class=\"bh-row\"><span>Прочитано выпусков: {{readN}} × 50</span><b>+{{readBits}}</b></div>\n            <div class=\"bh-row\"><span>Верных ответов: {{rightN}} × 10</span><b>+{{rightBits}}</b></div>\n            <sc-if value=\"{{extraBits}}\"><div class=\"bh-row\"><span>Заработано в Разминке</span><b>+{{extraBits}}</b></div></sc-if>\n          </sc-if>\n          <div class=\"bh-row\"><span>Потрачено на Барахолке</span><b>−{{spent}}</b></div>\n          <sc-if value=\"{{badgeOn}}\"><div class=\"bh-row\"><span>Значок на тебе</span><b>{{badgeOn}}</b></div></sc-if>\n          <p class=\"bh-earn\">Как заработать: <b>+50</b> за прочитанный выпуск, <b>+10</b> за каждый верный ответ. <a href=\"Main.dc.html#vypuski\">К выпускам →</a></p>\n        </section>\n      </div>\n    </section>\n  </div>\n\n  <section class=\"bh-stall\" id=\"tetradi\" aria-labelledby=\"h-tetradi\" style=\"--a1: #e8262b; --a2: #fff7e3\">\n    <div class=\"bh-awn\" aria-hidden=\"true\"></div>\n    <h2 class=\"bh-board\" id=\"h-tetradi\">Тетради</h2>\n    <div class=\"bh-counter\">\n      <p class=\"bh-intro\">Методички, как будто их написал друг-отличник: клетка, поля, маркер и стрелки. Сначала можно <b>полистать превью</b>, а целиком тетрадь открывается после покупки. Есть кнопка «Распечатать» на A4.</p>\n      <div class=\"bh-grid g2\">\n        <sc-for list=\"{{manuals}}\" as=\"it\" hint-placeholder-count=\"2\">\n          <article class=\"{{it.cls}}\" aria-labelledby=\"{{it.hid}}\">\n            <sc-if value=\"{{it.owned}}\"><span class=\"bh-stamp\" aria-hidden=\"true\">ТВОЁ</span></sc-if>\n            <sc-if value=\"{{it.isNew}}\">\n              <span class=\"bh-minus\" aria-hidden=\"true\">−{{it.price}}</span>\n              <sc-for list=\"{{flyers}}\" as=\"f\" hint-placeholder-count=\"10\"><i class=\"bh-fly\" style=\"{{f.style}}\" aria-hidden=\"true\">{{f.t}}</i></sc-for>\n            </sc-if>\n            <sc-if value=\"{{it.notOwned}}\"><span class=\"bh-tag\" aria-hidden=\"true\"><b>{{it.price}} бит</b><small>{{it.tagNote}}</small></span></sc-if>\n            <div class=\"bh-cover\">\n              <a class=\"nb\" href=\"{{it.href}}\" style=\"{{it.coverStyle}}\" tabindex=\"-1\" aria-hidden=\"true\">\n                <span class=\"nb-no\">{{it.no}}</span>\n                <span class=\"nb-label\"><b style=\"{{it.titleStyle}}\">{{it.big}}</b><span>{{it.small}}</span></span>\n                <span class=\"nb-st s1\">{{it.st1}}</span>\n                <span class=\"nb-st s2\">{{it.st2}}</span>\n              </a>\n            </div>\n            <div class=\"bh-body\">\n              <span class=\"bh-kind\">{{it.kind}}</span>\n              <h3 id=\"{{it.hid}}\">{{it.title}}</h3>\n              <p>{{it.desc}}</p>\n              <ul class=\"bh-inside\">\n                <sc-for list=\"{{it.inside}}\" as=\"x\" hint-placeholder-count=\"5\"><li>{{x}}</li></sc-for>\n              </ul>\n              <div class=\"bh-acts\">\n                <sc-if value=\"{{it.owned}}\"><a class=\"bh-btn own\" href=\"{{it.href}}\" data-open=\"{{it.id}}\">Открыть тетрадь →</a></sc-if>\n                <sc-if value=\"{{it.notOwned}}\">\n                  <button type=\"button\" class=\"{{it.btnCls}}\" onClick=\"{{it.buy}}\" aria-expanded=\"{{it.expanded}}\" aria-controls=\"{{it.sid}}\">{{it.btn}}</button>\n                  <a class=\"bh-btn ghost\" href=\"{{it.href}}\">Полистать превью</a>\n                </sc-if>\n              </div>\n              <div id=\"{{it.sid}}\">\n                <sc-if value=\"{{it.short}}\">\n                  <div class=\"bh-short\" role=\"status\" data-short=\"{{it.id}}\" tabindex=\"-1\">\n                    <b class=\"bh-need\">Не хватает {{it.need}} бит</b>\n                    <span>{{it.needHow}}</span>\n                    <ul>\n                      <sc-for list=\"{{it.earn}}\" as=\"e\" hint-placeholder-count=\"3\"><li><a href=\"{{e.href}}\">{{e.label}}</a></li></sc-for>\n                    </ul>\n                    <span class=\"pen\">{{it.needPen}}</span>\n                  </div>\n                </sc-if>\n              </div>\n            </div>\n          </article>\n        </sc-for>\n      </div>\n    </div>\n  </section>\n\n  <section class=\"bh-stall\" id=\"shpargalki\" aria-labelledby=\"h-shp\" style=\"--a1: #19c3ff; --a2: #fff7e3\">\n    <div class=\"bh-awn\" aria-hidden=\"true\"></div>\n    <h2 class=\"bh-board\" id=\"h-shp\">Шпаргалки</h2>\n    <div class=\"bh-counter\">\n      <p class=\"bh-intro\">Один лист — одна тема. Повесь над столом или держи в телефоне. <b>Дешевле тетрадей</b>: хватит трёх выпусков.</p>\n      <div class=\"bh-grid g3\">\n        <sc-for list=\"{{sheets}}\" as=\"it\" hint-placeholder-count=\"3\">\n          <article class=\"{{it.cls}}\" aria-labelledby=\"{{it.hid}}\">\n            <sc-if value=\"{{it.owned}}\"><span class=\"bh-stamp\" aria-hidden=\"true\">ТВОЁ</span></sc-if>\n            <sc-if value=\"{{it.isNew}}\">\n              <span class=\"bh-minus\" aria-hidden=\"true\">−{{it.price}}</span>\n              <sc-for list=\"{{flyers}}\" as=\"f\" hint-placeholder-count=\"10\"><i class=\"bh-fly\" style=\"{{f.style}}\" aria-hidden=\"true\">{{f.t}}</i></sc-for>\n            </sc-if>\n            <sc-if value=\"{{it.notOwned}}\"><span class=\"bh-tag\" aria-hidden=\"true\"><b>{{it.price}} бит</b><small>{{it.tagNote}}</small></span></sc-if>\n            <div class=\"bh-cover\">\n              <a class=\"sh\" href=\"{{it.href}}\" tabindex=\"-1\" aria-hidden=\"true\">\n                <b>{{it.big}}</b>\n                <sc-for list=\"{{it.lines}}\" as=\"l\" hint-placeholder-count=\"4\"><code>{{l.a}}<i>{{l.b}}</i></code></sc-for>\n              </a>\n            </div>\n            <div class=\"bh-body\">\n              <span class=\"bh-kind\">{{it.kind}}</span>\n              <h3 id=\"{{it.hid}}\">{{it.title}}</h3>\n              <p>{{it.desc}}</p>\n              <div class=\"bh-acts\">\n                <sc-if value=\"{{it.owned}}\"><a class=\"bh-btn own\" href=\"{{it.href}}\" data-open=\"{{it.id}}\">Открыть лист →</a></sc-if>\n                <sc-if value=\"{{it.notOwned}}\">\n                  <button type=\"button\" class=\"{{it.btnCls}}\" onClick=\"{{it.buy}}\" aria-expanded=\"{{it.expanded}}\" aria-controls=\"{{it.sid}}\">{{it.btn}}</button>\n                  <a class=\"bh-btn ghost\" href=\"{{it.href}}\">Превью</a>\n                </sc-if>\n              </div>\n              <div id=\"{{it.sid}}\">\n                <sc-if value=\"{{it.short}}\">\n                  <div class=\"bh-short\" role=\"status\" data-short=\"{{it.id}}\" tabindex=\"-1\">\n                    <b class=\"bh-need\">Не хватает {{it.need}} бит</b>\n                    <span>{{it.needHow}}</span>\n                    <ul>\n                      <sc-for list=\"{{it.earn}}\" as=\"e\" hint-placeholder-count=\"3\"><li><a href=\"{{e.href}}\">{{e.label}}</a></li></sc-for>\n                    </ul>\n                    <span class=\"pen\">{{it.needPen}}</span>\n                  </div>\n                </sc-if>\n              </div>\n            </div>\n          </article>\n        </sc-for>\n      </div>\n    </div>\n  </section>\n\n  <section class=\"bh-stall bh-badges\" id=\"znachki\" aria-labelledby=\"h-zn\" style=\"--a1: #2ee59d; --a2: #141a33\">\n    <div class=\"bh-awn\" aria-hidden=\"true\"></div>\n    <h2 class=\"bh-board\" id=\"h-zn\">Значки</h2>\n    <div class=\"bh-counter\">\n      <p class=\"bh-intro\">Значки для профиля читателя. Купи и <b>приколи один</b>: он появится в твоём кошельке, а когда у профиля появится своя страница, переедет туда.</p>\n      <div class=\"bh-grid g4\">\n        <sc-for list=\"{{badges}}\" as=\"it\" hint-placeholder-count=\"5\">\n          <article class=\"{{it.cls}}\" aria-labelledby=\"{{it.hid}}\">\n            <sc-if value=\"{{it.isNew}}\">\n              <span class=\"bh-minus\" aria-hidden=\"true\">−{{it.price}}</span>\n              <sc-for list=\"{{flyers}}\" as=\"f\" hint-placeholder-count=\"10\"><i class=\"bh-fly\" style=\"{{f.style}}\" aria-hidden=\"true\">{{f.t}}</i></sc-for>\n            </sc-if>\n            <sc-if value=\"{{it.notOwned}}\"><span class=\"bh-tag\" aria-hidden=\"true\"><b>{{it.price}} бит</b></span></sc-if>\n            <div class=\"bh-cover\"><span class=\"{{it.bdCls}}\" style=\"{{it.bdStyle}}\" aria-hidden=\"true\"><span><b>{{it.big}}</b><span>{{it.small}}</span></span></span></div>\n            <div class=\"bh-body\">\n              <h3 id=\"{{it.hid}}\">{{it.title}}</h3>\n              <p>{{it.desc}}</p>\n              <div class=\"bh-acts\">\n                <sc-if value=\"{{it.owned}}\"><button type=\"button\" class=\"bh-btn own sm\" onClick=\"{{it.equip}}\" aria-pressed=\"{{it.onAria}}\" data-open=\"{{it.id}}\">{{it.equipLabel}}</button></sc-if>\n                <sc-if value=\"{{it.notOwned}}\"><button type=\"button\" class=\"{{it.btnCls}}\" onClick=\"{{it.buy}}\" aria-expanded=\"{{it.expanded}}\" aria-controls=\"{{it.sid}}\">{{it.btn}}</button></sc-if>\n              </div>\n              <div id=\"{{it.sid}}\">\n                <sc-if value=\"{{it.short}}\">\n                  <div class=\"bh-short\" role=\"status\" data-short=\"{{it.id}}\" tabindex=\"-1\">\n                    <b class=\"bh-need\">Не хватает {{it.need}} бит</b>\n                    <span>{{it.needHow}}</span>\n                    <ul>\n                      <sc-for list=\"{{it.earn}}\" as=\"e\" hint-placeholder-count=\"3\"><li><a href=\"{{e.href}}\">{{e.label}}</a></li></sc-for>\n                    </ul>\n                  </div>\n                </sc-if>\n              </div>\n            </div>\n          </article>\n        </sc-for>\n      </div>\n    </div>\n  </section>\n\n  <section class=\"bh-stall\" id=\"zachetka\" aria-labelledby=\"h-zk\" style=\"--a1: #ffd60a; --a2: #141414\">\n    <div class=\"bh-awn\" aria-hidden=\"true\"></div>\n    <h2 class=\"bh-board\" id=\"h-zk\">Зачётка</h2>\n    <div class=\"bh-counter\">\n      <p class=\"bh-intro\">Твоя зачётная книжка: какие выпуски уже зачтены. Нажми на выпуск, чтобы его прочитать.</p>\n      <div class=\"zk\">\n        <div class=\"zk-head\"><h3>Зачётка: {{zkName}}</h3><span style=\"font-family: 'Russo One', sans-serif; font-size: 20px\">{{zkDone}} из {{zkAll}}</span></div>\n        <div class=\"zk-meter\" role=\"img\" aria-label=\"{{zkAria}}\"><i style=\"{{zkBar}}\"></i></div>\n        <ul class=\"zk-list\">\n          <sc-for list=\"{{zk}}\" as=\"z\" hint-placeholder-count=\"12\">\n            <li><span class=\"zk-n\">№{{z.n}}</span><a href=\"{{z.href}}\">{{z.t}}</a><sc-if value=\"{{z.ok}}\"><span class=\"zk-ok\">зачёт</span></sc-if><sc-if value=\"{{z.no}}\"><span class=\"zk-no\">ещё нет</span></sc-if></li>\n          </sc-for>\n        </ul>\n        <p class=\"zk-note\">{{zkNote}}</p>\n      </div>\n    </div>\n  </section>\n\n  <section class=\"bh-stall\" id=\"skoro\" aria-labelledby=\"h-soon\" style=\"--a1: #ff2e93; --a2: #fff7e3\">\n    <div class=\"bh-awn\" aria-hidden=\"true\"></div>\n    <h2 class=\"bh-board\" id=\"h-soon\">Скоро привезут</h2>\n    <div class=\"bh-counter\">\n      <p class=\"bh-intro\">Этих вещей ещё нет на прилавке. Купить их пока нельзя, а биты никуда не денутся.</p>\n      <div class=\"bh-grid g2\">\n        <article class=\"bh-item\" aria-labelledby=\"h-map\">\n          <span class=\"bh-soonstamp\" aria-hidden=\"true\">скоро</span>\n          <div class=\"bh-cover\"><div class=\"ps map\" aria-hidden=\"true\"><i style=\"--c: #ffd60a; left: 8%; top: 14%; width: 26%; height: 30%\"></i><i style=\"--c: #ff3b3b; left: 40%; top: 10%; width: 22%; height: 44%\"></i><i style=\"--c: #2ee59d; left: 68%; top: 22%; width: 24%; height: 28%\"></i><i style=\"--c: #8a5cff; left: 12%; top: 58%; width: 76%; height: 14%\"></i><b>БАЙТСК</b></div></div>\n          <div class=\"bh-body\">\n            <span class=\"bh-kind\">Постер A3</span>\n            <h3 id=\"h-map\">Карта Сетеграда</h3>\n            <p>Все районы города и Фундамент под ним: где живёт какой злодей и в каком он выпуске.</p>\n          </div>\n        </article>\n        <article class=\"bh-item\" aria-labelledby=\"h-gal\">\n          <span class=\"bh-soonstamp\" aria-hidden=\"true\">скоро</span>\n          <div class=\"bh-cover\"><div class=\"ps gal\" aria-hidden=\"true\"><img loading=\"lazy\" decoding=\"async\" width=\"720\" height=\"899\" srcset=\"/_blob/40522caf67506d1d8a1711a08454e769-360 360w, /_blob/40522caf67506d1d8a1711a08454e769-540 540w, /_blob/40522caf67506d1d8a1711a08454e769 720w\" sizes=\"120px\" src=\"/_blob/40522caf67506d1d8a1711a08454e769\" alt=\"\"><img loading=\"lazy\" decoding=\"async\" width=\"720\" height=\"960\" srcset=\"/_blob/514e6e80025fe9d5923d48bbb8ffecaf-360 360w, /_blob/514e6e80025fe9d5923d48bbb8ffecaf-540 540w, /_blob/514e6e80025fe9d5923d48bbb8ffecaf 720w\" sizes=\"120px\" src=\"/_blob/514e6e80025fe9d5923d48bbb8ffecaf\" alt=\"\"><img loading=\"lazy\" decoding=\"async\" width=\"720\" height=\"960\" srcset=\"/_blob/f6d4ece1d46d17878f4a78cd6cd908a5-360 360w, /_blob/f6d4ece1d46d17878f4a78cd6cd908a5-540 540w, /_blob/f6d4ece1d46d17878f4a78cd6cd908a5 720w\" sizes=\"120px\" src=\"/_blob/f6d4ece1d46d17878f4a78cd6cd908a5\" alt=\"\"><img loading=\"lazy\" decoding=\"async\" width=\"720\" height=\"960\" srcset=\"/_blob/2871ddc0547fea9d62c83365e76e7ab1-360 360w, /_blob/2871ddc0547fea9d62c83365e76e7ab1-540 540w, /_blob/2871ddc0547fea9d62c83365e76e7ab1 720w\" sizes=\"120px\" src=\"/_blob/2871ddc0547fea9d62c83365e76e7ab1\" alt=\"\"><img loading=\"lazy\" decoding=\"async\" width=\"720\" height=\"960\" srcset=\"/_blob/b22c2c3c1d7460c06a98b2235425b27a-360 360w, /_blob/b22c2c3c1d7460c06a98b2235425b27a-540 540w, /_blob/b22c2c3c1d7460c06a98b2235425b27a 720w\" sizes=\"120px\" src=\"/_blob/b22c2c3c1d7460c06a98b2235425b27a\" alt=\"\"><img loading=\"lazy\" decoding=\"async\" width=\"720\" height=\"960\" srcset=\"/_blob/61d2fd71e56001a5bf9abae0dba0bfa3-360 360w, /_blob/61d2fd71e56001a5bf9abae0dba0bfa3-540 540w, /_blob/61d2fd71e56001a5bf9abae0dba0bfa3 720w\" sizes=\"120px\" src=\"/_blob/61d2fd71e56001a5bf9abae0dba0bfa3\" alt=\"\"></div></div>\n          <div class=\"bh-body\">\n            <span class=\"bh-kind\">Постер A3</span>\n            <h3 id=\"h-gal\">Галерея злодеев</h3>\n            <p>Доска розыска: портреты, клички и чем каждый опасен. Пока злодеи висят в <a href=\"Issue9.dc.html\">выпуске №9</a>.</p>\n          </div>\n        </article>\n      </div>\n    </div>\n  </section>\n\n  <section class=\"bh-rub\" aria-labelledby=\"h-rub\">\n    <div class=\"bh-rub-in\">\n      <h2 id=\"h-rub\">Когда-нибудь: толстые методички</h2>\n      <p>Большие тетради с задачами и разбором для тех, кто идёт в AppSec всерьёз. Мы их только пишем: цен и оплаты нет, и до готовности не будет. Всё, что выше, по-прежнему только за биты.</p>\n      <ul>\n        <li>Сети с нуля до Wireshark</li>\n        <li>Веб-уязвимости: журнал лабораторных</li>\n        <li>Собеседование Junior AppSec</li>\n        <li>Linux для безопасника</li>\n      </ul>\n    </div>\n  </section>\n\n  <footer class=\"bh-ft\">\n    CyberComics · Сетеград, ночной рынок · Покупки за биты хранятся в этом браузере.<br>\n    Тренируйся только легально: <a href=\"https://picoctf.org\" rel=\"noopener\">picoCTF</a>, <a href=\"https://portswigger.net/web-security\" rel=\"noopener\">PortSwigger Academy</a>, <a href=\"https://owasp.org/www-project-juice-shop/\" rel=\"noopener\">OWASP Juice Shop</a>, <a href=\"https://tryhackme.com\" rel=\"noopener\">TryHackMe</a>.\n  </footer>\n\n  <sc-if value=\"{{toast}}\"><div class=\"bh-toast\" role=\"status\">{{toast}}</div></sc-if>\n</div>", (function () {

/* ---------- Кошелёк Барахолки ----------
 * Пока в cc.js нет методов покупок, работаем через безопасную обёртку:
 *   заработано = CC.bits(); потрачено и купленное — localStorage 'cc-shop:' + имя
 *   (имя из CC.getUser() или localStorage 'cc-user' {name}, иначе 'guest').
 * Если в cc.js появятся CC.buy(id, price) и CC.owned(id), обёртка отдаёт покупки им
 * (тогда CC.bits() считается уже за вычетом трат).
 * Обёртка живёт в window.CCShop: ею же пользуется страница методички (Manual). */
(function () {
  if (typeof window === 'undefined' || window.CCShop) return;
  const ISSUES = [{"n":1,"t":"HTTP: о чём шепчутся браузер и сервер","v":"Перехватчик"},{"n":2,"t":"Мистер IDOR и чужие заказы","v":"Мистер IDOR"},{"n":3,"t":"Доктор Инъекция: когда данные становятся кодом","v":"Доктор Инъекция"},{"n":4,"t":"Скрипт-Призрак вселяется в браузер","v":"Скрипт-Призрак"},{"n":5,"t":"Подделыватель и чужие руки","v":"Подделыватель"},{"n":6,"t":"Прокси-Паук плетёт сеть изнутри","v":"Прокси-Паук"},{"n":7,"t":"Токенщик и поддельные пропуска","v":"Токенщик"},{"n":8,"t":"Утечкин и конвейер защиты","v":"Утечкин"},{"n":9,"t":"OWASP Top 10:2025 — галерея злодеев","v":"Совет Десяти"},{"n":10,"t":"Как работает интернет: путь одного пакета","v":"Лагоед"},{"n":11,"t":"Модели OSI и TCP/IP: сеть как матрёшка","v":"Путаник"},{"n":12,"t":"Сети и IP-адреса: кто есть кто в сети","v":"Самозванец"},{"n":13,"t":"TCP, UDP и порты: 65 535 дверей сервера","v":"Дверной Стукач"},{"n":14,"t":"DNS: телефонная книга интернета","v":"Лжесправочник"},{"n":15,"t":"HTTPS и TLS: паспорт сайта и опечатанный кейс","v":"Фальшивомонетчик"},{"n":16,"t":"Клиент, сервер и API","v":"Болтун"},{"n":17,"t":"Linux и терминал: права, root и журналы","v":"Товарищ 777"},{"n":18,"t":"Git: вагоны, ветки и замок на main","v":"Форс-Пушер"},{"n":19,"t":"Bash: командная строка безопасника","v":"Однострочник"},{"n":20,"t":"Python: первый скрипт и змей из pip","v":"Змей Пипыч"},{"n":21,"t":"SQL и базы данных: где живут все данные","v":"Дроп Таблыч"},{"n":22,"t":"Криптография: хеши, ключи и подписи","v":"Радужный Табличник"}];
  const CATALOG = [
    { id: 'git', type: 'manual', page: 'MGit', price: 350, rel: [18, 8], title: 'Git: тетрадь выживания' },
    { id: 'owasp', type: 'manual', page: 'MOwasp', price: 450, rel: [9, 2, 3, 6], title: 'OWASP Top 10:2025 — конспект' },
    { id: 'http', type: 'sheet', page: 'MHttp', price: 120, rel: [1], title: 'HTTP-коды на одном листе' },
    { id: 'ports', type: 'sheet', page: 'MPorts', price: 120, rel: [13, 12], title: 'Порты, которые надо знать' },
    { id: 'linux', type: 'sheet', page: 'MLinux', price: 150, rel: [17, 19], title: 'Linux: команды на каждый день' },
    { id: 'b-200', type: 'badge', price: 60, rel: [1], title: 'Значок «200 OK»' },
    { id: 'b-teapot', type: 'badge', price: 80, rel: [1], title: 'Значок «418»' },
    { id: 'b-noforce', type: 'badge', price: 80, rel: [18], title: 'Значок «Без --force»' },
    { id: 'b-env', type: 'badge', price: 100, rel: [8], title: 'Значок «.env в .gitignore»' },
    { id: 'b-council', type: 'badge', price: 150, rel: [9], title: 'Значок «Совет распущен»' }
  ];
  let LS = null;
  try { LS = window.localStorage; } catch (e) { LS = null; }
  const mem = {};
  function cc() { return window.CC || null; }
  function userName() {
    try { const c = cc(); if (c && typeof c.getUser === 'function') { const u = c.getUser(); const n = u && (typeof u === 'string' ? u : u.name); if (n) return String(n); } } catch (e) {}
    try { const u = JSON.parse((LS && LS.getItem('cc-user')) || 'null'); if (u && u.name) return String(u.name); } catch (e) {}
    return 'guest';
  }
  function key() { return 'cc-shop:' + userName(); }
  function load() {
    let s = null;
    try { s = JSON.parse((LS && LS.getItem(key())) || 'null'); } catch (e) { s = null; }
    if (!s) s = mem[key()] || null;
    s = s && typeof s === 'object' ? s : {};
    return { owned: s.owned && typeof s.owned === 'object' ? s.owned : {}, spent: Number(s.spent) > 0 ? Math.round(Number(s.spent)) : 0, badge: typeof s.badge === 'string' ? s.badge : '' };
  }
  function save(s) { mem[key()] = s; try { if (LS) LS.setItem(key(), JSON.stringify(s)); } catch (e) {} }
  function native() { const c = cc(); return !!(c && typeof c.buy === 'function' && typeof c.owned === 'function'); }
  function earned() { try { const c = cc(); return c && typeof c.bits === 'function' ? Math.max(0, Number(c.bits()) || 0) : 0; } catch (e) { return 0; } }
  function item(id) { return CATALOG.find((x) => x.id === id) || null; }
  const S = {
    ISSUES, CATALOG, item, user: userName,
    named() { return userName() !== 'guest'; },
    earned,
    spent() { try { const c = cc(); if (native() && typeof c.spent === 'function') return Math.max(0, Number(c.spent()) || 0); } catch (e) {} return native() ? 0 : load().spent; },
    total() { try { const c = cc(); if (c && typeof c.earned === 'function') return Math.max(0, Number(c.earned()) || 0); } catch (e) {} return native() ? earned() + S.spent() : earned(); },
    balance() { return native() ? earned() : Math.max(0, earned() - load().spent); },
    owned(id) {
      try { if (native() && cc().owned(id)) return true; } catch (e) {}
      return !!load().owned[id];
    },
    buy(id) {
      const it = item(id); if (!it) return { ok: false, need: 0 };
      if (S.owned(id)) return { ok: true, already: true };
      const bal = S.balance();
      if (bal < it.price) return { ok: false, need: it.price - bal };
      if (native()) { try { const r = cc().buy(id, it.price); return r === false ? { ok: false, need: Math.max(0, it.price - S.balance()) } : { ok: true }; } catch (e) { return { ok: false, need: 0 }; } }
      const s = load(); s.owned[id] = Date.now(); s.spent += it.price; save(s);
      return { ok: true };
    },
    badge() { const b = load().badge; return b && S.owned(b) ? b : ''; },
    setBadge(id) { const s = load(); s.badge = s.badge === id ? '' : id; save(s); return s.badge; },
    isRead(n) { try { const c = cc(); return !!(c && c.isRead(n)); } catch (e) { return false; } },
    rightN() { try { const c = cc(); return c && typeof c.rightCount === 'function' ? c.rightCount() : null; } catch (e) { return null; } },
    reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } },
    /* Куда сходить за битами: сначала непрочитанные выпуски по теме товара, потом любые непрочитанные. */
    earnLinks(id, max) {
      const it = item(id) || { rel: [] };
      const unread = ISSUES.filter((x) => !S.isRead(x.n));
      const first = (it.rel || []).map((n) => unread.find((x) => x.n === n)).filter(Boolean);
      const rest = unread.filter((x) => first.indexOf(x) === -1);
      return first.concat(rest).slice(0, max || 3).map((x) => ({ href: 'Issue' + x.n + '.dc.html', label: '№' + x.n + ' ' + x.t + ' · +50 бит' }));
    },
    needHow(need) {
      const unread = ISSUES.filter((x) => !S.isRead(x.n)).length;
      const iss = Math.ceil(need / 50), q = Math.ceil(need / 10);
      if (!ISSUES.length || unread >= iss) return 'Это ' + iss + ' ' + S.plural(iss, 'выпуск', 'выпуска', 'выпусков') + ' (по +50) или ' + q + ' ' + S.plural(q, 'верный ответ', 'верных ответа', 'верных ответов') + ' в квизах (по +10). Начни отсюда:';
      if (unread > 0) return 'Непрочитанных выпусков осталось ' + unread + ' — это +' + unread * 50 + '. Остальное добери верными ответами в квизах (по +10).';
      return 'Ты прочитал всё, что уже вышло! Добери битами за верные ответы в квизах или дождись новых выпусков.';
    },
    plural(n, one, few, many) { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : (a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many); }
  };
  window.CCShop = S;
})();

class Component extends DCLogic {
  constructor(props) { super(props); this.state = { short: null, just: null, disp: null, shake: false, toast: '' }; }
  componentWillUnmount() { clearTimeout(this._tt); clearTimeout(this._ts); if (this._raf) cancelAnimationFrame(this._raf); }
  countDown(from, to) {
    const S = window.CCShop;
    if (S.reduced() || from === to) { this.setState({ disp: null }); return; }
    const t0 = performance.now(), dur = 900;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      this.setState({ disp: Math.round(from + (to - from) * e) });
      if (k < 1) this._raf = requestAnimationFrame(step); else this.setState({ disp: null });
    };
    this._raf = requestAnimationFrame(step);
  }
  buy(id) {
    const S = window.CCShop; const it = S.item(id);
    const before = S.balance();
    const r = S.buy(id);
    if (!r.ok) {
      const open = this.state.short !== id;
      this.setState({ short: open ? id : null });
      if (open) setTimeout(() => { const el = document.querySelector('[data-short="' + id + '"]'); if (el) el.focus({ preventScroll: true }); }, 30);
      return;
    }
    clearTimeout(this._ts); clearTimeout(this._tt);
    this.setState({ just: id, short: null, shake: true, disp: before, toast: 'Куплено: ' + it.title + '. Списано ' + it.price + ' бит. Это твоё навсегда.' });
    this.countDown(before, S.balance());
    this._ts = setTimeout(() => this.setState({ shake: false }), 700);
    this._tt = setTimeout(() => this.setState({ toast: '' }), 5200);
    setTimeout(() => { const el = document.querySelector('[data-open="' + id + '"]'); if (el) el.focus({ preventScroll: true }); }, 40);
  }
  equip(id) {
    const S = window.CCShop; const on = S.setBadge(id);
    clearTimeout(this._tt);
    this.setState({ toast: on ? 'Значок приколот: ' + S.item(id).title.replace('Значок ', '') : 'Значок снят' });
    this._tt = setTimeout(() => this.setState({ toast: '' }), 3200);
  }
  renderVals() {
    const S = window.CCShop;
    const st = this.state || {};
    const bal = S.balance();
    const shown = st.disp === null || st.disp === undefined ? bal : st.disp;
    const rn = S.rightN();
    const readN = S.ISSUES.filter((x) => S.isRead(x.n)).length;
    const name = S.named() ? S.user() : '';
    const tagNote = (p) => (bal >= p ? 'тебе хватает' : 'ещё ' + (p - bal));
    const base = (it, extra) => {
      const owned = S.owned(it.id), afford = bal >= it.price, short = !owned && st.short === it.id;
      const need = Math.max(0, it.price - bal);
      return Object.assign({
        id: it.id, price: it.price, title: it.title, owned, notOwned: !owned, isNew: owned && st.just === it.id,
        hid: 'h-' + it.id, sid: 's-' + it.id, href: it.page ? it.page + '.dc.html' : '#',
        cls: 'bh-item' + (owned && st.just === it.id ? ' is-new' : ''),
        btn: afford ? 'Купить за ' + it.price + ' бит' : 'Не хватает ' + need + ' бит',
        btnCls: 'bh-btn' + (afford ? '' : ' poor'), expanded: afford ? undefined : (short ? 'true' : 'false'),
        buy: () => this.buy(it.id), tagNote: tagNote(it.price),
        short, need, needHow: S.needHow(need), earn: short ? S.earnLinks(it.id, 3) : [],
        needPen: 'Биты не сгорают: вернёшься — товар будет ждать.'
      }, extra || {});
    };
    const M = {
      git: { kind: 'Тетрадь · 10 страниц', no: 'Тетрадь №1', big: 'Git', small: 'тетрадь выживания', st1: 'не делай --force', st2: '+ шпаргалка', coverStyle: '--cv:#ff8c1a',
        desc: 'Всё, чтобы не потерять код и не слить пароль: от первого коммита до «я всё сломал, спасите».',
        inside: ['Репозиторий, коммит, ветка — на картинках', 'Merge и конфликт без паники', 'Remote, push и pull: кто кому что отправляет', 'Аптечка: как откатить любую ошибку', 'Шпаргалка команд с разбором каждого флага'] },
      owasp: { kind: 'Конспект · 8 страниц', no: 'Тетрадь №2', big: 'OWASP', small: 'Top 10:2025, конспект', st1: 'A01 → A10', st2: 'чем не путать', coverStyle: '--cv:#ff3b3b', titleStyle: 'font-size:clamp(36px,7vw,52px)',
        desc: 'Все десять категорий редакции 2025: смысл одной фразой, сценарий, защита и с какой соседкой не путать.',
        inside: ['Все 10 категорий по порядку', 'Что изменилось с 2021 года', 'Пары, которые путают на собесе', 'Как отвечать на «назови Top 10»', 'Где тренироваться легально'] }
    };
    const manuals = ['git', 'owasp'].map((id) => base(S.item(id), M[id]));
    const SH = {
      http: { kind: 'Шпаргалка · лист с двух сторон', big: 'HTTP-коды', desc: 'От 200 до 504: что значит каждый код, чем 401 отличается от 403 и какие ответы говорят «сломалось на сервере».',
        lines: [{ a: '200 ', b: 'OK' }, { a: '401 ', b: 'кто ты?' }, { a: '403 ', b: 'нельзя' }, { a: '404 ', b: 'нет такого' }] },
      ports: { kind: 'Шпаргалка · лист с двух сторон', big: 'Порты', desc: '22, 53, 80, 443 и ещё два десятка: какой сервис обычно где живёт и какие порты нельзя открывать в интернет.',
        lines: [{ a: '22   ', b: 'SSH' }, { a: '53   ', b: 'DNS' }, { a: '443  ', b: 'HTTPS' }, { a: '3306 ', b: 'MySQL' }] },
      linux: { kind: 'Шпаргалка · 2 страницы', big: 'Linux', desc: 'Команды терминала на каждый день: файлы, поиск, права, процессы и сеть. У каждой — что значат её флаги.',
        lines: [{ a: 'ls ', b: '-la' }, { a: 'grep ', b: '-ri' }, { a: 'chmod ', b: '644' }, { a: 'cd ', b: '~' }] }
    };
    const sheets = ['http', 'ports', 'linux'].map((id) => base(S.item(id), SH[id]));
    const BD = {
      'b-200': { big: '200', small: 'OK', bc: '#2ee59d', desc: 'Всё в порядке. Для тех, кто прочитал выпуск про HTTP.' },
      'b-teapot': { big: '418', small: 'я чайник', bc: '#19c3ff', desc: 'Настоящий код из шуточного RFC 2324. Дядя Миша одобряет.' },
      'b-noforce': { big: '--force', small: 'не сегодня', bc: '#ff8c1a', bs: '24px', desc: 'Для тех, кто не переписывает чужую историю.' },
      'b-env': { big: '.env', small: 'в .gitignore', bc: '#ffd60a', desc: 'Секреты не едут в репозиторий. Никогда.' },
      'b-council': { big: 'A01–A10', small: 'Совет распущен', bc: '#ff2e93', bs: '21px', desc: 'Знаешь всю десятку OWASP по порядку.' }
    };
    const myBadge = S.badge();
    const badges = Object.keys(BD).map((id) => {
      const d = BD[id], on = myBadge === id;
      return base(S.item(id), {
        big: d.big, small: d.small, desc: d.desc,
        bdCls: 'bd' + (on ? ' on' : ''), bdStyle: '--bc:' + d.bc + (d.bs ? ';--bs:' + d.bs : ''),
        equip: () => this.equip(id), equipLabel: on ? 'Снять значок' : 'Приколоть', onAria: on ? 'true' : 'false'
      });
    });
    const flyers = [];
    if (!S.reduced()) for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; flyers.push({ t: i % 2 ? '1' : '0', style: '--dx:' + Math.round(Math.cos(a) * 130) + 'px;--dy:' + Math.round(Math.sin(a) * 110 - 30) + 'px;animation-delay:' + (i * 25) + 'ms' }); }
    const bulbs = [];
    const C = ['#ffd60a', '#ff2e93', '#2ee59d', '#19c3ff', '#ff8c1a'];
    for (let i = 0; i < 17; i++) { const x = (i + 0.5) / 17; bulbs.push({ style: '--c:' + C[i % 5] + ';--d:' + ((i * 370) % 3400) + 'ms;left:' + (x * 100).toFixed(2) + '%;top:' + (4 * 32 * x * (1 - x) + 1).toFixed(1) + 'px' }); }
    const zk = S.ISSUES.map((x) => ({ n: x.n, t: x.t, href: 'Issue' + x.n + '.dc.html', ok: S.isRead(x.n), no: !S.isRead(x.n) }));
    const zkDone = zk.filter((z) => z.ok).length, zkAll = zk.length || 1;
    const left = zk.length - zkDone;
    return {
      hi: name ? 'Привет, ' + name : '',
      bitsLabel: bal + ' бит',
      dispBits: shown, bigCls: 'bh-big' + (st.shake ? ' bh-shake' : ''),
      hasBreak: rn !== null && S.ISSUES.length > 0, readN, readBits: readN * 50, rightN: rn || 0, rightBits: (rn || 0) * 10, spent: S.spent(), extraBits: Math.max(0, S.total() - readN * 50 - (rn || 0) * 10) || '',
      badgeOn: myBadge && BD[myBadge] ? BD[myBadge].big : '',
      gitPrice: S.item('git').price, gitTagNote: tagNote(S.item('git').price),
      manuals, sheets, badges, flyers, bulbs, toast: st.toast,
      zk, zkDone, zkAll: zk.length, zkName: name || 'читатель', zkBar: 'width:' + Math.round((zkDone / zkAll) * 100) + '%' + (zkDone ? '' : ';border-right:0'),
      zkAria: 'Зачтено ' + zkDone + ' из ' + zk.length + ' выпусков',
      zkNote: zkDone === 0 ? 'Пока пусто. Первый выпуск — и первые 50 бит уже твои.' : (left === 0 ? 'Всё зачтено! Ты прочитал каждый вышедший выпуск.' : 'Осталось ' + left + ' — это ещё +' + left * 50 + ' бит.')
    };
  }
}

return Component;
})());
