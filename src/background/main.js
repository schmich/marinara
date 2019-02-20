import { PomodoroTimer } from './Timer';
import Chrome from '../Chrome';
import { createPomodoroMenu } from './Menu';
import { History } from './History';
import StorageManager from './StorageManager';
import { SettingsSchema, PersistentSettings } from './Settings';
import { HistoryService, SoundsService, SettingsService, PomodoroService, OptionsService } from './Services';
import { BadgeObserver, TimerSoundObserver, ExpirationSoundObserver, NotificationObserver, HistoryObserver, CountdownObserver, MenuObserver } from './Observers';
import { ServiceBroker } from '../Service';
import * as Alarms from './Alarms';

async function run() {
  let settingsManager = new StorageManager(new SettingsSchema(), Chrome.storage.sync);
  let settings = await PersistentSettings.create(settingsManager);
  let timer = new PomodoroTimer(settings);
  let history = new History();

  let menu = createPomodoroMenu(timer);
  timer.observe(new HistoryObserver(history));
  timer.observe(new BadgeObserver());
  timer.observe(new NotificationObserver(timer, settings, history));
  timer.observe(new ExpirationSoundObserver(settings));
  timer.observe(new TimerSoundObserver(settings));
  timer.observe(new CountdownObserver(settings));
  timer.observe(new MenuObserver(menu));

  menu.apply();
  settingsManager.on('change', () => menu.apply());

  Alarms.install(timer, settingsManager);
  chrome.browserAction.onClicked.addListener(() => {
    if (timer.isRunning) {
      timer.pause();
    } else if (timer.isPaused) {
      timer.resume();
    } else {
      timer.start();
    }
  });

  ServiceBroker.register(new HistoryService(history));
  ServiceBroker.register(new SoundsService());
  ServiceBroker.register(new SettingsService(settingsManager));
  ServiceBroker.register(new PomodoroService(timer));
  ServiceBroker.register(new OptionsService());
}

run();