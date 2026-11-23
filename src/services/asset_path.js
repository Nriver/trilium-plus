const fs = require('fs');
const path = require('path');
const packageJson = require('../../package.json');

// app-dist is served with a one-year cache. Keep the URL stable within one
// build, but change it whenever the frontend bundle is rebuilt so clients
// don't keep running an old cached desktop.js/mobile.js.
function getAppDistCacheBuster() {
    try {
        const appDistDesktop = path.join(__dirname, '..', 'public', 'app-dist', 'desktop.js');
        const mtime = Math.floor(fs.statSync(appDistDesktop).mtimeMs);

        return `-${mtime.toString(36)}`;
    }
    catch (e) {
        // app-dist doesn't exist in a fresh dev checkout before webpack runs
        return '';
    }
}

module.exports = `assets/v${packageJson.version}${getAppDistCacheBuster()}`;
