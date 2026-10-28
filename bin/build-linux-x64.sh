#!/usr/bin/env bash
set -euo pipefail

SRC_DIR=./dist/trilium-linux-x64-src

[ "${1:-}" != "DONTCOPY" ] && ./bin/copy-trilium.sh "$SRC_DIR"

rm -f "$SRC_DIR"/src/public/app-dist/*.mobile.*

./bin/prune-better-sqlite3.sh "$SRC_DIR" linux-x64 linuxmusl-x64

ELECTRON_VERSION=$(jq -r ".devDependencies.electron" package.json)

echo "Packaging linux x64 electron build"
./node_modules/.bin/electron-packager "$SRC_DIR" --asar --out=dist --executable-name=trilium --platform=linux --arch=x64 --overwrite --electron-version="$ELECTRON_VERSION"

BUILD_DIR=./dist/trilium-linux-x64
rm -rf "$BUILD_DIR"

mv "./dist/Trilium Notes-linux-x64" "$BUILD_DIR"

# keep only en-US and zh-CN Chromium locales (other languages fall back to en-US)
if [[ -d "$BUILD_DIR/locales" ]]; then
    find "$BUILD_DIR/locales" -mindepth 1 -maxdepth 1 \
        ! -name 'en-US.pak' ! -name 'zh-CN.pak' -delete
fi

cp images/app-icons/png/128x128.png "$BUILD_DIR"/icon.png
cp bin/tpl/anonymize-database.sql "$BUILD_DIR"/

cp -r dump-db "$BUILD_DIR"/
rm -rf "$BUILD_DIR"/dump-db/node_modules

for f in 'trilium-portable' 'trilium-safe-mode' 'trilium-no-cert-check'; do
    cp bin/tpl/"$f".sh "$BUILD_DIR"/
    chmod 755 "$BUILD_DIR"/"$f".sh
done

echo "Packaging linux x64 electron distribution..."
VERSION=`jq -r ".version" package.json`

pushd dist
    tar cJf "trilium-linux-x64-${VERSION}.tar.xz" trilium-linux-x64
popd

bin/build-debian.sh
