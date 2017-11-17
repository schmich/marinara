class ChromeError extends Error
{
  constructor(...params) {
    super(...params);
  }
}

class AsyncChrome
{
  static get tabs() {
    return AsyncTabs;
  }

  static get windows() {
    return AsyncWindows;
  }

  static get notifications() {
    return AsyncNotifications;
  }

  static get storage() {
    return AsyncStorage;
  }

  static get files() {
    return AsyncFiles;
  }

  static handle(fn) {
    return new Promise((resolve, reject) => {
      const callback = result => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new ChromeError(err.message));
        } else {
          resolve(result);
        }
      };

      fn(callback);
    });
  }
}

class AsyncTabs
{
  static async create(options) {
    try {
      return await this.tryCreate(options);
    } catch (e) {
      if (e instanceof ChromeError) {
        // We cannot create a tab if no windows are open. In this case, we must
        // create a window with the desired URL instead.
        const windowOptions = {
          url: options.url,
          focused: !!options.active
        };
        let win = await AsyncChrome.windows.create(windowOptions);
        return win.tabs[0];
      } else {
        throw e;
      }
    }
  }

  static async tryCreate(options) {
    return AsyncChrome.handle(callback => {
      chrome.tabs.create(options, callback);
    });
  }

  static async getCurrent() {
    return AsyncChrome.handle(callback => {
      chrome.tabs.getCurrent(callback);
    });
  }

  static async update(tabId, updateProperties) {
    return AsyncChrome.handle(callback => {
      chrome.tabs.update(tabId, updateProperties, callback);
    });
  }
}

class AsyncWindows
{
  static async create(createData) {
    return AsyncChrome.handle(callback => {
      chrome.windows.create(createData, callback);
    });
  }

  static async update(windowId, updateInfo) {
    return AsyncChrome.handle(callback => {
      chrome.windows.update(windowId, updateInfo, callback);
    });
  }
}

class AsyncNotifications
{
  static async create(options) {
    return AsyncChrome.handle(callback => {
      try {
        chrome.notifications.create('', options, callback);        
      } catch (e) {
        // This is failing on Firefox as it doesn't support the buttons option for the notification and raises an exception when this is called. (see http://bugzil.la/1190681)
        // Try again with a subset of options that are more broadly supported
        const compatibleOptions = {
          type: options.type,
          iconUrl: options.iconUrl,
          title: options.title,
          message: options.message
        };
        chrome.notifications.create('', compatibleOptions, callback);
      }
    });
  }
}

class AsyncStorage
{
  constructor(store) {
    this.store = store;
  }

  get(keys = null) {
    return AsyncChrome.handle(callback => {
      this.store.get(keys, callback);
    });
  }

  set(obj) {
    return AsyncChrome.handle(callback => {
      this.store.set(obj, callback);
    });
  }

  clear() {
    return AsyncChrome.handle(callback => {
      this.store.clear(callback);
    });
  }

  static get sync() {
    if (!this._sync) {
      this._sync = new AsyncStorage(chrome.storage.sync);
    }
    return this._sync;
  }

  static get local() {
    if (!this._local) {
      this._local = new AsyncStorage(chrome.storage.local);
    }
    return this._local;
  }
}

class AsyncFiles
{
  static async readFile(file, type = null) {
    return new Promise((resolve, reject) => {
      let req = new XMLHttpRequest();
      if (type) {
        req.responseType = type;
      }

      req.onload = () => resolve(req.response);
      req.onerror = error => reject(error);

      const url = chrome.runtime.getURL(file);
      req.open('GET', url, true);
      req.send(null);
    });
  }

  static async readBinary(file) {
    return this.readFile(file, 'arraybuffer');
  }
}
