import * as Sounds from '../Sounds';

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

    let autostart = settings.autostart && settings.autostart.time;
    if (autostart && !autostart.match(/^\d+:\d+$/)) {
      throw new Error('Invalid autostart time.');
    }

    await this.settingsManager.set(settings);
  }

  async showSettings(settings) {
    return await this.controller.showOptionsPage('#settings');
  }

  _normalize(phase) {
    let duration = phase.duration
    if (duration <= 0 || isNaN(duration)) {
      throw new Error('Duration must be a positive number.');
    }

    let timerSound = phase.timerSound;
    if (timerSound) {
      let bpm = timerSound.bpm;
      if (isNaN(bpm) || bpm <= 0 || bpm > 1000) {
        throw new Error('BPM must be a number between 1-1000.');
      }
    }
  }
}

export default BackgroundServer;