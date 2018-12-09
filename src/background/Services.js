import * as Sounds from '../Sounds';
import Service from '../Service';
import M from '../Messages';

class SettingsService extends Service
{
  constructor(controller, settingsManager) {
    super();
    this.controller = controller;
    this.settingsManager = settingsManager;
  }

  async startSession() {
    this.controller.start();
  }

  async getSettings() {
    return await this.settingsManager.get();
  }

  async setSettings(settings) {
    this._validate(settings.focus);
    this._validate(settings.shortBreak);
    this._validate(settings.longBreak);

    settings.longBreak.interval = +settings.longBreak.interval;

    let autostart = settings.autostart && settings.autostart.time;
    if (autostart && !autostart.match(/^\d+:\d+$/)) {
      throw new Error(M.invalid_autostart_time);
    }

    await this.settingsManager.set(settings);
  }

  async showSettingsPage() {
    return await this.controller.showOptionsPage('settings');
  }

  _validate(phase) {
    let { duration, timerSound } = phase;
    if (isNaN(duration) || duration <= 0 || duration > 999) {
      throw new Error(M.invalid_duration);
    }

    if (timerSound) {
      let bpm = timerSound.bpm;
      if (isNaN(bpm) || bpm <= 0 || bpm > 1000) {
        throw new Error(M.invalid_bpm);
      }
    }
  }
}

class HistoryService extends Service
{
  constructor(controller, history) {
    super();
    this.controller = controller;
    this.history = history;
  }

  async getRawHistory() {
    return await this.history.raw();
  }

  async setRawHistory(history) {
    await this.history.import(history);
  }

  async getHistory(since) {
    return await this.history.stats(since);
  }

  async showHistoryPage() {
    return await this.controller.showOptionsPage('history');
  }
}

class PomodoroService extends Service
{
  constructor(controller) {
    super();
    this.controller = controller;
  }

  async startSession() {
    this.controller.start();
  }
}

class SoundsService extends Service
{
  async getNotificationSounds() {
    return Sounds.notification;
  }

  async getTimerSounds() {
    return Sounds.timer;
  }
}

const SettingsClient = SettingsService.proxy;
const HistoryClient = HistoryService.proxy;
const PomodoroClient = PomodoroService.proxy;
const SoundsClient = SoundsService.proxy;

export {
  SettingsService,
  SettingsClient,
  HistoryService,
  HistoryClient,
  PomodoroService,
  PomodoroClient,
  SoundsService,
  SoundsClient
};