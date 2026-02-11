import { DiscussServiceClient } from "@google-ai/generativelanguage";
import { GoogleAuth } from "google-auth-library";




async function main() {
    const client = new DiscussServiceClient({
        authClient: new GoogleAuth().fromAPIKey("AIzaSyDrTHb-R2MRJE_Haa5-gh7O5uOY2tQ41Oc"),
      });
      
      const response = await client.generateMessage({
        model: "models/chat-bison-001",
      
        temperature: 0.9,
        topP: 0.9,
        prompt: { messages: [{ author: "0", content: "What is your favorite condiment? Respond with the answer in one word." }] },
        topK: null,
        candidateCount: null,
      });
      const util = require('util')
      console.log("response: ", util.inspect(response, {showHidden: false, depth: null}));
}

main()