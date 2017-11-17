import {getNetInterfacesIPv4} from "./netInterfaces";
import {ControlPoint} from "./control-point";

const CP = new ControlPoint();

export function getControlPoint(): ControlPoint {
    return CP;
}