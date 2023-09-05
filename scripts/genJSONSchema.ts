import { resolve, join } from "path";
import { writeFileSync } from "fs";

import * as TJS from "typescript-json-schema";

// optionally pass argument to schema generator
const settings: TJS.PartialArgs = {
  required: true,
};

// optionally pass ts compiler options
const compilerOptions: TJS.CompilerOptions = {
  strictNullChecks: true,
};

// optionally pass a base path
const basePath = join(__dirname, "..");

const program = TJS.getProgramFromFiles(
  [resolve("types.ts")],
  compilerOptions,
  basePath
);

// We can either get the schema for one file and one type...
const schema = TJS.generateSchema(program, "AIConfig", settings);

const schemaJSON = JSON.stringify(schema, null, 2);
console.log(schemaJSON);

writeFileSync(join(basePath, "schema", "aiconfig.schema.json"), schemaJSON);

// // ... or a generator that lets us incrementally get more schemas

// const generator = TJS.buildGenerator(program, settings)!;

// // generator can be also reused to speed up generating the schema if usecase allows:
// const schemaWithReusedGenerator = TJS.generateSchema(
//   program,
//   "MyType",
//   settings,
//   [],
//   generator
// );

// // all symbols
// const symbols = generator.getUserSymbols();

// Get symbols for different types from generator.
// generator.getSchemaForSymbol("MyType");
// generator.getSchemaForSymbol("AnotherType");
