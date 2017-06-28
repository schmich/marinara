function BadgeObserver() {
}

BadgeObserver.observe = function(timer, title, color) {
  timer.addListener('start', state => {
    updateBadge({ minutes: Math.round(state.remaining / 60) });
  });

  timer.addListener('tick', state => {
    updateBadge({ minutes: Math.round(state.remaining / 60) });
  });

  timer.addListener('stop', () => {
    removeBadge();
  });

  timer.addListener('pause', () => {
    updateBadge({ text: '—', title: 'Timer Paused' });
  });

  timer.addListener('resume', state => {
    updateBadge({ minutes: Math.round(state.remaining / 60) });
  });

  timer.addListener('expire', () => {
    removeBadge();
  });

  function updateBadge(options) {
    let minutes = options.minutes;
    if (minutes != null) {
      text = ((minutes == 0) ? '<1' : minutes)  + 'm';
      badgeTitle = title + ': ' + minutes + 'm remaining.';
    } else {
      text = options.text;
      badgeTitle = title + ': ' + options.title;
    }

    chrome.browserAction.setTitle({ title: badgeTitle });
    chrome.browserAction.setBadgeText({ text: text });
    chrome.browserAction.setBadgeBackgroundColor({ color: color });
  };

  function removeBadge() {
    chrome.browserAction.setTitle({ title: '' });
    chrome.browserAction.setBadgeText({ text: '' });
  }
}

class AudioObserver
{
  static observe(timer, source) {
    if (source) {
      timer.addListener('expire', () => {
        let audio = new Audio();
        audio.src = source;
        audio.play();
      });
    }
  }
}

class MultiTimer
{
  constructor(...timers) {
    this.timers = timers;
    this.timerIndex = 0;

    for (let item of this.timers) {
      item.timer.addListener('expire', () => {
        this.timerIndex = (this.timerIndex + 1) % this.timers.length;
      });
    }
  }

  get current() {
    return this.timers[this.timerIndex].timer;
  }

  get phase() {
    return this.timers[this.timerIndex].phase;
  }

  get state() {
    return this.current.state;
  }

  get isRunning() {
    return this.current.isRunning;
  }

  get isStopped() {
    return this.current.isStopped;
  }

  get isPaused() {
    return this.current.isPaused;
  }

  start(phase = null) {
    for (let item of this.timers) {
      item.timer.stop();
    }

    if (phase !== null) {
      this.timerIndex = this.timers.findIndex(t => t.phase === phase);
    }

    this.current.start();
  }

  pause() {
    this.current.pause();
  }

  stop() {
    this.current.stop();
  }

  resume() {
    this.current.resume();
  }

  reset() {
    this.current.reset();
  }
}

class Controller
{
  constructor(settings) {
    this.settings = settings;
    this.settings.addListener('change', () => this.createTimers());
    this.createTimers();

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

    this.notificationId = null;
    this.timer = null;

    this.expirePageTabId = null;
    chrome.tabs.onRemoved.addListener(tabId => {
      if (tabId === this.expirePageTabId) {
        this.expirePageTabId = null;
      }
    });

    chrome.notifications.onClicked.addListener(() => {
      this.showExpirePage(tab => {
        chrome.windows.update(tab.windowId, { focused: true });
      });
    });

    chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
      this.start();
      chrome.notifications.clear(notificationId);
    });
  }

  get phase() {
    return this.timer.phase;
  }

  get state() {
    return this.timer ? this.timer.state : null;
  }

  browserAction() {
    if (this.timer.isRunning) {
      this.timer.pause();
    } else if (this.timer.isPaused) {
      this.timer.resume();
    } else {
      this.timer.start();
    }
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

  showExpirePage(callback) {
    if (this.expirePageTabId !== null) {
      chrome.tabs.update(this.expirePageTabId, { active: true, highlighted: true }, callback);
    } else {
      chrome.tabs.create({ url: chrome.extension.getURL('expire/expire.html') }, tab => {
        this.expirePageTabId = tab.id;
        if (callback) {
          callback(tab);
        }
      });
    }
  }

  notify(title, message, buttonTitle) {
    let options = {
      type: 'basic',
      title: title,
      message: message,
      iconUrl: 'icons/128.png',
      isClickable: true,
      buttons: [{ title: buttonTitle, iconUrl: 'icons/start.png' }]
    };

    chrome.notifications.create('', options, id => {
      this.notificationId = id;
    });
  }

  async createTimers() {
    let settings = await this.settings.get();
    if (this.timer) {
      this.timer.stop();
    }

    let fs = settings.focus;
    fs.phase = 'Focus';
    fs.badgeColor = '#990000';
    fs.notificationTitle = 'Take a break!';
    fs.notificationMessage = "Start your break when you're ready";
    fs.notificationButton = 'Start break now';
    let focusTimer = this.createTimer(fs);

    let bs = settings.break;
    bs.phase = 'Break';
    bs.badgeColor = '#009900';
    bs.notificationTitle = 'Break finished';
    bs.notificationMessage = "Start your focus session when you're ready";
    bs.notificationButton = 'Start focusing now';
    let breakTimer = this.createTimer(bs);

    this.timer = new MultiTimer({ phase: 'focus', timer: focusTimer }, { phase: 'break', timer: breakTimer });
  }

  createTimer(settings) {
    let timer = new Timer(settings.duration * 60, 60);
    BadgeObserver.observe(timer, settings.phase, settings.badgeColor);
    AudioObserver.observe(timer, settings.sound);

    timer.addListener('start', () => this.menu.refresh());
    timer.addListener('stop', () => this.menu.refresh());
    timer.addListener('pause', () => this.menu.refresh());
    timer.addListener('resume', () => this.menu.refresh());
    timer.addListener('expire', () => this.menu.refresh());

    timer.addListener('expire', () => {
      if (settings.desktopNotification) {
        this.notify(
          settings.notificationTitle,
          settings.notificationMessage,
          settings.notificationButton
        );
      }

      if (settings.newTabNotification) {
        this.showExpirePage();
      }
    });

    timer.addListener('start', () => {
      this.closeExpireTab();
      this.closeNotifications();
    });

    return timer;
  }

  closeExpireTab() {
    if (this.expirePageTabId !== null) {
      chrome.tabs.remove(this.expirePageTabId, () => {});
    }
  }

  closeNotifications() {
    if (this.notificationId !== null) {
      chrome.notifications.clear(this.notificationId);
      this.notificationId = null;
    }
  }
}

let settings = new Settings();
let controller = new Controller(settings);
let handler = new MarinaraMessageHandler(controller, settings);

chrome.browserAction.onClicked.addListener(() => controller.browserAction());
