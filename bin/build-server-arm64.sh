#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

. bin/lib/build-cache.sh

PKG_DIR=dist/trilium-linux-arm64-server
NODE_VERSION="${NODE_VERSION:-24.22.3}"
export NODE_VERSION

if [ "${1:-}" != "DONTCOPY" ]
then
    ./bin/copy-trilium.sh "$PKG_DIR"
fi

mkdir -p dist

fetch_node "$NODE_VERSION" linux-arm64 "$PKG_DIR/node"

rm -rf "$PKG_DIR/node/lib/node_modules/npm"
rm -rf "$PKG_DIR/node/include/node"

rm -rf "$PKG_DIR"/node_modules/electron*
rm -rf "$PKG_DIR"/node_modules/@electron/remote
rm -rf "$PKG_DIR"/node_modules/@types
rm -rf "$PKG_DIR"/node_modules/sass
rm -rf "$PKG_DIR"/webpack*
rm -f "$PKG_DIR/electron.js"

./bin/prune-better-sqlite3.sh "$PKG_DIR" linux-arm64 linuxmusl-arm64

printf "#!/bin/sh\n./node/bin/node src/www" > "$PKG_DIR/trilium.sh"
chmod 755 "$PKG_DIR/trilium.sh"

cp bin/tpl/anonymize-database.sql "$PKG_DIR"/

cp -r dump-db "$PKG_DIR/"
rm -rf "$PKG_DIR/dump-db/node_modules"

VERSION=$(jq -r ".version" package.json)

cd dist

# node_modules installed by pnpm contains hard links. Some Android/proot
# extraction tools don't preserve them, which leaves files like
# negotiator/lib/charset.js missing. Store every file separately instead.
tar --hard-dereference -cJf "trilium-linux-arm64-server-${VERSION}.tar.xz" trilium-linux-arm64-server

echo "Created dist/trilium-linux-arm64-server-${VERSION}.tar.xz"
