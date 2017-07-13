class AsyncChrome
{
  static get tabs() {
    return AsyncTabs;
  }

  static get notifications() {
    return AsyncNotifications;
  }

  static get storage() {
    return AsyncStorage;
  }
}

class AsyncTabs
{
  static async create(options) {
    return new Promise((resolve, reject) => {
      chrome.tabs.create(options, tab => {
        resolve(tab);
      });
    });
  }
}

class AsyncNotifications
{
  static async create(options) {
    return new Promise((resolve, reject) => {
      chrome.notifications.create('', options, id => resolve(id));
    });
  }
}

class AsyncStorage
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
