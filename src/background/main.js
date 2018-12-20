import M from '../Messages';
import { PomodoroTimer } from './Timer';
import Chrome from '../Chrome';
import { createPomodoroMenu } from './Menu';
import History from './History';
import StorageManager from './StorageManager';
import { SettingsSchema, PersistentSettings } from './Settings';
import { HistoryService, SoundsService, SettingsService, PomodoroService, OptionsService } from './Services';
import { BadgeObserver, TimerSoundObserver, ExpirationSoundObserver, NotificationObserver, HistoryObserver, MenuObserver } from './Observers';
import { ServiceBroker } from '../Service';

class Controller
{
  static run(timer, settingsManager, settings, history) {
    return new Controller(timer, settingsManager, settings, history);
  }

  constructor(timer, settingsManager, settings, history) {
    this.settings = settings;
    settingsManager.on('change', () => this.onSettingsChange(settings));

    this.history = history;
    this.timer = timer;
    this.menu = createPomodoroMenu(this.timer);
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
}

async function run() {
  let settingsManager = new StorageManager(new SettingsSchema(), Chrome.storage.sync);
  let settings = await PersistentSettings.create(settingsManager);
  let timer = new PomodoroTimer(settings);
  let history = new History();
  Controller.run(timer, settingsManager, settings, history);

  ServiceBroker.register(new HistoryService(history));
  ServiceBroker.register(new SoundsService());
  ServiceBroker.register(new SettingsService(settingsManager));
  ServiceBroker.register(new PomodoroService(timer));
  ServiceBroker.register(new OptionsService());
}

run();