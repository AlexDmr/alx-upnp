import {getNetInterfacesIPv4} from "./netInterfaces";
import {ControlPoint} from "./control-point";
import { Service, StateVariable, ServiceJSON } from './Service';
import {Device, CALL, ICON, SERVICE_EVENT, CB_SERVICE_EVENT, DeviceJSON} from "./Device";
import {CALL_RESULT, ActionJSON, ACTION_ARGUMENT} from "./ServiceAction";

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
export type ActionJSON = ActionJSON;
export type ACTION_ARGUMENT = ACTION_ARGUMENT;
export type ServiceJSON = ServiceJSON;
export type DeviceJSON = DeviceJSON;
