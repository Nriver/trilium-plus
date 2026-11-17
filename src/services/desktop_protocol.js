'use strict';

const path = require('path');
const log = require('./log.js');

const PROTOCOL = 'trilium';
const PROTOCOL_PREFIX = `${PROTOCOL}://`;
const NOTE_ID_REGEX = /^[_a-z0-9]{4,}$/i;

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

module.exports = {
    PROTOCOL,
    isDeepLink,
    findDeepLink,
    parseDeepLink,
    register
};
