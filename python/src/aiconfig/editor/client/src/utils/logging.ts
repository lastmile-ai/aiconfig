import * as uuid from "uuid";


function generateUniqueSessionId(): string {
    return uuid.v4();
}