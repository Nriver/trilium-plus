const eu = require('./etapi_utils.js');
const backupService = require('../services/backup.js');

function register(router) {
    eu.route(router, 'put', '/etapi/backup/:backupName', (req, res, next) => {
        backupService.backupNow(req.params.backupName)
            .then(() => res.sendStatus(204))
            .catch(() => res.sendStatus(500));
    });
}

module.exports = {
    register
};
