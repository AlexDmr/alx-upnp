import { SubscriptionEvent } from "./EventHandler";
import { Observable } from "@reactivex/rxjs/dist/package/Observable";
import { Subscription } from "@reactivex/rxjs/dist/package/Subscription";
import { BehaviorSubject, Observer } from "@reactivex/rxjs/dist/package";
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
    };
    subscribe(obs: Observer<any>): Subscription;
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
    stateVariables: StateVariable[];
    private actions;
    private baseURL;
    private host;
    private port;
    private sid;
    eventsObs: Observable<SubscriptionEvent>;
    properties: BehaviorSubject<Object>;
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
    };
    call(C: CALL): Promise<any>;
    getDescription(): Promise<this>;
    getPropertiesObs(): Observable<Object>;
    private subscribeToEvents();
    private getCompleteAdress(ad);
    private getServiceDetails();
}
