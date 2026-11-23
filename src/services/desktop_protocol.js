'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const {spawnSync} = require('child_process');
const log = require('./log.js');

const PROTOCOL = 'trilium';
const PROTOCOL_PREFIX = `${PROTOCOL}://`;
const NOTE_ID_REGEX = /^[_a-z0-9]{4,}$/i;
// Name of the desktop entry installed by app_icon.js. It is also the entry
// Electron's Linux protocol registration resolves through CHROME_DESKTOP.
const DESKTOP_FILE_NAME = 'trilium-notes.desktop';

function isDeepLink(value) {
    return typeof value === 'string' && value.toLowerCase().startsWith(PROTOCOL_PREFIX);
}

function findDeepLink(args) {
    if (!Array.isArray(args)) {
        return null;
    }

    return args.find(isDeepLink) || null;
}

function decode(value) {
    try {
        return decodeURIComponent(value);
    }
    catch (e) {
        return value;
    }
}

function buildHash(notePath) {
    let value = notePath.trim();

    if (value.startsWith('#')) {
        value = value.substr(1);
    }

    const queryIndex = value.indexOf('?');
    const pathPart = queryIndex === -1 ? value : value.substr(0, queryIndex);
    const query = queryIndex === -1 ? '' : value.substr(queryIndex + 1);

    const segments = pathPart
        .split('/')
        .map(segment => segment.trim())
        .filter(Boolean);

    if (segments.length === 0 || !segments.every(segment => NOTE_ID_REGEX.test(segment))) {
        return null;
    }

    if (segments[0] !== 'root') {
        segments.unshift('root');
    }

    return `#${segments.join('/')}${query ? `?${query}` : ''}`;
}

function parseWrappedUrl(url) {
    if (isDeepLink(url)) {
        return parseDeepLink(url);
    }

    const hashIndex = url.indexOf('#');

    if (hashIndex === -1) {
        return null;
    }

    return buildHash(url.substr(hashIndex + 1));
}

/**
 * Converts a trilium:// URL into the hash format understood by the frontend,
 * e.g. trilium://note/F0XgkCKd8Jps -> #root/F0XgkCKd8Jps
 *
 * @param {string} deepLink
 * @returns {string|null}
 */
function parseDeepLink(deepLink) {
    if (!isDeepLink(deepLink)) {
        return null;
    }

    let rest = deepLink.substr(PROTOCOL_PREFIX.length);
    // tolerate trilium:///F0XgkCKd8Jps
    rest = rest.replace(/^\/+/, '');

    if (!rest) {
        return null;
    }

    const lowerCaseRest = rest.toLowerCase();

    if (lowerCaseRest === 'open' || lowerCaseRest.startsWith('open?') || lowerCaseRest.startsWith('open/')) {
        const queryIndex = rest.indexOf('?');

        if (queryIndex === -1) {
            return null;
        }

        const params = new URLSearchParams(rest.substr(queryIndex + 1));
        const wrappedUrl = params.get('url');

        return wrappedUrl ? parseWrappedUrl(wrappedUrl) : null;
    }

    if (lowerCaseRest.startsWith('note/')) {
        rest = rest.substr('note/'.length);
    }
    else if (lowerCaseRest.startsWith('note?')) {
        rest = rest.substr('note'.length);
    }

    return buildHash(rest);
}

function register(app) {
    try {
        if (process.platform === 'linux') {
            return registerOnLinux(app);
        }

        if (process.defaultApp) {
            const appPath = process.argv
                .slice(1)
                .find(arg => !arg.startsWith('-') && !isDeepLink(arg));

            if (appPath) {
                return app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(appPath)]);
            }
        }

        return app.setAsDefaultProtocolClient(PROTOCOL);
    }
    catch (e) {
        log.error(`Could not register ${PROTOCOL}:// protocol handler: ${e.message}`);

        return false;
    }
}

