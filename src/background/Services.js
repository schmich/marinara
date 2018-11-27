import * as Sounds from '../Sounds';

class ServiceBroker
{
  constructor() {
    this.services = {};
    chrome.runtime.onMessage.addListener(this._handleMessage.bind(this));
  }

  registerService(service) {
    this.services[service.constructor.name] = service;
  }

  _handleMessage(request, sender, respond) {
    (async () => {
      try {
        let { service, command, params } = request;

        let handler = this.services[service];
        if (!handler) {
          // TODO: Extract to messages.json.
          throw new Error('Unknown service: ' + service);
        }

        let value = await handler[command](...params);
        respond({ value });
      } catch (e) {
        respond({ error: `${e}` });
      }
    })();

    // Response is async.
    return true;
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
      throw new Error('Invalid autostart time.');
    }

    await this.settingsManager.set(settings);
  }

  async showSettings(settings) {
    return await this.controller.showOptionsPage('#settings');
  }

  _validate(phase) {
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

  async showHistory() {
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