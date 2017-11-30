import {SSDP_HEADER, SSDP_MESSAGE} from "./SSDP";
import {get} from "request-promise-native";
import {TLS_SSL} from "./TLS_SSL";
import * as xmldom from "xmldom";
import {Service, ServiceJSON} from "./Service";
import {Subject} from "@reactivex/rxjs/dist/package/Subject";
import {Observable} from "@reactivex/rxjs/dist/package/Observable";
import {Observer} from "@reactivex/rxjs/dist/package/Observer";
import {CALL_RESULT} from "./ServiceAction";

import {log, logError} from "./logFunction";

const parserXML = new xmldom.DOMParser();
const mapDevices = new Map<string, Device>();

const subjectDeviceAppears      = new Subject<Device>();
const subjectDeviceDisappears   = new Subject<Device>();

export const obsDeviceAppears   = subjectDeviceAppears   .asObservable();
export const obsDeviceDisppears = subjectDeviceDisappears.asObservable();

export type CALL = {
    serviceId: string,
    actionName: string,
    args: Object
}

export type ICON = {
    mimetype: string;
    width: number;
    height: number;
    depth: number;
    url: string;
}

export type SERVICE_EVENT = {
    serviceId: string;
    properties: Object;
}

export type CB_SERVICE_EVENT = (evt: SERVICE_EVENT) => void;

export type DeviceJSON = {
    USN: string;
    headers: SSDP_HEADER; 
    iconList: ICON[];
    deviceType: string;
    friendlyName: string;
    manufacturer: string;
    manufacturerURL: string;
    modelDescription: string;
    modelName: string;
    modelURL: string;
    modelNumber: string;
    serialNumber: string;
    services: ServiceJSON[];
    baseURL: string;
    host: string;
    port: string;
};

export class Device {
    private removeDelay: any;
    private USN: string;
    private headers: SSDP_HEADER;
    private iconList: ICON[] = [];
    private deviceType: string; // ex: urn:schemas-upnp-org:device:MediaServer:1
    private friendlyName: string;
    private manufacturer: string;
    private manufacturerURL: string;
    private modelDescription: string;
    private modelName: string;
    private modelURL: string;
    private modelNumber: string;
    private serialNumber: string;
    private raw: string;
    private promiseDetails: Promise<this>;
    private services: Service[] = [];
    private baseURL: string;
    private host: string;
    private port: string;
    // private L_EventObservers: CB_SERVICE_EVENT[] = [];
    // private obsEvents: Observable<SERVICE_EVENT>;

    constructor(msg: SSDP_MESSAGE) {
        log("createDevice", msg);
        this.headers = msg.headers;
        this.USN = msg.headers.USN;
        this.updateRemoveDelay(msg.headers.CacheControl);
        mapDevices.set(this.USN, this);

        const A = this.headers.LOCATION.split("/" );
        this.baseURL = A[0] + "//" + A[2];
        [this.host, this.port] = A[2].split(":");
        this.port = this.port || "80";

        log("baseURL", this.baseURL, "=>", this.host, ":", this.port);
        this.promiseDetails = this.getDeviceDetails();
    }

    dispose() {
        mapDevices.delete(this.USN);
        if(this.removeDelay) {
            clearTimeout(this.removeDelay);
        }
        this.services.forEach( S => S.dispose() );
    }

    findServiceFromType(type: string): Service {
        return this.services.find( S => S.serviceType.indexOf(type) >= 0 );
    }

    getServices(): Service[] {
        return this.services;
    }

    getType(): string {
        return this.deviceType;
    }

    getUSN(): string {
        return this.USN;
    }

    /* subscribeToServices( obs: CB_SERVICE_EVENT ) {
        if (this.obsEvents) {
            this.obsEvents.subscribe( obs );
        } else {
            this.L_EventObservers.push(obs);
        }
    } */

