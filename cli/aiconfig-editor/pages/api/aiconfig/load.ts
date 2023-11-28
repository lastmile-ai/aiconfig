import type { NextApiRequest, NextApiResponse } from "next";
import { AIConfigRuntime } from "aiconfig";

type Data = {
  aiconfig: any;
};

type Error = {
  error: string;
};

type RequestBody = {
  path: string;
};

export default function handler(
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

  // TODO: Needed to add node-fetch to the dependencies of aiconfig-editor for this to work
  // This should be fixed up in library though?
  // TODO: load should probably be async?
  const aiconfig = AIConfigRuntime.load(body.path);

  res.status(200).json({ aiconfig });
}
