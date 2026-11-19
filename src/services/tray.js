const { Menu, Tray, app } = require('electron');
const path = require('path');
const windowService = require('./window.js');
const optionService = require('./options.js');

const UPDATE_TRAY_EVENTS = [
    'minimize', 'maximize', 'show', 'hide'
]

let tray = null;
// `mainWindow.isVisible` doesn't work with `mainWindow.show` and `mainWindow.hide` - it returns `false` when the window
// is minimized
let isVisible = true;

// Inspired by https://github.com/signalapp/Signal-Desktop/blob/dcb5bb672635c4b29a51adec8a5658e3834ec8fc/app/tray_icon.ts#L20
const getIconSize = () => {
    switch (process.platform) {
        case 'darwin':
            return 16;
        case 'win32':
            return 32;
        default:
            return 256;
    }
}
const getIconPath = () => {
    const iconSize = getIconSize();

    return path.join(
        __dirname,
        "../..",
        "images",
        "app-icons",
        "png",
        `${iconSize}x${iconSize}.png`
    )
}
const registerVisibilityListener = (startHidden) => {
    const mainWindow = windowService.getMainWindow();

    // The window may have been created hidden ("start to tray"), so seed the
    // state from the actual window rather than assuming it is visible.
    isVisible = !startHidden || mainWindow.isVisible();

    // They need to be registered before the tray updater is registered
    mainWindow.on('show', () => {
        isVisible = true;
    });
    mainWindow.on('hide', () => {
        isVisible = false;
    });

    UPDATE_TRAY_EVENTS.forEach(eventName => {
        mainWindow.on(eventName, updateTrayMenu)
    });
}

const updateTrayMenu = () => {
    const mainWindow = windowService.getMainWindow();

    const contextMenu = Menu.buildFromTemplate([
        {
            label: isVisible ? 'Hide' : 'Show',
            type: 'normal',
            click: () => {
                if (isVisible) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Quit',
            type: 'normal',
            // Genuinely quit. `app.quit()` triggers `before-quit`, which clears the
            // close-to-tray interception so the window closes for real instead of
            // hiding back to the tray. Works on macOS too.
            click: () => {
                app.quit();
            }
        },
    ]);

    tray?.setContextMenu(contextMenu);
}
const changeVisibility = () => {
    const window = windowService.getMainWindow();

    if (isVisible) {
        window.hide();
    } else {
        window.show();
        window.focus();
    }
}

function createTray(startHidden = false) {
    if (optionService.getOptionBool("disableTray")) {
        return;
    }

    tray = new Tray(getIconPath());
    tray.setToolTip('Trilium Notes')
    // Restore focus
    tray.on('click', changeVisibility)
    registerVisibilityListener(startHidden);
    updateTrayMenu();
}

module.exports = {
    createTray
}
