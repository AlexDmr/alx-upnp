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
const request_promise_native_1 = require("request-promise-native");
const TLS_SSL_1 = require("./TLS_SSL");
const xmldom = require("xmldom");
const ServiceAction_1 = require("./ServiceAction");
const EventHandler_1 = require("./EventHandler");
const ServiceSubscription_1 = require("./ServiceSubscription");
const Subject_1 = require("@reactivex/rxjs/dist/package/Subject");
const package_1 = require("@reactivex/rxjs/dist/package");
const parserXML = new xmldom.DOMParser();
class StateVariable {
    constructor(SV_XML) {
        this.subject = new Subject_1.Subject();
        this.name = SV_XML.getElementsByTagName("name")[0].textContent;
        this.dataType = SV_XML.getElementsByTagName("dataType")[0].textContent;
        this.sendEvents = SV_XML.getAttribute("sendEvents").toLowerCase() === "yes";
        // console.log("\tvariable", this.name);
    }
    toJSON() {
        return {
            sendEvents: this.sendEvents,
            name: this.name,
            dataType: this.dataType
        };
    }
    subscribe(obs) {
        return this.subject.subscribe(obs);
    }
}
exports.StateVariable = StateVariable;
class Service {
    constructor({ baseURL, serviceXML, host, port }) {
        this.properties = new package_1.BehaviorSubject({});
        this.baseURL = baseURL;
        this.host = host;
        this.port = port;
        let node;
        this.serviceId = (node = serviceXML.getElementsByTagName("serviceId")[0]) ? node.textContent : "";
        this.serviceType = (node = serviceXML.getElementsByTagName("serviceType")[0]) ? node.textContent : "";
        this.SCPDURL = (node = serviceXML.getElementsByTagName("SCPDURL")[0]) ? node.textContent : "";
        this.controlURL = (node = serviceXML.getElementsByTagName("controlURL")[0]) ? node.textContent : "";
        this.eventSubURL = (node = serviceXML.getElementsByTagName("eventSubURL")[0]) ? node.textContent : "";
        this.SCPDURL = this.getCompleteAdress(this.SCPDURL);
        this.controlURL = ServiceSubscription_1.getRelativeAdress(this.controlURL);
        this.eventSubURL = ServiceSubscription_1.getRelativeAdress(this.eventSubURL);
        this.promiseDetails = this.getServiceDetails();
        this.promiseDetails.then(() => this.subscribeToEvents(), err => console.error("Impossible to get service details..."));
    }
    dispose() {
        EventHandler_1.UnSubscribeFromEvent(this.sid);
    }
    toJSON() {
        return {
            serviceType: this.serviceType,
            serviceId: this.serviceId,
            SCPDURL: this.SCPDURL,
            controlURL: this.controlURL,
            eventSubURL: this.eventSubURL,
            stateVariables: this.stateVariables.map(S => S.toJSON()),
            actions: this.actions.map(A => A.toJSON()),
            baseURL: this.baseURL,
            host: this.host,
            port: this.port,
            properties: this.properties.getValue()
        };
    }
    call(C) {
        const action = this.actions.find(A => A.getName() === C.actionName);
        return action.call(C.args);
    }
    getDescription() {
        return this.promiseDetails;
    }
    getPropertiesObs() {
        return this.properties.asObservable();
    }
    subscribeToEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            const upnpSubscr = { host: this.host, port: this.port, path: this.eventSubURL };
            try {
                const { sid, timeout } = yield ServiceSubscription_1.SubscribeToService(upnpSubscr);
                this.sid = sid;
                this.eventsObs = EventHandler_1.SubscribeToEvent(sid, timeout, upnpSubscr);
                this.eventsObs.subscribe(str => {
                    console.log("EVENT", str);
                    const doc = parserXML.parseFromString(str, "text/xml");
                    let properties = Array.from(doc.getElementsByTagName("property"));
                    if (properties.length === 0) {
                        properties = Array.from(doc.getElementsByTagName("e:property"));
                    }
                    const objProperties = {};
                    properties.forEach(P => {
                        const tag = P.getElementsByTagName("*")[0];
                        const propName = tag.nodeName.split(":").reverse()[0];
                        objProperties[propName] = tag.textContent;
                    });
                    console.log("EVENT", objProperties);
                    const newProperties = Object.assign({}, this.properties.getValue(), objProperties);
                    this.properties.next(newProperties);
                });
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    getCompleteAdress(ad) {
        let location = ad.slice();
        if (location.indexOf("http") !== 0 && location.indexOf("https://") !== 0) {
            if (location.indexOf("/") === 0) {
                location = `${this.baseURL}${location}`;
            }
            else {
                location = `${this.baseURL}/${location}`;
            }
        }
        return location;
    }
    getServiceDetails() {
        let location = this.SCPDURL;
        let objRequest = { uri: location };
        if (TLS_SSL_1.TLS_SSL && location.indexOf("https://") === 0) {
            objRequest.cert = TLS_SSL_1.TLS_SSL.cert;
            objRequest.key = TLS_SSL_1.TLS_SSL.key;
            objRequest.securityOptions = 'SSL_OP_NO_SSLv3';
        }
        return request_promise_native_1.get(objRequest).then(data => {
            this.raw = data;
            const doc = parserXML.parseFromString(data, "text/xml");
            if (doc) {
                let node;
                // Get state variables
                const stateVariablesXML = Array.from(doc.getElementsByTagName("stateVariable"));
                this.stateVariables = stateVariablesXML.map(SV_XML => new StateVariable(SV_XML));
                // Get actions
                this.actions = Array.from(doc.getElementsByTagName("action")).map(actionXML => new ServiceAction_1.Action({
                    actionXML,
                    serviceType: this.serviceType,
                    controlURL: this.controlURL,
                    host: this.host,
                    port: this.port
                })); // actionXML, this.serviceType, this.controlURL
                return this;
            }
            else {
                throw "Device document cannot be parsed or is empty";
            }
        }, err => {
            console.error("Error getting details from", location, "\n", err);
            return err;
        }).catch(err => {
            console.error("Error getting details from", location, "\n", err);
            return err;
        });
    }
}
exports.Service = Service;
//# sourceMappingURL=Service.js.map