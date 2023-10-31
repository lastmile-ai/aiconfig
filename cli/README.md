oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g aiconfig-cli
$ aiconfig COMMAND
running command...
$ aiconfig (--version)
aiconfig-cli/0.0.0 darwin-arm64 node-v20.3.0
$ aiconfig --help [COMMAND]
USAGE
  $ aiconfig COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`aiconfig hello PERSON`](#aiconfig-hello-person)
* [`aiconfig hello world`](#aiconfig-hello-world)
* [`aiconfig help [COMMANDS]`](#aiconfig-help-commands)
* [`aiconfig plugins`](#aiconfig-plugins)
* [`aiconfig plugins:install PLUGIN...`](#aiconfig-pluginsinstall-plugin)
* [`aiconfig plugins:inspect PLUGIN...`](#aiconfig-pluginsinspect-plugin)
* [`aiconfig plugins:install PLUGIN...`](#aiconfig-pluginsinstall-plugin-1)
* [`aiconfig plugins:link PLUGIN`](#aiconfig-pluginslink-plugin)
* [`aiconfig plugins:uninstall PLUGIN...`](#aiconfig-pluginsuninstall-plugin)
* [`aiconfig plugins:uninstall PLUGIN...`](#aiconfig-pluginsuninstall-plugin-1)
* [`aiconfig plugins:uninstall PLUGIN...`](#aiconfig-pluginsuninstall-plugin-2)
* [`aiconfig plugins update`](#aiconfig-plugins-update)

## `aiconfig hello PERSON`

Say hello

```
USAGE
  $ aiconfig hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/lastmile-ai/aiconfig/blob/v0.0.0/src/commands/hello/index.ts)_

## `aiconfig hello world`

Say hello world

```
USAGE
  $ aiconfig hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ aiconfig hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/lastmile-ai/aiconfig/blob/v0.0.0/src/commands/hello/world.ts)_

## `aiconfig help [COMMANDS]`

Display help for aiconfig.

```
USAGE
  $ aiconfig help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for aiconfig.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.20/src/commands/help.ts)_

## `aiconfig plugins`

List installed plugins.

```
USAGE
  $ aiconfig plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ aiconfig plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.9.4/src/commands/plugins/index.ts)_

## `aiconfig plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ aiconfig plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ aiconfig plugins add

EXAMPLES
  $ aiconfig plugins:install myplugin 

  $ aiconfig plugins:install https://github.com/someuser/someplugin

  $ aiconfig plugins:install someuser/someplugin
```

## `aiconfig plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ aiconfig plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ aiconfig plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.9.4/src/commands/plugins/inspect.ts)_

## `aiconfig plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ aiconfig plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ aiconfig plugins add

EXAMPLES
  $ aiconfig plugins:install myplugin 

  $ aiconfig plugins:install https://github.com/someuser/someplugin

  $ aiconfig plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.9.4/src/commands/plugins/install.ts)_

## `aiconfig plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ aiconfig plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help      Show CLI help.
  -v, --verbose
  --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ aiconfig plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.9.4/src/commands/plugins/link.ts)_

## `aiconfig plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ aiconfig plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ aiconfig plugins unlink
  $ aiconfig plugins remove
```

## `aiconfig plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ aiconfig plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ aiconfig plugins unlink
  $ aiconfig plugins remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.9.4/src/commands/plugins/uninstall.ts)_

## `aiconfig plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ aiconfig plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ aiconfig plugins unlink
  $ aiconfig plugins remove
```

## `aiconfig plugins update`

Update installed plugins.

```
USAGE
  $ aiconfig plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.9.4/src/commands/plugins/update.ts)_
<!-- commandsstop -->
