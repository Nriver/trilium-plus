"use strict";

const marked = require("marked");
const htmlSanitizer = require('../html_sanitizer.js');
const importUtils = require('./utils.js');

function createMarkdownRenderer() {
    const renderer = new marked.Renderer();
    const defaultCodeRenderer = renderer.code;

    renderer.code = token => {
        const html = defaultCodeRenderer.call(renderer, token);

        // Marked always terminates code block content with a newline. CKEditor's code block
        // import splits the text on newlines, so that terminator would show up as an extra
        // empty line at the end. Keep it only when the code itself ends with a newline.
        return token.text.endsWith("\n")
            ? html
            : html.replace(/\n<\/code><\/pre>/, "</code></pre>");
    };

    return renderer;
}

function renderToHtml(content, title) {
    const html = marked.parse(content, {
        mangle: false,
        headerIds: false,
        renderer: createMarkdownRenderer()
    });
    const h1Handled = importUtils.handleH1(html, title); // h1 handling needs to come before sanitization
    return htmlSanitizer.sanitize(h1Handled);
}

module.exports = {
    renderToHtml
};
