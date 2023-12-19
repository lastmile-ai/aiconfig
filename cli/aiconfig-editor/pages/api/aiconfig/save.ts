import type { NextApiRequest, NextApiResponse } from "next";
import { ErrorResponse } from "@/src/shared/serverTypes";
import { AIConfig, AIConfigRuntime, Output } from "aiconfig";
import { ClientAIConfig } from "@/src/shared/types";

type Data = {
  status: string;
};

type RequestBody = {
  path: string;
  aiconfig: ClientAIConfig;
};

export default async function handler(
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

  if (!body.aiconfig) {
    return res.status(500).json({ error: "No aiconfig data provided" });
  }

  // TODO: Once ouputs are properly structured, remove this and use body.aiconfig directly
  const clientAIConfig = body.aiconfig;
  const config = {
    ...clientAIConfig,
    prompts: clientAIConfig.prompts.map((prompt) => ({
      ...prompt,
      outputs: prompt.outputs?.map((output) => {
        if (output.output_type === "execute_result") {
          const outputWithoutRenderData = { ...output, renderData: undefined };
          delete outputWithoutRenderData.renderData;
          return outputWithoutRenderData as Output;
        } else {
          return output as Output;
        }
      }),
    })),
  };

  // Construct the config and ensure proper serialization for saving
  const serializedConfig = await AIConfigRuntime.loadJSON(config);
  serializedConfig.save(body.path, { serializeOutputs: true });

  res.status(200).json({ status: "ok" });
}
