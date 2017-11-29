export type LogFunction = (...args: any[]) => void;
let logFct: LogFunction = () => {};
let logErr: LogFunction = () => {};

export function setLogFunction( fct: LogFunction ) {
    logFct = fct;
}

export function setLogErrorFunction( fct: LogFunction ) {
    logErr = fct;
}

export const log: LogFunction = ( ...args: any[] ): void => {
    logFct.apply(null, args);
}

export const logError: LogFunction = ( ...args: any[] ): void => {
    logErr.apply(null, args);
}
