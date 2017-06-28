var defaultSettings = {
  focus: {
    duration: 25,
    desktopNotification: true,
    newTabNotification: true,
    sound: null
  },
  break: {
    duration: 5,
    desktopNotification: true,
    newTabNotification: true,
    sound: null
  },
  version: 1
};

const sounds = [
  { name: 'Tone', file: 'tone.mp3' },
  { name: 'Electronic Chime', file: 'electronic-chime.mp3' },
  { name: 'Gong 1', file: 'gong-1.mp3' },
  { name: 'Gong 2', file: 'gong-2.mp3' },
  { name: 'Computer Magic', file: 'computer-magic.mp3' },
  { name: 'Fire Pager', file: 'fire-pager.mp3' },
  { name: 'Glass Ping', file: 'glass-ping.mp3' },
  { name: 'Music Box', file: 'music-box.mp3' },
  { name: 'Pin Dropping', file: 'pin-dropping.mp3' },
  { name: 'Robot Blip 1', file: 'robot-blip-1.mp3' },
  { name: 'Robot Blip 2', file: 'robot-blip-2.mp3' },
  { name: 'Ship Bell', file: 'ship-bell.mp3' },
  { name: 'Train Horn', file: 'train-horn.mp3' },
  { name: 'Bike Horn', file: 'bike-horn.mp3' },
  { name: 'Bell Ring', file: 'bell-ring.mp3' },
  { name: 'Reception Bell', file: 'reception-bell.mp3' },
  { name: 'Toaster Oven', file: 'toaster-oven.mp3' },
  { name: 'Battle Horn', file: 'battle-horn.mp3' },
  { name: 'Ding', file: 'ding.mp3' },
  { name: 'Dong', file: 'dong.mp3' },
  { name: 'Ding Dong', file: 'ding-dong.mp3' },
  { name: 'Din Ding', file: 'din-ding.mp3' }
];

for (let i = 0; i < sounds.length; ++i) {
  sounds[i].file = 'chrome-extension://' + chrome.runtime.id + '/audio/' + sounds[i].file;
}

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
    updateBadge({ text: '—', title: 'Timer Paused' });
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

function AudioObserver() {
}

AudioObserver.observe = function(timer, sourceFile) {
  if (sourceFile) {
    timer.addListener('expire', function() {
      var audio = new Audio();
      audio.src = sourceFile;
      audio.play();
    });
  }
};

