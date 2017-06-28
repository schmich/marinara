class Settings extends EventEmitter
{
  get() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(result => {
        if (Object.keys(result).length == 0) {
          chrome.storage.sync.set(Settings.default, () => {
            resolve(Settings.default);
          });
        } else {
          resolve(result);
        }
      });
    });
  }

  set(settings) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(settings, () => {
        this.emitEvent('change', [{}]);
        resolve();
      });
    });
  }

  static get default() {
    return {
      focus: {
        duration: 25,
        desktopNotification: true,
        newTabNotification: true,
        sound: null
      },
      break: {
        duration: 5,
        desktopNotification: true,
        newTabNotification: true,
        sound: null
      },
      version: 1
    };
  }
}
