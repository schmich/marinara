class BrowserTimerManager
{
  constructor(controller) {
    this.notificationId = null;
    this.expirationTabId = null;

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

  createTimer(settings) {
    let timer = new Timer(settings.duration * 60, 60);
    timer.observe(new BadgeObserver(settings.phase, settings.badgeColor));

    if (settings.sound) {
      timer.addListener('expire', () => {
        let audio = new Audio();
        audio.src = source;
        audio.play();
      });
    }

    timer.addListener('expire', () => {
      if (settings.notification) {
        this.notify(
          settings.notification.title,
          settings.notification.message,
          settings.notification.button
        );
      }

      if (settings.tab) {
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
    this.settings.addListener('change', () => this.createTimer());
    this.createTimer();

    this.menu = new Menu(['browser_action'],
      new MenuGroup(
        new PauseTimerMenuItem(this),
        new ResumeTimerMenuItem(this),
        new StopTimerMenuItem(this)
      ),
      new MenuGroup(
        new StartFocusingMenuItem(this),
        new StartBreakMenuItem(this)
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
    this.timer.start('focus');
  }

  startBreak() {
    this.timer.start('break');
  }

  async createTimer() {
    let settings = await this.settings.get();
    if (this.timer) {
      this.timer.stop();
    }

    let focusTimer = this.timerManager.createTimer({
      phase: 'Focus',
      duration: settings.focus.duration,
      sound: settings.focus.sound,
      badgeColor: '#bb0000',
      notification: !settings.focus.desktopNotification ? null : {
        title: 'Take a break!',
        message: "Start your break when you're ready",
        button: 'Start break now'
      },
      tab: settings.focus.newTabNotification
    });

    let breakTimer = this.timerManager.createTimer({
      phase: 'Break',
      duration: settings.break.duration,
      sound: settings.break.sound,
      badgeColor: '#009900',
      notification: !settings.break.desktopNotification ? null : {
        title: 'Break finished',
        message: "Start your focus session when you're ready",
        button: 'Start focusing now'
      },
      tab: settings.break.newTabNotification
    });

    for (let timer of [focusTimer, breakTimer]) {
      timer.addListener('change', () => this.menu.refresh());
    }

    this.timer = new MultiTimer(
      { phase: 'focus', timer: focusTimer },
      { phase: 'break', timer: breakTimer }
    );
  }
}

let settings = new Settings();
let controller = new Controller(settings);
let handler = new BackgroundMessageHandler(controller, settings);
