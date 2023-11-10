import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  // Get list of files in the currect directory; this should also use a path from the router to become a nested file tree that can be navigated

  return (
    <>
      <Head>
        <title>AIConfig Editor</title>
        <meta name="description" content="AIConfig editor and utilities" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <div>Test</div>
        <Link href="/editor?path=/Users/suyogsonwalkar/Projects">Editor</Link>
      </main>
    </>
  );
}
