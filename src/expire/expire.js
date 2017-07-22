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
  pomodoroLabel.innerText = `${request.pomodoros} Pomodoro${request.pomodoros === 1 ? '' : 's'} completed today`;

  let pomodoros = document.getElementById('pomodoros');
  for (let i = 0; i < request.pomodoros; ++i) {
    pomodoros.innerHTML += '&#x25cf; '
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
