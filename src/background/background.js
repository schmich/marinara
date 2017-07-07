class BrowserTimerManager
{
  constructor(controller) {
    this.notificationId = null;
    this.expirationTabId = null;
    this.controller = controller;

    chrome.tabs.onRemoved.addListener(id => {
      if (id === this.expirationTabId) {
        this.expirationTabId = null;
      }
    });

    chrome.notifications.onClicked.addListener(id => {
      if (id === this.notificationId) {
        this.showExpiration();
        chrome.notifications.clear(id);
      }
    });

    chrome.notifications.onButtonClicked.addListener(id => {
      if (id === this.notificationId) {
        controller.start();
        chrome.notifications.clear(id);
      }
    });
  }

  createTimer(options) {
    let timer = new Timer(options.duration * 60, 60);
    timer.observe(new BadgeObserver(options.phase, options.badgeColor));

    timer.once('expire', () => {
      if (options.sound) {
        let audio = new Audio();
        audio.src = options.sound;
        audio.play();
      }

      if (options.notification) {
        this.notify(
          options.notification.title,
          options.notification.message,
          options.notification.action
        );
      }

      if (options.tab) {
        this.showExpiration(
          options.tab.title,
          options.tab.message,
          options.tab.action,
          options.tab.phase
        );
      }
    });

    timer.once('start', () => {
      // Close expire tab.
      if (this.expirationTabId !== null) {
        chrome.tabs.remove(this.expirationTabId, () => {});
      }

      // Close notification.
      if (this.notificationId !== null) {
        chrome.notifications.clear(this.notificationId);
        this.notificationId = null;
      }
    });

    return timer;
  }

  showExpiration(title, message, action, phase) {
    let focusWindow = tab => chrome.windows.update(tab.windowId, { focused: true });
    let focusTab = id => chrome.tabs.update(id, { active: true, highlighted: true }, focusWindow);

    if (this.expirationTabId !== null) {
      focusTab(this.expirationTabId);
      return;
    }

    chrome.tabs.create({ url: chrome.extension.getURL('expire/expire.html'), active: false }, tab => {
      this.expirationTabId = tab.id;
      chrome.tabs.onUpdated.addListener(function update(id, changeInfo, _) {
        if (id === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(update);
          chrome.tabs.sendMessage(id, {
            title: title,
            message: message,
            action: action,
            phase: phase
          }, {}, () => focusTab(id));
        }
      });
    });
  }

  notify(title, message, action) {
    let options = {
      type: 'basic',
      title: title,
      message: message,
      iconUrl: 'icons/128.png',
      isClickable: true,
      buttons: [{ title: action, iconUrl: 'icons/start.png' }]
    };

    chrome.notifications.create('', options, id => this.notificationId = id);
  }
}

class BadgeObserver
{
  constructor(title, color) {
    this.title = title;
    this.color = color;
  }

  start(elapsed, remaining) {
    this.updateBadge({ minutes: Math.round(remaining / 60) });
  }

  tick(elapsed, remaining) {
    this.updateBadge({ minutes: Math.round(remaining / 60) });
  }

  stop() {
    this.removeBadge();
  }

  pause() {
    this.updateBadge({ text: '—', tooltip: 'Timer Paused' });
  }

  resume(elapsed, remaining) {
    this.updateBadge({ minutes: Math.round(remaining / 60) });
  }

  expire() {
    this.removeBadge();
  }

  updateBadge({ minutes, tooltip, text }) {
    var text, tooltip;

    if (minutes != null) {
      text = ((minutes == 0) ? '<1' : minutes)  + 'm';
      tooltip = this.title + ': ' + minutes + 'm remaining.';
    } else {
      tooltip = this.title + ': ' + tooltip;
    }

    chrome.browserAction.setTitle({ title: tooltip });
    chrome.browserAction.setBadgeText({ text: text });
    chrome.browserAction.setBadgeBackgroundColor({ color: this.color });
  };

  removeBadge() {
    chrome.browserAction.setTitle({ title: '' });
    chrome.browserAction.setBadgeText({ text: '' });
  }
}

class Controller
{
  constructor(settingsManager) {
    this.timerManager = new BrowserTimerManager(this);

    this.settingsManager = settingsManager;
    settingsManager.on('change', settings => {
      this._settings = settings;
      this.loadTimers(settings);
      this.menu.refresh();
    });
  }

