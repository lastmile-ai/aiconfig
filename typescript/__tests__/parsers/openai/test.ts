import OpenAI from "openai";

const client = new OpenAI();

async function main() {
  const response = await client.chat.completions.create({
    messages: [{ content: "Hi! Tell me 10 cool things to do in NYC.", role: "user" }],
    model: "gpt-3.5-turbo",
    temperature: 1,
    top_p: 1,
  });

  const util = require('util');
    console.log(util.inspect(response, false, null, true /* enable colors */))
  
}

main()