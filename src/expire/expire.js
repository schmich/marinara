window.onload = () => {
  chrome.windows.getCurrent({}, thisWindow => {
    chrome.windows.update(thisWindow.id, { focused: true });
  });

  chrome.runtime.sendMessage({ command: 'get-phase' }, phase => {
    let start = document.getElementById('start-session');
    start.onclick = () => {
      chrome.runtime.sendMessage({ command: 'start-session' });
    };

    let title = document.getElementById('session-title');
    let subtitle = document.getElementById('session-subtitle');
    let action = document.getElementById('session-action');

    if (phase === 'focus') {
      title.innerText = 'Break finished';
      subtitle.innerText = "Start your focus session when you're ready";
      action.innerText = 'Start Focusing';
    } else if (phase === 'break') {
      title.innerText = 'Take a break!';
      subtitle.innerText = "Start your break when you're ready";
      action.innerText = 'Start Break';
    }

    start.className += ' ' + phase;
  });
};
