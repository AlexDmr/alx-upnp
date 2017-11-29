import { CALL_RESULT } from "./ServiceAction";
import { Observable } from "@reactivex/rxjs/dist/package/Observable";
export declare type CALL = {
    actionName: string;
    args: Object;
};
export declare class StateVariable {
    private subject;
    private sendEvents;
    private name;
    private dataType;
    constructor(SV_XML: Element);
    toJSON(): {
        sendEvents: boolean;
        name: string;
        dataType: string;
        value: string;
    };
    updateValue(value: string): void;
    getName(): string;
    getDataType(): string;
    isSendingUPnPEvents(): boolean;
    getObservable(): Observable<string>;
}
export declare type ServiceConfig = {
    baseURL: string;
    serviceXML: Element;
    host: string;
    port: string;
};
export declare class Service {
    serviceType: string;
    serviceId: string;
    SCPDURL: string;
    controlURL: string;
    eventSubURL: string;
    raw: string;
    promiseDetails: Promise<this>;
    stateVariables: Map<string, StateVariable>;
    private actions;
    private baseURL;
    private host;
    private port;
    private sid;
    private eventsObs;
    constructor({baseURL, serviceXML, host, port}: ServiceConfig);
    dispose(): void;
    toJSON(): {
        serviceType: string;
        serviceId: string;
        SCPDURL: string;
        controlURL: string;
        eventSubURL: string;
        stateVariables: {
            sendEvents: boolean;
            name: string;
            dataType: string;
            value: string;
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
    };
    call(C: CALL): Promise<CALL_RESULT>;
    getId(): string;
    getType(): string;
    getDescription(): Promise<this>;
    updateProperty(propName: string, value: string): void;
    private subscribeToEvents();
    private getCompleteAdress(ad);
    private getServiceDetails();
}
