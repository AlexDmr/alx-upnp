"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
exports.TLS_SSL = {
    key: fs.readFileSync(path.join(__dirname, '../MM.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../certificat.pem'))
};
//# sourceMappingURL=TLS_SSL.js.map