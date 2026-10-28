#!/usr/bin/env bash
set -euo pipefail

SRC_DIR=./dist/trilium-windows-x64-src

if [ "${1:-}" != "DONTCOPY" ]
then
    ./bin/copy-trilium.sh $SRC_DIR
fi

rm -f $SRC_DIR/src/public/app-dist/*.mobile.*

./bin/prune-better-sqlite3.sh "$SRC_DIR" win32-x64

ELECTRON_VERSION=$(jq -r ".devDependencies.electron" package.json)

if [ -z "${WINE_BINARY:-}" ] && ! command -v wine64 >/dev/null 2>&1 && command -v wine >/dev/null 2>&1; then
    export WINE_BINARY="$(command -v wine)"
fi

echo "Packaging windows x64 electron build"

./node_modules/.bin/electron-packager $SRC_DIR --asar --out=dist --executable-name=trilium --platform=win32  --arch=x64 --overwrite --icon=images/app-icons/win/icon.ico --electron-version="$ELECTRON_VERSION"

BUILD_DIR=./dist/trilium-windows-x64
rm -rf $BUILD_DIR

mv "./dist/Trilium Notes-win32-x64" $BUILD_DIR

# keep only Chinese and English Chromium locales (other languages fall back to en-US)
if [[ -d "$BUILD_DIR/locales" ]]; then
    find "$BUILD_DIR/locales" -mindepth 1 -maxdepth 1 \
        ! -name 'en-*.pak' ! -name 'zh-*.pak' -delete
fi

cp bin/tpl/anonymize-database.sql $BUILD_DIR/

cp -r dump-db $BUILD_DIR/
rm -rf $BUILD_DIR/dump-db/node_modules

cp bin/tpl/trilium-{portable,no-cert-check,safe-mode}.bat $BUILD_DIR/

echo "Archiving windows x64 electron distribution..."
VERSION=$(jq -r ".version" package.json)

if ! command -v 7z >/dev/null 2>&1; then
    echo "ERROR: 7z is required to create the Windows distribution archive." >&2
    exit 1
fi

cd dist

rm -f "trilium-windows-x64-${VERSION}.zip" "trilium-windows-x64-${VERSION}.7z"
7z a -t7z -mx=9 "trilium-windows-x64-${VERSION}.7z" trilium-windows-x64 >/dev/null
