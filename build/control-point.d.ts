/// <reference types="node" />
import { AddressInfo, Socket } from "dgram";
import { Device } from "./Device";
import { Observer, Subscription } from "@reactivex/rxjs";
import { Observable } from '@reactivex/rxjs/dist/package';
export declare class ControlPoint {
    server: Socket;
    constructor();
    getObsDeviceAppears(): Observable<Device>;
    getObsDeviceDisappears(): Observable<Device>;
    subscribeToDeviceAppear(obs: Observer<Device>): Subscription;
    subscribeToDeviceDisappear(obs: Observer<Device>): Subscription;
    getDevices(): Device[];
    search(st?: string): void;
    onRequestMessage(msg: Buffer, rinfo: AddressInfo): void;
    private createDgramClientForNetInterface(NI, st);
    private pipoParseHTTP_header(str);
}
