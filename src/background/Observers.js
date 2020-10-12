import { M } from '../Messages';
import { Phase } from './Timer';
import * as Sounds from '../Sounds';
import Notification from './Notification';
import { ExpirationPage, ExpirationMessages } from './Expiration';
import Mutex from '../Mutex';
import createTimerSound from '../TimerSound';
import { SingletonPage, PageHost } from './SingletonPage';

class BadgeObserver
{
  onStart({ phase, remaining }) {
    this.updateBadge({ phase, minutes: Math.round(remaining / 60) });
  }

  onTick({ phase, remaining }) {
    this.updateBadge({ phase, minutes: Math.round(remaining / 60) });
  }

  onStop() {
    this.removeBadge();
  }

  onPause({ phase }) {
    this.updateBadge({ phase, text: '—', tooltip: M.timer_paused });
  }

  onResume({ phase, remaining }) {
    this.updateBadge({ phase, minutes: Math.round(remaining / 60) });
  }

  onExpire() {
    this.removeBadge();
  }

  updateBadge({ phase, minutes, tooltip, text }) {
    let title = {
      [Phase.Focus]: M.focus,
      [Phase.ShortBreak]: M.short_break,
      [Phase.LongBreak]: M.long_break
    }[phase];

    if (minutes != null) {
      text = minutes < 1 ? M.less_than_minute : M.n_minutes(minutes);
      tooltip = M.browser_action_tooltip(title, M.time_remaining(text));
    } else {
      tooltip = M.browser_action_tooltip(title, tooltip);
    }

    let color = phase === Phase.Focus ? '#bb0000' : '#11aa11';
    chrome.browserAction.setTitle({ title: tooltip });
    chrome.browserAction.setBadgeText({ text });
    chrome.browserAction.setBadgeBackgroundColor({ color });
  }

  removeBadge() {
    chrome.browserAction.setTitle({ title: '' });
    chrome.browserAction.setBadgeText({ text: '' });
  }
}

class TimerSoundObserver
{
  constructor(settings) {
    this.settings = settings;
    this.mutex = new Mutex();
    this.timerSound = null;
  }

  async onStart({ phase }) {
    let timerSoundSettings = this.settings.focus.timerSound;
    await this.mutex.exclusive(async () => {
      // Cleanup any existing timer sound.
      this.timerSound && await this.timerSound.close();

      if (phase === Phase.Focus && timerSoundSettings) {
        this.timerSound = await createTimerSound(timerSoundSettings);
        this.timerSound.start();
      } else {
        this.timerSound = null;
      }
    });
  }

  async onStop() {
    await this.mutex.exclusive(async () => {
      this.timerSound && await this.timerSound.close();
    });
  }

  async onPause() {
    await this.mutex.exclusive(async () => {
      this.timerSound && await this.timerSound.stop();
    });
  }

  async onResume() {
    await this.mutex.exclusive(async () => {
      this.timerSound && await this.timerSound.start();
    });
  }

  async onExpire() {
    await this.mutex.exclusive(async () => {
      this.timerSound && await this.timerSound.close();
    });
  }
}

class ExpirationSoundObserver
{
  constructor(settings) {
    this.settings = settings;
  }

  onExpire({ phase }) {
    let sound = s => s && s.notifications.sound;
    let filename = {
      [Phase.Focus]: sound(this.settings.focus),
      [Phase.ShortBreak]: sound(this.settings.shortBreak),
      [Phase.LongBreak]: sound(this.settings.longBreak)
    }[phase];

    if (filename) {
      Sounds.play(filename);
    }
  }
}

class NotificationObserver
{
  constructor(timer, settings, history) {
    this.timer = timer;
    this.settings = settings;
    this.history = history;
    this.notification = null;
    this.expiration = null;
    this.mutex = new Mutex();
  }

  onStart() {
    this.mutex.exclusive(async () => {
      if (this.notification) {
        this.notification.close();
        this.notification = null;
      }

      if (this.expiration) {
        this.expiration.close();
        this.expiration = null;
      }
    });
  }

