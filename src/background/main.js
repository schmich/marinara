import M from '../Messages';
import { pomodoroCount } from '../Filters';
import { Timer, Phase, PomodoroTimer } from './Timer';
import Chrome from '../Chrome';
import * as Menu from './Menu';
import * as Sounds from '../Sounds';
import History from './History';
import StorageManager from './StorageManager';
import SettingsSchema from './SettingsSchema';
import {
  HistoryService,
  SoundsService,
  SettingsService,
  PomodoroService
} from './Services';
import Notification from './Notification';
import SingletonPage from './SingletonPage';
import ExpirationPage from './ExpirationPage';
import Metronome from '../Metronome';

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
    this.updateBadge({ text: '—', tooltip: M.timer_paused });
  }

  resume(elapsed, remaining) {
    this.updateBadge({ minutes: Math.round(remaining / 60) });
  }

  expire() {
    this.removeBadge();
  }

  updateBadge({ minutes, tooltip, text }) {
    if (minutes != null) {
      text = minutes < 1 ? M.less_than_minute : M.n_minutes(minutes);
      tooltip = M.browser_action_tooltip(this.title, M.time_remaining(text));
    } else {
      tooltip = M.browser_action_tooltip(this.title, tooltip);
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
      this.setAlarm(settings);
      this.menu.apply();
    });

    this.expiration = null;
    this.notification = null;
  }

  async run() {
    this._settings = await this.settingsManager.get();
    this.setAlarm(this._settings);
    this.loadTimer(this._settings, Phase.Focus);
    this.menu = this.createMenu();
    this.menu.apply();

    chrome.alarms.onAlarm.addListener(alarm => {
      if (alarm.name !== 'autostart') {
        return;
      }

      // Set next autostart alarm.
      this.setAlarm(this._settings);

      if (!this.timer.isStopped) {
        return;
      }

      // Start a new cycle.
      this.timer.startCycle();

      Chrome.notifications.create({
        type: 'basic',
        title: M.autostart_notification_title,
        message: M.autostart_notification_message,
        iconUrl: 'images/128.png',
        isClickable: false,
        requireInteraction: true
      });
    });

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

  async showOptionsPage(page) {
    let manifest = chrome.runtime.getManifest();

    let windows = chrome.extension.getViews({ type: 'tab' });
    for (let window of windows) {
      if (window.location.toString().indexOf(manifest.options_page) >= 0) {
        window.postMessage({ page });
        return;
      }
    }

    let url = chrome.extension.getURL(manifest.options_page + '#/' + page);
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

  async setAlarm(settings) {
    await Chrome.alarms.clearAll();

    let time = settings.autostart && settings.autostart.time;
    if (!time) {
      return;
    }

    const now = new Date();

    let startAt = new Date();
    startAt.setHours(...time.split(':'), 0, 0);
    if (startAt <= now) {
      // The trigger is in the past. Set it for tomorrow instead.
      startAt.setDate(startAt.getDate() + 1);
    }

    Chrome.alarms.create('autostart', { when: +startAt, });
  }

  createMenu() {
    let pause = new Menu.PauseTimerAction(this);
    let resume = new Menu.ResumeTimerAction(this);
    let stop = new Menu.StopTimerAction(this);

    let startCycle = new Menu.StartPomodoroCycleAction(this);
    let startFocus = new Menu.StartFocusingAction(this);
    let startShortBreak = new Menu.StartShortBreakAction(this);
    let startLongBreak = new Menu.StartLongBreakAction(this);

    let viewHistory = new Menu.PomodoroHistoryAction(this);

    let inactive = new Menu.Menu(['browser_action'],
      new Menu.MenuGroup(
        startCycle,
        startFocus,
        startShortBreak,
        startLongBreak
      ),
      new Menu.MenuGroup(
        viewHistory
      )
    );

    let active = new Menu.Menu(['browser_action'],
      new Menu.MenuGroup(
        pause,
        resume,
        stop,
        new Menu.RestartTimerParentMenu(
          startFocus,
          startShortBreak,
          startLongBreak
        ),
        startCycle
      ),
      new Menu.MenuGroup(
        viewHistory
      )
    );

    return new Menu.PomodoroMenuSelector(controller, inactive, active);
  }

  loadTimer(settings, startPhase) {
    if (this.timer) {
      this.timer.dispose();
    }

    const factory = async (phase, nextPhase) => await this.createTimer(phase, nextPhase);
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
        Sounds.play(options.sound);
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
    let pomodorosLeft = pomodoros === 0 ? '' : M.pomodoros_until_long_break(pomodoroCount(pomodoros));
    let notificationMessages = count => {
      let pomodorosToday = count === 0 ? '' : M.pomodoros_completed_today(pomodoroCount(count));
      return [pomodorosLeft, pomodorosToday];
    };

    switch (phase) {
    case Phase.Focus:
      let breakId = 'break';
      if (settings.longBreak.interval > 0) {
        breakId = (nextPhase == Phase.ShortBreak) ? 'short_break' : 'long_break';
      }
      let title = M[`take_a_${breakId}`];
      return {
        phase: M.focus_title,
        duration: settings.focus.duration,
        sound: settings.focus.notifications.sound,
        badgeColor: '#bb0000',
        timerSound: settings.focus.timerSound,
        notification: !settings.focus.notifications.desktop ? null : {
          title: title,
          messages: notificationMessages,
          action: M[`start_${breakId}_now`]
        },
        tab: !settings.focus.notifications.tab ? null : {
          title: title,
          messages: [pomodorosLeft],
          action: M[`start_${breakId}`],
          phase: breakId.replace('_', '-')
        }
      };

    case Phase.ShortBreak:
    case Phase.LongBreak:
      let phaseTitle = phase == Phase.ShortBreak ? M.short_break_title : M.long_break_title;
      let breakSettings = (phase === Phase.ShortBreak) ? settings.shortBreak : settings.longBreak;
      return {
        phase: phaseTitle,
        duration: breakSettings.duration,
        sound: breakSettings.notifications.sound,
        badgeColor: '#11aa11',
        timerSound: null,
        notification: !breakSettings.notifications.desktop ? null : {
          title: M.start_focusing,
          messages: notificationMessages,
          action: M.start_focusing_now
        },
        tab: !breakSettings.notifications.tab ? null : {
          title: M.start_focusing,
          messages: [pomodorosLeft],
          action: M.start_focusing,
          phase: 'focus'
        }
      };
    }
  }
}

let history = new History();
let settingsManager = new StorageManager(new SettingsSchema(), Chrome.storage.sync);
let controller = new Controller(settingsManager, history);

HistoryService.start(controller, history);
SoundsService.start();
SettingsService.start(controller, settingsManager);
PomodoroService.start(controller);

controller.run();