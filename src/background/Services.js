import * as Sounds from '../Sounds';
import M from '../Messages';

class ServiceBroker
{
  constructor() {
    this.services = {};
    chrome.runtime.onMessage.addListener((request, sender, respond) => {
      this._handleMessage(request, respond);
      // Response is async.
      return true;
    });
  }

  registerService(service) {
    this.services[service.constructor.name] = service;
  }

  async _handleMessage(request, respond) {
    try {
      let { service, command, params } = request;

      let handler = this.services[service];
      if (!handler || !handler[command]) {
        throw new Error(M.invalid_service_request(service, command));
      }

      let value = await handler[command](...params);
      respond({ value });
    } catch (e) {
      respond({ error: `${e}` });
    }
  }
}

function serviceProxy(serviceClass) {
  return new Proxy({}, {
    get(target, prop, receiver) {
      return function() {
        return new Promise((resolve, reject) => {
          const message = {
            service: serviceClass.name,
            command: prop,
            params: Array.from(arguments)
          };
          chrome.runtime.sendMessage(message, response => {
            if (response.error) {
              reject(response.error);
            } else {
              resolve(response.value);
            }
          });
        });
      };
    }
  });
}

class SettingsService
{
  constructor(controller, settingsManager) {
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
    return await this.controller.showOptionsPage('#settings');
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

class HistoryService
{
  constructor(controller, history) {
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
    return await this.controller.showOptionsPage('#history');
  }
}

class PomodoroService
{
  constructor(controller) {
    this.controller = controller;
  }

  async startSession() {
    this.controller.start();
  }
}

class SoundsService
{
  async getNotificationSounds() {
    return Sounds.notification;
  }

  async getTimerSounds() {
    return Sounds.timer;
  }
}

const SettingsClient = serviceProxy(SettingsService);
const HistoryClient = serviceProxy(HistoryService);
const PomodoroClient = serviceProxy(PomodoroService);
const SoundsClient = serviceProxy(SoundsService);

export {
  ServiceBroker,
  SettingsService,
  SettingsClient,
  HistoryService,
  HistoryClient,
  PomodoroService,
  PomodoroClient,
  SoundsService,
  SoundsClient
};