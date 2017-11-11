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

class AsyncTabs
{
  static async create(options) {
    return new Promise((resolve, reject) => {
      chrome.tabs.create(options, tab => resolve(tab));
    });
  }

  static async getCurrent() {
    return new Promise((resolve, reject) => {
      chrome.tabs.getCurrent(tab => resolve(tab));
    });
  }

  static async update(tabId, updateProperties) {
    return new Promise((resolve, reject) => {
      chrome.tabs.update(tabId, updateProperties, tab => resolve(tab));
    });
  }
}

class AsyncWindows
{
  static async update(windowId, updateInfo) {
    return new Promise((resolve, reject) => {
      chrome.windows.update(windowId, updateInfo, win => resolve(win));
    });
  }
}

class AsyncNotifications
{
  static async create(options) {
    return new Promise((resolve, reject) => {
      try {
        chrome.notifications.create('', options, id => resolve(id));        
      } catch (e) {
        // This is failing on Firefox as it doesn't support the buttons option for the notification and raises an exception when this is called. (see http://bugzil.la/1190681)
        // Try again with a subset of options that are more broadly supported
        const compatible_options = {
          type: options.type,
          iconUrl: options.iconUrl,
          title: options.title,
          message: options.message
        };
        chrome.notifications.create('', compatible_options, id => resolve(id));
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
    return new Promise((resolve, reject) => {
      this.store.get(keys, result => resolve(result));
    });
  }

  set(obj) {
    return new Promise((resolve, reject) => {
      this.store.set(obj, () => resolve());
    });
  }

  clear() {
    return new Promise((resolve, reject) => {
      this.store.clear(() => resolve());
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
