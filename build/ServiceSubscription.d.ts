export declare type UPNP_SUBSCRIBE = {
    host: string;
    port: string;
    path: string;
};
export declare function getRelativeAdress(path: string): string;
export declare function SubscribeToService({host, port, path}: UPNP_SUBSCRIBE): Promise<{
    sid: string;
    timeout: number;
}>;
export declare function ReSubscribeToService(sid: string, {host, port, path}: UPNP_SUBSCRIBE): Promise<{
    sid: string;
    timeout: number;
}>;
export declare function UnSubscribeFromService(sid: any, host: any, port: any, eventSubUrl: any): Promise<void>;
