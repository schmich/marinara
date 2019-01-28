import Chrome from '../Chrome';
import StorageManager from './StorageManager';
import RLE from './RLE';
import Mutex from '../Mutex';
import M from '../Messages';
import moment from 'moment';

class History
{
  constructor() {
    this.storage = new StorageManager(new HistorySchema(), Chrome.storage.local);
    this.mutex = new Mutex();
  }

  async all() {
    return await this.storage.get();
  }

  async clear() {
    await this.storage.set(this.storage.schema.default);
  }

  async merge(history) {
    return await this.mutex.exclusive(async () => {
      let existing = decompress(await this.storage.get());
      let importing = decompress(history);
      let { count, merged } = merge(existing, importing);
      await this.storage.set(compress(merged));
      return count;
    });
  }

  async toCSV() {
    let {
      pomodoros,
      durations,
      timezones
    } = decompress(await this.storage.get());

    const escape = value => {
      if (value.indexOf(',') < 0) {
        return value;
      }

      return '"' + value.replace(/"/g, '""') + '"';
    };

    const row = values => values.map(v => escape(v.toString())).join(',') + '\n';

    let csv = row([
      M.end_iso_8601,
      M.end_date,
      M.end_time,
      M.end_timestamp,
      M.end_timezone,
      M.duration_seconds
    ]);

    for (let i = 0; i < pomodoros.length; i++) {
      let [timestamp, timezone] = [pomodoros[i] * 60, -timezones[i]];
      let time = moment.unix(timestamp).utcOffset(timezone, true);
      csv += row([
        time.toISOString(true),
        time.format('YYYY-MM-DD'),
        time.format('HH:mm:ss'),
        timestamp,
        timezone,
        durations[i]
      ]);
    }

    return csv;
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
        let durations = RLE.decompress(local.durations);
        durations.splice(i + 1, 0, duration);
        local.durations = RLE.compress(durations);

        let timezones = RLE.decompress(local.timezones);
        timezones.splice(i + 1, 0, timezone);
        local.timezones = RLE.compress(timezones);

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

function decompress(historyRLE) {
  if (!historyRLE) {
    throw new Error(M.missing_pomodoro_data);
  }

  let {
    pomodoros,
    durations: durationsRLE,
    timezones: timezonesRLE
  } = historyRLE;

  if (!pomodoros) {
    throw new Error(M.missing_pomodoro_data);
  }

  if (!durationsRLE) {
    throw new Error(M.missing_duration_data);
  }

  if (!Array.isArray(durationsRLE)) {
    throw new Error(M.invalid_duration_data);
  }

  if (!timezonesRLE) {
    throw new Error(M.missing_timezone_data);
  }

  if (!Array.isArray(timezonesRLE)) {
    throw new Error(M.missing_timezone_data);
  }

  const durations = RLE.decompress(durationsRLE);
  const timezones = RLE.decompress(timezonesRLE);

  if (pomodoros.length !== durations.length) {
    throw new Error(M.mismatched_pomodoro_duration_data);
  }

  if (pomodoros.length !== timezones.length) {
    throw new Error(M.mismatched_pomodoro_timezone_data);
  }

  for (let i = 0; i < pomodoros.length; i++) {
    if (!Number.isInteger(pomodoros[i])) {
      throw new Error(M.invalid_pomodoro_data);
    }

    if (!Number.isInteger(durations[i])) {
      throw new Error(M.invalid_duration_data);
    }

    if (!Number.isInteger(timezones[i])) {
      throw new Error(M.invalid_timezone_data);
    }
  }

  return {
    ...historyRLE,
    pomodoros,
    durations,
    timezones
  };
}

function compress(history) {
  if (!history) {
    throw new Error(M.missing_pomodoro_data);
  }

  if (!history.durations) {
    throw new Error(M.missing_duration_data);
  }

  if (!Array.isArray(history.durations)) {
    throw new Error(M.invalid_duration_data);
  }

  if (!history.timezones) {
    throw new Error(M.missing_timezone_data);
  }

  if (!Array.isArray(history.timezones)) {
    throw new Error(M.invalid_timezone_data);
  }

  return {
    ...history,
    durations: RLE.compress(history.durations),
    timezones: RLE.compress(history.timezones)
  };
}

function merge(existing, importing) {
  let {
    pomodoros: existingPomodoros,
    durations: existingDurations,
    timezones: existingTimezones
  } = existing;

  let {
    pomodoros: importingPomodoros,
    durations: importingDurations,
    timezones: importingTimezones
  } = importing;

  let pomodoros = [...existingPomodoros];
  let durations = [...existingDurations];
  let timezones = [...existingTimezones];

  let count = 0;
  for (let i = 0; i < importingPomodoros.length; i++) {
    let timestamp = importingPomodoros[i];
    let index = search(pomodoros, timestamp);

    if (pomodoros[index] === timestamp) {
      // Pomodoros with the same timestamp are considered
      // identical and are excluded when being imported.
      continue;
    }

    count++;
    pomodoros.splice(index, 0, timestamp);
    durations.splice(index, 0, importingDurations[i]);
    timezones.splice(index, 0, importingTimezones[i]);
  }

  return {
    count,
    merged: {
      ...existing,
      pomodoros,
      durations,
      timezones
    }
  };
}

// Returns the index in arr for which all elements at or after the index are
// at least min. If all elements are less than min, this returns arr.length.
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

  return Math.min(lo, arr.length);
}

export {
  History,
  merge
};