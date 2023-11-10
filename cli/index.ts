// Use commander or whatever to start CLI
// Make it use dev mode for devserver, make it use built next app for regular usage
// aiconfig devserver
// aiconfig server

// Should be only two commands for now, then most of the work is going to be in the next app & packaging it up properly as a correct CLI / putting stuff into the regular npm package as well

import { program } from "commander";

program.option("--first").option("-s, --separator <char>");

program.parse();

const options = program.opts();
const limit = options.first ? 1 : undefined;
console.log(program.args[0].split(options.separator, limit));
