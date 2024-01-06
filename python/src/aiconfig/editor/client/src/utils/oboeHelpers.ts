import oboe, { Options } from "oboe";

// Promisify Oboe - similar to this: https://stackoverflow.com/questions/54855494/rewrite-fetch-call-to-oboe-for-json-streams-with-typescript
// Except it allows to use .node('*', fn) & only resolves on done
// See https://medium.com/@amberlamps84/oboe-js-mongodb-express-node-js-and-the-beauty-of-streams-4a90fad5414 on using oboe vs raw streams
// (multiple chunks can be sent in single response & we only want valid json ones)
export async function streamingApi<T>(
  headers: Options,
  on: string = "*",
  fn: (data: unknown) => void,
  on2?: string,
  fn2?: (data: unknown) => void,
  on3?: string,
  fn3?: (data: unknown) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (fn2 && on2 && fn3 && on3) {
      oboe(headers)
        .node(on, fn)
        .node(on2, fn2)
        .node(on3, fn3)
        .done((data) => resolve(data))
        .fail((err) => reject(err.jsonBody));
    } else if (fn2 && on2) {
      oboe(headers)
        .node(on, fn)
        .node(on2, fn2)
        .done((data) => resolve(data))
        .fail((err) => reject(err.jsonBody));
    } else {
      oboe(headers)
        .node(on, fn)
        .done((data) => resolve(data))
        .fail((err) => reject(err.jsonBody));
    }
  });
}
