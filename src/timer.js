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

  start() {
    if (this._state !== TimerState.Stopped) {
      return;
    }

    this.expireTimeout = this.createExpireTimeout(this.durationSec);
    this.tickInterval = this.createTickInterval(this.tickSec);

    this.remainingSec = this.durationSec;

    this._state = TimerState.Running;
    this.periodStartTime = Date.now();
    this.emitEvent('start', [{
      elapsed: 0,
      remaining: this.remainingSec
    }]);
  }

  stop() {
    if (this._state === TimerState.Stopped) {
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
    if (this._state !== TimerState.Running) {
      return;
    }

    clearInterval(this.tickInterval);
    clearTimeout(this.expireTimeout);

    var periodSec = (Date.now() - this.periodStartTime) / 1000;
    this.remainingSec -= periodSec;

    this._state = TimerState.Paused;
    this.periodStartTime = null;
    this.emitEvent('pause', [{
      elapsed: this.durationSec - this.remainingSec,
      remaining: this.remainingSec
    }]);
  }

  resume() {
    if (this._state !== TimerState.Paused) {
      return;
    }

    this.expireTimeout = this.createExpireTimeout(this.remainingSec);
    this.tickInterval = this.createTickInterval(this.tickSec);

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

  get state() {
    return this._state;
  }

  createExpireTimeout(seconds) {
    return setTimeout(() => {
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

  createTickInterval(seconds) {
    return setInterval(() => {
      var periodSec = (Date.now() - this.periodStartTime) / 1000;
      var remainingSec = this.remainingSec - periodSec;

      this.emitEvent('tick', [{
        elapsed: this.durationSec - remainingSec,
        remaining: remainingSec
      }]);
    }, seconds * 1000);
  }
}
