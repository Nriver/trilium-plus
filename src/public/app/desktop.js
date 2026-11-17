import appContext from "./components/app_context.js";
import utils from './services/utils.js';
import noteTooltipService from './services/note_tooltip.js';
import bundleService from "./services/bundle.js";
import noteAutocompleteService from './services/note_autocomplete.js';
import macInit from './services/mac_init.js';
import electronContextMenu from "./menus/electron_context_menu.js";
import DesktopLayout from "./layouts/desktop_layout.js";
import glob from "./services/glob.js";
import froca from "./services/froca.js";
import linkService from "./services/link.js";

async function waitForTabManager() {
    while (!appContext.tabManager || !appContext.tabManager.getActiveContext()) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    return appContext.tabManager;
}

async function openDeepLink(hash) {
    const {notePath, viewScope} = linkService.parseNavigationStateFromUrl(hash);

    if (!notePath) {
        return;
    }

    const tabManager = await waitForTabManager();

    await froca.initializedPromise;

    await tabManager.openTabWithNoteWithHoisting(notePath, {
        activate: true,
        viewScope
    });
}

bundleService.getWidgetBundlesByParent().then(widgetBundles => {
    appContext.setLayout(new DesktopLayout(widgetBundles));
    appContext.start();
});

glob.setupGlobs();

if (utils.isElectron()) {
    const {ipcRenderer} = utils.dynamicRequire('electron');
    ipcRenderer.on('globalShortcut',
        async (event, actionName) => appContext.triggerCommand(actionName));

    ipcRenderer.on('open-deep-link', (event, {hash}) => {
        openDeepLink(hash).catch(e => console.error(`Could not open deep link '${hash}': ${e.message} ${e.stack}`));
    });
}

macInit.init();

noteTooltipService.setupGlobalTooltip();

noteAutocompleteService.init();

if (utils.isElectron()) {
    electronContextMenu.setupContextMenu();
}
