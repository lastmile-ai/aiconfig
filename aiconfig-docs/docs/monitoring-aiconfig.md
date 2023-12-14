---
sidebar_position: 8
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import constants from '@site/core/tabConstants';

# Tracing and Monitoring

Event callbacks provide in-depth tracing of `aiconfig` operations, and allow hooks for debuggability and monitoring.

The AIConfig SDK has a `CallbackManager` class which can be used to register callbacks that trace prompt resolution, serialization, deserialization, and model inference, as well as intermediate steps.

This lets you get a stack trace of what's going on under the covers, which is especially useful for complex control flow operations.

:::note
Anyone can register a callback, and filter for the events you care about. You can subsequently use these callbacks to integrate with your own monitoring and observability systems.
:::

<p align="center">
<video controls height="480" width="800">
    <source src="https://github.com/lastmile-ai/aiconfig/assets/141073967/ce909fc4-881f-40d9-9c67-78a6682b3063"/>
  </video>
</p>

## Creating custom callbacks

Custom callbacks are functions that conform to the Callback type. They receive a CallbackEvent object containing event details, and return a Promise. Here's an example of a simple logging callback:

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```python title="app.py"
from aiconfig import AIConfigRuntime, CallbackEvent, CallbackManager

async def my_custom_callback(event: CallbackEvent) -> None:
  print(f"Event triggered: {event.name}", event)
```

</TabItem>
<TabItem value="node">

```typescript title="app.ts"
import { Callback, CallbackEvent } from "aiconfig";

const myCustomCallback: Callback = async (event: CallbackEvent) => {
  console.log(`Event triggered: ${event.name}`, event);
};
```

</TabItem>
</Tabs>

## Registering Callbacks

:::info
By default, a CallbackManager is set up which logs all events to to `aiconfig.log`. This is useful for local debugging.
:::

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```python title="app.py"
from aiconfig import AIConfigRuntime, CallbackEvent, CallbackManager
config = AIConfigRuntime.load('aiconfig.json')

async def my_custom_callback(event: CallbackEvent) -> None:
  print(f"Event triggered: {event.name}", event)

callback_manager = CallbackManager([my_custom_callback])
config.set_callback_manager(callback_manager)

await config.run("prompt_name")
```

</TabItem>
<TabItem value="node">

```typescript title="app.ts"
import * as path from "path";
import {
  AIConfigRuntime,
  Callback,
  CallbackEvent,
  CallbackManager,
} from "aiconfig";

const config = AIConfigRuntime.load(path.join(__dirname, "aiconfig.json"));

const myCustomCallback: Callback = async (event: CallbackEvent) => {
  console.log(`Event triggered: ${event.name}`, event);
};

const callbackManager = new CallbackManager([myCustomCallback]);
config.setCallbackManager(callbackManager);

await config.run("prompt_name");
```

</TabItem>
</Tabs>

## Structure of a `CallbackEvent`

Each `CallbackEvent` is an object of the CallbackEvent type, containing:

- `name`: The name of the event (e.g., "on_resolve_start").
- `file`: The source file where the event is triggered
- `data`: An object containing relevant data for the event, such as parameters or results.
- `ts_ns`: An optional timestamp in nanoseconds.

### Sample output:

```
Event triggered: on_resolve_start
CallbackEventModel(name='on_resolve_start', file='/Users/John/Projects/aiconfig/python/src/aiconfig/Config.py', data={'prompt_name': 'get_activities', 'params': None}, ts_ns=1700094936363867000)
```

## Triggering Callbacks

Callbacks are automatically triggered at specific points in the AIConfigRuntime flow. For example, when the resolve method is called on an AIConfigRuntime instance, it triggers on_resolve_start and on_resolve_end events, which are then passed to the CallbackManager to execute any associated callbacks.

Similarly, ModelParsers should trigger their own events when serializing, deserializing, and running inference. These events are also passed to the CallbackManager to execute any associated callbacks.

#### Handling Callbacks with Timers

The CallbackManager uses a timeout mechanism to ensure callbacks do not hang indefinitely. If a callback does not complete within the specified timeout, it is aborted, and an error is logged. This timeout can be adjusted in the CallbackManager constructor and defaults to 5s if not specified.

<Tabs groupId="aiconfig-language" queryString defaultValue={constants.defaultAIConfigLanguage} values={constants.aiConfigLanguages}>
<TabItem value="python">

```python
custom_timeout = 10; # 10 seconds
callback_manager = CallbackManager([my_logging_callback], custom_timeout)
```

</TabItem>
<TabItem value="node">

```typescript
const customTimeout = 10;
const callbackManager = new CallbackManager(callbacks, customTimeout);
```

</TabItem>
</Tabs>

#### Error Handling

Custom callbacks should include error handling to manage exceptions. Errors thrown within callbacks are caught by the CallbackManager and can be logged or handled as needed.
