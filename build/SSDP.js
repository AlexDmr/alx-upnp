"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// SSDP
exports.SSDP_PORT = 1900;
exports.BROADCAST_ADDR = "239.255.255.250";
exports.SSDP_MSEARCH = "M-SEARCH * HTTP/1.1\r\nHost: %HOST\r\nST:%st\r\nMan:\"ssdp:discover\"\r\nMX:3\r\nUser-Agent: UPnP/1.0 DLNADOC/1.50 Platinum/1.0.4.11\r\n\r\n";
//# sourceMappingURL=SSDP.js.map