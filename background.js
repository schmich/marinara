var defaultSettings = {
  focusDuration: 25,
  breakDuration: 5,
  showDesktopNotification: true,
  showNewTabNotification: true
};

function Timer(durationSec, tickSec) {
  var self = this;
  var state = 'stopped';

  this.tickInterval = null;
  this.expireTimeout = null;

  this.startTime = null;
  this.remainingSec = null;

  this.start = function() {
    if (state !== 'stopped') {
      return;
    }

    this.expireTimeout = createExpireTimeout(durationSec);
    this.tickInterval = createTickInterval(tickSec);

    state = 'running';
    this.startTime = Date.now();
    this.emitEvent('start', [{
      elapsed: 0,
      remaining: durationSec
    }]);
  };

  this.stop = function() {
    if (state === 'stopped') {
      return;
    }

    clearInterval(this.tickInterval);
    clearTimeout(this.expireTimeout);

    this.tickInterval = null;
    this.expireTimeout = null;
    this.startTime = null;
    this.remainingSec = null;

    state = 'stopped';
    this.emitEvent('stop', [{}]);
  };

  this.pause = function() {
    if (state !== 'running') {
      return;
    }

    clearInterval(this.tickInterval);
    clearTimeout(this.expireTimeout);

    var elapsedSec = Date.now() - this.startTime;
    this.remainingSec = durationSec - elapsedSec;

    state = 'paused';
    this.startTime = null;
    this.emitEvent('pause', [{
      elapsed: elapsedSec,
      remaining: this.remainingSec
    }]);
  };

  this.resume = function() {
    if (state !== 'paused') {
      return;
    }

    this.expireTimeout = createExpireTimeout(this.remainingSec);
    this.tickInterval = createTickInterval(tickSec);

    state = 'running';
    this.startTime = Date.now();
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

      self.tickInterval = null;
      self.expireTimeout = null;
      self.startTime = null;
      self.remainingSec = null;

      self.emitEvent('expire', [{
        elapsed: durationSec,
        remaining: 0
      }]);
    }, seconds * 1000);
  }

  function createTickInterval(seconds) {
    return setInterval(function() {
      var elapsedSec = Date.now() - self.startTime;
      var remainingSec = durationSec - elapsedSec;

      self.emitEvent('tick', [{
        elapsed: elapsedSec,
        remaining: remainingSec
      }]);
    }, seconds * 1000);
  }
}

Timer.prototype = Object.create(EventEmitter.prototype);

function BadgeTimer(durationMin, badgeTitle, badgeColor) {
  var timer = new Timer(durationMin * 60, 60);

  timer.addListener('start', function(state) {
    updateBadge(Math.round(state.remaining / 60));
  });

  timer.addListener('tick', function(state) {
    updateBadge(Math.round(state.remaining / 60));
  });

  timer.addListener('stop', function() {
    updateBadge(null);
  });

  timer.addListener('expire', function() {
    updateBadge(null);
  });

  this.start = function() {
    return timer.start();
  };

  this.stop = function() {
    return timer.stop();
  };

  this.pause = function() {
    return timer.pause();
  };

  this.resume = function() {
    return timer.resume();
  };

  this.reset = function() {
    return timer.reset();
  };

  this.state = function() {
    return timer.state();
  };

  this.addListener = function(eventName, handler) {
    timer.addListener(eventName, handler);
    return this;
  };

  function updateBadge(remainingMin) {
    var text;
    if (remainingMin === null) {
      text = '';
      title = '';
    } else {
      text = remainingMin + 'm';
      title = badgeTitle + ' ' + remainingMin + 'm remaining.';
    }

    chrome.browserAction.setTitle({ title: title });
    chrome.browserAction.setBadgeText({ text: text });
    chrome.browserAction.setBadgeBackgroundColor({ color: badgeColor });
  };
}

