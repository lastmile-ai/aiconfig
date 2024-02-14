import { spawn, spawnSync } from "node:child_process";
import * as net from "net";
import fs from "fs";
import { create_server } from "./dev.js";
import { make_build } from "./build.js";
import { join } from "path";
import which from "which";

const args = process.argv.slice(2);
// get individual args as `--arg value` or `value`

function parse_args(args) {
	const arg_map = {};
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg.startsWith("--")) {
			const name = arg.slice(2);
			const value = args[i + 1];
			arg_map[name] = value;
			i++;
		}
	}
	return arg_map;
}

const parsed_args = parse_args(args);

async function run() {
	const gradio_path = spawnSync(
		"python",
		["-c", `"import gradio; print(gradio.__file__)"`],
		{
			shell: true,
			stdio: "pipe",
			encoding: "utf8",
		},
	).stdout.trim();

	const component_dir = join(process.cwd(), "..");
	const root = join(gradio_path, "..", "templates", "frontend");

	fs.cpSync(join(root), join(component_dir,"frontend", "node_modules", "__gradio__"), { recursive: true })
	if (parsed_args.mode === "build") {
		await make_build({
			component_dir,
			root_dir: join(component_dir,"frontend", "node_modules", "__gradio__"),
			gradio_path
		});
	} else {
		const [backend_port, frontend_port] = await find_free_ports(7860, 8860);
		const options = {
			component_dir,
			root_dir: join(component_dir,"frontend", "node_modules", "__gradio__"),
			frontend_port,
			backend_port,
			host: parsed_args.host,
			gradio_path,
			...parsed_args,
		};
		process.env.GRADIO_BACKEND_PORT = backend_port.toString();

		const app_path = join(options.component_dir, "demo", "app.py");

		const _process = spawn(
			which.sync("gradio"),
			[app_path, "--watch-dirs", options.component_dir],
			{
				shell: true,
				stdio: "pipe",
				cwd: options.component_dir,
				env: {
					...process.env,
					GRADIO_SERVER_PORT: backend_port.toString(),
					PYTHONUNBUFFERED: "true",
				},
			},
		);

		_process.stdout.setEncoding("utf8");
		_process.stderr.setEncoding("utf8");

		function std_out(mode) {
			return function (data) {
				const _data = data.toString();

				if (_data.includes("Running on")) {
					create_server({
						component_dir: options.component_dir,
						root_dir: options.root_dir,
						frontend_port,
						backend_port,
						host: options.host,
						gradio_path: options.gradio_path,
					});
				}

				process[mode].write(_data);
			};
		}

		_process.stdout.on("data", std_out("stdout"));
		_process.stderr.on("data", std_out("stderr"));
		_process.on("exit", () => kill_process(_process));
		_process.on("close", () => kill_process(_process));
		_process.on("disconnect", () => kill_process(_process));
	}
}

function kill_process(process) {
	process.kill("SIGKILL");
}

export { create_server };

run();

export async function find_free_ports(start_port, end_port) {
	let found_ports = [];

	for (let port = start_port; port < end_port; port++) {
		if (await is_free_port(port)) {
			found_ports.push(port);
			if (found_ports.length === 2) {
				return [found_ports[0], found_ports[1]];
			}
		}
	}

	throw new Error(
		`Could not find free ports: there were not enough ports available.`,
	);
}

export function is_free_port(port) {
	return new Promise((accept, reject) => {
		const sock = net.createConnection(port, "127.0.0.1");
		sock.once("connect", () => {
			sock.end();
			accept(false);
		});
		sock.once("error", (e) => {
			sock.destroy();
			//@ts-ignore
			if (e.code === "ECONNREFUSED") {
				accept(true);
			} else {
				reject(e);
			}
		});
	});
}

function is_truthy(value) {
	return value !== null && value !== undefined && value !== false;
}

export function examine_module(component_dir, gradio_path, mode) {
	const _process = spawnSync(
		which.sync("python"),
		[join(gradio_path, "..", "node", "examine.py"), "-m", mode],
		{
			cwd: join(component_dir, "backend"),
			stdio: "pipe",
		},
	);

	return _process.stdout
		.toString()
		.trim()
		.split("\n")
		.map((line) => {
			const [name, template_dir, frontend_dir, component_class_id] =
				line.split("~|~|~|~");
			if (name && template_dir && frontend_dir && component_class_id) {
				return {
					name: name.trim(),
					template_dir: template_dir.trim(),
					frontend_dir: frontend_dir.trim(),
					component_class_id: component_class_id.trim(),
				};
			}
			return false;
		})
		.filter(is_truthy);
}