/**
 * On Linux Electron resolves the desktop entry named by CHROME_DESKTOP and
 * silently gives up when the variable is missing. Desktop launchers usually set
 * it (e.g. the Chrome wrapper script does), but our tar.xz build is often
 * started directly, so point it at the entry installed by app_icon.js, or at
 * the one a distribution package already provides.
 */
function registerOnLinux(app) {
    const localDesktopFile = path.join(os.homedir(), '.local/share/applications', DESKTOP_FILE_NAME);
    const desktopFileId = fs.existsSync(localDesktopFile)
        ? DESKTOP_FILE_NAME
        : getSystemDesktopFile()?.id;

    if (!desktopFileId) {
        return app.setAsDefaultProtocolClient(PROTOCOL);
    }

    process.env.CHROME_DESKTOP = desktopFileId;

    if (app.setAsDefaultProtocolClient(PROTOCOL)) {
        return true;
    }

    // Fallback for setups where Electron's GIO based registration is unavailable.
    return registerWithXdgMime(desktopFileId);
}

function registerWithXdgMime(desktopFileId) {
    try {
        const result = spawnSync('xdg-mime', ['default', desktopFileId, `x-scheme-handler/${PROTOCOL}`],
            {timeout: 10_000, encoding: 'utf8'});

        if (result.error) {
            log.error(`Could not register ${PROTOCOL}:// protocol handler with xdg-mime: ${result.error.message}`);

            return false;
        }

        if (result.status !== 0) {
            log.error(`Could not register ${PROTOCOL}:// protocol handler with xdg-mime: ${(result.stderr || '').trim()}`);

            return false;
        }

        return true;
    }
    catch (e) {
        log.error(`Could not register ${PROTOCOL}:// protocol handler with xdg-mime: ${e.message}`);

        return false;
    }
}

let systemDesktopFileCache;

/**
 * Looks for a desktop entry installed by something else (distribution package,
 * Flatpak, ...) that already handles {@link PROTOCOL}:// URLs. Entries in the
 * user's own data directory are ignored because app_icon.js writes the only
 * entry we would find there.
 *
 * @returns {{id: string, file: string}|null}
 */
function getSystemDesktopFile() {
    if (systemDesktopFileCache === undefined) {
        systemDesktopFileCache = findSystemDesktopFile();
    }

    return systemDesktopFileCache;
}

function findSystemDesktopFile() {
    const userDataDir = path.resolve(process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local/share'));
    const dataDirs = (process.env.XDG_DATA_DIRS || '/usr/local/share:/usr/share')
        .split(':')
        .map(dir => dir.trim())
        .filter(Boolean)
        .filter(dir => path.resolve(dir) !== userDataDir);

    for (const dataDir of dataDirs) {
        const found = findDesktopFile(path.join(dataDir, 'applications'), '', 2);

        if (found) {
            return found;
        }
    }

    return null;
}

function findDesktopFile(dir, idPrefix, maxDepth) {
    let entries;

    try {
        entries = fs.readdirSync(dir, {withFileTypes: true});
    }
    catch (e) {
        return null;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.desktop')) {
            const file = path.join(dir, entry.name);

            if (declaresProtocol(file)) {
                return {id: idPrefix + entry.name, file};
            }
        }
    }

    if (maxDepth <= 0) {
        return null;
    }

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const found = findDesktopFile(path.join(dir, entry.name), `${idPrefix}${entry.name}-`, maxDepth - 1);

            if (found) {
                return found;
            }
        }
    }

    return null;
}

function declaresProtocol(file) {
    try {
        const content = fs.readFileSync(file, 'utf8');

        return /^MimeType=.*\bx-scheme-handler\/trilium\b/m.test(content);
    }
    catch (e) {
        return false;
    }
}

module.exports = {
    PROTOCOL,
    DESKTOP_FILE_NAME,
    isDeepLink,
    findDeepLink,
    parseDeepLink,
    getSystemDesktopFile,
    register
};
