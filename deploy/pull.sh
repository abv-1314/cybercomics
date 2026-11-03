#!/bin/sh
# Обновление сайта на хостинге: забирает свежую сборку из ветки `site` на GitHub.
# Крон на reg.ru (раз в 5 минут):
#   curl -fsSL https://raw.githubusercontent.com/abv-1314/cybercomics/main/deploy/pull.sh | sh
set -eu
REPO="abv-1314/cybercomics"
DIR="$HOME/www/cybercomics.ru"
STATE="$HOME/.cybercomics-version"

NEW=$(curl -fsSL "https://raw.githubusercontent.com/$REPO/site/VERSION?t=$(date +%s)" | tr -dc '0-9a-f')
[ -n "$NEW" ] || exit 0
[ "$NEW" = "$(cat "$STATE" 2>/dev/null || true)" ] && exit 0

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
# Старый sitemap: по нему IndexNow узнает, какие адреса изменились.
[ -f "$DIR/sitemap.xml" ] && cp "$DIR/sitemap.xml" "$TMP/old-sitemap.xml" 2>/dev/null || true
curl -fsSL "https://codeload.github.com/$REPO/tar.gz/refs/heads/site" -o "$TMP/site.tgz"
mkdir "$TMP/s"
tar -xzf "$TMP/site.tgz" -C "$TMP/s" --strip-components=1
test -s "$TMP/s/index.html"
mkdir -p "$DIR"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete --exclude 'yandex_*.html' --exclude 'google*.html' --exclude '.well-known/' --exclude 'cgi-bin/' "$TMP/s/" "$DIR/"
else
  cp -a "$TMP/s/." "$DIR/"
fi
echo "$NEW" > "$STATE"
echo "cybercomics: обновлено до ${NEW%"${NEW#???????}"}"

# IndexNow: сообщить Яндексу (он же передаёт Bing и другим) об адресах новой сборки. Только после того,
# как файлы уже лежат на хостинге: Яндекс сразу проверяет https://cybercomics.ru/<ключ>.txt.
# Первый раз шлём все адреса из sitemap.xml, дальше только новые и изменённые (другой lastmod).
# Ключ публичный по протоколу (тот же в src/seo.js). Любая ошибка здесь не ломает обновление сайта.
indexnow() {
  KEY="1607fd8910c8d318dc19014d5b8daf71"
  SITE="https://cybercomics.ru"
  SENT="$HOME/.cybercomics-indexnow"
  [ -s "$DIR/$KEY.txt" ] && [ -s "$DIR/sitemap.xml" ] || return 0
  if [ -f "$SENT" ] && [ -f "$TMP/old-sitemap.xml" ]; then
    grep '<loc>' "$DIR/sitemap.xml" | grep -vxFf "$TMP/old-sitemap.xml" > "$TMP/changed" || true
  else
    grep '<loc>' "$DIR/sitemap.xml" > "$TMP/changed" || true
  fi
  LIST=$(sed -n 's#.*<loc>\(https://cybercomics\.ru/[^<"]*\)</loc>.*#"\1"#p' "$TMP/changed" | head -n 10000 | paste -sd, -)
  [ -n "$LIST" ] || { echo "IndexNow: изменённых адресов нет"; return 0; }
  BODY="{\"host\":\"cybercomics.ru\",\"key\":\"$KEY\",\"keyLocation\":\"$SITE/$KEY.txt\",\"urlList\":[$LIST]}"
  CODE=$(curl -sS -m 20 -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json; charset=utf-8' \
    --data-binary "$BODY" https://yandex.com/indexnow 2>/dev/null) || CODE="000"
  N=$(printf '%s\n' "$LIST" | tr ',' '\n' | wc -l | tr -d ' ')
  echo "IndexNow (Яндекс): HTTP $CODE, адресов: $N"
  case "$CODE" in 200|202) date +%F > "$SENT" ;; esac
  return 0
}
indexnow || true
