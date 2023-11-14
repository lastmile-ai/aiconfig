import { AIConfigRuntime } from "../lib/config";

async function main() {
const config =  AIConfigRuntime.load("/Users/ankush/Projects/aiconfig/typescript/__tests__/samples/basic_chatgpt_query_config.json")
config.run("prompt1")
}
main()