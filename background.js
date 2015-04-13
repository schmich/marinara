var defaultSettings = {
  focusDuration: 25,
  breakDuration: 5
};

function CountdownTimer(durationMin, badgeColor, expireCallback) {
  var self = this;
  this.updateInterval = null;
  this.expireTimeout = null;

  this.start = function() {
    if (this.updateInterval) {
      this.stop();
    }

    var elapsedMin = 0;

    this.updateInterval = setInterval(function() {
      elapsedMin++;
      updateBadge(durationMin - elapsedMin, badgeColor);
    }, 60 * 1000);

    this.expireTimeout = setTimeout(function() {
      clearInterval(self.updateInterval);
      updateBadge(null, badgeColor);

      self.updateInterval = null;
      self.expireTimeout = null;

      expireCallback();
    }, durationMin * 60 * 1000);

    updateBadge(durationMin, badgeColor);
  };

  this.stop = function() {
    if (!this.updateInterval) {
      return;
    }

    clearInterval(this.updateInterval);
    clearTimeout(this.expireTimeout);
    updateBadge(null, badgeColor);

    this.updateInterval = null;
    this.expireTimeout = null;
  };

  this.running = function() {
    return this.updateInterval !== null;
  };

  function updateBadge(remainingMin, color) {
    var text;
    if (remainingMin === null) {
      text = '';
    } else {
      text = remainingMin + 'm';
    }

    chrome.browserAction.setBadgeText({ text: text });
    chrome.browserAction.setBadgeBackgroundColor({ color: color });
  };
}

function Pomo() {
  var self = this;
  var focusNext = true;
  var focusTimer;
  var breakTimer;

  this.cycleState = function() {
    if (focusTimer.running()) {
      focusTimer.stop();
      focusNext = false;
    } else if (breakTimer.running()) {
      breakTimer.stop();
      focusNext = true;
    } else {
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

  this.getDuration = function(callback) {
    chrome.storage.sync.get(function(result) {
      if (result.focusDuration === undefined || result.breakDuration === undefined) {
        chrome.storage.sync.set(defaultSettings, function() {
          callback(defaultSettings.focusDuration, defaultSettings.breakDuration);
        });
      } else {
        callback(result.focusDuration, result.breakDuration);
      }
    });
  };

  this.setDuration = function(focusDuration, breakDuration, callback) {
    focusTimer.stop();
    breakTimer.stop();

    var settings = { focusDuration: focusDuration, breakDuration: breakDuration };
    chrome.storage.sync.set(settings, function() {
      loadTimers();
      callback();
    });
  };

  function showExpirePage() {
    chrome.tabs.create({ url: chrome.extension.getURL('expire.html') });
  }

  function loadTimers() {
    self.getDuration(function(focusDuration, breakDuration) {
      focusTimer = new CountdownTimer(focusDuration, '#cc0000', function() {
        focusNext = false;
        showExpirePage();
      });
   
      breakTimer = new CountdownTimer(breakDuration, '#00cc00', function() {
        focusNext = true;
        showExpirePage();
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
  chrome.tabs.query({}, function(tabs) {
    var remove = [];
    for (var i = 0; i < tabs.length; ++i) {
      if (tabs[i].url.indexOf('chrome-extension://' + id) !== -1) {
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
      pomo.getDuration(function(focusDuration, _) {
        respond({
          focusNext: true,
          title: 'Break finished',
          subtitle: "Start your " + focusDuration + " minute focus session when you're ready",
          action: 'Start Focusing'
        });
      });
    } else {
      pomo.getDuration(function(_, breakDuration) {
        respond({
          focusNext: false,
          title: 'Take a break!',
          subtitle: "Start your " + breakDuration + " minute break when you're ready",
          action: 'Start Break'
        });
      });
    }
  } else if (request.command == 'start-session') {
    pomo.cycleState();
    respond({});
  } else if (request.command == 'get-duration') {
    pomo.getDuration(function(focusDuration, breakDuration) {
      respond({ focusDuration: focusDuration, breakDuration: breakDuration });
    });
  } else if (request.command == 'set-duration') {
    var focusDuration = request.focusDuration.trim();
    var breakDuration = request.breakDuration.trim();

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

    pomo.setDuration(focusParsed, breakParsed, function() {
      respond({});
    });
  }

  return true;
});
