chrome.runtime.onMessage.addListener(function onMessage(request, sender, respond) {
  chrome.runtime.onMessage.removeListener(onMessage);

  let title = document.getElementById('session-title');
  let messages = document.getElementById('session-messages');
  let action = document.getElementById('session-action');

  title.innerText = request.title;
  action.innerText = request.action;

  if(request.phase === "focus"){
    document.getElementById('skip-break').style.display = 'none';
    document.getElementById('skip-focus-action').innerText = 'Skip Focus';
  } else {
    document.getElementById('skip-focus').style.display = 'none';
    document.getElementById('skip-break-action').innerText = 'Skip Break';
  }

  let message = request.messages.filter(m => m && m.trim() !== '').join(' &mdash; ');
  let p = document.createElement('p');
  p.innerHTML = message;
  messages.appendChild(p);

  let pomodoros = document.getElementById('pomodoros');
  for (let i = 0; i < request.pomodoros; ++i) {
    pomodoros.innerHTML += '<i class="icon-circle"></i>';
  }

  let start = document.getElementById('start-session');
  start.classList.add(request.phase);
});

async function load() {
  let start = document.getElementById('start-session');
  let skipFocus = document.getElementById('skip-focus');
  let skipBreak = document.getElementById('skip-break');

  start.onclick = () => BackgroundClient.startSession();
  skipFocus.onclick = () => BackgroundClient.skipFocus();
  skipBreak.onclick = () => BackgroundClient.skipBreak();

  let history = document.getElementById('view-history');
  history.onclick = () => {
    BackgroundClient.showHistory();
    return false;
  };

  // On Enter keypress, start next session.
  document.body.addEventListener('keypress', e => {
    if (e.keyCode === 13) {
      BackgroundClient.startSession();
    }
  });
};

document.addEventListener('DOMContentLoaded', load);
