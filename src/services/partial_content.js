"use strict";

const { Readable } = require('stream');

/**
 * Serves content (typically audio/video) with support for HTTP Range requests,
 * which is required by browsers for streaming and seeking.
 *
 * @param {function} contentProvider - returns {content, totalSize, mimeType, fileName}
 * @returns {function} Express request handler
 */
function createPartialContentHandler(contentProvider) {
    return function handler(req, res) {
        const { content, totalSize, mimeType } = contentProvider(req);

        res.setHeader('Content-Type', mimeType || 'application/octet-stream');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        if (!totalSize) {
            res.setHeader('Content-Length', 0);
            res.status(200).end();

            return;
        }

        const ranges = req.headers.range ? req.range(totalSize) : undefined;

        if (ranges === undefined) {
            res.setHeader('Content-Length', totalSize);

            return sendBuffer(req, res, content);
        }

        if (ranges === -1 || ranges === -2) {
            res.setHeader('Content-Range', `bytes */${totalSize}`);

            return res.status(416).end();
        }

        if (ranges.length === 1) {
            return sendSingleRange(req, res, content, totalSize, mimeType, ranges[0]);
        }

        return sendMultipleRanges(req, res, content, totalSize, mimeType, ranges);
    };
}

function sendBuffer(req, res, content) {
    if (req.method === 'HEAD') {
        return res.end();
    }

    Readable.from([content]).pipe(res);
}

function sendSingleRange(req, res, content, totalSize, mimeType, range) {
    const { start, end } = range;

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
    res.setHeader('Content-Length', end - start + 1);

    if (req.method === 'HEAD') {
        return res.end();
    }

    Readable.from([content.subarray(start, end + 1)]).pipe(res);
}

function sendMultipleRanges(req, res, content, totalSize, mimeType, ranges) {
    const boundary = `TRILIUM_BOUNDARY_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;

    res.status(206);
    res.setHeader('Content-Type', `multipart/byteranges; boundary=${boundary}`);

    if (req.method === 'HEAD') {
        return res.end();
    }

    const chunks = [];

    for (const { start, end } of ranges) {
        chunks.push(
            Buffer.from(
                `--${boundary}\r\n`
                + `Content-Type: ${mimeType || 'application/octet-stream'}\r\n`
                + `Content-Range: bytes ${start}-${end}/${totalSize}\r\n\r\n`,
                'utf8'
            ),
            content.subarray(start, end + 1),
            Buffer.from('\r\n', 'utf8')
        );
    }

    chunks.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));

    Readable.from(chunks).pipe(res);
}

module.exports = {
    createPartialContentHandler
};
