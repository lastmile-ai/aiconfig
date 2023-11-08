import { writeFileSync, appendFileSync } from "fs";
import { EventEmitter } from "events";

// TypeScript interfaces for type definitions
interface Result<T> {
  Ok?: T;
  Err?: string;
}

// Record class equivalent in TypeScript
class Record {
  readonly model_config: object;

  constructor(modelConfig: object) {
    this.model_config = Object.freeze(modelConfig);
  }
}

// CallbackEvent equivalent in TypeScript
class CallbackEvent {
  name: string;
  data: any;
  ts_ns: number;

  constructor(name: string, data: any, ts_ns: number = Date.now()) {
    this.name = name;
    this.data = data;
    this.ts_ns = ts_ns;
  }
}

// CallbackResult equivalent in TypeScript
class CallbackResult extends Record {
  result: any;

  constructor(result: any) {
    super({ strict: true });
    this.result = result;
  }
}

// Callback type equivalent in TypeScript
type Callback = (
  event: CallbackEvent,
  run_id: string
) => Promise<CallbackResult>;

async function runThunkSafe<T>(
  thunk: () => Promise<T>,
  timeout: number
): Promise<Result<T>> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ Err: "Timeout" });
    }, timeout);

    thunk()
      .then((response) => {
        clearTimeout(timer);
        resolve({ Ok: response });
      })
      .catch((error) => {
        clearTimeout(timer);
        resolve({ Err: error.message });
      });
  });
}

// CallbackManager equivalent in TypeScript
class CallbackManager {
  callbacks: ReadonlyArray<Callback>;
  results: Result<any>[];
  run_id: string | undefined;

  constructor(callbacks: ReadonlyArray<Callback>) {
    this.callbacks = callbacks;
    this.results = [];
    this.run_id = undefined;
  }

  async runCallbacks(event: CallbackEvent): Promise<void> {
    for (const callback of this.callbacks) {
      const result = await runThunkSafe(
        () => callback(event, this.run_id!),
        1000
      );
      this.results.push(result);
    }
  }

  resetRunState(run_id?: string): void {
    this.results = [];
    this.run_id = run_id;
  }

  static default(): CallbackManager {
    // Placeholder for the actual default callback, which would write to a JSON file
    const defaultCallback: Callback = async (
      event: CallbackEvent,
      run_id: string
    ) => {
      const dataEvent = event; // Assuming event has a method to dump itself to a model
      const dataWrite = { run_id, ...dataEvent };
      appendFileSync(
        "/var/logs/callbacks.json",
        JSON.stringify(dataWrite, null, 2) + "\n"
      );
      return new CallbackResult(0); // Placeholder for actual result
    };
    return new CallbackManager([defaultCallback]);
  }
}

// Serialization function
function safeSerializeJson(obj: any): string {
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === "object" && value !== null) {
        return value;
      }
      return `<<non-serializable: ${typeof value}>>`;
    },
    2
  );
}

// The to_json callback creator
function toJson(file: string) {
  return async (
    event: CallbackEvent,
    run_id: string
  ): Promise<CallbackResult> => {
    const dataEvent = event; // Again, assuming a method to dump the event
    const dataWrite = { run_id, ...dataEvent };
    appendFileSync(file, safeSerializeJson(dataWrite) + "\n");
    return new CallbackResult(0); // Placeholder for actual result
  };
}

export {
  CallbackManager,
  CallbackEvent,
  CallbackResult,
  toJson,
  safeSerializeJson,
};
