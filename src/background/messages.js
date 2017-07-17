class MessageServer
{
  constructor() {
    chrome.runtime.onMessage.addListener((request, sender, respond) => {
      setTimeout(async () => {
        let method = request.command;
        let result = await this[method](...request.params) || {};
        respond(result);
      });

      // Response is async.
      return true;
    });
  }

}

class MessageClient
{
  static request(command, args) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command: command, params: Array.from(args) }, result => {
        resolve(result);
      });
    });
  }
}

class BackgroundClient extends MessageClient
{
  static startSession() {
    return this.request('startSession', arguments);
  }

  static getSounds() {
    return this.request('getSounds', arguments);
  }

  static getSettings() {
    return this.request('getSettings', arguments);
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
}

class BackgroundServer extends MessageServer
{
  constructor(controller, history, settingsManager) {
    super();
    this.controller = controller;
    this.history = history;
    this.settingsManager = settingsManager;
  }

  async startSession() {
    this.controller.start();
  }

  async getSounds() {
    return Sounds.all;
  }

  async getSettings() {
    return await this.settingsManager.get();
  }

  async getHistory(since) {
    return await this.history.stats(since);
  }

  async showHistory() {
    return await this.controller.showHistory();
  }

  async setSettings(settings) {
    try {
      this._normalize(settings.focus);
      this._normalize(settings.shortBreak);
      this._normalize(settings.longBreak);
    } catch (e) {
      return { error: e.message };
    }

    settings.longBreak.interval = +settings.longBreak.interval;

    await this.settingsManager.set(settings);
  }

  _normalize(phase) {
    let duration = phase.duration.trim();
    if (!duration) {
      throw new Error('Duration is required.');
    }

    let durationParsed = +duration;
    if (durationParsed <= 0 || isNaN(durationParsed)) {
      throw new Error('Duration must be a positive number.');
    }

    phase.duration = durationParsed;
  }
}
