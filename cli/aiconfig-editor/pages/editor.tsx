import { useRouter } from "next/router";

export default function Editor() {
  // Use router to get the path, load the file using aicnofig.load, make it editable & use save to save it regularly
  const router = useRouter();

  return <div>Test Editor {router.query?.path || "No path specified"}</div>;
}
