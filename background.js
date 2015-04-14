var defaultSettings = {
  focusDuration: 25,
  breakDuration: 5,
  showDesktopNotification: true,
  showNewTabNotification: true
};

function CountdownTimer(durationMin, badgeTitle, badgeColor, expireCallback) {
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
      updateBadge(Math.ceil(durationMin - elapsedMin));
    }, 60 * 1000);

    this.expireTimeout = setTimeout(function() {
      clearInterval(self.updateInterval);
      updateBadge(null);

      self.updateInterval = null;
      self.expireTimeout = null;

      expireCallback();
    }, durationMin * 60 * 1000);

    updateBadge(Math.ceil(durationMin));
  };

  this.stop = function() {
    if (!this.updateInterval) {
      return;
    }

    clearInterval(this.updateInterval);
    clearTimeout(this.expireTimeout);
    updateBadge(null);

    this.updateInterval = null;
    this.expireTimeout = null;
  };

  this.running = function() {
    return this.updateInterval !== null;
  };

  function updateBadge(remainingMin, title) {
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
    focusTimer.stop();
    breakTimer.stop();

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
      focusTimer = new CountdownTimer(settings.focusDuration, 'Focus:', '#cc0000', function() {
        focusNext = false;

        if (settings.showDesktopNotification) {
          notify('Pomo: Take a break!', "Start your break when you're ready");
        }

        if (settings.showNewTabNotification) {
          showExpirePage();
        }
      });
   
      breakTimer = new CountdownTimer(settings.breakDuration, 'Break:', '#00cc00', function() {
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
