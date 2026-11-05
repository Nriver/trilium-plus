"use strict";

const sql = require('../../services/sql.js');
const log = require('../../services/log.js');
const backupService = require('../../services/backup.js');
const anonymizationService = require('../../services/anonymization.js');
const consistencyChecksService = require('../../services/consistency_checks.js');

function getExistingBackups() {
    return backupService.getExistingBackups();
}

function getDatabaseInfo() {
    return {
        databaseSize: sql.getValue("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")
    };
}

function deleteBackup(req) {
    backupService.deleteBackup(req.params.fileName);
}

async function backupDatabase() {
    return {
        backupFile: await backupService.backupNow("now")
    };
}

function vacuumDatabase() {
    sql.execute("VACUUM");

    log.info("Database has been vacuumed.");
}

function findAndFixConsistencyIssues() {
    consistencyChecksService.runOnDemandChecks(true);
}

function getExistingAnonymizedDatabases() {
    return anonymizationService.getExistingAnonymizedDatabases();
}

async function anonymize(req) {
    return await anonymizationService.createAnonymizedCopy(req.params.type);
}

function checkIntegrity() {
    const results = sql.getRows("PRAGMA integrity_check");

    log.info(`Integrity check result: ${JSON.stringify(results)}`);

    return {
        results
    };
}

module.exports = {
    getExistingBackups,
    getDatabaseInfo,
    deleteBackup,
    backupDatabase,
    vacuumDatabase,
    findAndFixConsistencyIssues,
    getExistingAnonymizedDatabases,
    anonymize,
    checkIntegrity
};
