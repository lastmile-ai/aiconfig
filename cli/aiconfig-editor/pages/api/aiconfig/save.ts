import type { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";
import { ErrorResponse } from "@/src/shared/serverTypes";
import { AIConfigRuntime } from "aiconfig";

type Data = {
  status: string;
};

type RequestBody = {
  path: string;
  aiconfig: any;
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

  // Construct the config and ensure proper serialization for saving
  const config = await AIConfigRuntime.loadJSON(body.aiconfig);
  config.save(body.path);

  res.status(200).json({ status: "ok" });
}
