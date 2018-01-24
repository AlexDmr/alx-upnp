"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SSDP_1 = require("./SSDP");
const dgram_1 = require("dgram");
const netInterfaces_1 = require("./netInterfaces");
const Device_1 = require("./Device");
const logFunction_1 = require("./logFunction");
const RE_CacheControl = /= *([0-9]*)$/;
class ControlPoint {
    constructor() {
        this.server = dgram_1.createSocket({ type: 'udp4', reuseAddr: true });
        this.server.on('message', (msg, rinfo) => this.onRequestMessage(msg, rinfo));
        this.server.bind(SSDP_1.SSDP_PORT, () => {
            netInterfaces_1.getNetInterfacesIPv4().forEach(NI => {
                this.server.addMembership(SSDP_1.BROADCAST_ADDR, NI.address);
            });
            this.server.setMulticastLoopback(true);
            this.server.setBroadcast(true);
            console.log('UDP4 server addMembership ' + SSDP_1.BROADCAST_ADDR);
            this.search();
        });
    }
    getObsDeviceAppears() {
        return Device_1.obsDeviceAppears;
    }
    getObsDeviceDisappears() {
        return Device_1.obsDeviceDisppears;
    }
    subscribeToDeviceAppear(obs) {
        return Device_1.obsDeviceAppears.subscribe(obs);
    }
    subscribeToDeviceDisappear(obs) {
        return Device_1.obsDeviceDisppears.subscribe(obs);
    }
    getDevices() {
        return Device_1.getDevices();
    }
    search(st = "ssdp:all") {
        netInterfaces_1.getNetInterfacesIPv4().forEach(NI => {
            this.createDgramClientForNetInterface(NI, st);
        });
    }
    onRequestMessage(msg, rinfo) {
        const str = msg.toString('utf8');
        const res = this.pipoParseHTTP_header(str);
        switch (res.method.toUpperCase()) {
            case "HTTP/1.1":
            case "HTTP/1.0":
                Device_1.createDevice(res);
                break;
            case 'NOTIFY':
                // console.log("NOTIFY:______________\n", str, "\n" , rinfo, "\n____________________________");
                switch (res.headers.NTS) {
                    case "ssdp:alive":
                        Device_1.createDevice(res);
                        break;
                    case "ssdp:update":
                        Device_1.updateDevice(res);
                        break;
                    case "ssdp:byebye":
                        logFunction_1.log("ssdp:byebye", res);
                        Device_1.removeDevice(res);
                        break;
                }
                // var event = UPNP_NTS_EVENTS[res.headers.nts.toLowerCase()];
                // if (event) {this.emit(event, res.headers);} else {console.log("NOTIFY", res.headers.nts);}
                break;
            default:
        }
    }
    createDgramClientForNetInterface(NI, st) {
        const client = dgram_1.createSocket({ type: 'udp4' });
        client.on('message', (msg, rinfo) => {
            // console.log("Response to the MSEARCH !!!!", msg.toString('utf8'));
            this.onRequestMessage(msg, rinfo);
        });
        client.bind(undefined, NI.address, () => {
            client.addMembership(SSDP_1.BROADCAST_ADDR, NI.address);
            // client.setBroadcast(true);
            // client.setMulticastLoopback(true);
            const search = SSDP_1.SSDP_MSEARCH.replace('%st', st).replace('%HOST', `${client.address().address}:${client.address().port}`);
            const message = new Buffer(search, "ascii");
            // console.log("MSEARCH at", client.address(), `\n${search}`);
            client.send(message, 0, message.length, SSDP_1.SSDP_PORT, SSDP_1.BROADCAST_ADDR);
            setTimeout(() => {
                // console.log( "close multicast UDP client at IP", client.address());
                client.close();
            }, 6000);
        });
        return client;
    }
    pipoParseHTTP_header(str) {
        const lines = str.split("\r\n");
        const headers = {
            NT: "",
            NTS: null,
            USN: null,
            SERVER: "",
            LOCATION: "",
            CacheControl: 0
        };
        lines.forEach(line => {
            const pos = line.indexOf(':');
            if (pos >= 0) {
                const att = line.slice(0, pos).toUpperCase().trim();
                const val = line.slice(pos + 1).trim();
                switch (att) {
                    case "NT":
                        headers.NT = val;
                        break;
                    case "USN":
                        headers.USN = getUSN(val.toUpperCase());
                        break;
                    case "NTS":
                        headers.NTS = val.toLowerCase();
                        break;
                    case "SERVER":
                        headers.SERVER = val;
                        break;
                    case "LOCATION":
                        headers.LOCATION = getLocation(val);
                        break;
                    case "CACHE-CONTROL":
                        const resRE = RE_CacheControl.exec(val);
                        if (resRE) {
                            headers.CacheControl = parseInt(resRE[1]);
                        }
                }
            }
        });
        const A = lines[0].split(' ');
        return {
            method: A[0] || '',
            status: A[2] || '',
            statusCode: parseInt(A[1]),
            firstLine: A,
            headers: headers,
            raw: str
        };
    }
}
exports.ControlPoint = ControlPoint;
function getUSN(usn) {
    let udn = usn;
    if (udn) {
        const s = usn.split("::");
        if (s.length > 0) {
            udn = s[0];
        }
        if (udn.startsWith("uuid:")) {
            udn = udn.substring(5);
        }
    }
    return udn;
}
function getLocation(adress) {
    if (adress.indexOf("http") === 0) {
        return adress;
    }
    else {
        return `http://${adress}`;
    }
}
//# sourceMappingURL=control-point.js.map