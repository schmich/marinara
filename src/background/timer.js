const TimerState = new Enum({
  Stopped: 0,
  Running: 1,
  Paused: 2
});

class Timer extends EventEmitter
{
  constructor(durationSec, tickSec) {
    super();

    this._state = TimerState.Stopped;

    this.durationSec = durationSec;
    this.tickSec = tickSec;

    this.tickInterval = null;
    this.expireTimeout = null;

    this.periodStartTime = null;
    this.remainingSec = null;
  }

  observe(observer) {
    if (observer.start) {
      this.on('start', (...args) => observer.start(...args));
    }
    if (observer.stop) {
      this.on('stop', (...args) => observer.stop(...args));
    }
    if (observer.pause) {
      this.on('pause', (...args) => observer.pause(...args));
    }
    if (observer.resume) {
      this.on('resume', (...args) => observer.resume(...args));
    }
    if (observer.tick) {
      this.on('tick', (...args) => observer.tick(...args));
    }
    if (observer.expire) {
      this.on('expire', (...args) => observer.expire(...args));
    }
    if (observer.change) {
      this.on('change', (...args) => observer.change(...args));
    }
  }

  get state() {
    return this._state;
  }

  get isStopped() {
    return this.state === TimerState.Stopped;
  }

  get isRunning() {
    return this.state === TimerState.Running;
  }

  get isPaused() {
    return this.state === TimerState.Paused;
  }

  start() {
    if (!this.isStopped) {
      return;
    }

    this.setExpireTimeout(this.durationSec);
    this.setTickInterval(this.tickSec);

    this.remainingSec = this.durationSec;

    this._state = TimerState.Running;
    this.periodStartTime = Date.now();
    this.emit('start', 0, this.remainingSec);
    this.emit('change');
  }

  stop() {
    if (this.isStopped) {
      return;
    }

    clearInterval(this.tickInterval);
    clearTimeout(this.expireTimeout);

    this.tickInterval = null;
    this.expireTimeout = null;
    this.periodStartTime = null;
    this.remainingSec = null;

    this._state = TimerState.Stopped;
    this.emit('stop');
    this.emit('change');
  }

  pause() {
    if (!this.isRunning) {
      return;
    }

    clearInterval(this.tickInterval);
    clearTimeout(this.expireTimeout);

    let periodSec = (Date.now() - this.periodStartTime) / 1000;
    this.remainingSec -= periodSec;

    this._state = TimerState.Paused;
    this.periodStartTime = null;

    let elapsed = this.durationSec - this.remainingSec;
    this.emit('pause', elapsed, this.remainingSec);
    this.emit('change');
  }

  resume() {
    if (!this.isPaused) {
      return;
    }

    this.setExpireTimeout(this.remainingSec);
    this.setTickInterval(this.tickSec);

    this._state = TimerState.Running;
    this.periodStartTime = Date.now();

    let elapsed = this.durationSec - this.remainingSec;
    this.emit('resume', elapsed, this.remainingSec);
    this.emit('change');
  }

  reset() {
    this.stop();
    this.start();
  }

  setExpireTimeout(seconds) {
    this.expireTimeout = setTimeout(() => {
      clearInterval(this.tickInterval);
      clearTimeout(this.expireTimeout);

      this.tickInterval = null;
      this.expireTimeout = null;
      this.periodStartTime = null;
      this.remainingSec = null;

      this._state = TimerState.Stopped;

      this.emit('expire', this.durationSec, 0);
      this.emit('change');
    }, seconds * 1000);
  }

  setTickInterval(seconds) {
    this.tickInterval = setInterval(() => {
      let periodSec = (Date.now() - this.periodStartTime) / 1000;
      let remainingSec = this.remainingSec - periodSec;

      let elapsed = this.durationSec - remainingSec;
      this.emit('tick', elapsed, remainingSec);
    }, seconds * 1000);
  }
}

const Phase = new Enum({
  Focus: 0,
  ShortBreak: 1,
  LongBreak: 2
});

class PomodoroTimer
{
  constructor(timerFactory, longBreakInterval) {
    this.timerFactory = timerFactory;
    this.longBreakInterval = longBreakInterval;
    this.breakCount = 0;

    this.timer = null;
    this._phase = Phase.Focus;
  }

  get phase() {
    return this._phase;
  }

  get state() {
    return this.timer ? this.timer.state : null;
  }

  get isRunning() {
    return this.timer ? this.timer.isRunning : false;
  }

  get isStopped() {
    return this.timer ? this.timer.isStopped : false;
  }

  get isPaused() {
    return this.timer ? this.timer.isPaused : false;
  }

  get longBreakPomodoros() {
    if (this.longBreakInterval === 0) {
      return 0;
    }

    let breaks = this.longBreakInterval - this.breakCount;
    return this._phase === Phase.Focus ? breaks - 1 : breaks;
  }

  start(phase = null) {
    if (this.timer) {
      this.timer.stop();
      this.timer.removeAllListeners();
    }

    if (phase) {
      this._phase = phase;
      if (phase === Phase.LongBreak) {
        this.breakCount = 0;
      }
    }

    var nextBreakCount;
    var nextPhase;

    if (this._phase !== Phase.Focus) {
      nextBreakCount = this.breakCount;
      nextPhase = Phase.Focus;
    } else if (this.longBreakInterval === 0) {
      nextBreakCount = this.breakCount;
      nextPhase = Phase.ShortBreak;
    } else {
      nextBreakCount = (this.breakCount + 1) % this.longBreakInterval;
      nextPhase = (nextBreakCount === 0) ? Phase.LongBreak : Phase.ShortBreak;
    }

    this.timer = this.timerFactory(this._phase, nextPhase);
    this.timer.on('expire', () => {
      this.breakCount = nextBreakCount;
      this._phase = nextPhase;
    });

    this.timer.start();
  }

  pause() {
    this.timer ? this.timer.pause() : null;
  }

  stop() {
    this.timer ? this.timer.stop() : null;
  }

  resume() {
    this.timer ? this.timer.resume() : null;
  }

  reset() {
    this.timer ? this.timer.reset() : null;
  }
}
