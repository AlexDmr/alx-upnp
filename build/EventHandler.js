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
const http = require("http");
const netInterfaces_1 = require("./netInterfaces");
const ServiceSubscription_1 = require("./ServiceSubscription");
const package_1 = require("@reactivex/rxjs/dist/package");
const logFunction_1 = require("./logFunction");
// HTTP Server for receiving events
const server = http.createServer((req, res) => {
    serviceCallbackHandler(req, res);
});
server.listen(); // XXX check that a free port will be selected
function getEventHandlerPort() {
    return server.address().port;
}
exports.getEventHandlerPort = getEventHandlerPort;
function getCallcack_IP_RelatedTo(host) {
    let IP = "127.0.0.1";
    const hostArray = host.split(".");
    const netInterface = netInterfaces_1.networkInterfaceInfos.find(netInterface => {
        const adresseArray = netInterface.address.split(".");
        return adresseArray[0] === hostArray[0]
            && adresseArray[1] === hostArray[1]
            && adresseArray[2] === hostArray[2];
    }) || netInterfaces_1.networkInterfaceInfos.find(netInterface => {
        const adresseArray = netInterface.address.split(".");
        return adresseArray[0] === hostArray[0]
            && adresseArray[1] === hostArray[1];
    });
    if (netInterface) {
        IP = netInterface.address;
    }
    return IP;
}
exports.getCallcack_IP_RelatedTo = getCallcack_IP_RelatedTo;
const mapSubscription = new Map();
const mapMissedEvent = new Map();
function SubscribeToEvent(sid, timeout, upnpSubscr) {
    if (mapSubscription.has(sid)) {
        return mapSubscription.get(sid).eventSubject;
    }
    function reSubscribe(subscription) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sid: sid2, timeout: timeout2 } = yield ServiceSubscription_1.ReSubscribeToService(subscription.sid, upnpSubscr);
                subscription.sid = sid2;
                subscription.timeout = timeout2;
                subscription.timer = setTimeout(() => reSubscribe(subscription), Math.max(30, (timeout2 - 30)) * 1000);
            }
            catch (err) {
                // Clean subscription
                mapSubscription.delete(subscription.sid);
                clearTimeout(subscription.timer);
                subscription.eventSubject.complete();
            }
        });
    }
    const subscription = {
        sid,
        timeout,
        timer: null,
        responseCount: 0,
        eventSubject: new package_1.Subject(),
        upnpSubscr: upnpSubscr
    };
    subscription.timer = setTimeout(() => reSubscribe(subscription), Math.max(30, (timeout - 30)) * 1000);
    mapSubscription.set(sid, subscription);
    if (mapMissedEvent.has(sid)) {
        setTimeout(() => mapMissedEvent.get(sid).forEach(str => subscription.eventSubject.next(str)), 1);
    }
    return subscription.eventSubject.asObservable();
}
exports.SubscribeToEvent = SubscribeToEvent;
function UnSubscribeFromEvent(sid) {
    const subscription = mapSubscription.get(sid);
    if (subscription) {
        clearTimeout(subscription.timer);
        mapSubscription.delete(sid);
        const { host, port, path } = subscription.upnpSubscr;
        ServiceSubscription_1.UnSubscribeFromService(sid, host, port, path);
    }
}
exports.UnSubscribeFromEvent = UnSubscribeFromEvent;
function serviceCallbackHandler(req, res) {
    let reqContent = "";
    req.on("data", buf => reqContent += buf);
    req.on("end", () => {
        try {
            // acknowledge the event notification
            res.writeHead(200);
            res.end("");
            // log("Received event\n", req.headers, "\n", reqContent);
            const sid = req.headers.sid;
            const subscription = mapSubscription.get(sid);
            if (subscription) {
                subscription.responseCount++;
                // log( "\tsubscription.handleEvent", subscription.handleEvent);
                subscription.eventSubject.next(reqContent);
            }
            else {
                logFunction_1.log("PRECOCE EVENT FOR", sid);
                const missed = mapMissedEvent.has(sid) ? mapMissedEvent.get(sid) : [];
                missed.push(reqContent);
                mapMissedEvent.set(sid, missed);
            }
        }
        catch (ex) {
            if (ex.toString().startsWith("Error: Text data outside of root node.")) {
                // ignore
            }
            else {
                logFunction_1.logError("exception: ", ex);
            }
        }
    });
}
//# sourceMappingURL=EventHandler.js.map