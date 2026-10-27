#!/usr/bin/env bash
set -euo pipefail

NODE_VERSION="${NODE_VERSION:-24.22.1}"

if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
    nvm use "$NODE_VERSION" > /dev/null
fi

if [ "$(node -p 'process.versions.node' 2>/dev/null)" != "$NODE_VERSION" ]; then
    echo "Node.js v$NODE_VERSION is required, but $(node -v 2>/dev/null || echo 'node is not installed') is active." >&2
    echo "Please run 'nvm use $NODE_VERSION' or adjust PATH." >&2
    exit 1
fi

echo "Node version: $(node -v)"

require_file() {
    if [[ ! -s "$1" ]]; then
        echo "ERROR: Missing required build artifact: $1" >&2
        echo "The packaged application would be incomplete. Run 'npm install' and 'npm run webpack', then try again." >&2
        exit 1
    fi
}

if [[ $# -eq 0 ]] ; then
    echo "Missing argument of target directory"
    exit 1
fi
if ! [[ $(which npm) ]]; then
    echo "Missing npm"
    exit 1
fi

npm run webpack

require_file "src/public/app-dist/desktop.js"
require_file "src/public/app-dist/excalidraw.js"
require_file "node_modules/@excalidraw/excalidraw/dist/prod/index.css"

DIR="$1"

rm -rf "$DIR"
mkdir -pv "$DIR"

echo "Copying Trilium to build directory $DIR"

for d in 'images' 'libraries' 'src' 'db'; do
    cp -r "$d" "$DIR"/
done
for f in 'package.json' 'package-lock.json' 'README.md' 'LICENSE' 'config-sample.ini' 'electron.js'; do
    cp "$f" "$DIR"/
done
for f in webpack-*; do
    if [ -e "$f" ]; then
        cp "$f" "$DIR"/
    fi
done

# run in subshell (so we return to original dir)
(cd "$DIR" && npm install --omit=dev --no-audit --no-fund)

node -e '
const fs = require("fs");
const packagePath = process.argv[1];
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
delete pkg.devDependencies;
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");
' "$DIR/package.json"

if [[ -d "$DIR"/node_modules ]]; then
# cleanup of useless files in dependencies
    for d in 'image-q/demo' 'better-sqlite3/Release' 'better-sqlite3/deps/sqlite3.tar.gz' '@jimp/plugin-print/fonts' 'jimp/browser' 'jimp/fonts' \
        '@electron-internal' 'electron' 'es-toolkit'; do
        if [[ -e "$DIR"/node_modules/"$d" ]]; then
            rm -rf "$DIR"/node_modules/"$d"
        fi
    done

# keep only the boxicons files served at runtime
    if [[ -d "$DIR"/node_modules/boxicons ]]; then
        find "$DIR"/node_modules/boxicons -mindepth 1 -maxdepth 1 \
            ! -name css ! -name fonts ! -name package.json ! -name LICENSE \
            -exec rm -rf {} +
    fi

# keep only the force-graph bundle served at runtime
    if [[ -d "$DIR"/node_modules/force-graph ]]; then
        find "$DIR"/node_modules/force-graph -mindepth 1 -maxdepth 1 \
            ! -name dist ! -name package.json ! -name LICENSE \
            -exec rm -rf {} +
    fi

# delete all tests (there are often large images as test file for jimp etc.)
    find "$DIR"/node_modules -type d \( -name test -o -name docs -o -name demo \) -prune -exec rm -rf {} +

# remove type declarations and Markdown documentation not used at runtime
    find "$DIR"/node_modules -type f \
        \( -name '*.d.ts' -o -iname 'readme*.md' -o -iname 'changelog*.md' -o -iname 'history*.md' \) \
        -delete

    rm -rf "$DIR"/node_modules/@excalidraw/excalidraw/dist/dev \
        "$DIR"/node_modules/@excalidraw/excalidraw/dist/types \
        "$DIR"/node_modules/@excalidraw/mermaid-to-excalidraw/node_modules

    if [ -d "$DIR"/node_modules/mermaid/dist ]; then
        find "$DIR"/node_modules/mermaid/dist -mindepth 1 -maxdepth 1 ! -name 'mermaid.min.js' -exec rm -rf {} +
    fi

    find "$DIR"/node_modules -type f -name '*.map' -delete
fi

require_file "$DIR/src/public/app-dist/excalidraw.js"
require_file "$DIR/node_modules/@excalidraw/excalidraw/dist/prod/index.css"
require_file "$DIR/node_modules/@excalidraw/excalidraw/dist/prod/fonts/Assistant/Assistant-Regular.woff2"

find "$DIR"/libraries -name "*.map" -type f -delete

d="$DIR"/src/public
[[ -d "$d"/app-dist ]] || mkdir -pv "$d"/app-dist
cp "$d"/app/share.js "$d"/app-dist/
cp -r "$d"/app/doc_notes "$d"/app-dist/
find "$d"/app-dist -type f -name '*.map' -delete

rm -rf "$d"/app
unset f d DIR
