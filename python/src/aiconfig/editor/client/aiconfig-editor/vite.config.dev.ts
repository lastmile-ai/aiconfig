import { PROD_CONFIG } from "./vite.config";
import { LibraryOptions, defineConfig } from "vite";

// vite build --watch expects a watch/index.html entrypoing even for library builds.
// But setting 'watch' in build config is an alternate way to watch changes to files,
// so use this dev config for dev builds.
export default defineConfig({
  ...PROD_CONFIG,
  build: {
    ...PROD_CONFIG.build,
    lib: {
      ...(PROD_CONFIG.build!.lib as LibraryOptions),
      formats: ["es"], // LocalEditor only needs uses ES module format
    },
    watch: {
      include: "src/**", // Watches the specified files for changes.
    },
  },
});
