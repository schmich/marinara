class SettingsManager extends EventEmitter
{
  constructor(schema) {
    super();
    this.schema = schema;
  }

  async get() {
    let [settings, modified] = this._upgrade(await AsyncChrome.storage.sync.get());
    if (modified) {
      await AsyncChrome.storage.sync.clear();
      await AsyncChrome.storage.sync.set(settings);
    }

    return settings;
  }

  async set(settings) {
    await AsyncChrome.storage.sync.set(settings);
    this.emit('change', settings);
  }

  _upgrade(settings) {
    let modified = false;

    if (Object.keys(settings).length === 0) {
      modified = true;
      settings = this.schema.default;
    }

    if (!settings.version) {
      throw new Error('Missing version.');
    }

    if (settings.version < this.schema.version) {
      modified = true;
      for (let version = settings.version; version < this.schema.version; ++version) {
        let method = `from${version}To${version + 1}`;
        settings = this.schema[method](settings);

        if (settings.version !== (version + 1)) {
          throw new Error('Unexpected version.');
        }
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
