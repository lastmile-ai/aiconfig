import type { NextApiRequest, NextApiResponse } from "next";
import { AIConfigRuntime } from "aiconfig";
import { promises as fs } from "fs";

type Data = {
  status: string;
};

type Error = {
  error: string;
};

type RequestBody = {
  path: string;
  aiconfig: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Error>
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

  // TODO: There's no save without creating aiconfig object, and no clean way of only updating specific portions
  // So ignore all of this & just save the json from the editor
  await fs.writeFile(body.path, JSON.stringify(body.aiconfig, null, 2));

  res.status(200).json({ status: "ok" });
}
