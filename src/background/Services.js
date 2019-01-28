import * as Sounds from '../Sounds';
import { Service } from '../Service';
import M from '../Messages';
import SingletonPage from './SingletonPage';

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

  async getRawHistory() {
    return await this.history.raw();
  }

  async merge(history) {
    return await this.history.merge(history);
  }

  async getHistory(since) {
    return await this.history.stats(since);
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

  onTimerStart(...args) {
    this.emit('timer:start', ...args);
  }

  onTimerStop(...args) {
    this.emit('timer:stop', ...args);
  }

  onTimerPause(...args) {
    this.emit('timer:pause', ...args);
  }

  onTimerResume(...args) {
    this.emit('timer:resume', ...args);
  }

  onTimerTick(...args) {
    this.emit('timer:tick', ...args);
  }

  onTimerExpire(...args) {
    this.emit('timer:expire', ...args);
  }

  onTimerChange(...args) {
    this.emit('timer:change', ...args);
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
  constructor() {
    super();
  }

  async showPage(page) {
    let manifest = chrome.runtime.getManifest();

    let windows = chrome.extension.getViews({ type: 'tab' });
    for (let window of windows) {
      if (window.location.toString().indexOf(manifest.options_page) >= 0) {
        window.postMessage({ page });
        return;
      }
    }

    let url = chrome.extension.getURL(manifest.options_page + '#/' + page);
    await SingletonPage.show(url);
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