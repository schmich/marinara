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
}

function promise(fn) {
  return new Promise((resolve, reject) => {
    const callback = (...results) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new ChromeError(err.message));
      } else {
        resolve(...results);
      }
    };

    fn(callback);
  });
}

class AsyncTabs
{
  static async create(options) {
    // Create tab in specific window.
    const createInWindow = async windowId => {
      // Get the currently active tab in this window and make it the 'opener'
      // of the tab we're creating. When our tab is closed, the opener tab will
      // be reactivated.
      let tabs = await AsyncChrome.tabs.query({ active: true, windowId });
      let openerTabId = (tabs && tabs.length > 0) ? tabs[0].id : null;

      let tabOptions = { ...options, windowId, openerTabId };
      return promise(callback => {
        chrome.tabs.create(tabOptions, callback);
      });
    };
 
    try {
      let targetWindow = await AsyncChrome.windows.getLastFocused({ windowTypes: ['normal'] });
      if (targetWindow) {
        return createInWindow(targetWindow.id);
      }
    } catch (e) {
      if (e instanceof ChromeError) {
        // We assume there was no last focused window, ignore.
        console.error(e);
      } else {
        throw e;
      }
    }

    // No active window for our tab, so we must create our own.
    let windowOptions = { focused: !!options.active };
    let newWindow = await AsyncChrome.windows.create(windowOptions);
    return createInWindow(newWindow.id);
  }

  static async tryCreate(options) {
    return promise(callback => {
      chrome.tabs.create(options, callback);
    });
  }

  static async getCurrent() {
    return promise(callback => {
      chrome.tabs.getCurrent(callback);
    });
  }

  static async update(tabId, updateProperties) {
    return promise(callback => {
      chrome.tabs.update(tabId, updateProperties, callback);
    });
  }

  static async query(queryInfo) {
    return promise(callback => {
      chrome.tabs.query(queryInfo, callback);
    });
  }
}

class AsyncWindows
{
  static async getAll(getInfo) {
    return promise(callback => {
      chrome.windows.getAll(getInfo, callback);
    });
  }

  static async getLastFocused(getInfo) {
    return promise(callback => {
      chrome.windows.getLastFocused(getInfo, callback);
    });
  }

  static async create(createData) {
    return promise(callback => {
      chrome.windows.create(createData, callback);
    });
  }

  static async update(windowId, updateInfo) {
    return promise(callback => {
      chrome.windows.update(windowId, updateInfo, callback);
    });
  }
}

class AsyncNotifications
{
  static async create(options) {
    return promise(callback => {
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
    return promise(callback => {
      this.store.get(keys, callback);
    });
  }

  set(obj) {
    return promise(callback => {
      this.store.set(obj, callback);
    });
  }

  clear() {
    return promise(callback => {
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
