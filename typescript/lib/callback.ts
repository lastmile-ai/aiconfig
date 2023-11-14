import { createLogger, format, transports } from "winston";

// Constants
const DEFAULT_TIMEOUT_SECONDS: number = 5; // Default timeout for callback execution in seconds

export interface CallbackEvent {
  name: string;
  // The name of the file that triggered the event.
  file: string;
  // Anything available at the time the event happens. It is passed to the callback
  data: any;
  // Timestamp in nanoseconds. Use Date.now()
  ts_ns?: number;
}

// Type Aliases
type Callback = (event: CallbackEvent) => Promise<any>;
// type Result = Ok<any> | Err<any>;

async function withTimeout(
  promise: Promise<any>,
  timeout: number
): Promise<any> {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("Timeout"));
    }, timeout * 1000);
  });

  return Promise.race([promise, timeoutPromise]);
}

export class CallbackManager {
  callbacks: Callback[];
  results: any[];
  timeout: number;

  constructor(
    callbacks: Callback[],
    timeout: number = DEFAULT_TIMEOUT_SECONDS
  ) {
    this.callbacks = callbacks;
    this.results = [];
    this.timeout = timeout;
  }

  async runCallbacks(event: CallbackEvent): Promise<void> {
    const tasks = this.callbacks.map((callback) =>
      withTimeout(callback(event), this.timeout)
    );
    this.results = await Promise.all(tasks);
  }

  static createManagerWithLogging(
    filePath: string = "aiconfig.log"
  ): CallbackManager {
    const callback = createLoggingCallback(filePath);
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
