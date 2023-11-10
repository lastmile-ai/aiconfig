import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { ufetch } from "ufetch";

type EditorFile = {
  name: string;
  extension: string;
  isFolder: boolean;
  disabled: boolean;
};

export default function Home() {
  // Get list of files in the currect directory; this should also use a path from the router to become a nested file tree that can be navigated
  const router = useRouter();

  const [path, setPath] = useState<undefined | string>(undefined);
  const [files, setFiles] = useState<EditorFile[]>([]);

  const getFiles = useCallback(async () => {
    const res = await ufetch.post("/api/files", { path });

    console.log(res);
  }, [path]);

  useEffect(() => {
    // Get files from current directory (will be whatever is passed as root directory when undefined, but needs to be handled server side
    getFiles();
  }, [getFiles]);

  const navigate = useCallback(() => {
    // If directory, then change path & also update the url route to add to history
    // If random file, should not be able to select
    // If aiconfig.json file, then open editor - can't actually detect yet, so will just try to parse
    // load_json
  }, []);

  const back = useCallback(() => {}, []);

  return (
    <>
      <Head>
        <title>AIConfig Editor</title>
        <meta name="description" content="AIConfig editor and utilities" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <div>Test</div>
        <Link href="/editor?path=/Users/suyogsonwalkar/Projects">Editor</Link>
      </main>
    </>
  );
}
