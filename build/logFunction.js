"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let logFct = () => { };
let logErr = () => { };
function setLogFunction(fct) {
    logFct = fct;
}
exports.setLogFunction = setLogFunction;
function setLogErrorFunction(fct) {
    logErr = fct;
}
exports.setLogErrorFunction = setLogErrorFunction;
exports.log = (...args) => {
    logFct.apply(null, args);
};
exports.logError = (...args) => {
    logErr.apply(null, args);
};
//# sourceMappingURL=logFunction.js.map