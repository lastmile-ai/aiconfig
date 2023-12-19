import type { NextApiRequest, NextApiResponse } from "next";
import { AIConfigRuntime } from "aiconfig";
import { ErrorResponse } from "@/src/shared/serverTypes";
import {
  ClientAIConfig,
  ClientExecuteResult,
  ClientPromptOutput,
} from "@/src/shared/types";

type Data = {
  aiconfig: ClientAIConfig;
};

type RequestBody = {
  path: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(500).json({ error: "Method not allowed" });
  }

  const body: RequestBody = req.body;

  if (!body.path) {
    return res.status(500).json({ error: "No path provided" });
  }

  // TODO: load should probably be async?
  const aiconfig = AIConfigRuntime.load(body.path);

  // Refine outputs for client-side rendering. We only care about displaying (and deleting)
  // outputs directly from the editor
  const clientAIConfig: ClientAIConfig = {
    ...aiconfig,
    prompts: aiconfig.prompts.map((prompt) => ({
      ...prompt,
      outputs: prompt.outputs?.map((output) => {
        if (output.output_type === "execute_result") {
          const text = aiconfig.getOutputText(prompt, output);
          if (text) {
            // TODO: Once AIConfig output types are updated to be more structured, revisit and
            // ideally remove Client-specific types
            return {
              ...output,
              renderData: {
                type: "text",
                text,
              },
            } as ClientExecuteResult;
          }
        }
        return output as ClientPromptOutput;
      }),
    })),
  };

  res.status(200).json({ aiconfig: clientAIConfig });
}
