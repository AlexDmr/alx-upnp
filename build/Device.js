"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_promise_native_1 = require("request-promise-native");
const TLS_SSL_1 = require("./TLS_SSL");
const xmldom = require("xmldom");
const Service_1 = require("./Service");
const Subject_1 = require("@reactivex/rxjs/dist/package/Subject");
const logFunction_1 = require("./logFunction");
const parserXML = new xmldom.DOMParser();
const mapDevices = new Map();
const subjectDeviceAppears = new Subject_1.Subject();
const subjectDeviceDisappears = new Subject_1.Subject();
exports.obsDeviceAppears = subjectDeviceAppears.asObservable();
exports.obsDeviceDisppears = subjectDeviceDisappears.asObservable();
class Device {
    // private L_EventObservers: CB_SERVICE_EVENT[] = [];
    // private obsEvents: Observable<SERVICE_EVENT>;
    constructor(msg) {
        this.iconList = [];
        this.services = [];
        logFunction_1.log("createDevice", msg);
        this.headers = msg.headers;
        this.USN = msg.headers.USN;
        this.updateRemoveDelay(msg.headers.CacheControl);
        mapDevices.set(this.USN, this);
        const A = this.headers.LOCATION.split("/");
        this.baseURL = A[0] + "//" + A[2];
        [this.host, this.port] = A[2].split(":");
        this.port = this.port || "80";
        logFunction_1.log("baseURL", this.baseURL, "=>", this.host, ":", this.port);
        this.promiseDetails = this.getDeviceDetails();
    }
    dispose() {
        mapDevices.delete(this.USN);
        if (this.removeDelay) {
            clearTimeout(this.removeDelay);
        }
        this.services.forEach(S => S.dispose());
    }
    findServiceFromType(type) {
        return this.services.find(S => S.serviceType.indexOf(type) >= 0);
    }
    getServices() {
        return this.services;
    }
    getType() {
        return this.deviceType;
    }
    getUSN() {
        return this.USN;
    }
    /* subscribeToServices( obs: CB_SERVICE_EVENT ) {
        if (this.obsEvents) {
            this.obsEvents.subscribe( obs );
        } else {
            this.L_EventObservers.push(obs);
        }
    } */
    toJSON() {
        return {
            USN: this.USN,
            headers: this.headers,
            iconList: this.iconList,
            deviceType: this.deviceType,
            friendlyName: this.friendlyName,
            manufacturer: this.manufacturer,
            manufacturerURL: this.manufacturerURL,
            modelDescription: this.modelDescription,
            modelName: this.modelName,
            modelURL: this.modelURL,
            modelNumber: this.modelNumber,
            serialNumber: this.serialNumber,
            services: this.services.map(S => S.toJSON()),
            baseURL: this.baseURL,
            host: this.host,
            port: this.port
        };
    }
    updateRemoveDelay(nbSeconds) {
        logFunction_1.log("updateRemoveDelay", nbSeconds);
        if (this.removeDelay) {
            clearTimeout(this.removeDelay);
        }
        this.removeDelay = setTimeout(() => {
            // Last chance to respond...
            const location = this.headers.LOCATION;
            let objRequest = { uri: location };
            if (TLS_SSL_1.TLS_SSL && location.indexOf("https://") === 0) {
                objRequest.cert = TLS_SSL_1.TLS_SSL.cert;
                objRequest.key = TLS_SSL_1.TLS_SSL.key;
                objRequest.securityOptions = 'SSL_OP_NO_SSLv3';
            }
            request_promise_native_1.get(objRequest).then(data => this.updateRemoveDelay(this.headers.CacheControl), err => removeDeviceWithRef(this));
        }, Math.max(nbSeconds + 15, 300) * 1000);
    }
    call(C) {
        const service = this.services.find(S => S.serviceId === C.serviceId);
        return service.call(C);
    }
    getDescription() {
        return this.promiseDetails;
    }
    getDeviceDetails() {
        const location = this.headers.LOCATION;
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
                this.deviceType = (node = doc.getElementsByTagName("deviceType")[0]) ? node.textContent : "";
                this.friendlyName = (node = doc.getElementsByTagName("friendlyName")[0]) ? node.textContent : "";
                this.manufacturer = (node = doc.getElementsByTagName("manufacturer")[0]) ? node.textContent : "";
                this.manufacturerURL = (node = doc.getElementsByTagName("manufacturerURL")[0]) ? node.textContent : "";
                this.modelDescription = (node = doc.getElementsByTagName("modelDescription")[0]) ? node.textContent : "";
                this.modelName = (node = doc.getElementsByTagName("modelName")[0]) ? node.textContent : "";
                this.modelURL = (node = doc.getElementsByTagName("modelURL")[0]) ? node.textContent : "";
                this.modelNumber = (node = doc.getElementsByTagName("modelNumber")[0]) ? node.textContent : "";
                this.serialNumber = (node = doc.getElementsByTagName("serialNumber")[0]) ? node.textContent : "";
                const LI = Array.from(doc.getElementsByTagName("icon"));
                this.iconList = LI.map(I => ({
                    mimetype: (node = I.getElementsByTagName("mimetype")[0]) ? node.textContent : "",
                    width: (node = I.getElementsByTagName("mimetype")[0]) ? parseInt(node.textContent) : -1,
                    height: (node = I.getElementsByTagName("mimetype")[0]) ? parseInt(node.textContent) : -1,
                    url: (node = I.getElementsByTagName("url")[0]) ? node.textContent : ""
                }));
                // Get Services
                const servicesXML = Array.from(doc.getElementsByTagName("service"));
                return Promise.all(servicesXML.map(serviceXML => {
                    const service = new Service_1.Service({
                        baseURL: this.baseURL,
                        serviceXML,
                        host: this.host,
                        port: this.port
                    });
                    return service.getDescription();
                })).then(services => {
                    this.services = services;
                    // Subscribe...
                    /* this.obsEvents = Observable.merge( // Merge observable<SERVICE_EVENT> into one source
                        ...this.services.map( // map services to an array of {serviceId, observableProperties}
                            S => ({serviceId: S.serviceId, variables: S.stateVariables})
                        ).map( // map to an array of observable<SERVICE_EVENT>
                            ({serviceId, variables}) => obs.map(evtObj => ({serviceId, properties: evtObj}) )
                        )
                    );
                    this.L_EventObservers.forEach( obs => this.obsEvents.subscribe(obs) );
                    this.L_EventObservers = [];
                    return this;*/
                }, err => {
                    logFunction_1.logError("Error getting all services descriptions", err);
                });
            }
            else {
                throw "Device document cannot be parsed or is empty";
            }
        }, err => {
            logFunction_1.logError("Error getting details from", location, "\n", err.message);
            return err;
        }).catch(err => {
            logFunction_1.logError("Error getting details from", location, "\n", err.message);
            return err;
        });
    }
}
exports.Device = Device;
function createDevice(msg) {
    const USN = msg.headers.USN;
    if (USN) {
        if (mapDevices.has(USN)) {
            const device = mapDevices.get(USN);
            device.updateRemoveDelay(msg.headers.CacheControl);
        }
        else {
            const device = new Device(msg);
            device.getDescription().then(() => {
                subjectDeviceAppears.next(device);
                logFunction_1.log("New device, with complete description", device.getUSN());
            }, err => {
                logFunction_1.logError("Error getting device description of", device.getUSN());
            });
        }
    }
}
exports.createDevice = createDevice;
function removeDevice(msg) {
    if (mapDevices.has(msg.headers.USN)) {
        removeDeviceWithRef(mapDevices.get(msg.headers.USN));
    }
}
exports.removeDevice = removeDevice;
function removeDeviceWithRef(device) {
    if (device && device.getUSN() && mapDevices.has(device.getUSN())) {
        logFunction_1.log("removeDeviceWithRef", device);
        device.dispose();
    }
}
function updateDevice(msg) {
    logFunction_1.log("updateDevice", msg);
    createDevice(msg);
}
exports.updateDevice = updateDevice;
function getDeviceFromUUID(uuid) {
    return mapDevices.get(uuid);
}
exports.getDeviceFromUUID = getDeviceFromUUID;
function getDevices(filter) {
    const A = Array.from(mapDevices.values());
    return filter ? A.filter(filter) : A;
}
exports.getDevices = getDevices;
//# sourceMappingURL=Device.js.map