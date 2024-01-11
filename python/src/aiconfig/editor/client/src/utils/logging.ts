import * as uuid from "uuid";


export function generateUniqueSessionId(): string {
    return uuid.v4();
}