chrome.runtime.onMessage.addListener(function onMessage(request, sender, respond) {
  chrome.runtime.onMessage.removeListener(onMessage);

  let title = document.getElementById('session-title');
  let subtitle = document.getElementById('session-subtitle');
  let action = document.getElementById('session-action');

  title.innerText = request.title;
  subtitle.innerText = request.message;
  action.innerText = request.action;
  
  let start = document.getElementById('start-session');
  start.classList.add(request.phase);
});

document.addEventListener('DOMContentLoaded', load);

async function load() {
  let start = document.getElementById('start-session');
  start.onclick = () => BackgroundClient.startSession();
};
