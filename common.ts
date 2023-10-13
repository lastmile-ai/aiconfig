// From https://github.com/microsoft/TypeScript/issues/1897
export type JSONPrimitive = string | number | boolean | null | unknown;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONObject = { [member: string]: JSONValue };
export type JSONArray = JSONValue[];
