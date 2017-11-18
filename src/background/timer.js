const TimerState = new Enum({
  Stopped: 0,
  Running: 1,
  Paused: 2
});

class Timer extends EventEmitter
{
  constructor(duration, tick) {
    super();

    this.state = TimerState.Stopped;
    this.duration = duration;
    this.tick = tick;

    this.tickInterval = null;
    this.expireTimeout = null;

    this.periodStartTime = null;
    this.remaining = null;
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

    this.setExpireTimeout(this.duration);
    this.setTickInterval(this.tick);

    this.remaining = this.duration;

    this.state = TimerState.Running;
    this.periodStartTime = Date.now();
    this.emit('start', 0, this.remaining);
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
    this.remaining = null;

    this.state = TimerState.Stopped;
    this.emit('stop');
    this.emit('change');
  }

  pause() {
    if (!this.isRunning) {
      return;
    }

    clearInterval(this.tickInterval);
    clearTimeout(this.expireTimeout);

    let periodLength = (Date.now() - this.periodStartTime) / 1000;
    this.remaining -= periodLength;

    this.state = TimerState.Paused;
    this.periodStartTime = null;

    let elapsed = this.duration - this.remaining;
    this.emit('pause', elapsed, this.remaining);
    this.emit('change');
  }

  resume() {
    if (!this.isPaused) {
      return;
    }

    this.setExpireTimeout(this.remaining);
    this.setTickInterval(this.tick);

    this.state = TimerState.Running;
    this.periodStartTime = Date.now();

    let elapsed = this.duration - this.remaining;
    this.emit('resume', elapsed, this.remaining);
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
      this.remaining = null;

      this.state = TimerState.Stopped;

      this.emit('expire', this.duration, 0);
      this.emit('change');
    }, seconds * 1000);
  }

  setTickInterval(seconds) {
    this.tickInterval = setInterval(() => {
      let periodLength = (Date.now() - this.periodStartTime) / 1000;
      let remaining = this.remaining - periodLength;

      let elapsed = this.duration - remaining;
      this.emit('tick', elapsed, remaining);
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
  constructor(timerFactory, phase, longBreakInterval) {
    this.timerFactory = timerFactory;
    this.longBreakInterval = longBreakInterval;
    this.breakCount = 0;

    this.timer = null;
    this._phase = phase;
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

  dispose() {
    if (this.timer) {
      this.timer.stop();
      this.timer.removeAllListeners();
    }
  }

  startCycle() {
    this.breakCount = 0;
    this.start(Phase.Focus);
  }

  async start(phase = null) {
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

    this.timer = await this.timerFactory(this._phase, nextPhase);
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
