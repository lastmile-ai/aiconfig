import urlJoin from "url-join";

// For development, run the python server at port 8080
// For prod, client is bundled and served by the python server at the same port as
// the server so use "/" as the host endpoint and the port doesn't matter
const HOST_ENDPOINT =
  process.env.NODE_ENV === "development" ? "http://localhost:8080" : "";

const API_ENDPOINT = `${HOST_ENDPOINT}/api`;

export const ROUTE_TABLE = {
  LOAD: urlJoin(API_ENDPOINT, "/load"),
};
