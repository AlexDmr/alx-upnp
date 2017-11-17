"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
exports.networkInterfaceInfos = getNetInterfacesIPv4();
function getNetInterfacesIPv4() {
    const L = [];
    const NI = os_1.networkInterfaces();
    for (let i in NI) {
        const LNI = NI[i];
        L.push(...LNI.filter(NI => NI.family === "IPv4"));
    }
    return L;
}
exports.getNetInterfacesIPv4 = getNetInterfacesIPv4;
//# sourceMappingURL=netInterfaces.js.map