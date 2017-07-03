class BrowserTimerManager
{
  constructor(controller) {
    this.notificationId = null;
    this.expirationTabId = null;
    this.controller = controller;

    chrome.tabs.onRemoved.addListener(tabId => {
      if (tabId === this.expirationTabId) {
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

    timer.addListener('expire', () => {
      if (options.sound) {
        let audio = new Audio();
        audio.src = options.sound;
        audio.play();
      }

      if (options.notification) {
        this.notify(
          options.notification.title,
          options.notification.message,
          options.notification.button
        );
      }

      if (options.tab) {
        this.showExpiration();
      }
    });

    timer.addListener('start', () => {
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

  showExpiration() {
    let focusWindow = tab => chrome.windows.update(tab.windowId, { focused: true });
    let focusTab = id => chrome.tabs.update(id, { active: true, highlighted: true }, focusWindow);

    if (this.expirationTabId !== null) {
      focusTab(this.expirationTabId);
    } else {
      chrome.tabs.create({ url: chrome.extension.getURL('expire/expire.html') }, tab => {
        this.expirationTabId = tab.id;
        focusTab(tab.id);
      });
    }
  }

  notify(text, message, buttonText) {
    let options = {
      type: 'basic',
      title: text,
      message: message,
      iconUrl: 'icons/128.png',
      isClickable: true,
      buttons: [{ title: buttonText, iconUrl: 'icons/start.png' }]
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

  start({ remaining }) {
    this.updateBadge({ minutes: Math.round(remaining / 60) });
  }

  tick({ remaining }) {
    this.updateBadge({ minutes: Math.round(remaining / 60) });
  }

  stop() {
    this.removeBadge();
  }

  pause() {
    this.updateBadge({ text: '—', tooltip: 'Timer Paused' });
  }

  resume({ remaining }) {
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
  constructor(settings) {
    this.timerManager = new BrowserTimerManager(this);

    this.settings = settings;
    this.settings.addListener('change', () => this.loadTimers());
    this.loadTimers();

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

  async loadTimers() {
    let settings = await this.settings.get();
    if (this.timer) {
      this.timer.stop();
    }

    let timerFactory = (phase, nextPhase) => {
      let timer = this.createTimer(phase, nextPhase, settings);
      timer.addListener('change', () => this.menu.refresh());
      return timer;
    };

    this.timer = new PomodoroTimer(timerFactory, settings.longBreak.interval);
  }

  createTimer(phase, nextPhase, settings) {
    switch (phase) {
    case Phase.Focus:
      let length = (nextPhase === Phase.ShortBreak) ? 'short' : 'long';
      return this.timerManager.createTimer({
        phase: 'Focus',
        duration: settings.focus.duration,
        sound: settings.focus.notifications.sound,
        badgeColor: '#bb0000',
        notification: !settings.focus.notifications.desktop ? null : {
          title: 'Take a break!',
          message: `Start your ${length} break when you're ready`,
          button: `Start ${length} break now`
        },
        tab: settings.focus.notifications.tab
      });

    case Phase.ShortBreak:
      return this.timerManager.createTimer({
        phase: 'Short Break',
        duration: settings.shortBreak.duration,
        sound: settings.shortBreak.notifications.sound,
        badgeColor: '#009900',
        notification: !settings.shortBreak.notifications.desktop ? null : {
          title: 'Short break finished',
          message: "Start focusing when you're ready",
          button: 'Start focusing now'
        },
        tab: settings.shortBreak.notifications.tab
      });

    case Phase.LongBreak:
      return this.timerManager.createTimer({
        phase: 'Long Break',
        duration: settings.longBreak.duration,
        sound: settings.longBreak.notifications.sound,
        badgeColor: '#009900',
        notification: !settings.longBreak.notifications.desktop ? null : {
          title: 'Long break finished',
          message: "Start focusing when you're ready",
          button: 'Start focusing now'
        },
        tab: settings.longBreak.notifications.tab
      });
    }
  }
}

let settings = new Settings();
let controller = new Controller(settings);
let server = new BackgroundServer(controller, settings);
