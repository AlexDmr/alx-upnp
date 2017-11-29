import {get} from "request-promise-native";
import {TLS_SSL} from "./TLS_SSL";
import * as xmldom from "xmldom";
import {Action, CALL_RESULT} from "./ServiceAction";
import {SubscribeToEvent, SubscriptionEvent, UnSubscribeFromEvent} from "./EventHandler";
import {getRelativeAdress, SubscribeToService, UPNP_SUBSCRIBE} from "./ServiceSubscription";

import {Observable} from "@reactivex/rxjs/dist/package/Observable";
import {Subject} from "@reactivex/rxjs/dist/package/Subject";
import {Subscription} from "@reactivex/rxjs/dist/package/Subscription";
import {BehaviorSubject, Observer} from "@reactivex/rxjs/dist/package";

import {logError, log} from "./logFunction";

const parserXML = new xmldom.DOMParser();

export type CALL = {
    actionName: string,
    args: Object
}

export class StateVariable {
    private subject = new BehaviorSubject<string>("");
    private sendEvents: boolean;
    private name: string;
    private dataType: string;

    constructor( SV_XML: Element ) {
        this.name       = SV_XML.getElementsByTagName("name"    )[0].textContent;
        this.dataType   = SV_XML.getElementsByTagName("dataType")[0].textContent;
        this.sendEvents = SV_XML.getAttribute("sendEvents").toLowerCase()==="yes";
    }

    toJSON() {
        return {
            sendEvents: this.sendEvents,
            name: this.name,
            dataType: this.dataType,
            value: this.subject.getValue()
        };
    }

    updateValue(value: string) {
        this.subject.next(value);
    }

    getName(): string {
        return this.name;
    }

    getDataType(): string {
        return this.dataType;
    }

    isSendingUPnPEvents(): boolean {
        return this.sendEvents;
    }

    getObservable(): Observable<string> {
        return this.subject.asObservable();
    }

}

export type ServiceConfig = {
    baseURL: string;
    serviceXML: Element;
    host: string;
    port: string;
}

export class Service {
    serviceType: string;
    serviceId: string;
    SCPDURL: string;
    controlURL: string;
    eventSubURL: string;
    raw: string;
    promiseDetails: Promise<this>;
    stateVariables = new Map<string, StateVariable>();
    private actions: Action[];
    private baseURL: string;
    private host: string;
    private port: string;
    private sid: string;
    private eventsObs: Observable<SubscriptionEvent>;
    // properties = new BehaviorSubject<Object>({});

    constructor( {baseURL, serviceXML, host, port}: ServiceConfig) {
        this.baseURL = baseURL;
        this.host = host;
        this.port = port;

        let node: Element;
        this.serviceId   = (node=serviceXML.getElementsByTagName("serviceId"  )[0])?node.textContent:"";
        this.serviceType = (node=serviceXML.getElementsByTagName("serviceType")[0])?node.textContent:"";
        this.SCPDURL     = (node=serviceXML.getElementsByTagName("SCPDURL"    )[0])?node.textContent:"";
        this.controlURL  = (node=serviceXML.getElementsByTagName("controlURL" )[0])?node.textContent:"";
        this.eventSubURL = (node=serviceXML.getElementsByTagName("eventSubURL")[0])?node.textContent:"";

        this.SCPDURL     = this.getCompleteAdress( this.SCPDURL     );
        this.controlURL  = getRelativeAdress( this.controlURL  );
        this.eventSubURL = getRelativeAdress( this.eventSubURL );

        this.promiseDetails = this.getServiceDetails();
        this.promiseDetails.then(
            () => this.subscribeToEvents(),
            err => console.error("Impossible to get service details...")
        )
    }

    dispose() {
        UnSubscribeFromEvent( this.sid );
    }

