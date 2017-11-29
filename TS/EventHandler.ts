import * as http from "http";
import {networkInterfaceInfos} from "./netInterfaces";
import {NetworkInterfaceInfo} from "os";
import {ReSubscribeToService, UnSubscribeFromService, UPNP_SUBSCRIBE} from "./ServiceSubscription";
import {Observable, Subject} from "@reactivex/rxjs/dist/package";

import {logError, log} from "./logFunction";

// HTTP Server for receiving events
const server = http.createServer((req, res) => {
    serviceCallbackHandler(req, res);
});

server.listen(); // XXX check that a free port will be selected

export function getEventHandlerPort(): number {
    return server.address().port;
}

export function getCallcack_IP_RelatedTo(host: string): string {
    let IP = "127.0.0.1";
    const hostArray = host.split( "." );
    const netInterface: NetworkInterfaceInfo = networkInterfaceInfos.find( netInterface => {
        const adresseArray = netInterface.address.split( "." );
        return adresseArray[0] === hostArray[0]
            && adresseArray[1] === hostArray[1]
            && adresseArray[2] === hostArray[2] ;
    }) || networkInterfaceInfos.find( netInterface => {
        const adresseArray = netInterface.address.split( "." );
        return adresseArray[0] === hostArray[0]
            && adresseArray[1] === hostArray[1];
    });

    if(netInterface) {
        IP = netInterface.address;
    }
    return IP;
}

// Subscription
export type SubscriptionEvent = string;
export type SubscriptionHandler = ( event: SubscriptionEvent ) => void;
export type Subscription = {
    sid: string;
    timeout: number;
    timer: any;
    responseCount: number;
    eventSubject: Subject<SubscriptionEvent>;
    upnpSubscr: UPNP_SUBSCRIBE;
}
const mapSubscription = new Map<string, Subscription>();
const mapMissedEvent = new Map<string, string[]>();

export function SubscribeToEvent(sid: string, timeout: number, upnpSubscr: UPNP_SUBSCRIBE): Observable<SubscriptionEvent> {
    if (mapSubscription.has(sid)) {
        return mapSubscription.get(sid).eventSubject;
    }
    async function reSubscribe(subscription: Subscription) {
        try {
            const {sid: sid2, timeout: timeout2} = await ReSubscribeToService(subscription.sid, upnpSubscr);
            subscription.sid = sid2;
            subscription.timeout = timeout2;
            subscription.timer = setTimeout(() => reSubscribe(subscription), Math.max(30, (timeout2 - 30)) * 1000);
        } catch (err) {
            // Clean subscription
            mapSubscription.delete( subscription.sid );
            clearTimeout( subscription.timer );
            subscription.eventSubject.complete();
        }
    }
    const subscription: Subscription = {
        sid,
        timeout,
        timer: null,
        responseCount: 0,
        eventSubject: new Subject<SubscriptionEvent>(),
        upnpSubscr: upnpSubscr
    };
    subscription.timer = setTimeout(() => reSubscribe(subscription), Math.max(30, (timeout - 30))*1000);
    mapSubscription.set(sid, subscription);
    if (mapMissedEvent.has(sid)) {
        setTimeout(
            () => mapMissedEvent.get(sid).forEach(
                str => subscription.eventSubject.next( str )
            ),
            1
        );
    }
    return subscription.eventSubject.asObservable();
}

export function UnSubscribeFromEvent(sid: string) {
    const subscription: Subscription = mapSubscription.get(sid);
    if(subscription) {
        clearTimeout(subscription.timer);
        mapSubscription.delete(sid);
        const {host, port, path} = subscription.upnpSubscr;
        UnSubscribeFromService(sid, host, port, path);
    }
}

function serviceCallbackHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    let reqContent = "";
    req.on("data", buf => reqContent += buf );
    req.on("end", () => {
        try {
            // acknowledge the event notification
            res.writeHead	( 200 );
            res.end("");
            // log("Received event\n", req.headers, "\n", reqContent);
            const sid = req.headers.sid as string;
            const subscription: Subscription = mapSubscription.get(sid);
            if (subscription) {
                subscription.responseCount++;
                // log( "\tsubscription.handleEvent", subscription.handleEvent);
                subscription.eventSubject.next( reqContent );
            } else {
                log("PRECOCE EVENT FOR", sid);
                const missed = mapMissedEvent.has(sid) ? mapMissedEvent.get(sid) : [];
                missed.push(reqContent);
                mapMissedEvent.set(sid, missed);
            }
        } catch (ex) {
            if (ex.toString().startsWith("Error: Text data outside of root node.")) {
                // ignore
            }
            else {
                logError("exception: ", ex);
            }
        }
    });
}


