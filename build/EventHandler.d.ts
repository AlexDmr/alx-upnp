import { UPNP_SUBSCRIBE } from "./ServiceSubscription";
import { Observable, Subject } from "@reactivex/rxjs/dist/package";
export declare function getEventHandlerPort(): number;
export declare function getCallcack_IP_RelatedTo(host: string): string;
export declare type SubscriptionEvent = string;
export declare type SubscriptionHandler = (event: SubscriptionEvent) => void;
export declare type Subscription = {
    sid: string;
    timeout: number;
    timer: any;
    responseCount: number;
    eventSubject: Subject<SubscriptionEvent>;
    upnpSubscr: UPNP_SUBSCRIBE;
};
export declare function SubscribeToEvent(sid: string, timeout: number, upnpSubscr: UPNP_SUBSCRIBE): Observable<SubscriptionEvent>;
export declare function UnSubscribeFromEvent(sid: string): void;
