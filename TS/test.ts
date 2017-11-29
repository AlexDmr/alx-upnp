import * as express from "express";
import * as socketIO from "socket.io";          // Websocket server
import * as http from "http";                   // HTTP server
import * as path from "path";

import {ControlPoint} from "./control-point";
import {Device, getDeviceFromUUID, SERVICE_EVENT} from "./Device";
import {Service, StateVariable} from "./Service";
import {byteLength} from "./SoapUtils";

import {log, logError, setLogFunction, setLogErrorFunction} from "./logFunction";


     setLogFunction( console.log   );
setLogErrorFunction( console.error );


const CP = new ControlPoint();


const app: express.Application = express();

// HTTP
const serverHTTP = http.createServer(app);
const portHTTP = process.env.PORT || 8080;
serverHTTP.listen(portHTTP, () => {
    console.log(`HTTP server running on port ${portHTTP}`);
});

// Static files
const staticPathTS = path.join(__dirname, "../TS" );
const staticPathJS = path.join(__dirname);
console.log("staticPathTS", staticPathTS);
console.log("staticPathJS", staticPathJS);
app.use( express.static( staticPathTS ) );
app.use( express.static( staticPathJS ) );

// Socket.IO
type CALL = {
    deviceId: string,
    serviceId: string,
    actionName: string,
    args: Object
}
const ioHTTP  = socketIO(serverHTTP );
ioHTTP.on( "connection", socket => {
    socket.emit("UPNP::devices", CP.getDevices().map(D => D.toJSON() ));
    socket.on("call", (call: CALL, cbRes) => {
        // log("call", call);
        try {
            const device = getDeviceFromUUID(call.deviceId);
            device.call(call).then(
                data => cbRes( {success: data} ),
                err => {
                    logError("rejected", err);
                    cbRes( {error: err} );
                }
            );
        } catch (err) {
            logError("catch", err);
            cbRes( {error: err} );
        }
    })
});

// Devices and events services
function sendEvent(device: Device, service: Service, SV: StateVariable, value: string) {
    const msg = {
        device  : device.getUSN(),
        service : service.getId(),
        variable: SV.getName(),
        value   : value
    };
    log(msg);
    ioHTTP.emit( "property", msg);
}
CP.subscribeToDeviceAppear( (device: Device) => {
    // OLD: device.subscribeToServices( evt => sendEvent(device, evt) );
    // Subscribe to every stateVariable of every service.
    device.getServices().forEach( S => {
        S.stateVariables.forEach( V => {
            V.getObservable().subscribe( value => {
                sendEvent(device, S, V, value);
            })
        });
    });
});


