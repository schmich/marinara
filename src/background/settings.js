class StorageManager extends EventEmitter
{
  constructor(schema, storage) {
    super();
    this.schema = schema;
    this.storage = storage;
  }

  async get() {
    let [payload, modified] = this._upgrade(await this.storage.get());
    if (modified) {
      await this.storage.clear();
      await this.storage.set(payload);
    }

    return payload;
  }

  async set(payload) {
    await this.storage.set(payload);
    this.emit('change', payload);
  }

  _upgrade(payload) {
    let modified = false;

    if (Object.keys(payload).length === 0) {
      modified = true;
      payload = this.schema.default;
    }

    if (!payload.version) {
      throw new Error('Missing version.');
    }

    if (payload.version < this.schema.version) {
      modified = true;
      for (let version = payload.version; version < this.schema.version; ++version) {
        let method = `from${version}To${version + 1}`;
        payload = this.schema[method](payload);

        if (payload.version !== (version + 1)) {
          throw new Error('Unexpected version.');
        }
      }
    }

    return [payload, modified];
  }
}

class MarinaraSchema
{
  get version() {
    return 2;
  }

  get default() {
    return {
      focus: {
        duration: 25,
        notifications: {
          desktop: true,
          tab: true,
          sound: null
        }
      },
      shortBreak: {
        duration: 5,
        notifications: {
          desktop: true,
          tab: true,
          sound: null
        }
      },
      longBreak: {
        duration: 15,
        interval: 4,
        notifications: {
          desktop: true,
          tab: true,
          sound: null
        }
      },
      version: this.version
    };
  }

  from1To2(v1) {
    return {
      focus: {
        duration: v1.focus.duration,
        notifications: {
          desktop: v1.focus.desktopNotification,
          tab: v1.focus.newTabNotification,
          sound: v1.focus.sound ? new URL(v1.focus.sound).pathname : null
        }
      },
      shortBreak: {
        duration: v1.break.duration,
        notifications: {
          desktop: v1.break.desktopNotification,
          tab: v1.break.newTabNotification,
          sound: v1.break.sound ? new URL(v1.break.sound).pathname : null
        }
      },
      longBreak: {
        duration: 15,
        interval: 4,
        notifications: {
          desktop: v1.break.desktopNotification,
          tab: v1.break.newTabNotification,
          sound: v1.break.sound ? new URL(v1.break.sound).pathname : null
        }
      },
      version: 2
    };
  }
}
