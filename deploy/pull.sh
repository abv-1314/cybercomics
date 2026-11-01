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