function Controller() {
  var self = this;
  var focusNext = true;
  var focusTimer;
  var breakTimer;
  var notificationId = null;

  this.state = function() {
    if (!breakTimer || !focusTimer) {
      return 'expired';
    }

    if (breakTimer.state !== TimerState.Stopped) {
      return breakTimer.state;
    }

    return focusTimer.state;
  };

  this.startSession = function() {
    focusTimer.stop();
    breakTimer.stop();

    if (focusNext) {
      focusTimer.start();
    } else {
      breakTimer.start();
    }
  };

  this.browserAction = function() {
    if (focusTimer.state === TimerState.Running) {
      focusTimer.pause();
    } else if (breakTimer.state === TimerState.Running) {
      breakTimer.pause();
    } else if (focusTimer.state === TimerState.Paused) {
      focusTimer.resume();
    } else if (breakTimer.state === TimerState.Paused) {
      breakTimer.resume();
    } else {
      this.startSession();
    }
  };

  this.pause = function() {
    if (focusTimer.state === TimerState.Running) {
      focusTimer.pause();
    } else if (breakTimer.state === TimerState.Running) {
      breakTimer.pause();
    }
  };

  this.stop = function() {
    focusTimer.stop();
    breakTimer.stop();
  };

  this.resume = function() {
    if (focusTimer.state === TimerState.Paused) {
      focusTimer.resume();
    } else if (breakTimer.state === TimerState.Paused) {
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

  function showExpirePage(callback) {
    if (expirePageTabId !== null) {
      chrome.tabs.update(expirePageTabId, { active: true, highlighted: true }, callback);
    } else {
      chrome.tabs.create({ url: chrome.extension.getURL('expire/expire.html') }, function(tab) {
        expirePageTabId = tab.id;
        if (callback) {
          callback(tab);
        }
      });
    }
  }

  var expirePageTabId = null;
  chrome.tabs.onRemoved.addListener(function(tabId) {
    if (tabId === expirePageTabId) {
      expirePageTabId = null;
    }
  });

  function notify(title, message, buttonTitle) {
    var options = {
      type: 'basic',
      title: title,
      message: message,
      iconUrl: 'icons/128.png',
      isClickable: true,
      buttons: [{ title: buttonTitle, iconUrl: 'icons/start.png' }]
    };

    chrome.notifications.create('', options, function (id) {
      notificationId = id;
    });
  }

  chrome.notifications.onClicked.addListener(function() {
    showExpirePage(function(tab) {
      chrome.windows.update(tab.windowId, { focused: true });
    });
  });

  chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
    self.focusNext() ? self.startFocus() : self.startBreak();
    chrome.notifications.clear(notificationId);
  });

  function createTimers() {
    self.getSettings(function(settings) {
      if (focusTimer) {
        focusTimer.stop();
      }

      focusTimer = createFocusTimer(settings);

      if (breakTimer) {
        breakTimer.stop();
      }

      breakTimer = createBreakTimer(settings);
    });
  }

  function menuHandler(timer) {
    timer.addListener('start', () => menu.refresh());
    timer.addListener('stop', () => menu.refresh());
    timer.addListener('pause', () => menu.refresh());
    timer.addListener('resume', () => menu.refresh());
    timer.addListener('expire', () => menu.refresh());
  }

  function createFocusTimer(settings) {
    var timer = new Timer(settings.focus.duration * 60, 60);
    BadgeObserver.observe(timer, 'Focus', '#990000');
    menuHandler(timer);
    AudioObserver.observe(timer, settings.focus.sound);

    timer.addListener('expire', function() {
      focusNext = false;

      if (settings.focus.desktopNotification) {
        notify(
          'Take a break!', 
          "Start your break when you're ready", 
          'Start break now'
        );
      }

      if (settings.focus.newTabNotification) {
        showExpirePage();
      }
    });

    timer.addListener('start', function () {
      closeExpireTab();
      closeNotifications();
    });

    return timer;
  }

  function createBreakTimer(settings) {
    var timer = new Timer(settings.break.duration * 60, 60);
    BadgeObserver.observe(timer, 'Break', '#009900');
    menuHandler(timer);
    AudioObserver.observe(timer, settings.break.sound);

    timer.addListener('expire', function() {
      focusNext = true;

      if (settings.break.desktopNotification) {
        notify(
          'Break finished', 
          "Start your focus session when you're ready", 
          'Start focusing now'
        );
      }

      if (settings.break.newTabNotification) {
        showExpirePage();
      }
    });

    timer.addListener('start', function () {
      closeExpireTab();
      closeNotifications();
    });

    return timer;
  }

  function closeExpireTab() {
    if (expirePageTabId !== null) {
      chrome.tabs.remove(expirePageTabId, function() { });
    }
  }

  function closeNotifications() {
    if (notificationId !== null) {
      chrome.notifications.clear(notificationId);
      notificationId = null;
    }
  }

  createTimers();

  let menu = new Menu('browser_action');

  menu.addGroup(new MenuGroup([
    new StopTimerMenuItem(self),
    new PauseTimerMenuItem(self),
    new ResumeTimerMenuItem(self)
  ]));

  menu.addGroup(new MenuGroup([
    new StartFocusingMenuItem(self),
    new StartBreakMenuItem(self)
  ]));
}

var controller = new Controller();

chrome.browserAction.onClicked.addListener(function() {
  controller.browserAction();
});

chrome.runtime.onMessage.addListener(function(request, sender, respond) {
  if (request.command === 'get-session') {
    if (controller.focusNext()) {
      controller.getSettings(function(settings) {
        respond({
          focusNext: true,
          title: 'Break finished',
          subtitle: "Start your " + settings.focus.duration + " minute focus session when you're ready",
          action: 'Start Focusing'
        });
      });
    } else {
      controller.getSettings(function(settings) {
        respond({
          focusNext: false,
          title: 'Take a break!',
          subtitle: "Start your " + settings.break.duration + " minute break when you're ready",
          action: 'Start Break'
        });
      });
    }
  } else if (request.command === 'start-session') {
    controller.startSession();
    respond({});
  } else if (request.command === 'get-sounds') {
    respond(sounds);
  } else if (request.command === 'get-settings') {
    controller.getSettings(respond);
  } else if (request.command === 'set-settings') {
    var newSettings = request.settings;
    var focusDuration = newSettings.focus.duration.trim();
    var breakDuration = newSettings.break.duration.trim();

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

    newSettings.focus.duration = focusParsed;
    newSettings.break.duration = breakParsed;

    controller.setSettings(newSettings, function() {
      respond({});
    });
  }

  return true;
});
