import M from '../Messages';
import { PersistentPomodoroTimer } from './Timer';
import Chrome from '../Chrome';
import * as Menu from './Menu';
import History from './History';
import StorageManager from './StorageManager';
import SettingsSchema from './SettingsSchema';
import { HistoryService, SoundsService, SettingsService, PomodoroService, OptionsService } from './Services';
import { BadgeObserver, TimerSoundObserver, ExpirationSoundObserver, NotificationObserver, HistoryObserver, MenuObserver } from './Observers';
import { ServiceBroker } from '../Service';

class PersistentSettings
{
  static async create(settingsManager) {
    let settings = await settingsManager.get();
    settingsManager.on('change', newSettings => settings = newSettings);
    return new Proxy(function() {}, {
      get(target, prop, receiver) {
        return settings[prop];
      }
    });
  }
}

class Controller
{
  static async run(timer, settingsManager, history) {
    let settings = await PersistentSettings.create(settingsManager);
    return new Controller(timer, settingsManager, settings, history);
  }

  constructor(timer, settingsManager, settings, history) {
    this.settings = settings;
    settingsManager.on('change', () => this.onSettingsChange(settings));

    this.history = history;
    this.timer = timer;
    this.menu = this.createMenu(this.timer);
    this.timer.observe(new HistoryObserver(history));
    this.timer.observe(new BadgeObserver());
    this.timer.observe(new NotificationObserver(timer, settings, history));
    this.timer.observe(new ExpirationSoundObserver(settings));
    this.timer.observe(new TimerSoundObserver(settings));
    this.timer.observe(new MenuObserver(this.menu));
    this.menu.apply();

    chrome.alarms.onAlarm.addListener(alarm => this.onAlarm(alarm));
    chrome.browserAction.onClicked.addListener(() => this.onBrowserAction());
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

  onAlarm(alarm) {
    if (alarm.name !== 'autostart') {
      return;
    }

    // Set next autostart alarm.
    this.setAlarm(this.settings);

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
  }

  onSettingsChange(settings) {
    this.setAlarm(settings);
  }

  onBrowserAction() {
    if (this.timer.isRunning) {
      this.timer.pause();
    } else if (this.timer.isPaused) {
      this.timer.resume();
    } else {
      this.timer.start();
    }
  }

  createMenu(timer) {
    let pause = new Menu.PauseTimerAction(timer);
    let resume = new Menu.ResumeTimerAction(timer);
    let stop = new Menu.StopTimerAction(timer);
    let startCycle = new Menu.StartPomodoroCycleAction(timer);
    let startFocus = new Menu.StartFocusingAction(timer);
    let startShortBreak = new Menu.StartShortBreakAction(timer);
    let startLongBreak = new Menu.StartLongBreakAction(timer);
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

    return new Menu.PomodoroMenuSelector(timer, inactive, active);
  }
}

async function run() {
  let settingsManager = new StorageManager(new SettingsSchema(), Chrome.storage.sync);
  let timer = await PersistentPomodoroTimer.create(settingsManager);
  let history = new History();
  await Controller.run(timer, settingsManager, history);

  ServiceBroker.register(new HistoryService(history));
  ServiceBroker.register(new SoundsService());
  ServiceBroker.register(new SettingsService(timer, settingsManager));
  ServiceBroker.register(new PomodoroService(timer));
  ServiceBroker.register(new OptionsService());
}

run();