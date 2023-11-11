import { createLogger, format, transports } from "winston";

// Constants
const DEFAULT_TIMEOUT: number = 5; // Default timeout for callback execution in seconds

export class CallbackEvent {
  name: string;
  file: string;
  data: any;
  ts_ns: number;

  constructor(
    name: string,
    file: string,
    data: any,
    ts_ns: number = Date.now()
  ) {
    this.name = name;
    this.file = file;
    this.data = data;
    this.ts_ns = ts_ns;
  }
}

// Type Aliases
type Callback = (event: CallbackEvent) => Promise<any>;
// type Result = Ok<any> | Err<any>;

async function executeCoroutineWithTimeout(
  coroutine: Promise<any>,
  timeout: number
): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Error("Timeout"));
    }, timeout * 1000);

    coroutine
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        resolve(error);
      });
  });
}

export class CallbackManager {
  callbacks: Callback[];
  results: any[];
  timeout: number;

  constructor(callbacks: Callback[], timeout: number = DEFAULT_TIMEOUT) {
    this.callbacks = callbacks;
    this.results = [];
    this.timeout = timeout;
  }

  async runCallbacks(event: CallbackEvent): Promise<void> {
    const tasks = this.callbacks.map((callback) =>
      executeCoroutineWithTimeout(callback(event), this.timeout)
    );
    this.results = await Promise.all(tasks);
  }

  static createDefaultManager(): CallbackManager {
    const callback = createLoggingCallback("aiconfig.log");
    return new CallbackManager([callback]);
  }
}

function setupLogger(logFile: string = "callbacks.log") {
  const logger = createLogger({
    level: "info",
    format: format.combine(
      format.timestamp(),
      format.printf(
        (info) => `${info.timestamp} - ${info.level}: ${info.message}`
      )
    ),

    transports: [new transports.File({ filename: logFile })],
  });

  return logger;
}

// Function to create a logging callback
function createLoggingCallback(logFile?: string) {
  const logger = setupLogger(logFile);

  const callbackHandler: Callback = async (event: CallbackEvent) => {
    logger.info(`Callback called. Event: ${JSON.stringify(event)}`);
  };

  return callbackHandler;
}
