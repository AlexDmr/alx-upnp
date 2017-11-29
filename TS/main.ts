import {getNetInterfacesIPv4} from "./netInterfaces";
import {ControlPoint} from "./control-point";
import { Service, StateVariable } from './Service';
import {Device, CALL, ICON, SERVICE_EVENT, CB_SERVICE_EVENT} from "./Device";
import {CALL_RESULT} from "./ServiceAction";

const CP = new ControlPoint();

export function getControlPoint(): ControlPoint {
    return CP;
}

export type Service = Service;
export type Device = Device;
export type StateVariable = StateVariable;
export type CALL = CALL;
export type ICON = ICON;
export type SERVICE_EVENT = SERVICE_EVENT;
export type CB_SERVICE_EVENT = CB_SERVICE_EVENT;
export type CALL_RESULT = CALL_RESULT;
