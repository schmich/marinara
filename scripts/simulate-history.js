// Simulate Pomodoro history entries.

async function simulate(count) {
  function rand(lo, hi) {
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }
  let origin = new Date(2015, 0, 0, 0);
  let range = (new Date()) - +origin;
  for (let i = 0; i < count; ++i) {
    let timestamp = +origin + rand(0, range);
    await controller.history.addPomodoro(25 * 60, new Date(timestamp));
  }
}

simulate(2000).then(() => console.log('done'));
