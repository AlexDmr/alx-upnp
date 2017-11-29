"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const EventHandler_1 = require("./EventHandler");
const http_1 = require("http");
const xmldom = require("xmldom");
const logFunction_1 = require("./logFunction");
const parserXML = new xmldom.DOMParser();
const reURL = /^(https?):\/\/([\w|\.|\d]*)\:?(\d+)\/(.*)$/i;
function getRelativeAdress(path) {
    if (path.indexOf('/') !== 0) {
        if (path.indexOf('http') !== 0) {
            path = `/${path}`;
        }
        else {
            const reRes = reURL.exec(path);
            path = reRes[4];
        }
    }
    return path;
}
exports.getRelativeAdress = getRelativeAdress;
function SubscribeToService({ host, port, path }) {
    const IP = EventHandler_1.getCallcack_IP_RelatedTo(host);
    const callbackUrl = `http://${IP}:${EventHandler_1.getEventHandlerPort()}/listener`;
    const options = {
        method: "SUBSCRIBE",
        // url: url,
        host: host,
        port: port,
        path: path,
        headers: {
            "HOST": `${host}:${port}`,
            "CALLBACK": `<${callbackUrl}>`,
            "NT": "upnp:event",
            "TIMEOUT": "Second-300",
            "USER-AGENT": "alx-upnp/1 UPnP/1.1 NodeJS",
            "Content-Length": 0
        }
    };
    return new Promise((resolve, reject) => {
        const req = http_1.request(options, (res) => {
            let buf = "";
            res.on('data', (chunk) => buf += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    logFunction_1.logError("Rejected SOAP action", buf);
                    reject(`Invalid SUBSCRIBE code: ${res.statusCode}\n${buf}`);
                }
                else {
                    const sid = res.headers.sid;
                    const timeoutStr = res.headers.timeout;
                    const timeout = parseInt(timeoutStr.slice(timeoutStr.indexOf('-') + 1));
                    logFunction_1.log(`SUBSCRIBE SUCCESS:\n\t-sid: ${sid}\n\t-timeout: ${timeout}\n\t-buf: ${buf}`);
                    resolve({ sid, timeout });
                }
            });
        });
        req.on('error', err => {
            reject(`problem with calling ${this.name}: ${err.message}`);
        });
        req.end();
    });
}
exports.SubscribeToService = SubscribeToService;
function ReSubscribeToService(sid, { host, port, path }) {
    return __awaiter(this, void 0, void 0, function* () {
        const IP = EventHandler_1.getCallcack_IP_RelatedTo(host);
        const callbackUrl = `http://${IP}:${EventHandler_1.getEventHandlerPort()}/listener`;
        const options = {
            method: "SUBSCRIBE",
            host: host,
            port: port,
            path: path,
            headers: {
                "HOST": `${host}:${port}`,
                "SID": sid,
                "TIMEOUT": "Second-300"
            }
        };
        return new Promise((resolve, reject) => {
            const req = http_1.request(options, (res) => {
                let buf = "";
                res.on('data', chunk => buf += chunk);
                res.on('end', () => {
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        const msg = `---------> problem code ${res.statusCode} with _resubscribe:\n\t-buf: ${buf}`;
                        logFunction_1.logError(msg);
                        if (res.statusCode === 412) {
                            logFunction_1.log("Try to subscribe again...");
                            return SubscribeToService({ host, port, path });
                        }
                        else {
                            reject({ code: res.statusCode, msg: msg });
                        }
                    }
                    else {
                        const sid2 = res.headers.sid;
                        const timeoutStr = res.headers.timeout;
                        const timeout2 = parseInt(timeoutStr.slice(timeoutStr.indexOf('-') + 1));
                        logFunction_1.log(`re-subscription success ${res.statusCode} :\n\t-sid: ${sid}\n\t-sid2: ${sid2}\n\ttimeout2: ${timeout2}`);
                        resolve({ sid, timeout: timeout2 });
                    }
                });
            });
            req.on('error', e => {
                const msg = `---------> error with req resubscribe:\n\t-message: ${e.message}\n\t-options: ${JSON.stringify(options)}`;
                console.error(msg);
                reject({ code: 0, msg: msg });
            });
            req.end();
        });
    });
}
exports.ReSubscribeToService = ReSubscribeToService;
function UnSubscribeFromService(sid, host, port, eventSubUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            method: "UNSUBSCRIBE",
            host: host,
            port: port,
            path: eventSubUrl,
            headers: {
                "host": `${host}:${port}`,
                "sid": sid
            }
        };
        return new Promise((resolve, reject) => {
            const req = http_1.request(options, res => {
                let buf = "";
                res.on('data', chunk => buf += chunk);
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        const msg = `HTTP CODE !== 200 : ${res.statusCode}`;
                        console.error(msg);
                        reject(msg);
                    }
                    else {
                        resolve();
                    }
                });
            });
            req.on('error', function (e) {
                const msg = `problem with unsubscribe: ${e.message}`;
                console.error(msg);
                reject(msg);
            });
            req.end("");
        });
    });
}
exports.UnSubscribeFromService = UnSubscribeFromService;
/*
UpnpService.prototype.unsubscribe = function(sid, callback) {
    var self = this;
    var options = {
        method  : "UNSUBSCRIBE",
        host    : this.host,
        port    : this.port,
        path    : this.eventSubUrl
    }
    options.headers = {
        "host"     : this.host + ":" + this.port,
        "sid"      : sid
    };

    var req = http.request(options, function(res) {
        var buf = "";
        res.on('data', function (chunk) { buf += chunk });
        res.on('end', function () {
            if (res.statusCode !== 200) {
                if (callback && typeof(callback) === "function") {
                    callback(new Error("Problem with unsubscription on " + self.serviceId), buf);
                }
            }
            else {
                if (TRACE && DETAIL) {console.log("unsubscribe success: " + buf);}
                if (callback && typeof(callback) === "function") {
                    callback(null, buf);
                }
            }
        });
    });
    req.on('error', function(e) {
        console.error('problem with unsubscribe: ', e.message);
    });
    req.end("");
}
*/ 
//# sourceMappingURL=ServiceSubscription.js.map