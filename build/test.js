"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const socketIO = require("socket.io"); // Websocket server
const http = require("http"); // HTTP server
const path = require("path");
const control_point_1 = require("./control-point");
const Device_1 = require("./Device");
const logFunction_1 = require("./logFunction");
logFunction_1.setLogFunction(console.log);
logFunction_1.setLogErrorFunction(console.error);
const CP = new control_point_1.ControlPoint();
const app = express();
// HTTP
const serverHTTP = http.createServer(app);
const portHTTP = process.env.PORT || 8080;
serverHTTP.listen(portHTTP, () => {
    console.log(`HTTP server running on port ${portHTTP}`);
});
// Static files
const staticPathTS = path.join(__dirname, "../TS");
const staticPathJS = path.join(__dirname);
console.log("staticPathTS", staticPathTS);
console.log("staticPathJS", staticPathJS);
app.use(express.static(staticPathTS));
app.use(express.static(staticPathJS));
const ioHTTP = socketIO(serverHTTP);
ioHTTP.on("connection", socket => {
    socket.emit("UPNP::devices", CP.getDevices().map(D => D.toJSON()));
    socket.on("call", (call, cbRes) => {
        // log("call", call);
        try {
            const device = Device_1.getDeviceFromUUID(call.deviceId);
            device.call(call).then(data => cbRes({ success: data }), err => {
                logFunction_1.logError("rejected", err);
                cbRes({ error: err });
            });
        }
        catch (err) {
            logFunction_1.logError("catch", err);
            cbRes({ error: err });
        }
    });
});
// Devices and events services
function sendEvent(device, service, SV, value) {
    const msg = {
        device: device.getUSN(),
        service: service.getId(),
        variable: SV.getName(),
        value: value
    };
    logFunction_1.log(msg);
    ioHTTP.emit("property", msg);
}
CP.subscribeToDeviceAppear((device) => {
    // OLD: device.subscribeToServices( evt => sendEvent(device, evt) );
    // Subscribe to every stateVariable of every service.
    device.getServices().forEach(S => {
        S.stateVariables.forEach(V => {
            V.getObservable().subscribe(value => {
                sendEvent(device, S, V, value);
            });
        });
    });
});
//# sourceMappingURL=test.js.map