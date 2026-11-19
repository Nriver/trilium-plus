import OptionsWidget from "../options_widget.js";

const TPL = `
<div class="options-section">
    <style>
        .options-section .close-to-tray-wrapper.disabled-field {
            opacity: 0.5;
            pointer-events: none;
        }
    </style>

    <h4>Tray</h4>

    <label>
        <input type="checkbox" class="tray-enabled">
        Enable tray (Trilium needs to be restarted for this change to take effect)
    </label>

    <div class="close-to-tray-wrapper">
        <label>
            <input type="checkbox" class="close-to-tray-enabled">
            Close to tray (keep Trilium running in the system tray when the window is closed)
        </label>
    </div>
</div>`;

export default class TrayOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);
        this.$trayEnabled = this.$widget.find(".tray-enabled");
        this.$closeToTrayEnabled = this.$widget.find(".close-to-tray-enabled");
        this.$closeToTrayWrapper = this.$widget.find(".close-to-tray-wrapper");

        this.$trayEnabled.on('change', () => {
            this.updateOption('disableTray', !this.$trayEnabled.is(":checked") ? "true" : "false");
            this.setCloseToTrayEnabled();
        });

        this.$closeToTrayEnabled.on('change', () =>
            this.updateOption('closeToTray', this.$closeToTrayEnabled.is(":checked") ? "true" : "false"));
    }

    async optionsLoaded(options) {
        this.$trayEnabled.prop("checked", options.disableTray !== 'true');
        this.$closeToTrayEnabled.prop("checked", options.closeToTray === 'true');

        this.setCloseToTrayEnabled();
    }

    setCloseToTrayEnabled() {
        const trayEnabled = this.$trayEnabled.is(":checked");

        this.$closeToTrayEnabled.prop("disabled", !trayEnabled);
        this.$closeToTrayWrapper.toggleClass("disabled-field", !trayEnabled);
    }
}
