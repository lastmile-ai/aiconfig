import urlJoin from "url-join";

// TODO: Figure out how to dynamically set this based on port specified by script
const ENDPOINT = "http://localhost:8080";

const API_ENDPOINT = `${ENDPOINT}/api`;

export const ROUTE_TABLE = {
  LOAD: urlJoin(API_ENDPOINT, "/load"),
};
