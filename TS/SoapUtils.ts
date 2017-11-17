export const SOAP_ENV_PRE = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<s:Envelope \
s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\" \
xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" \>\n<s:Body>\n";

export const SOAP_ENV_POST = "\n</s:Body>\n</s:Envelope>";

export function byteLength(str) {
    // returns the byte length of an utf8 string
    let s = str.length;
    for (let i=str.length-1; i>=0; i--) {
        const code = str.charCodeAt(i);
        if (code > 0x7f && code <= 0x7ff) s++;
        else if (code > 0x7ff && code <= 0xffff) s+=2;
        if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
    }
    return s;
}
