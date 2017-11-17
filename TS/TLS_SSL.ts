import * as fs from "fs-extra";
import * as path from "path";

export const TLS_SSL =	{
    key	: fs.readFileSync( path.join( __dirname, '../MM.pem'		) ),
    cert: fs.readFileSync( path.join( __dirname, '../certificat.pem') )
};
