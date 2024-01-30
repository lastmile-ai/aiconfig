import oboe, { Options } from "oboe";

// Promisify Oboe - similar to this: https://stackoverflow.com/questions/54855494/rewrite-fetch-call-to-oboe-for-json-streams-with-typescript
// Except it allows to use .node('keyname', fn) & only resolves on done
// See https://medium.com/@amberlamps84/oboe-js-mongodb-express-node-js-and-the-beauty-of-streams-4a90fad5414 on using oboe vs raw streams
// (multiple chunks can be sent in single response & we only want valid json ones)
export async function streamingApiChain<T>(
  headers: Options,
  chain: { [on: string]: (data: unknown) => void }
): Promise<T> {
  return new Promise((resolve, reject) => {
    let oboeInstance = oboe(headers);
    Object.keys(chain).forEach((on) => {
      const fn = chain[on];
      oboeInstance = oboeInstance.node(on, fn);
    });

    oboeInstance
      .done((data) => resolve(data))
      .fail((err) => reject(err.jsonBody));
  });
}
