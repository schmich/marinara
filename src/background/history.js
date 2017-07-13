class History
{
  async addPomodoro() {
    let local = await AsyncChrome.storage.local.get();
    if (!local) {
      local = { pomodoros: [] };
    }

    if (!local.pomodoros) {
      local.pomodoros = [];
    }

    let now = this.timestamp(new Date());
    local.pomodoros.push(now);
    await AsyncChrome.storage.local.set(local);

    return this.completedToday(local.pomodoros);
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

    let today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);

    let timestamp = this.timestamp(today);
    let index = search(pomodoros, timestamp);
    if (index === null) {
      return 0;
    }

    return pomodoros.length - index;
  }

  timestamp(date) {
    return Math.floor(+date / 1000 / 60);
  }
}

function search(arr, min) {
  let lo = 0;
  let hi = arr.length - 1;

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
