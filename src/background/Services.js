import * as Sounds from '../Sounds';
import { Service } from '../Service';
import M from '../Messages';
import { SingletonPage, PageHost } from './SingletonPage';

class SettingsService extends Service
{
  constructor(settingsManager) {
    super();
    this.settingsManager = settingsManager;
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

  _validate(phase) {
    let { duration, timerSound } = phase;
    if (isNaN(duration) || duration <= 0 || duration > 999) {
      throw new Error(M.invalid_duration);
    }

    if (timerSound && timerSound.metronome) {
      let { bpm } = timerSound.metronome;
      if (isNaN(bpm) || bpm <= 0 || bpm > 1000) {
        throw new Error(M.invalid_bpm);
      }
    }
  }
}

class HistoryService extends Service
{
  constructor(history) {
    super();
    this.history = history;
  }

  async getStats(since) {
    return await this.history.stats(since);
  }

  async getCSV() {
    return await this.history.toCSV();
  }

  async getAll() {
    return await this.history.all();
  }

  async merge(history) {
    return await this.history.merge(history);
  }

  async clearHistory() {
    return await this.history.clear();
  }
}

class PomodoroService extends Service
{
  constructor(timer) {
    super();
    this.timer = timer;
    this.timer.observe(this);
  }

  async startSession() {
    this.timer.start();
  }

  async getStatus() {
    return this.timer.status;
  }

  onStart(...args) {
    this.emit('start', ...args);
  }

  onStop(...args) {
    this.emit('stop', ...args);
  }

  onPause(...args) {
    this.emit('pause', ...args);
  }

  onResume(...args) {
    this.emit('resume', ...args);
  }

  onTick(...args) {
    this.emit('tick', ...args);
  }

  onExpire(...args) {
    this.emit('expire', ...args);
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

class OptionsService extends Service
{
  async showPage(optionPage) {
    let manifest = chrome.runtime.getManifest();
    let url = chrome.extension.getURL(manifest.options_page + '#/' + optionPage);
    let page = await SingletonPage.show(url, PageHost.Tab);
    page.focus();
  }

  async showSettingsPage() {
    return await this.showPage('settings');
  }

  async showHistoryPage() {
    return await this.showPage('history');
  }

  async showFeedbackPage() {
    return await this.showPage('feedback');
  }
}

const SettingsClient = SettingsService.proxy;
const HistoryClient = HistoryService.proxy;
const PomodoroClient = PomodoroService.proxy;
const SoundsClient = SoundsService.proxy;
const OptionsClient = OptionsService.proxy;

export {
  SettingsService,
  SettingsClient,
  HistoryService,
  HistoryClient,
  PomodoroService,
  PomodoroClient,
  SoundsService,
  SoundsClient,
  OptionsService,
  OptionsClient
};