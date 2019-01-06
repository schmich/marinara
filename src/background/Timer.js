import Enum from './Enum';
import EventEmitter from 'events';

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
    observer.onStart && this.on('start', (...args) => observer.onStart(...args));
    observer.onStop && this.on('stop', (...args) => observer.onStop(...args));
    observer.onPause && this.on('pause', (...args) => observer.onPause(...args));
    observer.onResume && this.on('resume', (...args) => observer.onResume(...args));
    observer.onTick && this.on('tick', (...args) => observer.onTick(...args));
    observer.onExpire && this.on('expire', (...args) => observer.onExpire(...args));
    observer.onChange && this.on('change', (...args) => observer.onChange(...args));
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

  get timeRemaining() {
    if (!this.periodStartTime || !this.remaining) {
      return null;
    }

    let periodLength = (Date.now() - this.periodStartTime) / 1000;
    return this.remaining - periodLength;
  }

  get timeElapsed() {
    return this.duration - this.timeRemaining;
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

class PomodoroTimer extends EventEmitter
{
  constructor(settings, initialPhase = Phase.Focus, timerType = Timer) {
    super();
    this.timerType = timerType;
    this.advanceTimer = false;
    this.pomodoros = 0;
    this.settings = settings;
    this.phase = initialPhase;
  }

  _updateTimer() {
    let { duration } = {
      [Phase.Focus]: this.settings.focus,
      [Phase.ShortBreak]: this.settings.shortBreak,
      [Phase.LongBreak]: this.settings.longBreak
    }[this.phase];

    if (this.timer) {
      this.timer.stop();
      this.timer.removeAllListeners();
    }

    this.timer = new this.timerType(Math.floor(duration * 60), 60);
    this.timer.observe(this);
  }

  get phase() {
    return this._phase;
  }

  set phase(newPhase) {
    if (!this.hasLongBreak && newPhase === Phase.LongBreak) {
      throw new Error('No long break interval defined.');
    }

    this._phase = newPhase;
    this._updateTimer();
    this.advanceTimer = false;
  }

  get nextPhase() {
    if (this.phase === Phase.ShortBreak || this.phase === Phase.LongBreak) {
      return Phase.Focus;
    }

    if (!this.hasLongBreak) {
      return Phase.ShortBreak;
    }

    if (this.pomodorosUntilLongBreak === 0) {
      return Phase.LongBreak;
    } else {
      return Phase.ShortBreak;
    }
  }

  get hasLongBreak() {
    return this.settings.longBreak.interval > 0;
  }

  get pomodorosUntilLongBreak() {
    let { interval } = this.settings.longBreak;
    if (!interval) {
      return null;
    }

    return interval - ((this.pomodoros - 1) % interval) - 1;
  }

  get timeRemaining() {
    return this.timer.timeRemaining;
  }

  get timeElapsed() {
    return this.timer.timeElapsed;
  }

  get state() {
    return this.timer.state;
  }

  get isRunning() {
    return this.timer.isRunning;
  }

  get isStopped() {
    return this.timer.isStopped;
  }

  get isPaused() {
    return this.timer.isPaused;
  }

  dispose() {
    this.timer.stop();
    this.timer.removeAllListeners();
  }

  startCycle() {
    this.pomodoros = 0;
    this.phase = Phase.Focus;
    this.start();
  }

  startFocus() {
    this.phase = Phase.Focus;
    this.start();
  }

  startShortBreak() {
    this.phase = Phase.ShortBreak;
    this.start();
  }

  startLongBreak() {
    this.phase = Phase.LongBreak;
    this.start();
  }

  start() {
    if (this.advanceTimer) {
      this._phase = this.nextPhase;
      this.advanceTimer = false;
    }

    this._updateTimer();
    this.timer.start();
  }

  pause() {
    return this.timer.pause();
  }

  stop() {
    return this.timer.stop();
  }

  resume() {
    return this.timer.resume();
  }

  reset() {
    return this.timer.reset();
  }

  observe(observer) {
    observer.onTimerStart && this.on('timer:start', (...args) => observer.onTimerStart(...args));
    observer.onTimerStop && this.on('timer:stop', (...args) => observer.onTimerStop(...args));
    observer.onTimerPause && this.on('timer:pause', (...args) => observer.onTimerPause(...args));
    observer.onTimerResume && this.on('timer:resume', (...args) => observer.onTimerResume(...args));
    observer.onTimerTick && this.on('timer:tick', (...args) => observer.onTimerTick(...args));
    observer.onTimerExpire && this.on('timer:expire', (...args) => observer.onTimerExpire(...args));
    observer.onTimerChange && this.on('timer:change', (...args) => observer.onTimerChange(...args));
  }

  onStart(...args) {
    this.emit('timer:start', ...[this.phase, this.nextPhase, ...args]);
  }

  onStop(...args) {
    this.emit('timer:stop', ...[this.phase, this.nextPhase, ...args]);
  }

  onPause(...args) {
    this.emit('timer:pause', ...[this.phase, this.nextPhase, ...args]);
  }

  onResume(...args) {
    this.emit('timer:resume', ...[this.phase, this.nextPhase, ...args]);
  }

  onTick(...args) {
    this.emit('timer:tick', ...[this.phase, this.nextPhase, ...args]);
  }

  onExpire(...args) {
    if (this.phase === Phase.Focus) {
      this.pomodoros++;
    }

    this.advanceTimer = true;
    this.emit('timer:expire', ...[this.phase, this.nextPhase, ...args]);
  }

  onChange(...args) {
    this.emit('timer:change', ...[this.phase, this.nextPhase, ...args]);
  }
}

export {
  Timer,
  TimerState,
  Phase,
  PomodoroTimer
};