class MessageHandler
{
  constructor() {
    chrome.runtime.onMessage.addListener((request, sender, respond) => {
      setTimeout(async () => {
        let method = request.command.replace(/-./g, (m) => m[1].toUpperCase())
        let result = await this[method](request.params) || {};
        respond(result);
      });

      // Response is async.
      return true;
    });
  }
}

class BackgroundMessageHandler extends MessageHandler
{
  constructor(controller, settings) {
    super();
    this.controller = controller;
    this.settings = settings;
  }

  async getPhase() {
    return this.controller.phase;
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

  async setSettings(newSettings) {
    let focusDuration = newSettings.focus.duration.trim();
    let breakDuration = newSettings.break.duration.trim();

    if (!focusDuration) {
      return { error: 'Focus duration is required.' };
    } else if (!breakDuration) {
      return { error: 'Break duration is required.' };
    }

    let focusParsed = +focusDuration;
    let breakParsed = +breakDuration;

    if (focusParsed <= 0 || isNaN(focusParsed)) {
      return { error: 'Focus duration must be a positive number.' };
    } else if (breakParsed <= 0 || isNaN(breakParsed)) {
      return { error: 'Break duration must be a positive number.' };
    }

    newSettings.focus.duration = focusParsed;
    newSettings.break.duration = breakParsed;

    await this.settings.set(newSettings);
  }
}
