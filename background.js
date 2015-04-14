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

    this.remainingSec = durationSec;

    state = 'running';
    this.startTime = Date.now();
    this.emitEvent('start', [{
      elapsed: 0,
      remaining: this.remainingSec
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

    var intervalSec = (Date.now() - this.startTime) / 1000;
    this.remainingSec -= intervalSec;

    state = 'paused';
    this.startTime = null;
    this.emitEvent('pause', [{
      elapsed: durationSec - this.remainingSec,
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
      clearTimeout(self.expireTimeout);

      self.tickInterval = null;
      self.expireTimeout = null;
      self.startTime = null;
      self.remainingSec = null;

      state = 'stopped';
      self.emitEvent('expire', [{
        elapsed: durationSec,
        remaining: 0
      }]);
    }, seconds * 1000);
  }

  function createTickInterval(seconds) {
    return setInterval(function() {
      var elapsedSec = (Date.now() - self.startTime) / 1000;
      var remainingSec = durationSec - elapsedSec;

      self.emitEvent('tick', [{
        elapsed: elapsedSec,
        remaining: remainingSec
      }]);
    }, seconds * 1000);
  }
}

Timer.prototype = Object.create(EventEmitter.prototype);

function BadgeObserver() {
}

BadgeObserver.observe = function(timer, title, color) {
  timer.addListener('start', function(state) {
    updateBadge({ minutes: Math.round(state.remaining / 60) });
  });

  timer.addListener('tick', function(state) {
    updateBadge({ minutes: Math.round(state.remaining / 60) });
  });

  timer.addListener('stop', function() {
    removeBadge();
  });

  timer.addListener('pause', function() {
    updateBadge({ text: '—', title: 'Paused' });
  });

  timer.addListener('resume', function(state) {
    updateBadge({ minutes: Math.round(state.remaining / 60) });
  });

  timer.addListener('expire', function() {
    removeBadge();
  });

  function updateBadge(options) {
    var minutes = options.minutes;
    if (minutes != null) {
      text = ((minutes == 0) ? '<1' : minutes)  + 'm';
      badgeTitle = title + ': ' + minutes + 'm remaining.';
    } else {
      text = options.text;
      badgeTitle = title + ': ' + options.title;
    }

    chrome.browserAction.setTitle({ title: badgeTitle });
    chrome.browserAction.setBadgeText({ text: text });
    chrome.browserAction.setBadgeBackgroundColor({ color: color });
  };

  function removeBadge() {
    chrome.browserAction.setTitle({ title: '' });
    chrome.browserAction.setBadgeText({ text: '' });
  }
}

function ContextMenuObserver() {
}

ContextMenuObserver.observe = function(pomo, timer) {
  timer.addListener('start', function() {
    addStop();
    addPause();
    removeResume();
  });

  timer.addListener('pause', function() {
    addStop();
    removePause();
    addResume();
  });

  timer.addListener('resume', function() {
    addStop();
    addPause();
    removeResume();
  });

  timer.addListener('stop', function() {
    removeStop();
    removePause();
    removeResume();
  });

  timer.addListener('expire', function() {
    removeStop();
    removePause();
    removeResume();
  });

  function addStop() {
    chrome.contextMenus.create({
      id: 'stop',
      title: 'Stop',
      contexts: ['browser_action'],
      onclick: function() {
        pomo.stop();
      }
    });
  }

  function removeStop() {
    chrome.contextMenus.remove('stop', function() { });
  }

  function addPause() {
    chrome.contextMenus.create({
      id: 'pause',
      title: 'Pause',
      contexts: ['browser_action'],
      onclick: function() {
        pomo.pause();
      }
    });
  }

  function removePause() {
    chrome.contextMenus.remove('pause', function() { });
  }

  function addResume() {
    chrome.contextMenus.create({
      id: 'resume',
      title: 'Resume',
      contexts: ['browser_action'],
      onclick: function() {
        pomo.resume();
      }
    });
  }

  function removeResume() {
    chrome.contextMenus.remove('resume', function() { });
  }
};

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

  this.browserAction = function() {
    if (focusTimer.state() === 'paused') {
      focusTimer.resume();
    } else if (breakTimer.state() === 'paused') {
      breakTimer.resume();
    } else {
      this.cycleState();
    }
  };

  this.pause = function() {
    if (focusTimer.state() === 'running') {
      focusTimer.pause();
    } else if (breakTimer.state() === 'running') {
      breakTimer.pause();
    }
  };

  this.stop = function() {
    focusTimer.stop();
    breakTimer.stop();
  };

  this.resume = function() {
    if (focusTimer.state() == 'paused') {
      focusTimer.resume();
    } else if (breakTimer.state() == 'paused') {
      breakTimer.resume();
    }
  };

  this.startBreak = function() {
    focusTimer.stop();
    breakTimer.stop();
    breakTimer.start();
  };

  this.startFocus = function() {
    focusTimer.stop();
    breakTimer.stop();
    focusTimer.start();
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
      createTimers();
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

  function createTimers() {
    self.getSettings(function(settings) {
      if (focusTimer) {
        focusTimer.stop();
      }

      focusTimer = new Timer(settings.focusDuration * 60, 60);
      BadgeObserver.observe(focusTimer, 'Focus', '#cc0000');
      ContextMenuObserver.observe(self, focusTimer);

      focusTimer.addListener('expire', function() {
        focusNext = false;

        if (settings.showDesktopNotification) {
          notify('Pomo: Take a break!', "Start your break when you're ready");
        }

        if (settings.showNewTabNotification) {
          showExpirePage();
        }
      });

      focusTimer.addListener('start', closeExtensionTabs);

      if (breakTimer) {
        breakTimer.stop();
      }
   
      breakTimer = new Timer(settings.breakDuration * 60, 60);
      BadgeObserver.observe(breakTimer, 'Break', '#00cc00');
      ContextMenuObserver.observe(self, breakTimer);

      breakTimer.addListener('expire', function() {
        focusNext = true;

        if (settings.showDesktopNotification) {
          notify('Pomo: Break finished', "Start your focus session when you're ready");
        }

        if (settings.showNewTabNotification) {
          showExpirePage();
        }
      });

      breakTimer.addListener('start', closeExtensionTabs);
    });
  }

  function closeExtensionTabs() {
    var id = chrome.runtime.id;
    var extensionUrl = 'chrome-extension://' + id;

    chrome.tabs.query({}, function(tabs) {
      var remove = [];
      for (var i = 0; i < tabs.length; ++i) {
        if (tabs[i].url.indexOf(extensionUrl) !== -1) {
          remove.push(tabs[i].id);
        }
      }

      chrome.tabs.remove(remove, function() { });
    });
  }

  createTimers();
}

chrome.contextMenus.removeAll();

chrome.contextMenus.create({
  id: 'start-break',
  title: 'Begin break',
  contexts: ['browser_action'],
  onclick: function() {
    pomo.startBreak();
  }
});

chrome.contextMenus.create({
  id: 'start-focus',
  title: 'Begin focusing',
  contexts: ['browser_action'],
  onclick: function() {
    pomo.startFocus();
  }
});

chrome.contextMenus.create({
  id: 'separator',
  type: 'separator',
  contexts: ['browser_action']
});

var pomo = new Pomo();

chrome.browserAction.onClicked.addListener(function() {
  pomo.browserAction();
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
