'use strict';

const {app, globalShortcut, BrowserWindow} = require('electron');
const sqlInit = require('./src/services/sql_init.js');
const appIconService = require('./src/services/app_icon.js');
const windowService = require('./src/services/window.js');
const tray = require('./src/services/tray.js');
const optionService = require('./src/services/options.js');
const desktopProtocol = require('./src/services/desktop_protocol.js');

// Adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

const pendingDeepLinks = [];
let deepLinkHandlerReady = false;

function openDeepLink(hash) {
    if (!windowService.openDeepLink(hash)) {
        pendingDeepLinks.push(hash);
    }
}

function queueDeepLink(url) {
    const hash = desktopProtocol.parseDeepLink(url);

    if (!hash) {
        return;
    }

    if (deepLinkHandlerReady) {
        openDeepLink(hash);
    }
    else {
        pendingDeepLinks.push(hash);
    }
}

function flushPendingDeepLinks() {
    deepLinkHandlerReady = true;

    while (pendingDeepLinks.length > 0) {
        const hash = pendingDeepLinks.shift();

        if (!windowService.openDeepLink(hash)) {
            pendingDeepLinks.unshift(hash);
            break;
        }
    }
}

// macOS delivers URL scheme activations through this event, including at startup.
app.on('open-url', (event, url) => {
    event.preventDefault();
    queueDeepLink(url);
});

// Windows/Linux deliver the URL as a command line argument to the new process.
app.on('second-instance', (event, commandLine) => {
    const deepLink = desktopProtocol.findDeepLink(commandLine);

    if (deepLink) {
        queueDeepLink(deepLink);
    }
});

const initialDeepLink = desktopProtocol.findDeepLink(process.argv);

if (initialDeepLink) {
    queueDeepLink(initialDeepLink);
}

require('electron-dl')({ saveAs: true });

// needed for excalidraw export https://github.com/zadam/trilium/issues/4271
app.commandLine.appendSwitch("enable-experimental-web-platform-features");

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('ready', async () => {
//    app.setAppUserModelId('com.github.zadam.trilium');

    // Install the desktop entry first: it is what declares (and is indexed as)
    // the trilium:// handler, so it has to exist before registration below.
    await appIconService.installLocalAppIcon();

    desktopProtocol.register(app);

    // if db is not initialized -> setup process
    // if db is initialized, then we need to wait until the migration process is finished
    if (sqlInit.isDbInitialized()) {
        await sqlInit.dbReady;

        // Start minimized to the tray only when the tray is actually available,
        // otherwise the app would have no way to show its window.
        const startHidden = !optionService.getOptionBool('disableTray')
            && optionService.getOptionBool('startToTray');

        await windowService.createMainWindow(app, startHidden);

        flushPendingDeepLinks();

        if (process.platform === 'darwin') {
            app.on('activate', async () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    await windowService.createMainWindow(app);
                }
                else {
                    // Close-to-tray may have hidden the window rather than destroying
                    // it, so a dock-icon click must reveal the existing window.
                    const mainWindow = windowService.getMainWindow();

                    if (mainWindow) {
                        if (mainWindow.isMinimized()) {
                            mainWindow.restore();
                        }

                        mainWindow.show();
                        mainWindow.focus();
                    }
                }
            });
        }

        tray.createTray(startHidden);
    }
    else {
        await windowService.createSetupWindow();
    }

    await windowService.registerGlobalShortcuts();
});

app.on('before-quit', () => {
    // Mark a genuine quit so the close-to-tray interceptor lets the window close
    // for real. Fires for every quit path (Cmd+Q, tray "Quit", app menu, OS shutdown).
    windowService.markQuitting();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// this is to disable electron warning spam in the dev console (local development only)
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

require('./src/www.js');