function Pomo() {
  var self = this;
  var focusNext = true;
  var focusTimer;
  var breakTimer;

  this.cycleState = function() {
    if (focusTimer.state() !== 'stopped') {
      focusTimer.stop();
      focusNext = false;
    } else if (breakTimer.state() !== 'stopped') {
      breakTimer.stop();
      focusNext = true;
    } else {
      focusTimer.stop();
      breakTimer.stop();

      if (focusNext) {
        focusTimer.start();
      } else {
        breakTimer.start();
      }
    }
  };

  this.focusNext = function() {
    return focusNext;
  };

  this.getSettings = function(callback) {
    chrome.storage.sync.get(function(result) {
      if (Object.keys(result).length == 0) {
        chrome.storage.sync.set(defaultSettings, function() {
          callback(defaultSettings);
        });
      } else {
        callback(result);
      }
    });
  };

  this.setSettings = function(settings, callback) {
    chrome.storage.sync.set(settings, function() {
      loadTimers();
      callback();
    });
  };

  function showExpirePage() {
    chrome.tabs.create({ url: chrome.extension.getURL('expire.html') });
  }

  function notify(title, message) {
    var notification = {
      type: 'basic',
      title: title,
      message: message,
      iconUrl: 'icon.png'
    };

    chrome.notifications.create('', notification, function() { });
  }

  function loadTimers() {
    self.getSettings(function(settings) {
      if (focusTimer) {
        focusTimer.stop();
      }

      focusTimer = new BadgeTimer(settings.focusDuration, 'Focus:', '#cc0000');
      focusTimer.addListener('expire', function() {
        focusNext = false;

        if (settings.showDesktopNotification) {
          notify('Pomo: Take a break!', "Start your break when you're ready");
        }

        if (settings.showNewTabNotification) {
          showExpirePage();
        }
      });

      if (breakTimer) {
        breakTimer.stop();
      }
   
      breakTimer = new BadgeTimer(settings.breakDuration, 'Break:', '#00cc00');
      breakTimer.addListener('expire', function() {
        focusNext = true;

        if (settings.showDesktopNotification) {
          notify('Pomo: Break finished', "Start your focus session when you're ready");
        }

        if (settings.showNewTabNotification) {
          showExpirePage();
        }
      });
    });
  }

  loadTimers();
}

var pomo = new Pomo();

chrome.contextMenus.removeAll();
chrome.contextMenus.create({
  id: 'pomo-pause',
  title: 'Pause',
  contexts: ['browser_action'],
  onclick: function() {
  }
});

chrome.browserAction.onClicked.addListener(function(tab) {
  var id = chrome.runtime.id;
  var extensionUrl = 'chrome-extension://' + id;

  chrome.tabs.query({}, function(tabs) {
    var remove = [];
    for (var i = 0; i < tabs.length; ++i) {
      if (tabs[i].url.indexOf(extensionUrl) !== -1) {
        remove.push(tabs[i].id);
      }
    }

    chrome.tabs.remove(remove, function() {
      pomo.cycleState();
    });
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, respond) {
  if (request.command == 'get-session') {
    if (pomo.focusNext()) {
      pomo.getSettings(function(settings) {
        respond({
          focusNext: true,
          title: 'Break finished',
          subtitle: "Start your " + settings.focusDuration + " minute focus session when you're ready",
          action: 'Start Focusing'
        });
      });
    } else {
      pomo.getSettings(function(settings) {
        respond({
          focusNext: false,
          title: 'Take a break!',
          subtitle: "Start your " + settings.breakDuration + " minute break when you're ready",
          action: 'Start Break'
        });
      });
    }
  } else if (request.command == 'start-session') {
    pomo.cycleState();
    respond({});
  } else if (request.command == 'get-settings') {
    pomo.getSettings(respond);
  } else if (request.command == 'set-settings') {
    var newSettings = request.settings;
    var focusDuration = newSettings.focusDuration.trim();
    var breakDuration = newSettings.breakDuration.trim();

    if (!focusDuration) {
      respond({ error: 'Focus duration is required.' });
      return true;
    } else if (!breakDuration) {
      respond({ error: 'Break duration is required.' });
      return true;
    }

    var focusParsed = +focusDuration;
    var breakParsed = +breakDuration;

    if (focusParsed <= 0 || isNaN(focusParsed)) {
      respond({ error: 'Focus duration must be a positive number.' });
      return true;
    } else if (breakParsed <= 0 || isNaN(breakParsed)) {
      respond({ error: 'Break duration must be a positive number.' });
      return true;
    }

    newSettings.focusDuration = focusParsed;
    newSettings.breakDuration = breakParsed;

    pomo.setSettings(newSettings, function() {
      respond({});
    });
  }

  return true;
});
