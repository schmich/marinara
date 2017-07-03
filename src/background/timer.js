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
    this.addListener('start', (...args) => observer.start ? observer.start(...args) : null);
    this.addListener('stop', (...args) => observer.stop ? observer.stop(...args) : null);
    this.addListener('pause', (...args) => observer.pause ? observer.pause(...args) : null);
    this.addListener('resume', (...args) => observer.resume ? observer.resume(...args) : null);
    this.addListener('tick', (...args) => observer.tick ? observer.tick(...args) : null);
    this.addListener('expire', (...args) => observer.expire ? observer.expire(...args) : null);
    this.addListener('change', (...args) => observer.change ? observer.change(...args) : null);
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
    this.emitEvent('start', [{
      elapsed: 0,
      remaining: this.remainingSec
    }]);
    this.emitEvent('change', [{}]);
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
    this.emitEvent('stop', [{}]);
    this.emitEvent('change', [{}]);
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
    this.emitEvent('pause', [{
      elapsed: this.durationSec - this.remainingSec,
      remaining: this.remainingSec
    }]);
    this.emitEvent('change', [{}]);
  }

  resume() {
    if (!this.isPaused) {
      return;
    }

    this.setExpireTimeout(this.remainingSec);
    this.setTickInterval(this.tickSec);

    this._state = TimerState.Running;
    this.periodStartTime = Date.now();
    this.emitEvent('resume', [{
      elapsed: this.durationSec - this.remainingSec,
      remaining: this.remainingSec
    }]);
    this.emitEvent('change', [{}]);
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
      this.emitEvent('expire', [{
        elapsed: this.durationSec,
        remaining: 0
      }]);
      this.emitEvent('change', [{}]);
    }, seconds * 1000);
  }

  setTickInterval(seconds) {
    this.tickInterval = setInterval(() => {
      let periodSec = (Date.now() - this.periodStartTime) / 1000;
      let remainingSec = this.remainingSec - periodSec;

      this.emitEvent('tick', [{
        elapsed: this.durationSec - remainingSec,
        remaining: remainingSec
      }]);
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

  start(phase = null) {
    if (this.timer) {
      this.timer.stop();
    }

    if (phase) {
      this._phase = phase;
    }

    var nextBreakCount;
    var nextPhase;

    if (this._phase !== Phase.Focus) {
      nextBreakCount = this.breakCount;
      nextPhase = Phase.Focus;
    } else {
      nextBreakCount = (this.breakCount + 1) % this.longBreakInterval;
      nextPhase = (nextBreakCount == 0) ? Phase.LongBreak : Phase.ShortBreak;
    }

    this.timer = this.timerFactory(this._phase, nextPhase);
    this.timer.addListener('expire', () => {
      this.breakCount = nextBreakCount;
      this._phase = nextPhase;
    });

    this.timer.start();
  }

  pause() {
    this.timer.pause();
  }

  stop() {
    this.timer.stop();
  }

  resume() {
    this.timer.resume();
  }

  reset() {
    this.timer.reset();
  }
}
