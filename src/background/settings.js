class ChromeStorage
{
  constructor(store) {
    this.store = store;
  }

  get() {
    return new Promise((resolve, reject) => {
      this.store.get(result => resolve(result));
    });
  }

  set(obj) {
    return new Promise((resolve, reject) => {
      this.store.set(obj, () => resolve());
    });
  }

  static get sync() {
    return new ChromeStorage(chrome.storage.sync);
  }

  static get local() {
    return new ChromeStorage(chrome.storage.local);
  }
}

class Settings extends EventEmitter
{
  constructor(schema) {
    super();
    this.schema = schema;
  }

  async get() {
    let [settings, modified] = this._upgrade(await ChromeStorage.sync.get());
    if (modified) {
      await ChromeStorage.sync.set(settings);
    }

    return settings;
  }

  async set(settings) {
    await ChromeStorage.sync.set(settings);
    this.emitEvent('change', [{}]);
  }

  _upgrade(settings) {
    let modified = false;

    if (Object.keys(settings).length === 0) {
      modified = true;
      settings = this.schema.default;
    }

    if (settings.version < this.schema.version) {
      modified = true;
      for (let version = settings.version; version < this.schema.version; ++version) {
        let method = `from${version}To${version + 1}`;
        settings = this.schema[method](settings);
      }
    }

    return [settings, modified];
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
