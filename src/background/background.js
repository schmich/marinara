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
        new StartPomodoroCycleMenuItem(this),
        new StartTimerParentMenu(
          new StartFocusingMenuItem(this),
          new StartShortBreakMenuItem(this),
          new StartLongBreakMenuItem(this)
        ),
        new PomodoroHistoryMenuItem(this)
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

  async showHistory() {
    let manifest = chrome.runtime.getManifest();
    let url = chrome.extension.getURL(manifest.options_page + '#history');
    await SingletonPage.show(url);
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

  startCycle() {
    this.timer.startCycle();
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

      // Reload history on options page.
      let views = chrome.extension.getViews({ type: 'tab' });
      for (let view of views) {
        if (view.loadHistory) {
          view.loadHistory(true);
        }
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

let history = new History();
let settingsManager = new StorageManager(new MarinaraSchema(), AsyncChrome.storage.sync);
let controller = new Controller(settingsManager, history);
let server = new BackgroundServer(controller, history, settingsManager);

controller.run();
