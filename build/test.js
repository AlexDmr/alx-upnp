"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const socketIO = require("socket.io"); // Websocket server
const http = require("http"); // HTTP server
const path = require("path");
const control_point_1 = require("./control-point");
const Device_1 = require("./Device");
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
        // console.log("call", call);
        try {
            const device = Device_1.getDeviceFromUUID(call.deviceId);
            device.call(call).then(data => cbRes({ success: data }), err => {
                console.error("rejected", err);
                cbRes({ error: err });
            });
        }
        catch (err) {
            console.error("catch", err);
            cbRes({ error: err });
        }
    });
});
// Devices and events services
function sendEvent(device, evt) {
    ioHTTP.emit("properties", Object.assign({ device: device.getUSN() }, evt));
}
CP.subscribeToDeviceAppear((device) => {
    device.subscribeToServices(evt => sendEvent(device, evt));
});
//# sourceMappingURL=test.js.map