import EventEmitter from 'events';
import M from './Messages';

class ServiceProxy extends EventEmitter
{
  constructor(serviceName) {
    super();
    this.messageId = 0;
    this.promises = {};
    this.port = chrome.runtime.connect({ name: serviceName });
    this.onMessage = this._onMessage.bind(this);
    this.port.onMessage.addListener(this.onMessage);
  }

  dispose() {
    this.removeAllListeners();
    this.port.onMessage.removeListener(this.onMessage);
    this.port.disconnect();
    for (let promise of Object.values(this.promises)) {
      promise.reject(new Error('Proxy disposed.'));
    }
    this.promises = {};
  }

  get(target, prop, receiver) {
    if (this[prop]) {
      return this[prop];
    }

    const self = this;
    return function() {
      return new Promise((resolve, reject) => {
        self.promises[self.messageId] = {
          resolve,
          reject
        };
        const message = {
          id: self.messageId,
          method: prop,
          args: Array.from(arguments)
        };
        self.port.postMessage(message);
        self.messageId++;
      });
    };
  }

  _onMessage({ id, value, error, event, args }) {
    if (event != null) {
      this.emit(event, ...args);
    } else if (error != null) {
      this.promises[id].reject(error);
      delete this.promises[id];
    } else {
      this.promises[id].resolve(value);
      delete this.promises[id];
    }
  }
}

class Service
{
  constructor() {
    this.clients = {};
    this.clientId = 0;

    let serviceName = this.constructor.name;
    this.onConnect = port => {
      if (port.name != serviceName) {
        return;
      }

      let clientId = this.clientId++;

      const onMessage = async ({ id, method, args }) => {
        try {
          if (!this[method]) {
            throw new Error(M.invalid_service_request(serviceName, method));
          }

          let value = await this[method](...args);
          port.postMessage({ id, value });
        } catch (e) {
          port.postMessage({ id, error: `${e}` });
        }
      };

      const onDisconnect = () => {
        // Remove event handlers.
        this.clients[clientId].dispose();
        delete this.clients[clientId];
      };

      this.clients[clientId] = {
        port,
        dispose() {
          port.onMessage.removeListener(onMessage);
          port.onDisconnect.removeListener(onDisconnect);
        }
      };

      port.onMessage.addListener(onMessage);
      port.onDisconnect.addListener(onDisconnect);
    };

    chrome.runtime.onConnect.addListener(this.onConnect);
  }

  dispose() {
    // Remove all event handlers.
    chrome.runtime.onConnect.removeListener(this.onConnect);
    for (let { dispose } of Object.values(this.clients)) {
      dispose();
    }
    this.clients = {};
  }

  emit(eventName, ...args) {
    for (let { port } of Object.values(this.clients)) {
      try {
        port.postMessage({ event: eventName, args: args });
      } catch (e) {
        // Assume port has disconnected.
      }
    }
  }

  static start(...args) {
    return new this(...args);
  }

  static get proxy() {
    let serviceName = this.name;
    const constructProxy = {
      construct(target, args) {
        return new Proxy(function() {}, new ServiceProxy(serviceName));
      }
    };

    return new Proxy(function() {}, constructProxy);
  }
}

export default Service;
