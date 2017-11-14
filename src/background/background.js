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
    this.updateBadge({ text: '—', tooltip: T('timer_paused') });
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
      text = minutes < 1 ? T('less_than_minute') : T('n_minutes', minutes);
      tooltip = T('browser_action_tooltip', this.title, T('time_remaining', text));
    } else {
      tooltip = T('browser_action_tooltip', this.title, tooltip);
    }

    chrome.browserAction.setTitle({ title: tooltip });
    chrome.browserAction.setBadgeText({ text: text });
    chrome.browserAction.setBadgeBackgroundColor({ color: this.color });
  }

  removeBadge() {
    chrome.browserAction.setTitle({ title: '' });
    chrome.browserAction.setBadgeText({ text: '' });
  }
}

class TimerSoundObserver
{
  constructor(metronome) {
    this.metronome = metronome;
  }

  start(elapsed, remaining) {
    this.metronome.start();
  }

  stop() {
    this.metronome.close();
  }

  pause() {
    this.metronome.stop();
  }

  resume(elapsed, remaining) {
    this.metronome.start();
  }

  expire() {
    this.metronome.close();
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
      this.menu.apply();
    });

    this.expiration = null;
    this.notification = null;
  }

  async run() {
    this._settings = await this.settingsManager.get();
    this.loadTimer(this._settings, Phase.Focus);
    this.menu = this.createMenu();
    this.menu.apply();

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

  async showOptionsPage(hash) {
    let manifest = chrome.runtime.getManifest();

    let views = chrome.extension.getViews({ type: 'tab' });
    for (let view of views) {
      if (view.location.toString().indexOf(manifest.options_page) >= 0 && view.focus) {
        view.focus(hash);
        return;
      }
    }

    let url = chrome.extension.getURL(manifest.options_page + hash);
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

  createMenu() {
    let pause = new PauseTimerAction(this);
    let resume = new ResumeTimerAction(this);
    let stop = new StopTimerAction(this);

    let startCycle = new StartPomodoroCycleAction(this);
    let startFocus = new StartFocusingAction(this);
    let startShortBreak = new StartShortBreakAction(this);
    let startLongBreak = new StartLongBreakAction(this);

    let viewHistory = new PomodoroHistoryAction(this);

    let inactive = new Menu(['browser_action'],
      new MenuGroup(
        startCycle,
        startFocus,
        startShortBreak,
        startLongBreak
      ),
      new MenuGroup(
        viewHistory
      )
    );

    let active = new Menu(['browser_action'],
      new MenuGroup(
        pause,
        resume,
        stop,
        new RestartTimerParentMenu(
          startFocus,
          startShortBreak,
          startLongBreak
        ),
        startCycle
      ),
      new MenuGroup(
        viewHistory
      )
    );

    return new PomodoroMenuSelector(controller, inactive, active);
  }

  loadTimer(settings, startPhase) {
    if (this.timer) {
      this.timer.dispose();
    }

    const factory = async (phase, nextPhase) => {
      return await this.createTimer(phase, nextPhase);
    };
    this.timer = new PomodoroTimer(factory, startPhase, settings.longBreak.interval);
  }

  async createTimer(phase, nextPhase) {
    let options = this.timerOptions(phase, nextPhase, this.settings);
    let duration = Math.floor(options.duration * 60);
    let timer = new Timer(duration, 60);

    timer.observe(new BadgeObserver(options.phase, options.badgeColor));

    let timerSound = options.timerSound;
    if (timerSound) {
      let metronome = await Metronome.create(timerSound.files, (60 / timerSound.bpm) * 1000);
      timer.observe(new TimerSoundObserver(metronome));
    }

    timer.on('change', () => this.menu.apply());

    timer.once('expire', async () => {
      if (phase === Phase.Focus) {
        var pomodorosToday = await this.history.addPomodoro(duration);
      } else {
        var pomodorosToday = await this.history.countToday();
      }

      if (options.sound) {
        let audio = new Audio();
        audio.volume = 1;
        audio.src = options.sound;
        audio.play();
      }

      if (options.notification) {
        this.notification = await Notification.show(
          this,
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
    let pomodorosLeft = pomodoros === 0 ? '' : T('pomodoros_until_long_break', this.pomodoroCount(pomodoros));
    let notificationMessages = count => {
      let pomodorosToday = count === 0 ? '' : T('pomodoros_completed_today', this.pomodoroCount(count));
      return [pomodorosLeft, pomodorosToday];
    };

    switch (phase) {
    case Phase.Focus:
      let breakId = 'break';
      if (settings.longBreak.interval > 0) {
        breakId = (nextPhase == Phase.ShortBreak) ? 'short_break' : 'long_break';
      }
      let title = T(`take_a_${breakId}`)
      return {
        phase: T('focus_title'),
        duration: settings.focus.duration,
        sound: settings.focus.notifications.sound,
        badgeColor: '#bb0000',
        timerSound: settings.focus.timerSound,
        notification: !settings.focus.notifications.desktop ? null : {
          title: title,
          messages: notificationMessages,
          action: T(`start_${breakId}_now`)
        },
        tab: !settings.focus.notifications.tab ? null : {
          title: title,
          messages: [pomodorosLeft],
          action: T(`start_${breakId}`),
          phase: breakId.replace('_', '-')
        }
      };

    case Phase.ShortBreak:
    case Phase.LongBreak:
      let phaseTitle = T(phase === Phase.ShortBreak ? 'short_break_title' : 'long_break_title');
      let breakSettings = (phase === Phase.ShortBreak) ? settings.shortBreak : settings.longBreak;
      return {
        phase: phaseTitle,
        duration: breakSettings.duration,
        sound: breakSettings.notifications.sound,
        badgeColor: '#11aa11',
        timerSound: null,
        notification: !breakSettings.notifications.desktop ? null : {
          title: T('start_focusing'),
          messages: notificationMessages,
          action: T('start_focusing_now')
        },
        tab: !breakSettings.notifications.tab ? null : {
          title: T('start_focusing'),
          messages: [pomodorosLeft],
          action: T('start_focusing'),
          phase: 'focus'
        }
      };
    }
  }

  pomodoroCount(count) {
    if (count === 0) {
      return T('pomodoro_count_zero');
    } else if (count === 1) {
      return T('pomodoro_count_one');
    } else {
      return T('pomodoro_count_many', count.toLocaleString());
    }
  }
}

let history = new History();
let settingsManager = new StorageManager(new MarinaraSchema(), AsyncChrome.storage.sync);
let controller = new Controller(settingsManager, history);
let server = new BackgroundServer(controller, history, settingsManager);

controller.run();
