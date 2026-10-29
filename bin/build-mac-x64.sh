#!/usr/bin/env bash
set -euo pipefail

. bin/lib/build-cache.sh

SRC_DIR=./dist/trilium-mac-x64-src

if [ "${1:-}" != "DONTCOPY" ]
then
    ./bin/copy-trilium.sh $SRC_DIR
fi

rm -f $SRC_DIR/src/public/app-dist/*.mobile.*

./bin/prune-better-sqlite3.sh "$SRC_DIR" darwin-x64

ELECTRON_VERSION=$(jq -r ".devDependencies.electron" package.json)
ELECTRON_CACHE_DIR="$(electron_cache_dir)"
mkdir -p "$ELECTRON_CACHE_DIR"

echo "Packaging mac x64 electron build"

./node_modules/.bin/electron-packager $SRC_DIR --asar --out=dist --executable-name=trilium --platform=darwin --arch=x64 --overwrite --icon=images/app-icons/mac/icon.icns --electron-version="$ELECTRON_VERSION" --download.cacheRoot="$ELECTRON_CACHE_DIR"

BUILD_DIR=./dist/trilium-mac-x64
rm -rf $BUILD_DIR

# Mac build has by default useless directory level
mv "./dist/Trilium Notes-darwin-x64" $BUILD_DIR

# keep only Chinese and English Chromium locales (other languages fall back to en-US)
APP_RESOURCES="$BUILD_DIR/Trilium Notes.app/Contents/Resources"
FRAMEWORK_RESOURCES="$BUILD_DIR/Trilium Notes.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Resources"
for resources_dir in "$APP_RESOURCES" "$FRAMEWORK_RESOURCES"; do
    if [[ -d "$resources_dir" ]]; then
        find "$resources_dir" -mindepth 1 -maxdepth 1 -type d -name '*.lproj' \
            ! -name 'en*.lproj' ! -name 'zh*.lproj' -exec rm -rf {} +
    fi
done

cp bin/tpl/anonymize-database.sql $BUILD_DIR/

cp -r dump-db $BUILD_DIR/
rm -rf $BUILD_DIR/dump-db/node_modules

echo "Zipping mac x64 electron distribution..."

VERSION=`jq -r ".version" package.json`

cd dist

rm -f trilium-mac-x64-${VERSION}.zip
zip -r9 --symlinks trilium-mac-x64-${VERSION}.zip trilium-mac-x64