  async run() {
    this._settings = await this.settingsManager.get();
    this.loadTimers(this._settings);

    this.menu = new Menu(['browser_action'],
      new MenuGroup(
        new PauseTimerMenuItem(this),
        new ResumeTimerMenuItem(this),
        new StopTimerMenuItem(this)
      ),
      new MenuGroup(
        new StartFocusingMenuItem(this),
        new StartShortBreakMenuItem(this),
        new StartLongBreakMenuItem(this)
      )
    );

    chrome.browserAction.onClicked.addListener(() => {
      if (this.timer.isRunning) {
        this.timer.pause();
      } else if (this.timer.isPaused) {
        this.timer.resume();
      } else {
        this.timer.start();
      }
    });
  }

  get settings() {
    return this._settings;
  }

  get phase() {
    return this.timer.phase;
  }

  get state() {
    return this.timer ? this.timer.state : null;
  }

  start() {
    this.timer.start();
  }

  pause() {
    this.timer.pause();
  }

  stop() {
    this.timer.stop();
  }

  resume() {
    this.timer.resume();
  }

  startFocus() {
    this.timer.start(Phase.Focus);
  }

  startShortBreak() {
    this.timer.start(Phase.ShortBreak);
  }

  startLongBreak() {
    this.timer.start(Phase.LongBreak);
  }

  loadTimers(settings) {
    if (this.timer) {
      this.timer.stop();
    }

    let timerFactory = (phase, nextPhase) => {
      let timer = this.createTimer(phase, nextPhase, settings);
      timer.on('change', () => this.menu.refresh());
      return timer;
    };

    this.timer = new PomodoroTimer(timerFactory, settings.longBreak.interval);
  }

  createTimer(phase, nextPhase, settings) {
    switch (phase) {
    case Phase.Focus:
      var hasLong = settings.longBreak.interval > 0;
      let length = (nextPhase === Phase.ShortBreak) ? 'short' : 'long';
      let lengthTitle = length.replace(/^./, c => c.toUpperCase());
      let nextDuration = settings[`${length}Break`].duration;
      let brk = hasLong ? `${length} break` : 'break';
      var brkTitle = hasLong ? `${lengthTitle} Break` : 'Break';
      return this.timerManager.createTimer({
        phase: 'Focus',
        duration: settings.focus.duration,
        sound: settings.focus.notifications.sound,
        badgeColor: '#bb0000',
        notification: !settings.focus.notifications.desktop ? null : {
          title: `Take a ${brkTitle}`,
          message: `${nextDuration} minute ${brk} up next`,
          action: `Start ${brk} now`
        },
        tab: !settings.focus.notifications.tab ? null : {
          title: `Take a ${brkTitle}`,
          message: `${nextDuration} minute ${brk} up next`,
          action: `Start ${brkTitle}`,
          phase: `${length}-break`
        }
      });

    case Phase.ShortBreak:
      var hasLong = settings.longBreak.interval > 0;
      var brkTitle = hasLong ? `Short Break` : 'Break';
      return this.timerManager.createTimer({
        phase: 'Short Break',
        duration: settings.shortBreak.duration,
        sound: settings.shortBreak.notifications.sound,
        badgeColor: '#009900',
        notification: !settings.shortBreak.notifications.desktop ? null : {
          title: `${brkTitle} Finished`,
          message: `${settings.focus.duration} minute focus session up next`,
          action: 'Start focusing now'
        },
        tab: !settings.shortBreak.notifications.tab ? null : {
          title: `${brkTitle} Finished`,
          message: `${settings.focus.duration} minute focus session up next`,
          action: 'Start Focusing',
          phase: 'focus'
        }
      });

    case Phase.LongBreak:
      return this.timerManager.createTimer({
        phase: 'Long Break',
        duration: settings.longBreak.duration,
        sound: settings.longBreak.notifications.sound,
        badgeColor: '#009900',
        notification: !settings.longBreak.notifications.desktop ? null : {
          title: 'Long Break Finished',
          message: `${settings.focus.duration} minute focus session up next`,
          action: 'Start focusing now'
        },
        tab: !settings.longBreak.notifications.tab ? null : {
          title: 'Long Break Finished',
          message: `${settings.focus.duration} minute focus session up next`,
          action: 'Start Focusing',
          phase: 'focus'
        }
      });
    }
  }
}

let settingsManager = new SettingsManager(new MarinaraSchema());
let controller = new Controller(settingsManager);
let server = new BackgroundServer(controller, settingsManager);

controller.run();
