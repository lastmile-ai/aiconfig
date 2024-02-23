import { Mutex } from "async-mutex";
import { getPortPromise } from "portfinder";

/**
 * Super simple class to manage server port allocation using a lock mechanism. If
 * we don't do this, restarting multiple servers simultaneously can result in
 * obtaining the same port for multiple servers.
 */
class ServerPortManager {
  private lock;

  constructor() {
    this.lock = new Mutex();
  }

  async getPort(): Promise<number> {
    const release = await this.lock.acquire();
    const port = await getPortPromise();
    release();
    return port;
  }
}

const serverPortManager = new ServerPortManager();
export default serverPortManager;
