import server from "../../../services/server.js";
import toastService from "../../../services/toast.js";
import dialogService from "../../../services/dialog.js";
import utils from "../../../services/utils.js";
import OptionsWidget from "./options_widget.js";

const TPL = `
<div class="options-section">
    <h4>Automatic backup</h4>
    
    <p>Trilium can back up the database automatically:</p>
    
    <ul style="list-style: none">
        <li>
            <label>
                <input type="checkbox" class="daily-backup-enabled">
                Enable daily backup
            </label>
        </li>
        <li>    
            <label>
                <input type="checkbox" class="weekly-backup-enabled">
                Enable weekly backup
            </label>
        </li>
        <li>
        <label>
            <input type="checkbox" class="monthly-backup-enabled">
            Enable monthly backup
            </label>
        </li>
    </ul>
    
    <p>It's recommended to keep the backup turned on, but this can make application startup slow with large databases and/or slow storage devices.</p>
</div>

<div class="options-section">
    <h4>Backup now</h4>
    
    <p>Current database size: <strong class="current-database-size">calculating...</strong></p>

    <button class="backup-database-button btn">Backup database now</button>
</div>

<div class="options-section">
    <h4>Existing backups</h4>

    <table class="existing-backup-table table table-stripped">
        <thead>
            <tr>
                <th>Path</th>
                <th>Backup time</th>
                <th>File size</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>
</div>

<style>
    .backup-delete-button {
        display: inline-block;
        cursor: pointer;
        padding: 3px;
        font-size: large;
        border: 1px solid transparent;
        border-radius: var(--button-border-radius);
    }

    .backup-delete-button:hover {
        border: 1px solid var(--button-border-color);
    }
</style>
`;

export default class BackupOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);

        this.$backupDatabaseButton = this.$widget.find(".backup-database-button");
        this.$currentDatabaseSize = this.$widget.find(".current-database-size");

        this.$backupDatabaseButton.on('click', async () => {
            const {backupFile} = await server.post('database/backup-database');

            toastService.showMessage(`Database has been backed up to ${backupFile}`, 10000);

            this.refreshBackups();
            this.refreshDatabaseSize();
        });

        this.$dailyBackupEnabled = this.$widget.find(".daily-backup-enabled");
        this.$weeklyBackupEnabled = this.$widget.find(".weekly-backup-enabled");
        this.$monthlyBackupEnabled = this.$widget.find(".monthly-backup-enabled");

        this.$dailyBackupEnabled.on('change', () =>
            this.updateCheckboxOption('dailyBackupEnabled', this.$dailyBackupEnabled));

        this.$weeklyBackupEnabled.on('change', () =>
            this.updateCheckboxOption('weeklyBackupEnabled', this.$weeklyBackupEnabled));

        this.$monthlyBackupEnabled.on('change', () =>
            this.updateCheckboxOption('monthlyBackupEnabled', this.$monthlyBackupEnabled));

        this.$existingBackupTableBody = this.$widget.find(".existing-backup-table tbody");
    }

    optionsLoaded(options) {
        this.setCheckboxState(this.$dailyBackupEnabled, options.dailyBackupEnabled);
        this.setCheckboxState(this.$weeklyBackupEnabled, options.weeklyBackupEnabled);
        this.setCheckboxState(this.$monthlyBackupEnabled, options.monthlyBackupEnabled);

        this.refreshBackups();
        this.refreshDatabaseSize();
    }

    async refreshDatabaseSize() {
        const {databaseSize} = await server.get("database/info");

        this.$currentDatabaseSize.text(utils.formatSize(databaseSize));
    }

    async refreshBackups() {
        const backupFiles = await server.get("database/backups");

        this.$existingBackupTableBody.empty();

        if (!backupFiles.length) {
            this.$existingBackupTableBody.append(
                $("<tr>").append($("<td>").attr("colspan", 4).text("No backups yet.")));
            return;
        }

        for (const {fileName, filePath, mtime, size} of backupFiles) {
            this.$existingBackupTableBody.append(
                $("<tr>")
                    .append($("<td>").text(filePath))
                    .append($("<td>").text(mtime ? utils.formatDateTime(new Date(mtime)) : ""))
                    .append($("<td>").text(size != null ? utils.formatSize(size) : ""))
                    .append($("<td>").append(
                        $('<span class="bx bx-trash backup-delete-button" title="Delete this backup"></span>')
                            .on("click", () => this.deleteBackup(fileName, filePath)))));
        }
    }

    async deleteBackup(fileName, filePath) {
        if (!await dialogService.confirm(`Are you sure you want to delete backup "${filePath}"?`)) {
            return;
        }

        await server.remove(`database/backups/${encodeURIComponent(fileName)}`);

        toastService.showMessage(`Backup "${fileName}" has been deleted`);

        this.refreshBackups();
    }
}
