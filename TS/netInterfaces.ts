import {NetworkInterfaceInfo, networkInterfaces} from "os";

export const networkInterfaceInfos: NetworkInterfaceInfo[] = getNetInterfacesIPv4();

export function getNetInterfacesIPv4(): NetworkInterfaceInfo[] {
    const L: NetworkInterfaceInfo[] = [];
    const NI = networkInterfaces();
    for(let i in NI) {
        const LNI: NetworkInterfaceInfo[] = NI[i];
        L.push( ...LNI.filter( NI => /*NI.internal === false &&*/ NI.family === "IPv4") );
    }
    return L;
}
