import * as Sounds from '../Sounds';
import { Service } from '../Service';
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
    if (!this._isValid(settings)) {
      return;
    }

    await this.settingsManager.set(settings);
  }

  _isValid(settings) {
    let phasesValid = [settings.focus, settings.shortBreak, settings.longBreak].every(this._isPhaseValid);
    if (!phasesValid) {
      return false;
    }

    let autostart = settings.autostart && settings.autostart.time;
    if (autostart && !autostart.match(/^\d+:\d+$/)) {
      return false;
    }

    return true;
  }

  _isPhaseValid(phase) {
    let { duration, timerSound, countdown } = phase;
    if (isNaN(duration) || duration <= 0 || duration > 999) {
      return false;
    }

    if (timerSound && timerSound.metronome) {
      let { bpm } = timerSound.metronome;
      if (isNaN(bpm) || bpm <= 0 || bpm > 1000) {
        return false;
      }
    }

    if (countdown.host === 'window') {
      let { resolution } = countdown;

      // Resolution must either be 'fullscreen' or a [width, height] array.
      let isValid = (resolution === 'fullscreen') || (Array.isArray(resolution) && resolution.length === 2 && resolution.every(Number.isInteger));
      if (!isValid) {
        return false;
      }
    }

    return true;
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

  async start() {
    this.timer.start();
  }

  async pause() {
    this.timer.pause();
  }

  async resume() {
    this.timer.resume();
  }

  async restart() {
    this.timer.restart();
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