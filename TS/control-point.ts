import {BROADCAST_ADDR, SSDP_ALL, SSDP_HEADER, SSDP_MESSAGE, SSDP_MESSAGE_TYPE, SSDP_MSEARCH, SSDP_PORT} from "./SSDP";
import {AddressInfo, createSocket, Socket} from "dgram";
import {getNetInterfacesIPv4} from "./netInterfaces";
import {createDevice, Device, getDevices, obsDeviceAppears, obsDeviceDisppears, removeDevice, updateDevice} from "./Device";
import {NetworkInterfaceInfo} from "os";
import {Observer, Subscription} from "@reactivex/rxjs";
import { Observable } from '@reactivex/rxjs/dist/package';

const RE_CacheControl = /= *([0-9]*)$/;

export class ControlPoint {
    server: Socket;

    constructor() {
        this.server = createSocket( { type: 'udp4', reuseAddr: true } );
        this.server.on('message', (msg: Buffer, rinfo: AddressInfo) => this.onRequestMessage(msg, rinfo) );

        this.server.bind( SSDP_PORT, () => {
            getNetInterfacesIPv4().forEach( NI => {
                this.server.addMembership(BROADCAST_ADDR, NI.address);
            });
            this.server.setMulticastLoopback(true);
            this.server.setBroadcast		(true);
            console.log('UDP4 server addMembership ' + BROADCAST_ADDR);
            this.search();
        });
    }

    getObsDeviceAppears(): Observable<Device> {
        return obsDeviceAppears;
    }

    getObsDeviceDisappears(): Observable<Device> {
        return obsDeviceDisppears;
    }

    subscribeToDeviceAppear(obs: Observer<Device>): Subscription {
        return obsDeviceAppears.subscribe( obs );
    }

    subscribeToDeviceDisappear(obs: Observer<Device>): Subscription {
        return obsDeviceDisppears.subscribe( obs );
    }

    getDevices(): Device[] {
        return getDevices();
    }

    search(st = "ssdp:all") {
        getNetInterfacesIPv4().forEach( NI => {
            this.createDgramClientForNetInterface(NI, st);
        });
    }

    onRequestMessage(msg: Buffer, rinfo: AddressInfo) {
        const str = msg.toString('utf8');
        const res = this.pipoParseHTTP_header(str);

        switch(res.method.toUpperCase()) {
            case "HTTP/1.1":
            case "HTTP/1.0":
                createDevice(res);
                break;
            case 'NOTIFY':
                // console.log("NOTIFY:______________\n", str, "\n" , rinfo, "\n____________________________");
                switch (res.headers.NTS) {
                    case "ssdp:alive":
                        createDevice(res);
                        break;
                    case "ssdp:update":
                        updateDevice(res);
                        break;
                    case "ssdp:byebye":
                        removeDevice(res);
                        break;
                }
                // var event = UPNP_NTS_EVENTS[res.headers.nts.toLowerCase()];
                // if (event) {this.emit(event, res.headers);} else {console.log("NOTIFY", res.headers.nts);}
                break;
            default:
            // console.log("onRequestMessage", res.method);
        }
    }

    private createDgramClientForNetInterface(NI: NetworkInterfaceInfo, st: string): Socket {
        const client = createSocket({type: 'udp4'});
        client.on('message', (msg, rinfo) => {
            // console.log("Response to the MSEARCH !!!!", msg.toString('utf8'));
            this.onRequestMessage(msg, rinfo);
        } );
        client.bind( undefined, NI.address, () => {
            client.addMembership(BROADCAST_ADDR, NI.address);
            // client.setBroadcast(true);
            // client.setMulticastLoopback(true);
            const search = SSDP_MSEARCH.replace('%st', st).replace('%HOST', `${client.address().address}:${client.address().port}`);
            const message = new Buffer(search, "ascii");
            // console.log("MSEARCH at", client.address(), `\n${search}`);
            client.send(message, 0, message.length, SSDP_PORT, BROADCAST_ADDR);
            setTimeout	( () => {
                // console.log( "close multicast UDP client at IP", client.address());
                client.close();
            }, 6000);
        });
        return client;
    }

    private pipoParseHTTP_header(str: string): SSDP_MESSAGE {
        const lines = str.split("\r\n");
        const headers: SSDP_HEADER = {
            NT: "",
            NTS: null,
            USN: null,
            SERVER: "",
            LOCATION: "",
            CacheControl: 0
        };
        lines.forEach( line => {
            const pos = line.indexOf(':');
            if(pos >= 0) {
                const att = line.slice(0, pos).toUpperCase().trim();
                const val = line.slice(pos+1).trim();
                switch (att) {
                    case "NT"       : headers.NT        = val; break;
                    case "USN"      : headers.USN       = getUSN(val.toUpperCase()); break;
                    case "NTS"      : headers.NTS       = val.toLowerCase() as SSDP_MESSAGE_TYPE; break;
                    case "SERVER"   : headers.SERVER    = val; break;
                    case "LOCATION" : headers.LOCATION  = getLocation(val); break;
                    case "CACHE-CONTROL":
                        const resRE = RE_CacheControl.exec(val);
                        if (resRE) {
                            headers.CacheControl = parseInt( resRE[1] );
                        }
                }
            }
        });
        const A = lines[0].split(' ');
        return {
            method		: A[0] || '',
            status		: A[2] || '',
            statusCode	: parseInt(A[1]),
            firstLine	: A,
            headers	: headers,
            raw: str
        };
    }
}





function getUSN(usn: string): string {
    let udn = usn;
    if(udn) {
        const s = usn.split("::");
        if (s.length > 0) {
            udn = s[0];
        }

        if (udn.startsWith("uuid:")) {
            udn = udn.substring(5);
        }
    }
    return udn;
}

function getLocation(adress: string): string {
    if (adress.indexOf("http") === 0) {
        return adress;
    } else {
        return `http://${adress}`;
    }
}
