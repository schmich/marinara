const TimerState = new Enum({
  Stopped: 0,
  Running: 1,
  Paused: 2
});

function Timer(durationSec, tickSec) {
  var self = this;
  var state = TimerState.Stopped;

  this.tickInterval = null;
  this.expireTimeout = null;

  this.periodStartTime = null;
  this.remainingSec = null;

  this.start = function() {
    if (state !== TimerState.Stopped) {
      return;
    }

    this.expireTimeout = createExpireTimeout(durationSec);
    this.tickInterval = createTickInterval(tickSec);

    this.remainingSec = durationSec;

    state = TimerState.Running;
    this.periodStartTime = Date.now();
    this.emitEvent('start', [{
      elapsed: 0,
      remaining: this.remainingSec
    }]);
  };

  this.stop = function() {
    if (state === TimerState.Stopped) {
      return;
    }

    clearInterval(this.tickInterval);
    clearTimeout(this.expireTimeout);

    this.tickInterval = null;
    this.expireTimeout = null;
    this.periodStartTime = null;
    this.remainingSec = null;

    state = TimerState.Stopped;
    this.emitEvent('stop', [{}]);
  };

  this.pause = function() {
    if (state !== TimerState.Running) {
      return;
    }

    clearInterval(this.tickInterval);
    clearTimeout(this.expireTimeout);

    var periodSec = (Date.now() - this.periodStartTime) / 1000;
    this.remainingSec -= periodSec;

    state = TimerState.Paused;
    this.periodStartTime = null;
    this.emitEvent('pause', [{
      elapsed: durationSec - this.remainingSec,
      remaining: this.remainingSec
    }]);
  };

  this.resume = function() {
    if (state !== TimerState.Paused) {
      return;
    }

    this.expireTimeout = createExpireTimeout(this.remainingSec);
    this.tickInterval = createTickInterval(tickSec);

    state = TimerState.Running;
    this.periodStartTime = Date.now();
    this.emitEvent('resume', [{
      elapsed: durationSec - this.remainingSec,
      remaining: this.remainingSec
    }]);
  };

  this.reset = function() {
    this.stop();
    this.start();
  };

  this.state = function() {
    return state;
  };

  function createExpireTimeout(seconds) {
    return setTimeout(function() {
      clearInterval(self.tickInterval);
      clearTimeout(self.expireTimeout);

      self.tickInterval = null;
      self.expireTimeout = null;
      self.periodStartTime = null;
      self.remainingSec = null;

      state = TimerState.Stopped;
      self.emitEvent('expire', [{
        elapsed: durationSec,
        remaining: 0
      }]);
    }, seconds * 1000);
  }

  function createTickInterval(seconds) {
    return setInterval(function() {
      var periodSec = (Date.now() - self.periodStartTime) / 1000;
      var remainingSec = self.remainingSec - periodSec;

      self.emitEvent('tick', [{
        elapsed: durationSec - remainingSec,
        remaining: remainingSec
      }]);
    }, seconds * 1000);
  }
}

Timer.prototype = Object.create(EventEmitter.prototype);
