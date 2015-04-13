function updateBadge(minRemaining, color) {
  var text;
  if (minRemaining === null) {
    text = '';
  } else {
    text = minRemaining + 'm';
  }

  chrome.browserAction.setBadgeText({ text: text });
  chrome.browserAction.setBadgeBackgroundColor({ color: color });
}

function startTimer(min, color, callback) {
  var elapsedMin = 0;

  var updateInterval = setInterval(function() {
    elapsedMin++;
    updateBadge(min - elapsedMin, color);
  }, 60 * 1000);

  setTimeout(function() {
    clearInterval(updateInterval);
    updateBadge(null, color);
    callback();
  }, min * 60 * 1000);

  updateBadge(min, color);
}

function startBreakTimer(breakMin) {
  startTimer(breakMin, '#00cc00', function() {
  });
}

function startWorkTimer(workMin) {
  startTimer(workMin, '#cc0000', function() {
  });
}

chrome.browserAction.onClicked.addListener(function(tab) {
  startWorkTimer(2);
});
