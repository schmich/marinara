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

    this.checkpointStartAt = null;
    this.checkpointElapsed = 0;
  }

  observe(observer) {
    observer.onStart && this.on('start', (...args) => observer.onStart(...args));
    observer.onStop && this.on('stop', (...args) => observer.onStop(...args));
    observer.onPause && this.on('pause', (...args) => observer.onPause(...args));
    observer.onResume && this.on('resume', (...args) => observer.onResume(...args));
    observer.onTick && this.on('tick', (...args) => observer.onTick(...args));
    observer.onExpire && this.on('expire', (...args) => observer.onExpire(...args));
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

  get remaining() {
    return this.duration - this.elapsed;
  }

  get elapsed() {
    let periodElapsed = 0;
    if (this.checkpointStartAt && this.isRunning) {
      periodElapsed = (Date.now() - this.checkpointStartAt) / 1000;
    }
    return this.checkpointElapsed + periodElapsed;
  }

  get status() {
    return {
      state: this.state,
      duration: this.duration,
      elapsed: this.elapsed,
      remaining: this.remaining,
      checkpointElapsed: this.checkpointElapsed,
      checkpointStartAt: this.checkpointStartAt
    };
  }

  start() {
    if (!this.isStopped) {
      return;
    }

    this.setExpireTimeout(this.duration);
    this.setTickInterval(this.tick);

    this.state = TimerState.Running;
    this.checkpointStartAt = Date.now();

    this.emit('start', this.status);
  }

  stop() {
    if (this.isStopped) {
      return;
    }

    clearInterval(this.tickInterval);
    clearTimeout(this.expireTimeout);

    this.tickInterval = null;
    this.expireTimeout = null;
    this.checkpointStartAt = null;
    this.checkpointElapsed = 0;

    this.state = TimerState.Stopped;

    this.emit('stop', this.status);
  }

  pause() {
    if (!this.isRunning) {
      return;
    }

    clearInterval(this.tickInterval);
    clearTimeout(this.expireTimeout);

    let periodElapsed = (Date.now() - this.checkpointStartAt) / 1000;
    this.checkpointElapsed += periodElapsed;

    this.state = TimerState.Paused;

    this.emit('pause', this.status);
  }

  resume() {
    if (!this.isPaused) {
      return;
    }

    this.setExpireTimeout(this.remaining);
    this.setTickInterval(this.tick);

    this.state = TimerState.Running;
    this.checkpointStartAt = Date.now();

    this.emit('resume', this.status);
  }

  restart() {
    this.stop();
    this.start();
  }

  setExpireTimeout(seconds) {
    this.expireTimeout = setTimeout(() => {
      clearInterval(this.tickInterval);
      clearTimeout(this.expireTimeout);

      this.tickInterval = null;
      this.expireTimeout = null;
      this.checkpointStartAt = Date.now();
      this.checkpointElapsed = this.duration;

      this.state = TimerState.Stopped;

      this.emit('expire', this.status);
    }, seconds * 1000);
  }

  setTickInterval(seconds) {
    this.tickInterval = setInterval(() => {
      this.emit('tick', this.status);
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

  get remaining() {
    return this.timer.remaining;
  }

  get elapsed() {
    return this.timer.elapsed;
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

  get status() {
    return {
      phase: this.phase,
      nextPhase: this.nextPhase,
      ...this.timer.status
    };
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

  restart() {
    // Calling timer.restart directly would ignore any settings changes, so
    // so we call start then stop to ensure we pick up on the changes.
    this.stop();
    return this.start();
  }

  observe(observer) {
    observer.onStart && this.on('start', (...args) => observer.onStart(...args));
    observer.onStop && this.on('stop', (...args) => observer.onStop(...args));
    observer.onPause && this.on('pause', (...args) => observer.onPause(...args));
    observer.onResume && this.on('resume', (...args) => observer.onResume(...args));
    observer.onTick && this.on('tick', (...args) => observer.onTick(...args));
    observer.onExpire && this.on('expire', (...args) => observer.onExpire(...args));
  }

  onStart(status) {
    this.emit('start', { phase: this.phase, nextPhase: this.nextPhase, ...status });
  }

  onStop(status) {
    this.emit('stop', { phase: this.phase, nextPhase: this.nextPhase, ...status });
  }

  onPause(status) {
    this.emit('pause', { phase: this.phase, nextPhase: this.nextPhase, ...status });
  }

  onResume(status) {
    this.emit('resume', { phase: this.phase, nextPhase: this.nextPhase, ...status });
  }

  onTick(status) {
    this.emit('tick', { phase: this.phase, nextPhase: this.nextPhase, ...status });
  }

  onExpire(status) {
    if (this.phase === Phase.Focus) {
      this.pomodoros++;
    }

    this.advanceTimer = true;
    this.emit('expire', { phase: this.phase, nextPhase: this.nextPhase, ...status });
  }
}

export {
  Timer,
  TimerState,
  Phase,
  PomodoroTimer
};