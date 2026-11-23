import BasicWidget from "./basic_widget.js";
import ws from "../services/ws.js";
import options from "../services/options.js";
import syncService from "../services/sync.js";
import utils from "../services/utils.js";

const TPL = `
<div class="sync-status-widget launcher-button">
    <style>
    .sync-status-widget {
    }
    
    .sync-status {
        box-sizing: border-box;
    }
    
    .sync-status .sync-status-icon {
        display: inline-block;
        position: relative;
        top: -5px;
        font-size: 110%;
    }
    
    .sync-status .sync-status-sub-icon {
        font-size: 40%; 
        position: absolute; 
        left: 0;
        top: 16px;
    }
    
    .sync-status .sync-status-icon span {
        border: none !important;
    }
    
    .sync-status-icon:not(.sync-status-in-progress):hover {
        background-color: var(--hover-item-background-color);
        cursor: pointer;
    }
    </style>

    <div class="sync-status">
        <span class="sync-status-icon sync-status-unknown bx bx-time" 
              data-toggle="tooltip" 
              data-placement="right"
              title="<p>Sync status will be known once the next sync attempt starts.</p><p>Click to trigger sync now.</p>">
        </span>
        <span class="sync-status-icon sync-status-connected-with-changes bx bx-wifi"
              data-toggle="tooltip" 
              data-placement="right"
              title="<p>Connected to the sync server. <br>There are some outstanding changes yet to be synced.</p><p>Click to trigger sync.</p>">
            <span class="bx bxs-star sync-status-sub-icon"></span>
        </span>
        <span class="sync-status-icon sync-status-connected-no-changes bx bx-wifi" 
              data-toggle="tooltip" 
              data-placement="right"
              title="<p>Connected to the sync server.<br>All changes have been already synced.</p><p>Click to trigger sync.</p>">
        </span>
        <span class="sync-status-icon sync-status-disconnected-with-changes bx bx-wifi-off"
              data-toggle="tooltip" 
              data-placement="right"
              title="<p>Establishing the connection to the sync server was unsuccessful.<br>There are some outstanding changes yet to be synced.</p><p>Click to trigger sync.</p>">
            <span class="bx bxs-star sync-status-sub-icon"></span>
        </span>
        <span class="sync-status-icon sync-status-disconnected-no-changes bx bx-wifi-off" 
              data-toggle="tooltip"
              data-placement="right"
              title="<p>Establishing the connection to the sync server was unsuccessful.<br>All known changes have been synced.</p><p>Click to trigger sync.</p>">
        </span>
        <span class="sync-status-icon sync-status-in-progress bx bx-analyse bx-spin" 
              data-toggle="tooltip"
              data-placement="right"
              title="Sync with the server is in progress.">
        </span>
    </div>
</div>
`;

export default class SyncStatusWidget extends BasicWidget {
    constructor() {
        super();

        this.syncState = 'unknown';
        this.allChangesPushed = false;
        this.currentIconClass = null;
        this.isMobile = utils.isMobile();
        this.suppressTooltip = false;
        this.tooltipHideTimeout = null;
    }

    doRender() {
        this.$widget = $(TPL);
        this.$widget.hide();

        const $tooltipIcons = this.$widget.find('[data-toggle="tooltip"]');

        if (this.isMobile) {
            // Tooltips are intentionally disabled on mobile.
            $tooltipIcons
                .removeAttr('data-toggle')
                .removeAttr('data-placement')
                .removeAttr('title');
        } else {
            $tooltipIcons.tooltip({
                html: true,
                trigger: 'manual'
            });

            $tooltipIcons
                .on('mouseenter', e => {
                    if (!this.suppressTooltip) {
                        $(e.currentTarget).tooltip('show');
                        this.scheduleTooltipHide();
                    }
                })
                .on('mouseleave', () => this.hideTooltips());

            this.$widget.on('mouseleave', () => {
                this.suppressTooltip = false;
                this.hideTooltips();
            });
        }

        this.$widget.find('.sync-status-icon:not(.sync-status-in-progress)')
            .on('click', () => {
                // A click triggers sync and immediately changes the icon.
                // Hide the tooltip and don't show it again until the pointer
                // leaves the button, otherwise it stays stuck on screen.
                this.suppressTooltip = true;
                this.hideTooltips();

                syncService.syncNow();
            });

        ws.subscribeToMessages(message => this.processMessage(message));
    }

    scheduleTooltipHide() {
        clearTimeout(this.tooltipHideTimeout);

        this.tooltipHideTimeout = setTimeout(() => this.hideTooltips(), 3000);
    }

    hideTooltips() {
        clearTimeout(this.tooltipHideTimeout);
        this.tooltipHideTimeout = null;

        this.$widget.find('.sync-status-icon').each((i, icon) => {
            const tooltip = $(icon).data('bs.tooltip');

            if (tooltip?.tip) {
                tooltip.hide();
            }
        });
    }

    showIcon(className) {
        if (!options.get('syncServerHost')) {
            this.hideTooltips();
            this.currentIconClass = null;
            this.toggleInt(false);
            return;
        }

        this.$widget.show();

        if (this.currentIconClass === className) {
            return;
        }

        // The tooltip is anchored to the icon which is about to be hidden.
        // Bootstrap doesn't hide it automatically in that case.
        this.hideTooltips();
        this.currentIconClass = className;

        this.$widget.find('.sync-status-icon').hide();
        this.$widget.find(`.sync-status-${className}`).show();
    }

    processMessage(message) {
        if (message.type === 'sync-pull-in-progress') {
            this.syncState = 'in-progress';
            this.lastSyncedPush = message.lastSyncedPush;
        }
        else if (message.type === 'sync-push-in-progress') {
            this.syncState = 'in-progress';
            this.lastSyncedPush = message.lastSyncedPush;
        }
        else if (message.type === 'sync-finished') {
            this.syncState = 'connected';
            this.lastSyncedPush = message.lastSyncedPush;
        }
        else if (message.type === 'sync-failed') {
            this.syncState = 'disconnected';
            this.lastSyncedPush = message.lastSyncedPush;
        }
        else if (message.type === 'frontend-update') {
            this.lastSyncedPush = message.data.lastSyncedPush;
        }

        this.allChangesPushed = this.lastSyncedPush === ws.getMaxKnownEntityChangeSyncId();

        if (['unknown', 'in-progress'].includes(this.syncState)) {
            this.showIcon(this.syncState);
        } else {
            this.showIcon(`${this.syncState}-${this.allChangesPushed ? 'no-changes' : 'with-changes'}`);
        }
    }
}
