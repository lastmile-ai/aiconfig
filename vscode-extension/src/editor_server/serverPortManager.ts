import { Mutex } from "async-mutex";
import { getPortPromise } from "portfinder";

/**
 * Super simple class to manage server port allocation using a lock mechanism. If
 * we don't do this, restarting multiple servers simultaneously can result in
 * obtaining the same port for multiple servers.
 */
class ServerPortManager {
  private lock;
  private lowestPort = 8000;
  private highestPort = 8200;

  constructor() {
    this.lock = new Mutex();
  }

  async getPort(): Promise<number> {
    return await this.lock.runExclusive(async () => {
      const port = await getPortPromise({ port: this.lowestPort });
      // Restart if port reaches max
      this.lowestPort = port === this.highestPort ? this.lowestPort : port + 1;
      return port;
    });
  }
}

const serverPortManager = new ServerPortManager();
export default serverPortManager;
