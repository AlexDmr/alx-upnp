import * as xmldom from "xmldom";
import {byteLength, SOAP_ENV_POST, SOAP_ENV_PRE} from "./SoapUtils";
import * as http from "http";

const xmlSerializer	= new xmldom.XMLSerializer();
const parserXML     = new xmldom.DOMParser();

export type ACTION_ARGUMENT = {
    name: string;
    direction: "in" | "out";
    relatedStateVariable: string;
}

export type ActionConfig = {
    actionXML: Element;
    serviceType: string;
    controlURL: string;
    host: string;
    port: string;
};

export type CALL_RESULT = {
    raw: string;
    out: Object;
}

export type ActionJSON = {
    name: string;
    serviceType: string;
    controlURL: string;
    args: ACTION_ARGUMENT[];
    host: string;
    port: string;
};

export class Action {
    private name: string;
    private doc: Document;
    private serviceType: string;
    private controlURL: string;
    private host: string;
    private port: string;
    private args: ACTION_ARGUMENT[] = [];

    constructor( {actionXML, serviceType, controlURL, host, port}: ActionConfig ) {
        this.name = actionXML.getElementsByTagName("name")[0].textContent;
        this.controlURL = controlURL;
        this.serviceType = serviceType;
        this.host = host;
        this.port = port;

        const argumentsXML = Array.from( actionXML.getElementsByTagName("argument") );
        this.args = argumentsXML.map( argumentXML => ({
            name: argumentXML.getElementsByTagName("name")[0].textContent,
            direction: argumentXML.getElementsByTagName("direction")[0].textContent as "in" | "out",
            relatedStateVariable: argumentXML.getElementsByTagName("relatedStateVariable")[0].textContent,
        }) );

        const str = `<u:${this.name} xmlns:u="${this.serviceType}"></u:${this.name}>`;
        this.doc = parserXML.parseFromString( str );
    }

    toJSON(): ActionJSON {
        return {
            name: this.name,
            serviceType: this.serviceType,
            controlURL: this.controlURL,
            args: this.args,
            host: this.host,
            port: this.port
        };
    }
    getName(): string {
        return this.name;
    }

    call(args: Object): Promise<CALL_RESULT> {
        return new Promise<CALL_RESULT>( (resolve, reject) => {
            // Clean arguments from DOM node
            while (this.doc.documentElement.childNodes.length) {
                this.doc.documentElement.removeChild( this.doc.documentElement.childNodes[0] );
            }

            // Append new arguments to the DOM node
            for (let name in args) {
                const node = this.doc.createElement(name);
                node.appendChild( this.doc.createTextNode(args[name]) );
                this.doc.documentElement.appendChild( node );
            }

            // Build message
            const s = [SOAP_ENV_PRE, xmlSerializer.serializeToString( this.doc ), SOAP_ENV_POST].join("").replace("\r\n", "\n").replace("\n", "\r\n");

            // Send message
            const options: http.RequestOptions = {
                host    : this.host,
                port    : this.port,
                path    : this.controlURL,
                method  : "POST",
                headers : {
                    "host"           : `${this.host}:${this.port}`,
                    "SOAPACTION"     :`"${this.serviceType}#${this.name}"`,
                    'CONTENT-TYPE'   : 'text/xml; charset="utf-8"',
                    "Content-Length" : byteLength(s)
                }
            };

            // console.log("SOAP ACTION\n", options, "\n", s);
            const req = http.request(options, (res) => {
                let buf = "";
                res.on('data', (chunk) => buf += chunk );
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        // console.error("Rejected SOAP action", buf);
                        reject(`Invalid SOAP action, code: ${res.statusCode}\n${buf}`);
                    }
                    else {
                        // console.log("SOAP response:\n", buf);
                        const doc = parserXML.parseFromString(buf, "text/xml" );
                        const result = {
                            raw: buf,
                            out: {}
                        };
                        const body = doc.getElementsByTagName("Body")[0] || doc.getElementsByTagName("s:Body")[0];
                        try {
                            if (body) {
                                const root: Node = body.childNodes[0].nodeName !== "#text" ? body.childNodes[0] : body.childNodes[1];
                                const children = Array.from(root.childNodes).filter(node => node.nodeName !== "#text");
                                children.forEach(C => result.out[C.nodeName] = C.textContent);
                                resolve(result);
                            } else {
                                reject("NO Body in doc");
                            }
                        } catch (err) {
                            console.error(err, body);
                            reject(err);
                        }
                    }
                });
            });
            req.on('error', err => {
                reject(`problem with calling ${this.name}: ${err.message}`);
            });
            req.end(s);
        });
    }
}
