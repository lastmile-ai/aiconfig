// From https://github.com/microsoft/TypeScript/issues/1897
export type JSONPrimitive = string | number | boolean | null | undefined;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONObject = { [member: string]: JSONValue | any };
export type JSONArray = JSONValue[];
