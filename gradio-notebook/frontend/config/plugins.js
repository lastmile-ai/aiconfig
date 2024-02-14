import { svelte } from "@sveltejs/vite-plugin-svelte";
import { transform } from "sucrase";
import sucrase from "@rollup/plugin-sucrase";
import { join } from "path";
import react from "@vitejs/plugin-react";
import preprocessReact from "svelte-preprocess-react/preprocessReact";

const RE_SVELTE_IMPORT =
	/import\s+([\w*{},\s]+)\s+from\s+['"](svelte|svelte\/internal)['"]/g;
const RE_BARE_SVELTE_IMPORT = /import ("|')svelte(\/\w+)*("|')(;)*/g;
export const plugins = [

	react(),
	
	
	svelte({
		onwarn(warning, handler) {
			handler(warning);
		},
		prebundleSvelteLibraries: false,
		hot: true,
		compilerOptions: {
			discloseVersion: false,
		},
		preprocess: [
			{
				script: ({ attributes, filename, content }) => {
					if (attributes.lang === "ts") {
						const compiledCode = transform(content, {
							transforms: ["typescript"],
							keepUnusedImports: true,
						});
						return {
							code: compiledCode.code,
							map: compiledCode.sourceMap,
						};
					}
				},
			},
			preprocessReact()
		],
	}),
	sucrase({
		transforms: ["typescript"],
		include: ["**/*.ts", "**/*.tsx"],
	}),
	
];

export function make_gradio_plugin({
	mode,
	svelte_dir,
	backend_port,
	imports,
	component_dir,
}) {
	return {
		name: "gradio",
		enforce: "pre",
		transform(code) {
			const new_code = code
				.replace(RE_SVELTE_IMPORT, (str, $1, $2) => {
					const identifier = $1.trim().startsWith("* as")
						? $1.replace("* as", "").trim()
						: $1.trim();
					return `const ${identifier.replace(
						" as ",
						": ",
					)} = window.__gradio__svelte__internal;`;
				})
				.replace(RE_BARE_SVELTE_IMPORT, "");
			return {
				code: new_code,
				map: null,
			};
		},
		resolveId(id, importer) {
			if (
				id !== "svelte" &&
				id !== "svelte/internal" &&
				id.startsWith("svelte/")
			) {
				return join(svelte_dir, "svelte-submodules.js");
			}
		},
		transformIndexHtml(html) {
			return mode === "dev"
				? [
						{
							tag: "script",
							children: `window.__GRADIO_DEV__ = "dev";
        window.__GRADIO__SERVER_PORT__ = ${backend_port};
        window.__GRADIO__CC__ = ${imports};`,
						},
				  ]
				: undefined;
		},
	};
}