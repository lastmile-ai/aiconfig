import type { NextApiRequest, NextApiResponse } from "next";

import { promises as fs } from "fs";
import path from "path";
import { EditorFile } from "@/src/shared/types";

type Data = {
  files: EditorFile[];
};

type RequestBody = {
  path?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // TODO: Check method == POST to validate

  const body: RequestBody = req.body;

  console.log(body);
  if (body.path) {
    // TODO: Impl
    return res.status(200).json({ files: [] });
  } else {
    const files = (await fs.readdir(path.join(process.cwd(), "."), {
      withFileTypes: true,
    })) as unknown as EditorFile[];

    return res.status(200).json({ files });
  }
}
