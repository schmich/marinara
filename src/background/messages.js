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
    try {
      this._normalize(settings.focus);
      this._normalize(settings.shortBreak);
      this._normalize(settings.longBreak);
    } catch (e) {
      return { error: e.message };
    }

    settings.longBreak.interval = +settings.longBreak.interval;

    await this.settings.set(settings);
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
