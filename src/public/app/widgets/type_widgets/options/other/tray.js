import OptionsWidget from "../options_widget.js";

const TPL = `
<div class="options-section">
    <style>
        .options-section .tray-dependent-option.disabled-field {
            opacity: 0.5;
            pointer-events: none;
        }
    </style>

    <h4>Tray</h4>

    <label>
        <input type="checkbox" class="tray-enabled">
        Enable tray (Trilium needs to be restarted for this change to take effect)
    </label>

    <div class="tray-dependent-option close-to-tray-wrapper">
        <label>
            <input type="checkbox" class="close-to-tray-enabled">
            Close to tray (keep Trilium running in the system tray when the window is closed)
        </label>
    </div>

    <div class="tray-dependent-option start-to-tray-wrapper">
        <label>
            <input type="checkbox" class="start-to-tray-enabled">
            Start to tray (start Trilium minimized to the system tray instead of showing the main window; takes effect after restarting Trilium)
        </label>
    </div>
</div>`;

export default class TrayOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);
        this.$trayEnabled = this.$widget.find(".tray-enabled");
        this.$closeToTrayEnabled = this.$widget.find(".close-to-tray-enabled");
        this.$startToTrayEnabled = this.$widget.find(".start-to-tray-enabled");
        this.$trayDependentOptions = this.$widget.find(".tray-dependent-option");

        this.$trayEnabled.on('change', () => {
            this.updateOption('disableTray', !this.$trayEnabled.is(":checked") ? "true" : "false");
            this.setTrayDependentOptionsEnabled();
        });

        this.$closeToTrayEnabled.on('change', () =>
            this.updateOption('closeToTray', this.$closeToTrayEnabled.is(":checked") ? "true" : "false"));

        this.$startToTrayEnabled.on('change', () =>
            this.updateOption('startToTray', this.$startToTrayEnabled.is(":checked") ? "true" : "false"));
    }

    async optionsLoaded(options) {
        this.$trayEnabled.prop("checked", options.disableTray !== 'true');
        this.$closeToTrayEnabled.prop("checked", options.closeToTray === 'true');
        this.$startToTrayEnabled.prop("checked", options.startToTray === 'true');

        this.setTrayDependentOptionsEnabled();
    }

    setTrayDependentOptionsEnabled() {
        const trayEnabled = this.$trayEnabled.is(":checked");

        this.$closeToTrayEnabled.prop("disabled", !trayEnabled);
        this.$startToTrayEnabled.prop("disabled", !trayEnabled);
        this.$trayDependentOptions.toggleClass("disabled-field", !trayEnabled);
    }
}
