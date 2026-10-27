#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
    echo "Usage: $0 <package-dir> <prebuild-target>..." >&2
    exit 1
fi

PKG_DIR="$1"
shift

SQLITE_DIR="$PKG_DIR/node_modules/better-sqlite3"

if [[ ! -d "$SQLITE_DIR" ]]; then
    echo "better-sqlite3 not found in $PKG_DIR" >&2
    exit 1
fi

for target in "$@"; do
    if [[ ! -f "$SQLITE_DIR/prebuilds/$target.node" ]]; then
        echo "Missing better-sqlite3 prebuild: $target" >&2
        exit 1
    fi
done

find_args=()
for target in "$@"; do
    find_args+=(! -name "$target.node")
done

find "$SQLITE_DIR/prebuilds" -mindepth 1 -maxdepth 1 -type f -name '*.node' "${find_args[@]}" -delete

rm -rf "$SQLITE_DIR/build" "$SQLITE_DIR/deps" "$SQLITE_DIR/src" \
    "$SQLITE_DIR/binding.gyp"
