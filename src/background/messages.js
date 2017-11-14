class MessageServer
{
  constructor() {
    chrome.runtime.onMessage.addListener((request, sender, respond) => {
      (async () => {
        let method = request.command;
        let result = await this[method](...request.params) || {};
        respond(result);
      })();

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

  async getNotificationSounds() {
    return Sounds.notification;
  }

  async getTimerSounds() {
    return Sounds.timer;
  }

  async getSettings() {
    return await this.settingsManager.get();
  }

  async getRawHistory() {
    return await this.history.raw();
  }

  async setRawHistory(history) {
    try {
      await this.history.import(history);
      return true;
    } catch (e) {
      return e.toString();
    }
  }

  async getHistory(since) {
    return await this.history.stats(since);
  }

  async showHistory() {
    return await this.controller.showOptionsPage('#history');
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

  async showSettings(settings) {
    return await this.controller.showOptionsPage('#settings');
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

    let timerSound = phase.timerSound;
    if (timerSound) {
      let bpm = +timerSound.bpm;
      if (isNaN(bpm) || bpm <= 0 || bpm > 1000) {
        throw new Error('BPM must be a number between 1-1000.');
      }
    }

    phase.duration = durationParsed;
  }
}
