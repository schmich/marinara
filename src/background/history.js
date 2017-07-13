class History
{
  async addPomodoro(when = null) {
    let local = await AsyncChrome.storage.local.get();
    if (!local) {
      local = { pomodoros: [] };
    }

    if (!local.pomodoros) {
      local.pomodoros = [];
    }

    let timestamp = this.timestamp(when || new Date());
    local.pomodoros.push(timestamp);
    local.pomodoros.sort();
    await AsyncChrome.storage.local.set(local);

    return this.completedToday(local.pomodoros);
  }

  async stats() {
    const empty = {
      day: 0,
      week: 0,
      month: 0,
      year: 0,
      all: 0,
      daily: []
    };

    let local = await AsyncChrome.storage.local.get();
    if (!local) {
      return empty;
    }

    let pomodoros = local.pomodoros;
    if (!pomodoros) {
      return empty;
    }

    let daily = {};
    let base = 0;
    let date = History.day;
    for (let i = 0; i < 365 + 7; ++i) {
      let completed = this.completedSince(pomodoros, date);
      daily[+date] = completed - base;
      base = completed;
      date.setDate(date.getDate() - 1);
    }

    return {
      day: this.completedSince(pomodoros, History.day),
      week: this.completedSince(pomodoros, History.week),
      month: this.completedSince(pomodoros, History.month),
      year: this.completedSince(pomodoros, History.year),
      all: pomodoros.length,
      daily: daily
    };
  }

  async completedToday(pomodoros = null) {
    if (!pomodoros) {
      let local = await AsyncChrome.storage.local.get();
      if (!local) {
        return 0;
      }

      pomodoros = local.pomodoros;
      if (!pomodoros) {
        return 0;
      }
    }

    let timestamp = this.timestamp(History.day);
    let index = search(pomodoros, timestamp);
    if (index === null) {
      return 0;
    }

    return pomodoros.length - index;
  }

  completedSince(pomodoros, date) {
    let timestamp = this.timestamp(date);
    let index = search(pomodoros, timestamp);
    if (index === null) {
      return 0;
    }

    return pomodoros.length - index;
  }

  timestamp(date) {
    return Math.floor(+date / 1000 / 60);
  }

  static get day() {
    let today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    return today;
  }

  static get week() {
    let week = new Date();
    week.setDate(week.getDate() - week.getDay());
    week.setHours(0);
    week.setMinutes(0);
    week.setSeconds(0);
    week.setMilliseconds(0);
    return week;
  }

  static get month() {
    let month = new Date();
    month.setDate(1);
    month.setHours(0);
    month.setMinutes(0);
    month.setSeconds(0);
    month.setMilliseconds(0);
    return month;
  }

  static get year() {
    let year = new Date();
    year.setDate(1);
    year.setMonth(0);
    year.setHours(0);
    year.setMinutes(0);
    year.setSeconds(0);
    year.setMilliseconds(0);
    return year;
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
