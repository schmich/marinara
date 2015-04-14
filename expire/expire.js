window.onload = function() {
  chrome.windows.getCurrent({}, function(thisWindow) {
    chrome.windows.update(thisWindow.id, { focused: true });
  });

  chrome.runtime.sendMessage({ command: 'get-session' }, function(session) {
    var startSession = document.getElementById('start-session');
    startSession.onclick = function() {
      chrome.runtime.sendMessage({ command: 'start-session' });
      chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.remove(tab.id);
      });
    };

    var sessionTitle = document.getElementById('session-title');
    sessionTitle.innerText = session.title;

    var sessionSubtitle = document.getElementById('session-subtitle');
    sessionSubtitle.innerText = session.subtitle;

    var sessionAction = document.getElementById('session-action');
    sessionAction.innerText = session.action;

    if (session.focusNext) {
      startSession.className += ' focus';
    } else {
      startSession.className += ' break';
    }
  });
};
