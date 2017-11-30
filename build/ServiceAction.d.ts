export declare type ACTION_ARGUMENT = {
    name: string;
    direction: "in" | "out";
    relatedStateVariable: string;
};
export declare type ActionConfig = {
    actionXML: Element;
    serviceType: string;
    controlURL: string;
    host: string;
    port: string;
};
export declare type CALL_RESULT = {
    raw: string;
    out: Object;
};
export declare type ActionJSON = {
    name: string;
    serviceType: string;
    controlURL: string;
    args: ACTION_ARGUMENT[];
    host: string;
    port: string;
};
export declare class Action {
    private name;
    private doc;
    private serviceType;
    private controlURL;
    private host;
    private port;
    private args;
    constructor({actionXML, serviceType, controlURL, host, port}: ActionConfig);
    toJSON(): ActionJSON;
    getName(): string;
    call(args: Object): Promise<CALL_RESULT>;
}