    toJSON() {
        return {
            serviceType: this.serviceType,
            serviceId: this.serviceId,
            SCPDURL: this.SCPDURL,
            controlURL: this.controlURL,
            eventSubURL: this.eventSubURL,
            stateVariables: Array.from( this.stateVariables.values() ).map( S => S.toJSON() ),
            actions: this.actions.map( A => A.toJSON() ),
            baseURL: this.baseURL,
            host: this.host,
            port: this.port,
            // properties: this.properties.getValue()
        };
    }

    call(C: CALL): Promise<CALL_RESULT> {
        const action = this.actions.find(A => A.getName() === C.actionName);
        return action.call(C.args);
    }

    getId(): string {
        return this.serviceId;
    }

    getType(): string {
        return this.serviceType;
    }

    getDescription(): Promise<this> {
        return this.promiseDetails;
    }

    /* getPropertiesObs(): Observable<Object> {
        return this.properties.asObservable();
    }*/

    updateProperty(propName: string, value: string) {
        const SV = this.stateVariables.get(propName);
        SV.updateValue( value );
    }

    private async subscribeToEvents() {
        const upnpSubscr: UPNP_SUBSCRIBE = {host: this.host, port: this.port, path: this.eventSubURL};
        try {
            const {sid, timeout} = await SubscribeToService(upnpSubscr);
            this.sid = sid;
            this.eventsObs = SubscribeToEvent(sid, timeout, upnpSubscr);
            this.eventsObs.subscribe(str => {
                log("EVENT", str);
                const doc = parserXML.parseFromString(str, "text/xml");
                let properties: Element[] = Array.from( doc.getElementsByTagName("property") );
                if(properties.length === 0) {
                    properties = Array.from( doc.getElementsByTagName("e:property") );
                }
                // const objProperties = {};
                properties.forEach( P => {
                    const tag = P.getElementsByTagName("*")[0];
                    const propName = tag.nodeName.split(":").reverse()[0]
                    // objProperties[propName] = tag.textContent;
                    const SV = this.stateVariables.get(propName);
                    if (SV) {
                        SV.updateValue( tag.textContent ); // objProperties[propName] );
                    }
                });
                /* log("EVENT", objProperties);
                const newProperties = Object.assign({}, this.properties.getValue(), objProperties);
                this.properties.next( newProperties ); */
            } );
        } catch(err) {
            logError(err);
        }
    }

    private getCompleteAdress(ad: string): string {
        let location = ad.slice();
        if (location.indexOf("http") !== 0 && location.indexOf("https://") !== 0) {
            if (location.indexOf("/") === 0) {
                location = `${this.baseURL}${location}`;
            } else {
                location = `${this.baseURL}/${location}`;
            }
        }
        return location;
    }

    private getServiceDetails(): Promise<this> {
        let location = this.SCPDURL;
        let objRequest: any = {uri: location};
        if (TLS_SSL && location.indexOf("https://") === 0) {
            objRequest.cert = TLS_SSL.cert;
            objRequest.key = TLS_SSL.key;
            objRequest.securityOptions = 'SSL_OP_NO_SSLv3';
        }
        return get(objRequest).then(data => {
            this.raw = data;
            const doc = parserXML.parseFromString(data, "text/xml");
            if (doc) {
                let node: Element;
                // Get state variables
                const stateVariablesXML = Array.from( doc.getElementsByTagName("stateVariable") );
                stateVariablesXML.map( SV_XML => new StateVariable(SV_XML) ).forEach( SV => {
                    this.stateVariables.set(SV.getName(), SV);
                });

                // Get actions
                this.actions = Array.from(
                    doc.getElementsByTagName("action")
                ).map(
                    actionXML => new Action( {
                        actionXML,
                        serviceType: this.serviceType,
                        controlURL: this.controlURL,
                        host: this.host,
                        port: this.port
                    } )
                ); // actionXML, this.serviceType, this.controlURL

                return this;
            } else {
                throw "Device document cannot be parsed or is empty";
            }
        }, err => {
            console.error("Error getting details from", location, "\n", err);
            return err;
        }).catch(err => {
            console.error("Error getting details from", location, "\n", err);
            return err;
        });    }
}


