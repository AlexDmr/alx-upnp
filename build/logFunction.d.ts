export declare type LogFunction = (...args: any[]) => void;
export declare function setLogFunction(fct: LogFunction): void;
export declare function setLogErrorFunction(fct: LogFunction): void;
export declare const log: LogFunction;
export declare const logError: LogFunction;
