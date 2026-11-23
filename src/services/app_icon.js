'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const {execFile} = require('child_process');
const {ELECTRON_APP_ROOT_DIR} = require('./resource_dir.js');
const log = require('./log.js');
const config = require('./config.js');
const utils = require('./utils.js');
const {PROTOCOL, DESKTOP_FILE_NAME, getSystemDesktopFile} = require('./desktop_protocol.js');

const template = `[Desktop Entry]
Type=Application
Name=Trilium Notes
Icon=#APP_ROOT_DIR#/icon.png
Exec=#EXE_PATH# %U
Categories=Office
Terminal=false
MimeType=x-scheme-handler/#PROTOCOL#;
StartupWMClass=trilium-notes
`;

/**
 * Installs .desktop icon into standard ~/.local/share/applications directory.
 * We overwrite this file during every run as it might have been updated.
 *
 * The entry also acts as the `trilium://` protocol handler, which is why it
 * declares the scheme in MimeType and why the desktop database is refreshed
 * afterwards. GIO only considers a desktop entry a usable handler when the
 * scheme is listed there and the entry is present in mimeinfo.cache, even if
 * it is already configured as the default application.
 *
 * When another installation (e.g. a distribution package) already ships such
 * an entry, ours is not created so the application is not listed twice.
 */
async function installLocalAppIcon() {
    if (!utils.isElectron()
        || ["win32", "darwin"].includes(os.platform())
        || (config.General && config.General.noDesktopIcon)) {
        return;
    }

    if (!fs.existsSync(path.resolve(ELECTRON_APP_ROOT_DIR, "trilium-portable.sh"))) {
        // simple heuristic to detect ".tar.xz" linux build (i.e., not flatpak, not debian)
        // only in such case it's necessary to create an icon
        return;
    }

    const desktopDir = path.resolve(os.homedir(), '.local/share/applications');

    try {
        const stats = await fs.promises.stat(desktopDir);

        if (!stats.isDirectory()) {
            return;
        }
    }
    catch (e) {
        // Directory doesn't exist, so we won't attempt to create the .desktop file
        return;
    }

    const desktopFilePath = path.resolve(desktopDir, DESKTOP_FILE_NAME);
    let changed = false;

    if (getSystemDesktopFile()) {
        // A distribution package (or Flatpak) already provides the desktop entry
        // and the trilium:// handler. Adding our own entry would make menus and
        // protocol choosers list the same application twice, so only drop the
        // one previous runs may have installed.
        changed = await removeOwnDesktopFile(desktopFilePath);
    }
    else {
        try {
            await fs.promises.writeFile(desktopFilePath, getDesktopFileContent());
            changed = true;
        }
        catch (e) {
            log.error("Desktop icon installation to ~/.local/share/applications failed.");

            return;
        }
    }

    if (changed) {
        await updateDesktopDatabase(desktopDir);
    }
}

async function removeOwnDesktopFile(desktopFilePath) {
    try {
        const content = await fs.promises.readFile(desktopFilePath, 'utf8');

        if (!content.includes(`Exec=${escapePath(getExePath())}`)) {
            // Not written by us, leave it alone.
            return false;
        }

        await fs.promises.unlink(desktopFilePath);

        return true;
    }
    catch (e) {
        return false;
    }
}

function updateDesktopDatabase(desktopDir) {
    return new Promise(resolve => {
        execFile("update-desktop-database", [desktopDir], {timeout: 10_000}, error => {
            if (error && error.code !== "ENOENT") {
                log.info(`Could not refresh desktop database in ${desktopDir}: ${error.message}`);
            }

            resolve();
        });
    });
}

function getDesktopFileContent() {
    return template
        .replace("#APP_ROOT_DIR#", escapePath(ELECTRON_APP_ROOT_DIR))
        .replace("#EXE_PATH#", escapePath(getExePath()))
        .replace("#PROTOCOL#", PROTOCOL);
}

function escapePath(path) {
    return path.replace(/ /g, "\\ ");
}

function getExePath() {
     return path.resolve(ELECTRON_APP_ROOT_DIR, 'trilium');
}

module.exports = {
    installLocalAppIcon
};
