/// <reference types="node" />
import { AddressInfo, Socket } from "dgram";
import { Device } from "./Device";
import { Observer, Subscription } from "@reactivex/rxjs";
export declare class ControlPoint {
    server: Socket;
    constructor();
    subscribeToDeviceAppear(obs: Observer<Device>): Subscription;
    subscribeToDeviceDisappear(obs: Observer<Device>): Subscription;
    getDevices(): Device[];
    search(st?: string): void;
    onRequestMessage(msg: Buffer, rinfo: AddressInfo): void;
    private createDgramClientForNetInterface(NI, st);
    private pipoParseHTTP_header(str);
}
