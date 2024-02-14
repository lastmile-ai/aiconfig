import { join } from "path";
import * as fs from "fs";
import { createServer, createLogger } from "vite";
import { plugins, make_gradio_plugin } from "./plugins.js";
import { examine_module } from "./index.js";

const vite_messages_to_ignore = [
	"Default and named imports from CSS files are deprecated.",
	"The above dynamic import cannot be analyzed by Vite.",
];

const logger = createLogger();
const originalWarning = logger.warn;
logger.warn = (msg, options) => {
	if (vite_messages_to_ignore.some((m) => msg.includes(m))) return;

	originalWarning(msg, options);
};

export async function create_server({
	component_dir,
	root_dir,
	frontend_port,
	backend_port,
	host,
	gradio_path
}) {
	process.env.gradio_mode = "dev";
	const imports = generate_imports(component_dir, gradio_path);

	const NODE_DIR = join(root_dir, "..", "..", "node", "dev");
	const svelte_dir = join(root_dir, "assets", "svelte");

	try {
		const server = await createServer({
			// customLogger: logger,
			mode: "development",
			configFile: false,
			root: root_dir,
			define: {
				"process.env.NODE_ENV": JSON.stringify("development"),
			},
			build: {
				rollupOptions: { 
					external: ["bufferutil"]
				}
			},
			server: {
				port: frontend_port,
				host: host,
				fs: {
					allow: [root_dir, NODE_DIR, component_dir],
				},
			},
			plugins: [
				...plugins,
				make_gradio_plugin({
					mode: "dev",
					backend_port,
					svelte_dir,
					imports,
					component_dir,
				}),
			],
		});

		await server.listen();

		console.info(
			`[orange3]Frontend Server[/] (Go here): ${server.resolvedUrls?.local}`,
		);
	} catch (e) {
		console.error(e);
	}
}

function find_frontend_folders(start_path) {
	if (!fs.existsSync(start_path)) {
		console.warn("No directory found at:", start_path);
		return [];
	}

	if (fs.existsSync(join(start_path, "pyproject.toml"))) return [start_path];

	const results = [];
	const dir = fs.readdirSync(start_path);
	dir.forEach((dir) => {
		const filepath = join(start_path, dir);
		if (fs.existsSync(filepath)) {
			if (fs.existsSync(join(filepath, "pyproject.toml")))
				results.push(filepath);
		}
	});

	return results;
}

function to_posix(_path) {
	const isExtendedLengthPath = /^\\\\\?\\/.test(_path);
	const hasNonAscii = /[^\u0000-\u0080]+/.test(_path); // eslint-disable-line no-control-regex

	if (isExtendedLengthPath || hasNonAscii) {
		return _path;
	}

	return _path.replace(/\\/g, "/");
}

function generate_imports(component_dir, gradio_path) {
	const components = find_frontend_folders(component_dir);

	const component_entries = components.flatMap((component) => {
		return examine_module(component, gradio_path, "dev");
	});

	const imports = component_entries.reduce((acc, component) => {
		const pkg = JSON.parse(
			fs.readFileSync(join(component.frontend_dir, "package.json"), "utf-8"),
		);

		const exports = {
			component: pkg.exports["."],
			example: pkg.exports["./example"],
		};

		const example = exports.example
			? `example: () => import("${to_posix(
					join(component.frontend_dir, exports.example),
			  )}"),\n`
			: "";
		return `${acc}"${component.component_class_id}": {
			${example}
			component: () => import("${to_posix(component.frontend_dir)}")
			},\n`;
	}, "");

	return `{${imports}}`;
}