  async onExpire({ phase, nextPhase }) {
    let settings = this.settings[{
      [Phase.Focus]: 'focus',
      [Phase.ShortBreak]: 'shortBreak',
      [Phase.LongBreak]: 'longBreak'
    }[phase]];

    let hasLongBreak = this.timer.hasLongBreak;
    let title_key = {
      [Phase.Focus]: 'start_focusing',
      [Phase.ShortBreak]: hasLongBreak ? 'take_a_short_break' : 'take_a_break',
      [Phase.LongBreak]: 'take_a_long_break'
    }[nextPhase];

    let buttonText_key = {
      [Phase.Focus]: 'start_focusing_now',
      [Phase.ShortBreak]: hasLongBreak ? 'start_short_break_now' : 'start_break_now',
      [Phase.LongBreak]: 'start_long_break_now'
    }[nextPhase];

    let action_key = {
      [Phase.Focus]: 'start_focusing',
      [Phase.ShortBreak]: hasLongBreak ? 'start_short_break' : 'start_break',
      [Phase.LongBreak]: 'start_long_break'
    }[nextPhase];

    let pomodorosRemaining = this.timer.pomodorosUntilLongBreak;
    let pomodorosToday = await this.history.countToday();
    let messages = ExpirationMessages(pomodorosRemaining, pomodorosToday)

    await this.mutex.exclusive(async () => {
      if (settings.notifications.desktop) {
        this.notification = new Notification(M[title_key], messages.join('\n'), () => this.timer.start());
        this.notification.addButton(M[buttonText_key], () => this.timer.start());
        await this.notification.show();
      }

      if (settings.notifications.tab) {
        let phaseId = {
          [Phase.Focus]: 'focus',
          [Phase.ShortBreak]: hasLongBreak ? 'short-break' : 'break',
          [Phase.LongBreak]: 'long-break'
        }[nextPhase];

        this.expiration = await ExpirationPage.show(
          title_key,
          pomodorosRemaining,
          pomodorosToday,
          action_key,
          pomodorosToday,
          phaseId
        );
      }
    });
  }
}

class HistoryObserver
{
  constructor(history) {
    this.history = history;
  }

  async onExpire({ phase, duration }) {
    if (phase !== Phase.Focus) {
      return;
    }

    await this.history.addPomodoro(duration);
  }
}

class CountdownObserver
{
  constructor(settings) {
    this.settings = settings;
  }

  async onStart({ phase }) {
    let settings = this.settings[{
      [Phase.Focus]: 'focus',
      [Phase.ShortBreak]: 'shortBreak',
      [Phase.LongBreak]: 'longBreak'
    }[phase]];

    let { host, resolution } = settings.countdown;
    if (!host) {
      return;
    }

    let page = null;
    let url = chrome.extension.getURL('modules/countdown.html');

    if (host === 'tab') {
      page = await SingletonPage.show(url, PageHost.Tab);
      page.focus();
      return;
    }

    if (host !== 'window') {
      return;
    }

    let properties = {};
    if (resolution === 'fullscreen') {
      properties = { state: 'maximized' };
    } else if (Array.isArray(resolution)) {
      let [windowWidth, windowHeight] = resolution;
      const { width: screenWidth, height: screenHeight } = window.screen;
      let left = screenWidth / 2 - windowWidth / 2;
      let top = screenHeight / 2 - windowHeight / 2;
      properties = { width: windowWidth, height: windowHeight, left, top };
    }

    page = await SingletonPage.show(url, PageHost.Window, properties);
    page.focus();
  }
}

class MenuObserver
{
  constructor(menu) {
    this.menu = menu;
  }

  onStart() {
    this.menu.apply();
  }

  onStop() {
    this.menu.apply();
  }

  onPause() {
    this.menu.apply();
  }

  onResume() {
    this.menu.apply();
  }

  onTick() {
    this.menu.apply();
  }

  onExpire() {
    this.menu.apply();
  }
}

class TraceObserver
{
  onStart(...args) {
    console.log('start', ...args);
  }

  onStop(...args) {
    console.log('stop', ...args);
  }

  onPause(...args) {
    console.log('pause', ...args);
  }

  onResume(...args) {
    console.log('resume', ...args);
  }

  onTick(...args) {
    console.log('tick', ...args);
  }

  onExpire(...args) {
    console.log('expire', ...args);
  }
}

export {
  BadgeObserver,
  TimerSoundObserver,
  ExpirationSoundObserver,
  NotificationObserver,
  HistoryObserver,
  CountdownObserver,
  MenuObserver,
  TraceObserver
};