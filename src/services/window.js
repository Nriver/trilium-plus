const path = require('path');
const url = require("url");
const port = require('./port.js');
const optionService = require('./options.js');
const env = require('./env.js');
const log = require('./log.js');
const sqlInit = require('./sql_init.js');
const cls = require('./cls.js');
const keyboardActionsService = require('./keyboard_actions.js');
const desktopProtocol = require('./desktop_protocol.js');
const {ipcMain} = require('electron');

// Prevent the window being garbage collected
/** @type {Electron.BrowserWindow} */
let mainWindow;
/** @type {Electron.BrowserWindow} */
let setupWindow;

// Set to true once the app is genuinely quitting (via `before-quit`). The
// close-to-tray interceptor checks this so a real quit isn't turned into a hide.
let isQuitting = false;

function markQuitting() {
    isQuitting = true;
}

async function createExtraWindow(extraWindowHash) {
    const spellcheckEnabled = optionService.getOptionBool('spellCheckEnabled');

    const {BrowserWindow} = require('electron');

    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        title: 'Trilium Notes',
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
            spellcheck: spellcheckEnabled
        },
        frame: optionService.getOptionBool('nativeTitleBarVisible'),
        icon: getIcon()
    });

    win.setMenuBarVisibility(false);
    win.loadURL(`http://127.0.0.1:${port}/?extraWindow=1${extraWindowHash}`);

    configureWebContents(win.webContents, spellcheckEnabled);
}

ipcMain.on('create-extra-window', (event, arg) => {
    createExtraWindow(arg.extraWindowHash);
});

async function createMainWindow(app) {
    const windowStateKeeper = require('electron-window-state'); // should not be statically imported

    const mainWindowState = windowStateKeeper({
        // default window width & height, so it's usable on a 1600 * 900 display (including some extra panels etc.)
        defaultWidth: 1200,
        defaultHeight: 800
    });

    const spellcheckEnabled = optionService.getOptionBool('spellCheckEnabled');

    const {BrowserWindow} = require('electron'); // should not be statically imported

    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        title: 'Trilium Notes',
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
            spellcheck: spellcheckEnabled,
            webviewTag: true
        },
        frame: optionService.getOptionBool('nativeTitleBarVisible'),
        icon: getIcon()
    });

    mainWindowState.manage(mainWindow);

    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadURL(`http://127.0.0.1:${port}`);

    // Close-to-tray: when enabled, closing the main window hides it to the tray
    // instead of quitting. Only intercepts a genuine window close (not an app
    // quit, which sets `isQuitting` first). Extra windows are unaffected.
    mainWindow.on('close', (event) => {
        if (!isQuitting
            && !optionService.getOptionBool('disableTray')
            && optionService.getOptionBool('closeToTray')) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });

    mainWindow.on('closed', () => mainWindow = null);

    configureWebContents(mainWindow.webContents, spellcheckEnabled);

    app.on('second-instance', () => {
        // Someone tried to run a second instance, we should focus our window.
        // see www.js "requestSingleInstanceLock" for the rest of this logic with explanation
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }

            mainWindow.show();
            mainWindow.focus();
        }
    });
}

function configureWebContents(webContents, spellcheckEnabled) {
    require("@electron/remote/main").enable(webContents);

    mainWindow.webContents.setWindowOpenHandler((details) => {
        require("electron").shell.openExternal(details.url);
        return { action: 'deny' }
    });

    // prevent drag & drop to navigate away from trilium
    webContents.on('will-navigate', (ev, targetUrl) => {
        if (desktopProtocol.isDeepLink(targetUrl)) {
            ev.preventDefault();

            const hash = desktopProtocol.parseDeepLink(targetUrl);

            if (hash) {
                openDeepLink(hash);
            }

            return;
        }

        const parsedUrl = url.parse(targetUrl);

        // we still need to allow internal redirects from setup and migration pages
        if (!['localhost', '127.0.0.1'].includes(parsedUrl.hostname) || (parsedUrl.path && parsedUrl.path !== '/' && parsedUrl.path !== '/?')) {

            ev.preventDefault();
        }
    });

    if (spellcheckEnabled) {
        const languageCodes = (optionService.getOption('spellCheckLanguageCode'))
            .split(',')
            .map(code => code.trim());

        webContents.session.setSpellCheckerLanguages(languageCodes);
    }
}

function getIcon() {
    return path.join(__dirname, '../../images/app-icons/png/256x256' + (env.isDev() ? '-dev' : '') + '.png');
}

function openDeepLink(hash) {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return false;
    }

    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }

    mainWindow.show();
    mainWindow.focus();

    const send = () => {
        if (!mainWindow.isDestroyed()) {
            mainWindow.webContents.send('open-deep-link', { hash });
        }
    };

    if (mainWindow.webContents.isLoading()) {
        mainWindow.webContents.once('did-finish-load', send);
    }
    else {
        send();
    }

    return true;
}

async function createSetupWindow() {
    const {BrowserWindow} = require('electron'); // should not be statically imported
    setupWindow = new BrowserWindow({
        width: 800,
        height: 800,
        title: 'Trilium Notes Setup',
        icon: getIcon(),
        webPreferences: {
            // necessary for e.g. utils.isElectron()
            nodeIntegration: true
        }
    });

    setupWindow.setMenuBarVisibility(false);
    setupWindow.loadURL(`http://127.0.0.1:${port}`);
    setupWindow.on('closed', () => setupWindow = null);
}

function closeSetupWindow() {
    if (setupWindow) {
        setupWindow.close();
    }
}

async function registerGlobalShortcuts() {
    const {globalShortcut} = require('electron');

    await sqlInit.dbReady;

    const allActions = keyboardActionsService.getKeyboardActions();

    for (const action of allActions) {
        if (!action.effectiveShortcuts) {
            continue;
        }

        for (const shortcut of action.effectiveShortcuts) {
            if (shortcut.startsWith('global:')) {
                const translatedShortcut = shortcut.substr(7);

                const result = globalShortcut.register(translatedShortcut, cls.wrap(() => {
                    // window may be hidden / not in focus
                    mainWindow.focus();

                    mainWindow.webContents.send('globalShortcut', action.actionName);
                }));

                if (result) {
                    log.info(`Registered global shortcut ${translatedShortcut} for action ${action.actionName}`);
                }
                else {
                    log.info(`Could not register global shortcut ${translatedShortcut}`);
                }
            }
        }
    }
}

function getMainWindow() {
    return mainWindow;
}


module.exports = {
    createMainWindow,
    createSetupWindow,
    closeSetupWindow,
    registerGlobalShortcuts,
    getMainWindow,
    openDeepLink,
    markQuitting
};
