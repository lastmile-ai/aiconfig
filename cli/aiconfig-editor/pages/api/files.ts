import type { NextApiRequest, NextApiResponse } from "next";

import { promises as fs } from "fs";
import path from "path";
import { EditorFile } from "@/src/shared/types";

type Data = {
  files: EditorFile[];
};

type Error = {
  error: string;
};

type RequestBody = {
  path?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Error>
) {
  if (req.method !== "POST") {
    return res.status(500).json({ error: "Method not allowed" });
  }

  const body: RequestBody = req.body;

  const relativePath = body.path ? body.path : ".";

  const directoryToRead = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(process.cwd(), relativePath);

  const files = await fs.readdir(path.join(directoryToRead), {
    withFileTypes: true,
  });

  const filesResponse = files.map((file) => {
    const extension = path.extname(file.name);

    return {
      name: file.name,
      extension,
      path: file.path,
      isDirectory: file.isDirectory(),
    };
  });

  return res.status(200).json({ files: filesResponse });
}
