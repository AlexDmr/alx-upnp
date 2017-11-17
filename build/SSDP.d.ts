export declare const SSDP_PORT = 1900;
export declare const BROADCAST_ADDR = "239.255.255.250";
export declare const SSDP_MSEARCH = "M-SEARCH * HTTP/1.1\r\nHost: %HOST\r\nST:%st\r\nMan:\"ssdp:discover\"\r\nMX:3\r\nUser-Agent: UPnP/1.0 DLNADOC/1.50 Platinum/1.0.4.11\r\n\r\n";
export declare type SSDP_ALIVE = 'ssdp:alive';
export declare type SSDP_BYEBYE = 'ssdp:byebye';
export declare type SSDP_UPDATE = 'ssdp:update';
export declare type SSDP_ALL = 'ssdp:all';
export declare type SSDP_MESSAGE_TYPE = SSDP_ALIVE | SSDP_BYEBYE | SSDP_UPDATE | SSDP_ALL;
export declare type SSDP_HEADER = {
    NT: string;
    NTS: SSDP_MESSAGE_TYPE;
    USN: string;
    SERVER: string;
    LOCATION: string;
    CacheControl: number;
};
export declare type SSDP_MESSAGE = {
    method: string;
    status: string;
    statusCode: number;
    firstLine: string[];
    headers: SSDP_HEADER;
    raw: string;
};
