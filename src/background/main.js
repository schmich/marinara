import { PomodoroTimer } from './Timer';
import Chrome from '../Chrome';
import { createPomodoroMenu } from './Menu';
import History from './History';
import StorageManager from './StorageManager';
import { SettingsSchema, PersistentSettings } from './Settings';
import { HistoryService, SoundsService, SettingsService, PomodoroService, OptionsService } from './Services';
import { BadgeObserver, TimerSoundObserver, ExpirationSoundObserver, NotificationObserver, HistoryObserver, MenuObserver } from './Observers';
import { ServiceBroker } from '../Service';
import * as Alarms from './Alarms';

class Controller
{
  static run(timer, settingsManager, settings, history) {
    return new Controller(timer, settingsManager, settings, history);
  }

  constructor(timer, settingsManager, settings, history) {
    this.settings = settings;
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
    settingsManager.on('change', () => this.menu.apply());

    Alarms.install(timer, settingsManager);
    chrome.browserAction.onClicked.addListener(() => this.onBrowserAction());
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