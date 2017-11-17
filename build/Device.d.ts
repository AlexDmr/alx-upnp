import { SSDP_HEADER, SSDP_MESSAGE } from "./SSDP";
import { Observable } from "@reactivex/rxjs/dist/package/Observable";
export declare const obsDeviceAppears: Observable<Device>;
export declare const obsDeviceDisppears: Observable<Device>;
export declare type CALL = {
    serviceId: string;
    actionName: string;
    args: Object;
};
export declare type ICON = {
    mimetype: string;
    width: number;
    height: number;
    url: string;
};
export declare type SERVICE_EVENT = {
    serviceId: string;
    properties: Object;
};
export declare type CB_SERVICE_EVENT = (evt: SERVICE_EVENT) => void;
export declare class Device {
    private removeDelay;
    private USN;
    private headers;
    private iconList;
    private deviceType;
    private friendlyName;
    private manufacturer;
    private manufacturerURL;
    private modelDescription;
    private modelName;
    private modelURL;
    private modelNumber;
    private serialNumber;
    private raw;
    private promiseDetails;
    private services;
    private baseURL;
    private host;
    private port;
    private L_EventObservers;
    private obsEvents;
    constructor(msg: SSDP_MESSAGE);
    dispose(): void;
    getUSN(): string;
    subscribeToServices(obs: CB_SERVICE_EVENT): void;
    toJSON(): {
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
        services: {
            serviceType: string;
            serviceId: string;
            SCPDURL: string;
            controlURL: string;
            eventSubURL: string;
            stateVariables: {
                sendEvents: boolean;
                name: string;
                dataType: string;
            }[];
            actions: {
                name: string;
                serviceType: string;
                controlURL: string;
                args: {
                    name: string;
                    direction: "in" | "out";
                    relatedStateVariable: string;
                }[];
                host: string;
                port: string;
            }[];
            baseURL: string;
            host: string;
            port: string;
            properties: Object;
        }[];
        baseURL: string;
        host: string;
        port: string;
    };
    updateRemoveDelay(nbSeconds: number): void;
    call(C: CALL): Promise<any>;
    getDescription(): Promise<this>;
    private getDeviceDetails();
}
export declare function createDevice(msg: SSDP_MESSAGE): void;
export declare function removeDevice(msg: SSDP_MESSAGE): void;
export declare function updateDevice(msg: SSDP_MESSAGE): void;
export declare function getDeviceFromUUID(uuid: string): Device;
export declare function getDevices(filter?: (d: Device) => boolean): Device[];
