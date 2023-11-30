import { DiscussServiceClient } from "@google-ai/generativelanguage";
import { GoogleAuth } from "google-auth-library";
import { AIConfigRuntime } from "../lib/config";

const MODEL_NAME = "models/chat-bison-001";
const API_KEY = process.env.API_KEY;

const client = new DiscussServiceClient({
  authClient: new GoogleAuth().fromAPIKey("AIzaSyDV_YJfFrOP3hORJvtg8rA4NSlWqobc9dM"),
});

async function main() {
  const result = await client.generateMessage({
    model: MODEL_NAME, // Required. The model to use to generate the result.
    temperature: 0.5, // Optional. Value `0.0` always uses the highest-probability result.
    candidateCount: 1, // Optional. The number of candidate results to generate.
    prompt: {
      // optional, preamble context to prime responses
      context: "Respond to all questions with a rhyming poem.",
      // Optional. Examples for further fine-tuning of responses.
      examples: [
        {
          input: { content: "What is the capital of California?" },
          output: {
            content: `If the capital of California is what you seek,
Sacramento is where you ought to peek.`,
          },
        },
      ],
      // Required. Alternating prompt/response messages.
      messages: [{ content: "How tall is the Eiffel Tower?" }],
    },
  });

  const util = require('util')
  console.log(util.inspect(result, false, null, true /* enable colors */))
  
}

main();

async function run(){
    const config = AIConfigRuntime.load()
}

run()