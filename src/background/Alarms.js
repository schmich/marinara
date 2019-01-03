import Chrome from '../Chrome';
import Mutex from '../Mutex';

let settings = null;
let mutex = new Mutex();

async function install(timer, settingsManager) {
  settings = await settingsManager.get();
  settingsManager.on('change', async newSettings => {
    settings = newSettings;
    await setAlarm(settings);
  });
  chrome.alarms.onAlarm.addListener(alarm => onAlarm(alarm, timer));
  await setAlarm(settings);
}

async function setAlarm(settings) {
  await mutex.exclusive(async () => {
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
  });
}

async function onAlarm(alarm, timer) {
  if (alarm.name !== 'autostart') {
    return;
  }

  // Set next autostart alarm.
  await setAlarm(settings);

  if (!timer.isStopped) {
    return;
  }

  // Start a new cycle.
  timer.startCycle();

  Chrome.notifications.create({
    type: 'basic',
    title: M.autostart_notification_title,
    message: M.autostart_notification_message,
    iconUrl: 'images/128.png',
    isClickable: false,
    requireInteraction: true
  });
}

export {
  install
};