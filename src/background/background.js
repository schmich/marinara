class Notification
{
  static async show(title, messages, action) {
    let options = {
      type: 'basic',
      title: title,
      message: messages.filter(m => m && m.trim() !== '').join("\n"),
      iconUrl: 'icons/128.png',
      isClickable: true,
      buttons: [{ title: action, iconUrl: 'icons/start.png' }]
    };

    let notificationId = await AsyncChrome.notifications.create(options);
    return new Notification(notificationId);
  }

  constructor(notificationId) {
    this.notificationId = notificationId;

    let notificationClicked = id => {
      if (id === this.notificationId) {
        this.controller.start();
        chrome.notifications.clear(id);
      }
    };

    let buttonClicked = id => {
      if (id === this.notificationId) {
        this.controller.start();
        chrome.notifications.clear(id);
      }
    };

    let notificationClosed = id => {
      if (id === this.notificationId) {
        chrome.notifications.onClicked.removeListener(notificationClicked);
        chrome.notifications.onButtonClicked.removeListener(buttonClicked);
        chrome.notifications.onClosed.removeListener(notificationClosed);
        this.notificationId = null;
      }
    };

    chrome.notifications.onClicked.addListener(notificationClicked);
    chrome.notifications.onButtonClicked.addListener(buttonClicked);
    chrome.notifications.onClosed.addListener(notificationClosed);
  }

  close() {
    if (this.notificationId) {
      chrome.notifications.clear(this.notificationId);
    }
  }
}

class ExpirationPage
{
  static async show(title, messages, action, pomodoros, phase) {
    let tab = await AsyncChrome.tabs.create({ url: chrome.extension.getURL('expire/expire.html'), active: false });
    return new ExpirationPage(tab.id, title, messages, action, pomodoros, phase);
  }

  constructor(tabId, title, messages, action, pomodoros, phase) {
    let self = this;
    let focusWindow = tab => chrome.windows.update(tab.windowId, { focused: true });
    let focusTab = id => chrome.tabs.update(id, { active: true, highlighted: true }, focusWindow);

    this.tabId = tabId;

    function updated(id, changeInfo, _) {
      if (id === self.tabId && changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(id, {
          title: title,
          messages: messages,
          pomodoros: pomodoros,
          action: action,
          phase: phase
        }, {}, () => focusTab(id));
      }
    }

    chrome.tabs.onRemoved.addListener(function removed(id) {
      if (id === self.tabId) {
        chrome.tabs.onRemoved.removeListener(removed);
        chrome.tabs.onUpdated.removeListener(updated);
        self.tabId = null;
      }
    });

    chrome.tabs.onUpdated.addListener(updated);
  }

  close() {
    if (this.tabId) {
      chrome.tabs.remove(this.tabId, () => {});
    }
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
  constructor(settingsManager, history) {
    this.history = history;

    this.settingsManager = settingsManager;
    settingsManager.on('change', settings => {
      this._settings = settings;
      let phase = this.timer ? this.timer.phase : Phase.Focus;
      this.loadTimer(settings, phase);
      this.menu.refresh();
    });

    this.expiration = null;
    this.notification = null;
  }

  async run() {
    this._settings = await this.settingsManager.get();
    this.loadTimer(this._settings, Phase.Focus);

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

  loadTimer(settings, startPhase) {
    if (this.timer) {
      this.timer.dispose();
    }

    let factory = (phase, nextPhase) => this.createTimer(phase, nextPhase);
    this.timer = new PomodoroTimer(factory, startPhase, settings.longBreak.interval);
  }

  createTimer(phase, nextPhase) {
    let options = this.timerOptions(phase, nextPhase, this.settings);
    let timer = new Timer(options.duration * 60, 60);

    timer.observe(new BadgeObserver(options.phase, options.badgeColor));

    timer.on('change', () => this.menu.refresh());

    timer.once('expire', async () => {
      if (phase === Phase.Focus) {
        var pomodorosToday = await this.history.addPomodoro();
      } else {
        var pomodorosToday = await this.history.completedToday();
      }

      if (options.sound) {
        let audio = new Audio();
        audio.src = options.sound;
        audio.play();
      }

      if (options.notification) {
        this.notification = await Notification.show(
          options.notification.title,
          options.notification.messages(pomodorosToday),
          options.notification.action
        );
      }

      if (options.tab) {
        this.expiration = await ExpirationPage.show(
          options.tab.title,
          options.tab.messages,
          options.tab.action,
          pomodorosToday,
          options.tab.phase
        );
      }
    });

    timer.once('start', () => {
      if (this.notification) {
        this.notification.close();
        this.notification = null;
      }

      if (this.expiration) {
        this.expiration.close();
        this.expiration = null;
      }
    });

    return timer;
  }

  timerOptions(phase, nextPhase, settings) {
    let pomodoros = this.timer.longBreakPomodoros;
    let pomodorosLeft = pomodoros === 0 ? '' : `${pomodoros} Pomodoro${pomodoros === 1 ? '' : 's'} left until long break`;

    switch (phase) {
    case Phase.Focus:
      var hasLong = settings.longBreak.interval > 0;
      var length = (nextPhase === Phase.ShortBreak) ? 'short' : 'long';
      let lengthTitle = length.replace(/^./, c => c.toUpperCase());
      let nextDuration = settings[`${length}Break`].duration;
      let brk = hasLong ? `${length} break` : 'break';
      var brkTitle = hasLong ? `${lengthTitle} Break` : 'Break';
      var notificationMessages = count => {
        return [pomodorosLeft, `${count} Pomodoro${count === 1 ? '' : 's'} completed today`];
      };
      var tabMessages = [`${nextDuration} minute break`, pomodorosLeft];
      return {
        phase: 'Focus',
        duration: settings.focus.duration,
        sound: settings.focus.notifications.sound,
        badgeColor: '#bb0000',
        notification: !settings.focus.notifications.desktop ? null : {
          title: `Take a ${brkTitle} (${nextDuration}m)`,
          messages: notificationMessages,
          action: `Start ${brk} now`
        },
        tab: !settings.focus.notifications.tab ? null : {
          title: `Take a ${brkTitle}`,
          messages: tabMessages,
          action: `Start ${brkTitle}`,
          phase: `${length}-break`
        }
      };

    case Phase.ShortBreak:
    case Phase.LongBreak:
      var length = (phase === Phase.ShortBreak) ? 'Short' : 'Long'; 
      let breakSettings = (phase === Phase.ShortBreak) ? settings.shortBreak : settings.longBreak;
      var notificationMessages = count => {
        return [pomodorosLeft, `${count} Pomodoro${count === 1 ? '' : 's'} completed today`];
      };
      var tabMessages = [`${settings.focus.duration} minute focus session`, pomodorosLeft];
      return {
        phase: `${length} Break`,
        duration: breakSettings.duration,
        sound: breakSettings.notifications.sound,
        badgeColor: '#009900',
        notification: !breakSettings.notifications.desktop ? null : {
          title: `Start Focusing (${settings.focus.duration}m)`,
          messages: notificationMessages,
          action: 'Start focusing now'
        },
        tab: !breakSettings.notifications.tab ? null : {
          title: 'Start Focusing',
          messages: tabMessages,
          action: 'Start Focusing',
          phase: 'focus'
        }
      };
    }
  }
}

let settingsManager = new SettingsManager(new MarinaraSchema());
let controller = new Controller(settingsManager, new History());
let server = new BackgroundServer(controller, settingsManager);

controller.run();
