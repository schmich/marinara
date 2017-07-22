function pomodoroCount(count) {
  if (count === 0) {
    return 'No Pomodoros';
  } else if (count === 1) {
    return '1 Pomodoro';
  } else {
    return `${count.toLocaleString()} Pomodoros`;
  }
}

chrome.runtime.onMessage.addListener(function onMessage(request, sender, respond) {
  chrome.runtime.onMessage.removeListener(onMessage);

  let title = document.getElementById('session-title');
  let messages = document.getElementById('session-messages');
  let action = document.getElementById('session-action');

  title.innerText = request.title;
  action.innerText = request.action;

  let message = request.messages.filter(m => m && m.trim() !== '').join(' &mdash; ');
  let p = document.createElement('p');
  p.innerHTML = message;
  messages.appendChild(p);

  let pomodoroLabel = document.getElementById('pomodoro-label');
  pomodoroLabel.innerText = `${pomodoroCount(request.pomodoros)} completed today`;

  let pomodoros = document.getElementById('pomodoros');
  for (let i = 0; i < request.pomodoros; ++i) {
    pomodoros.innerHTML += '&#x2B24; '
  }

  let start = document.getElementById('start-session');
  start.classList.add(request.phase);
});

async function load() {
  let start = document.getElementById('start-session');
  start.onclick = () => BackgroundClient.startSession();

  let settings = document.getElementById('settings');
  settings.onclick = () => {
    chrome.runtime.openOptionsPage();
    return false;
  };

  let history = document.getElementById('history');
  history.onclick = () => {
    BackgroundClient.showHistory();
    return false;
  };
};

document.addEventListener('DOMContentLoaded', load);
