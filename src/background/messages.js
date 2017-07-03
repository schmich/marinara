class MessageServer
{
  constructor() {
    chrome.runtime.onMessage.addListener((request, sender, respond) => {
      setTimeout(async () => {
        let method = request.command.replace(/-./g, (m) => m[1].toUpperCase())
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
  static getPhase() {
    return this.request('get-phase', arguments);
  }

  static startSession() {
    return this.request('start-session', arguments);
  }

  static getSounds() {
    return this.request('get-sounds', arguments);
  }

  static getSettings() {
    return this.request('get-settings', arguments);
  }

  static setSettings() {
    return this.request('set-settings', arguments);
  }
}

class BackgroundServer extends MessageServer
{
  constructor(controller, settings) {
    super();
    this.controller = controller;
    this.settings = settings;
  }

  async getPhase() {
    switch (this.controller.phase) {
    case Phase.Focus:
      return 'focus';
    case Phase.ShortBreak:
      return 'short-break';
    case Phase.LongBreak:
      return 'long-break';
    }
  }

  async startSession() {
    this.controller.start();
  }

  async getSounds() {
    return Sounds.all;
  }

  async getSettings() {
    return await this.settings.get();
  }

  async setSettings(settings) {
    let focusDuration = settings.focus.duration.trim();
    let shortBreakDuration = settings.shortBreak.duration.trim();
    let longBreakDuration = settings.longBreak.duration.trim();

    if (!focusDuration) {
      return { error: 'Focus duration is required.' };
    } else if (!shortBreakDuration) {
      return { error: 'Short break duration is required.' };
    } else if (!longBreakDuration) {
      return { error: 'Long break duration is required.' };
    }

    let focusParsed = +focusDuration;
    let shortBreakParsed = +shortBreakDuration;
    let longBreakParsed = +longBreakDuration;

    if (focusParsed <= 0 || isNaN(focusParsed)) {
      return { error: 'Focus duration must be a positive number.' };
    } else if (shortBreakParsed <= 0 || isNaN(shortBreakParsed)) {
      return { error: 'Short break duration must be a positive number.' };
    } else if (longBreakParsed <= 0 || isNaN(longBreakParsed)) {
      return { error: 'Long break duration must be a positive number.' };
    }

    settings.focus.duration = focusParsed;
    settings.shortBreak.duration = shortBreakParsed;
    settings.longBreak.duration = longBreakParsed;
    settings.longBreak.interval = +settings.longBreak.interval;

    await this.settings.set(settings);
  }
}
