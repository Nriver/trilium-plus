#!/usr/bin/env bash
# Shared cache helpers for build-time downloads.
#
# Caches live in dist_cache/ instead of dist/ so they survive `rm -rf dist/*`
# in build.sh and can be reused by every build. Override the root location with
# TRILIUM_DIST_CACHE_DIR, or the individual caches with TRILIUM_NODE_CACHE_DIR
# and TRILIUM_ELECTRON_CACHE_DIR.

dist_cache_dir() {
    local script_dir repo_root

    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    repo_root="$(cd "$script_dir/../.." && pwd)"

    printf '%s\n' "${TRILIUM_DIST_CACHE_DIR:-$repo_root/dist_cache}"
}

node_cache_dir() {
    printf '%s\n' "${TRILIUM_NODE_CACHE_DIR:-$(dist_cache_dir)/node}"
}

electron_cache_dir() {
    printf '%s\n' "${TRILIUM_ELECTRON_CACHE_DIR:-$(dist_cache_dir)/electron}"
}

download_file() {
    local url="$1"
    local dest="$2"
    local -a cmd

    if command -v curl >/dev/null 2>&1; then
        cmd=(curl -fL --retry 3 --retry-delay 2 -o "$dest" "$url")
    elif command -v wget >/dev/null 2>&1; then
        cmd=(wget -O "$dest" "$url")
    else
        echo "ERROR: curl or wget is required to download Node.js." >&2
        return 1
    fi

    if command -v proxychains >/dev/null 2>&1; then
        proxychains "${cmd[@]}" || "${cmd[@]}"
    else
        "${cmd[@]}"
    fi
}

# fetch_node <version> <platform> <destination>
#
# Copies a cached Node.js distribution to <destination>, downloading and
# extracting it into the cache on first use. Supported platforms are the ones
# whose distributions ship as .tar.xz (e.g. linux-x64, linux-arm64).
fetch_node() {
    local version="$1"
    local platform="$2"
    local dest="$3"
    local cache_dir cache_name cache_path tarball url tmp_dir

    cache_dir="$(node_cache_dir)"
    cache_name="node-v${version}-${platform}"
    cache_path="$cache_dir/$cache_name"
    tarball="$cache_dir/${cache_name}.tar.xz"
    url="https://nodejs.org/dist/v${version}/${cache_name}.tar.xz"

    mkdir -p "$cache_dir"

    if [[ ! -x "$cache_path/bin/node" ]]; then
        if [[ ! -s "$tarball" ]]; then
            echo "Downloading Node.js v${version} (${platform})..."
            rm -f "$tarball.part"
            download_file "$url" "$tarball.part"
            mv "$tarball.part" "$tarball"
        else
            echo "Using cached Node.js v${version} archive (${platform})"
        fi

        echo "Extracting Node.js v${version} (${platform}) into cache..."
        rm -rf "$cache_path"
        tmp_dir="$(mktemp -d "$cache_dir/${cache_name}.tmp.XXXXXX")"

        if ! tar xfJ "$tarball" -C "$tmp_dir"; then
            rm -rf "$tmp_dir"
            return 1
        fi

        mv "$tmp_dir/$cache_name" "$cache_path"
        rm -rf "$tmp_dir"
        rm -f "$tarball"
    else
        echo "Using cached Node.js v${version} (${platform})"
    fi

    rm -rf "$dest"
    mkdir -p "$(dirname "$dest")"
    cp -a "$cache_path" "$dest"
}