    toJSON(): DeviceJSON {
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
            services: this.services.map( S => S.toJSON() ),
            baseURL: this.baseURL,
            host: this.host,
            port: this.port
        };
    }
    updateRemoveDelay(nbSeconds: number) {
        log("updateRemoveDelay", nbSeconds);
        if(this.removeDelay) {
            clearTimeout(this.removeDelay);
        }
        this.removeDelay = setTimeout(
            () => {
                // Last chance to respond...
                const location = this.headers.LOCATION;
                let objRequest: any = {uri: location};
                if (TLS_SSL && location.indexOf("https://") === 0) {
                    objRequest.cert = TLS_SSL.cert;
                    objRequest.key = TLS_SSL.key;
                    objRequest.securityOptions = 'SSL_OP_NO_SSLv3';
                }
                get(objRequest).then(
                    data => this.updateRemoveDelay( this.headers.CacheControl ),
                    err  => removeDeviceWithRef( this )
                );
            },
            Math.max(nbSeconds+15, 300)*1000
        );
    }

    call(C: CALL): Promise<CALL_RESULT> {
        const service = this.services.find( S => S.serviceId === C.serviceId);
        return service.call(C);
    }

    getDescription(): Promise<this> {
        return this.promiseDetails;
    }

    private getDeviceDetails(): Promise<this> {
        const location = this.headers.LOCATION;
        let objRequest: any = {uri: location};
        if (TLS_SSL && location.indexOf("https://") === 0) {
            objRequest.cert = TLS_SSL.cert;
            objRequest.key = TLS_SSL.key;
            objRequest.securityOptions = 'SSL_OP_NO_SSLv3';
        }
        return get(objRequest).then(data => {
            this.raw = data;
            const doc = parserXML.parseFromString(data, "text/xml");
            if (doc) {
                let node: Element;
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
                    width: (node = I.getElementsByTagName("width")[0]) ? parseInt(node.textContent) : -1,
                    height: (node = I.getElementsByTagName("height")[0]) ? parseInt(node.textContent) : -1,
                    depth: (node = I.getElementsByTagName("depth")[0]) ? parseInt(node.textContent) : -1,
                    url: (node = I.getElementsByTagName("url")[0]) ? node.textContent : ""
                }));
                // Get Services
                const servicesXML = Array.from( doc.getElementsByTagName("service") );
                return Promise.all(
                    servicesXML.map( serviceXML => {
                        const service = new Service({
                            baseURL: this.baseURL,
                            serviceXML,
                            host: this.host,
                            port: this.port
                        });
                        return service.getDescription();
                    } )
                ).then(
                    services => {
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
                    },
                    err => {
                        logError("Error getting all services descriptions", err);
                    }
                );
            } else {
                throw "Device document cannot be parsed or is empty";
            }
        }, err => {
            logError("Error getting details from", location, "\n", err.message);
            return err;
        }).catch(err => {
            logError("Error getting details from", location, "\n", err.message);
            return err;
        });
    }
}

export function createDevice(msg: SSDP_MESSAGE) {
    const USN = msg.headers.USN;
    if (USN) {
        if (mapDevices.has(USN)) {
            const device = mapDevices.get(USN);
            device.updateRemoveDelay(msg.headers.CacheControl);
        } else {
            const device = new Device(msg);
            device.getDescription().then(
                () => {
                    subjectDeviceAppears.next(device);
                    log("New device, with complete description", device.getUSN());
                },
                err => {
                    logError("Error getting device description of", device.getUSN());
                }
            );
        }
    }
}

export function removeDevice(msg: SSDP_MESSAGE) {
    if(mapDevices.has(msg.headers.USN)) {
        removeDeviceWithRef( mapDevices.get(msg.headers.USN) );
    }
}

function removeDeviceWithRef(device: Device) {
    if (device && device.getUSN() && mapDevices.has(device.getUSN())) {
        log("removeDeviceWithRef", device);
        device.dispose();
    }
}

export function updateDevice(msg: SSDP_MESSAGE) {
    log("updateDevice", msg);
    createDevice(msg);
}

export function getDeviceFromUUID(uuid: string): Device {
    return mapDevices.get(uuid);
}

export function getDevices(filter?: (d: Device) => boolean): Device[] {
    const A = Array.from( mapDevices.values() );
    return filter ? A.filter(filter) : A;
}
