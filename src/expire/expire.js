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
  
  let start = document.getElementById('start-session');
  start.classList.add(request.phase);
});

document.addEventListener('DOMContentLoaded', load);

async function load() {
  let start = document.getElementById('start-session');
  start.onclick = () => BackgroundClient.startSession();

  let settings = document.getElementById('settings');
  settings.onclick = () => {
    chrome.runtime.openOptionsPage();
    return false;
  };
};
