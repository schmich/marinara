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
