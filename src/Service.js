import EventEmitter from 'events';

class ServiceBroker
{
  constructor() {
    this.services = {};
    chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
  }

  static get instance() {
    if (!this._instance) {
      this._instance = new ServiceBroker();
    }
    return this._instance;
  }

  static register(service) {
    return this.instance.register(service);
  }

  static async invoke(call) {
    return await this.instance.invoke(call);
  }

  register(service) {
    this.services[service.constructor.name] = service;
    return service;
  }

  unregister(service) {
    delete this.services[service.constructor.name];
    return service;
  }

  async invoke({ serviceName, methodName, args }) {
    let service = this.services[serviceName];
    if (service) {
      if (service[methodName]) {
        // Service is defined in this context, call method directly.
        return await service[methodName](...args);
      } else {
        throw new Exception(`Invalid service request: ${serviceName}.${methodName}.`);
      }
    }

    // Service is defined in another context, use sendMessage to call it.
    return await new Promise((resolve, reject) => {
      let message = { serviceName, methodName, args };
      chrome.runtime.sendMessage(message, ({ result, error }) => {
        if (error !== undefined) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  onMessage({ serviceName, methodName, args }, sender, respond) {
    let service = this.services[serviceName];
    if (!service || methodName === undefined) {
      // Service is not defined in this context, so we have nothing to do.
      return;
    }

    if (!service[methodName]) {
      respond({ error: `Invalid service request: ${serviceName}.${methodName}.` });
      return true;
    }

    (async () => {
      try {
        respond({ result: await service[methodName](...args) });
      } catch (e) {
        console.error(e);
        respond({ error: `${e}` });
      }
    })();

    return true;
  }
}

class ServiceProxy extends EventEmitter
{
  constructor(serviceName) {
    super();
    this.serviceName = serviceName;
    this.listenerCount = 0;

    this.on('removeListener', () => {
      if (--this.listenerCount === 0) {
        chrome.runtime.onMessage.removeListener(this.onMessage);
      }
    });

    this.on('newListener', () => {
      if (++this.listenerCount === 1) {
        this.onMessage = this._onMessage.bind(this);
        chrome.runtime.onMessage.addListener(this.onMessage);
      }
    });
  }

  dispose() {
    this.removeAllListeners();
    chrome.runtime.onMessage.removeListener(this.onMessage);
  }

  get(target, prop, receiver) {
    if (this[prop]) {
      return this[prop];
    }

    const self = this;
    return async function() {
      const call = {
        serviceName: self.serviceName,
        methodName: prop,
        args: Array.from(arguments)
      };
      return await ServiceBroker.invoke(call);
    };
  }

  _onMessage({ serviceName, eventName, args }, sender, respond) {
    if (serviceName !== this.serviceName || eventName === undefined) {
      return;
    }

    this.emit(eventName, ...args);
  }
}

class Service
{
  constructor() {
    this.clients = {};
    this.serviceName = this.constructor.name;
  }

  emit(eventName, ...args) {
    chrome.runtime.sendMessage({
      serviceName: this.serviceName,
      eventName,
      args
    });
  }

  static get proxy() {
    const serviceName = this.name;
    const create = () => new Proxy(function() {}, new ServiceProxy(serviceName));

    const handler = {
      construct(target, args) {
        return create();
      },
      get(target, prop, receiver) {
        // Support one-shot service invocations.
        // This creates a client, performs the RPC, then cleans up.
        // Example usage: let result = await SomeClient.once.doThing('abc', 123);

        if (prop !== 'once') {
          return undefined;
        }

        return new Proxy(function() {}, {
          get(target, prop, receiver) {
            return (...args) => {
              let client = create();
              try {
                return client[prop](...args);
              } finally {
                client.dispose();
              }
            };
          }
        });
      }
    };

    return new Proxy(function() {}, handler);
  }
}

export {
  Service,
  ServiceBroker
};