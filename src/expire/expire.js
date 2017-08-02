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

  let stats = document.getElementById('view-stats');
  stats.onclick = () => {
    BackgroundClient.showHistory();
    return false;
  };
};

document.addEventListener('DOMContentLoaded', load);
