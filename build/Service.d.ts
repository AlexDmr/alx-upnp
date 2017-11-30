import { CALL_RESULT, ActionJSON } from "./ServiceAction";
import { Observable } from "@reactivex/rxjs/dist/package/Observable";
export declare type CALL = {
    actionName: string;
    args: Object;
};
export declare type StateVariableJSON = {
    sendEvents: boolean;
    name: string;
    dataType: string;
    value: string;
};
export declare class StateVariable {
    private subject;
    private sendEvents;
    private name;
    private dataType;
    constructor(SV_XML: Element);
    toJSON(): StateVariableJSON;
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
export declare type ServiceJSON = {
    serviceType: string;
    serviceId: string;
    SCPDURL: string;
    controlURL: string;
    eventSubURL: string;
    stateVariables: StateVariableJSON[];
    actions: ActionJSON[];
    baseURL: string;
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
    toJSON(): ServiceJSON;
    call(C: CALL): Promise<CALL_RESULT>;
    getId(): string;
    getType(): string;
    getDescription(): Promise<this>;
    updateProperty(propName: string, value: string): void;
    private subscribeToEvents();
    private getCompleteAdress(ad);
    private getServiceDetails();
}
