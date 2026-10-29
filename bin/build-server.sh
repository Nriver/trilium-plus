#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

. bin/lib/node-cache.sh

PKG_DIR=dist/trilium-linux-x64-server
NODE_VERSION="${NODE_VERSION:-24.22.1}"
export NODE_VERSION

if [ "${1:-}" != "DONTCOPY" ]
then
    ./bin/copy-trilium.sh "$PKG_DIR"
fi

mkdir -p dist

fetch_node "$NODE_VERSION" linux-x64 "$PKG_DIR/node"

rm -rf "$PKG_DIR/node/lib/node_modules/npm"
rm -rf "$PKG_DIR/node/include/node"

rm -rf "$PKG_DIR"/node_modules/electron*
rm -rf "$PKG_DIR"/node_modules/@electron/remote
rm -rf "$PKG_DIR"/node_modules/@types
rm -rf "$PKG_DIR"/node_modules/sass
rm -rf "$PKG_DIR"/webpack*
rm -f "$PKG_DIR/electron.js"

./bin/prune-better-sqlite3.sh "$PKG_DIR" linux-x64 linuxmusl-x64

printf "#!/bin/sh\n./node/bin/node src/www" > "$PKG_DIR/trilium.sh"
chmod 755 "$PKG_DIR/trilium.sh"

cp bin/tpl/anonymize-database.sql "$PKG_DIR"/

cp -r dump-db "$PKG_DIR/"
rm -rf "$PKG_DIR/dump-db/node_modules"

VERSION=$(jq -r ".version" package.json)

cd dist

tar cJf "trilium-linux-x64-server-${VERSION}.tar.xz" trilium-linux-x64-server

echo "Created dist/trilium-linux-x64-server-${VERSION}.tar.xz"
