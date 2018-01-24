import {getCallcack_IP_RelatedTo, getEventHandlerPort} from "./EventHandler";
import {RequestResponse} from "request";
import {request, IncomingMessage, RequestOptions} from "http";
import * as xmldom from "xmldom";

import {logError, log} from "./logFunction";


const parserXML = new xmldom.DOMParser();
const reURL = /^(https?):\/\/([\w|\.|\d]*)\:?(\d+)\/(.*)$/i;

export type UPNP_SUBSCRIBE = {
    host: string,
    port: string,
    path: string
};

export function getRelativeAdress(path: string): string {
    if (path.indexOf('/') !== 0) {
        if (path.indexOf('http') !== 0) {
            path = `/${path}`;
        } else {
            const reRes = reURL.exec(path);
            path = reRes[4];
        }
    }

    return path;
}

export function SubscribeToService( {host, port, path}: UPNP_SUBSCRIBE ): Promise<{sid: string, timeout: number}> {
    const IP = getCallcack_IP_RelatedTo(host);
    const callbackUrl = `http://${IP}:${getEventHandlerPort()}/listener`;

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

    return new Promise<{sid: string, timeout: number}>( (resolve, reject) => {
        const req = request(options, (res) => {
            let buf = "";
            res.on('data', (chunk) => buf += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    logError("Rejected SOAP action", buf);
                    reject(`Invalid SUBSCRIBE code: ${res.statusCode}\n${buf}`);
                }
                else {
                    const sid = res.headers.sid as string;
                    const timeoutStr: string = res.headers.timeout as string;
                    const timeout: number = parseInt( timeoutStr.slice( timeoutStr.indexOf('-') + 1 ) );

                    log(`SUBSCRIBE SUCCESS:\n\t-sid: ${sid}\n\t-timeout: ${timeout}\n\t-buf: ${buf}`);
                    resolve({sid, timeout});
                }
            });
        });
        req.on('error', err => {
            reject(`problem with calling ${this.name}: ${err.message}`);
        });
        req.end();
    } );
}

export async function ReSubscribeToService(sid: string, {host, port, path}: UPNP_SUBSCRIBE): Promise<{sid: string, timeout: number}> {
    const IP = getCallcack_IP_RelatedTo(host);
    const callbackUrl = `http://${IP}:${getEventHandlerPort()}/listener`;

    const options: RequestOptions = {
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

    return new Promise<{sid: string, timeout: number}>( (resolve, reject) => {
        const req = request(options, (res) => {
            let buf = "";
            res.on('data', chunk => buf += chunk);
            res.on('end', () => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    const msg = `---------> problem code ${res.statusCode} with _resubscribe:\n\t-buf: ${buf}`;
                    logError(msg);
                    if (res.statusCode === 412) {
                        log("Try to subscribe again...");
                        return SubscribeToService( {host, port, path} );
                    } else {
                        reject( {code: res.statusCode, msg: msg} );                        
                    }
                }
                else {
                    const sid2 = res.headers.sid as string;
                    const timeoutStr: string = res.headers.timeout as string;
                    const timeout2: number = parseInt( timeoutStr.slice( timeoutStr.indexOf('-') + 1 ) );
                    log(`re-subscription success ${res.statusCode} :\n\t-sid: ${sid}\n\t-sid2: ${sid2}\n\ttimeout2: ${timeout2}`);
                    resolve( {sid, timeout: timeout2} );
                }
            });
        });
        req.on('error', e => {
            const msg = `---------> error with req resubscribe:\n\t-message: ${e.message}\n\t-options: ${JSON.stringify(options)}`;
            console.error(msg);
            reject( {code: 0, msg: msg} );
        });
        req.end();
    });
}

export async function UnSubscribeFromService(sid, host, port, eventSubUrl) {
    const options = {
        method  : "UNSUBSCRIBE",
        host    : host,
        port    : port,
        path    : eventSubUrl,
        headers : {
            "host"     : `${host}:${port}`,
            "sid"      : sid
        }
    };

    return new Promise<void>( (resolve, reject) => {
        const req = request(options, res => {
            let buf = "";
            res.on('data', chunk => buf += chunk );
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    const msg = `HTTP CODE !== 200 : ${res.statusCode}`;
                    logError( msg );
                    reject( msg );
                } else {
                    resolve();
                }
            });
        });
        req.on('error', function (e) {
            const msg = `problem with unsubscribe: ${e.message}`;
            logError( msg );
            reject(msg);
        });
        req.end("");
    });
}

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