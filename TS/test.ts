import * as express from "express";
import * as socketIO from "socket.io";          // Websocket server
import * as http from "http";                   // HTTP server
import * as path from "path";

import {ControlPoint} from "./control-point";
import {Device, getDeviceFromUUID, SERVICE_EVENT} from "./Device";
import {byteLength} from "./SoapUtils";
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
        // console.log("call", call);
        try {
            const device = getDeviceFromUUID(call.deviceId);
            device.call(call).then(
                data => cbRes( {success: data} ),
                err => {
                    console.error("rejected", err);
                    cbRes( {error: err} );
                }
            );
        } catch (err) {
            console.error("catch", err);
            cbRes( {error: err} );
        }
    })
});

// Devices and events services
function sendEvent(device: Device, evt: SERVICE_EVENT) {
    ioHTTP.emit( "properties", Object.assign({device: device.getUSN()}, evt) );
}
CP.subscribeToDeviceAppear( (device: Device) => {
    device.subscribeToServices( evt => sendEvent(device, evt) );
});


