class MessageClient
{
  static request(command, args) {
    // TODO: Move to AsyncChrome.
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command: command, params: Array.from(args) }, result => {
        resolve(result);
      });
    });
  }
}

// TODO: Use Proxy.
class BackgroundClient extends MessageClient
{
  static startSession() {
    return this.request('startSession', arguments);
  }

  static getNotificationSounds() {
    return this.request('getNotificationSounds', arguments);
  }

  static getTimerSounds() {
    return this.request('getTimerSounds', arguments);
  }

  static getSettings() {
    return this.request('getSettings', arguments);
  }

  static getRawHistory() {
    return this.request('getRawHistory', arguments);
  }

  static setRawHistory() {
    return this.request('setRawHistory', arguments);
  }

  static getHistory(since) {
    return this.request('getHistory', arguments);
  }

  static showHistory() {
    return this.request('showHistory', arguments);
  }

  static setSettings() {
    return this.request('setSettings', arguments);
  }

  static showSettings() {
    return this.request('showSettings', arguments);
  }
}

export default BackgroundClient;