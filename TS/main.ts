import {getNetInterfacesIPv4} from "./netInterfaces";
import {ControlPoint} from "./control-point";
import { Service, StateVariable, CALL } from './Service';
import {Device} from "./Device";

const CP = new ControlPoint();

export function getControlPoint(): ControlPoint {
    return CP;
}

export type Service = Service;
export type Device = Device;
export type StateVariable = StateVariable;
export type CALL = CALL;