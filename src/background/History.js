import Chrome from '../Chrome';
import StorageManager from './StorageManager';
import RLE from './RLE';
import Mutex from '../Mutex';
import M from '../Messages';

class History
{
  constructor() {
    this.storage = new StorageManager(new HistorySchema(), Chrome.storage.local);
    this.mutex = new Mutex();
  }

  async raw() {
    return await this.storage.get();
  }

  async import(history) {
    await this.mutex.exclusive(async () => {
      if (!history.pomodoros) {
        throw new Error(M.missing_pomodoro_data);
      }

      if (!history.durations) {
        throw new Error(M.missing_duration_data);
      }

      if (!history.timezones) {
        throw new Error(M.missing_timezone_data);
      }

      let durations = RLE.decode(history.durations);
      let timezones = RLE.decode(history.timezones);

      if (history.pomodoros.length !== durations.length) {
        throw new Error('Mismatched Pomodoro/duration data.');
      }

      if (history.pomodoros.length !== timezones.length) {
        throw new Error('Mismatched Pomodoro/timezone data.');
      }

      await this.storage.set(history);
    });
  }

  async addPomodoro(duration, when = null) {
    await this.mutex.exclusive(async () => {
      let local = await this.storage.get();

      when = when || new Date();
      let timestamp = History.timestamp(when);

      let i = local.pomodoros.length - 1;
      while (i >= 0 && local.pomodoros[i] > timestamp) {
        --i;
      }

      let timezone = when.getTimezoneOffset();

      if (i >= local.pomodoros.length - 1) {
        // Timestamps *should* be monotonically increasing, so we should
        // always be able to quickly append new values.
        RLE.append(local.durations, duration);
        RLE.append(local.timezones, timezone);
        local.pomodoros.push(timestamp);
      } else {
        // If there is a timestamp inversion for some reason, insert values
        // at the correct sorted position.
        let durations = RLE.decode(local.durations);
        durations.splice(i + 1, 0, duration);
        local.durations = RLE.encode(durations);

        let timezones = RLE.decode(local.timezones);
        timezones.splice(i + 1, 0, timezone);
        local.timezones = RLE.encode(timezones);

        local.pomodoros.splice(i + 1, 0, timestamp);
      }

      await this.storage.set(local);

      return this.countSince(local.pomodoros, History.today);
    });
  }

  async stats(since) {
    return this.mutex.exclusive(async () => {
      let { pomodoros } = await this.storage.get('pomodoros');

      let total = pomodoros.length;
      let delta = total === 0 ? 0 : (new Date() - History.date(pomodoros[0]));
      let dayCount = Math.max(delta / 1000 / 60 / 60 / 24, 1);
      let weekCount = Math.max(dayCount / 7, 1);
      let monthCount = Math.max(dayCount / (365.25 / 12), 1);

      return {
        day: this.countSince(pomodoros, History.today),
        dayAverage: total / dayCount,
        week: this.countSince(pomodoros, History.thisWeek),
        weekAverage: total / weekCount,
        month: this.countSince(pomodoros, History.thisMonth),
        monthAverage: total / monthCount,
        period: this.countSince(pomodoros, new Date(since)),
        total: total,
        daily: this.dailyGroups(pomodoros, since),
        pomodoros: pomodoros.map(p => +History.date(p))
      };
    });
  }

  async countToday(pomodoros = null) {
    return this.mutex.exclusive(async () => {
      if (!pomodoros) {
        pomodoros = (await this.storage.get('pomodoros')).pomodoros;
        if (pomodoros.length === 0) {
          return 0;
        }
      }

      return this.countSince(pomodoros, History.today);
    });
  }

  countSince(pomodoros, date) {
    let timestamp = History.timestamp(date);
    let index = search(pomodoros, timestamp);
    if (index === null) {
      return 0;
    }

    return pomodoros.length - index;
  }

  dailyGroups(pomodoros, since) {
    let start = new Date(since);

    let daily = {};
    let base = 0;
    let date = History.today;
    while (date >= start) {
      let countSince = this.countSince(pomodoros, date);
      let count = countSince - base;
      if (count > 0) {
        daily[+date] = count;
        base = countSince;
      }
      date.setDate(date.getDate() - 1);
    }

    return daily;
  }

  static timestamp(date) {
    return Math.floor(+date / 1000 / 60);
  }

  static date(timestamp) {
    return new Date(timestamp * 60 * 1000);
  }

  static get today() {
    let today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    return today;
  }

  static get thisWeek() {
    let week = new Date();
    week.setDate(week.getDate() - week.getDay());
    week.setHours(0);
    week.setMinutes(0);
    week.setSeconds(0);
    week.setMilliseconds(0);
    return week;
  }

  static get thisMonth() {
    let month = new Date();
    month.setDate(1);
    month.setHours(0);
    month.setMinutes(0);
    month.setSeconds(0);
    month.setMilliseconds(0);
    return month;
  }
}

class HistorySchema
{
  get version() {
    return 1;
  }

  get default() {
    return {
      pomodoros: [],
      durations: [],
      timezones: [],
      version: this.version
    };
  }
}

function search(arr, min, lo = null, hi = null) {
  lo = lo || 0;
  hi = hi || (arr.length - 1);

  while (lo <= hi) {
    let mid = Math.floor((lo + hi) / 2);
    if (arr[mid] >= min) {
      hi = mid - 1;
    } else if (arr[mid] < min) {
      lo = mid + 1;
    }
  }

  return lo < arr.length ? lo : null;
}

export default History;