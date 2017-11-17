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
export declare class Action {
    private name;
    private doc;
    private serviceType;
    private controlURL;
    private host;
    private port;
    private args;
    constructor({actionXML, serviceType, controlURL, host, port}: ActionConfig);
    toJSON(): {
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
    };
    getName(): string;
    call(args: Object): Promise<CALL_RESULT>;
}
