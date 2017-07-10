function appendSounds(elem, sounds, selected) {
  for (let sound of sounds) {
    let option = document.createElement('option');
    option.appendChild(document.createTextNode(sound.name));
    option.dataset.file = sound.file;
    option.selected = (sound.file == selected);
    elem.appendChild(option);
  }
}

function playSound(control) {
  let option = control.options[control.selectedIndex];
  let audio = new Audio();
  audio.src = option.dataset.file;
  audio.play();
}

function loadSettingGroup(name, settings, soundOptions) {
  let duration = document.getElementById(`${name}-duration`);
  let desktopNotification = document.getElementById(`${name}-desktop-notification`);
  let newTabNotification = document.getElementById(`${name}-new-tab-notification`);
  let audioNotification = document.getElementById(`${name}-audio-notification`);
  let sounds = document.getElementById(`${name}-sounds`);

  audioNotification.addEventListener('change', () => {
    sounds.disabled = !audioNotification.checked;
    if (audioNotification.checked) {
      playSound(sounds);
    }
  });

  sounds.addEventListener('change', () => playSound(sounds));

  duration.value = settings.duration;
  desktopNotification.checked = settings.notifications.desktop;
  newTabNotification.checked = settings.notifications.tab;
  audioNotification.checked = settings.notifications.sound !== null;
  sounds.disabled = !audioNotification.checked;

  appendSounds(sounds, soundOptions, settings.notifications.sound);
}

async function loadSettings() {
  let settings = await BackgroundClient.getSettings();
  let sounds = await BackgroundClient.getSounds();

  loadSettingGroup('focus', settings.focus, sounds);
  loadSettingGroup('short-break', settings.shortBreak, sounds);
  loadSettingGroup('long-break', settings.longBreak, sounds);

  let longBreakInterval = document.getElementById('long-break-interval');

  let updateLongBreak = () => {
    let fields = document.getElementById('long-break');
    fields.disabled = longBreakInterval.value == 0;
  };

  longBreakInterval.value = settings.longBreak.interval;
  longBreakInterval.addEventListener('change', updateLongBreak);
  updateLongBreak();
}

function getSettingGroup(name) {
  let duration = document.getElementById(`${name}-duration`);
  let desktopNotification = document.getElementById(`${name}-desktop-notification`);
  let newTabNotification = document.getElementById(`${name}-new-tab-notification`);
  let audioNotification = document.getElementById(`${name}-audio-notification`);
  let sounds = document.getElementById(`${name}-sounds`);

  let soundFile = null;
  if (audioNotification.checked) {
    let option = sounds.options[sounds.selectedIndex];
    soundFile = option.dataset.file;
  }

  return {
    duration: duration.value,
    notifications: {
      desktop: desktopNotification.checked,
      tab: newTabNotification.checked,
      sound: soundFile
    }
  };
}

async function saveSettings() {
  let params = {
    focus: getSettingGroup('focus'),
    shortBreak: getSettingGroup('short-break'),
    longBreak: getSettingGroup('long-break')
  };

  let longBreakInterval = document.getElementById('long-break-interval');
  params.longBreak.interval = longBreakInterval.value;

  let result = await BackgroundClient.setSettings(params);
  if (result.error) {
    // TODO
  }
}

function selectTab(id) {
  let active = id.substring(1);

  ['settings', 'feedback'].forEach(name => {
    document.getElementById(`${name}-tab`).classList.remove('active');
    document.getElementById(`${name}-page`).classList.remove('active');
  });

  document.getElementById(`${active}-tab`).classList.add('active');
  document.getElementById(`${active}-page`).classList.add('active');
}

document.addEventListener('DOMContentLoaded', load);

async function load() {
  await loadSettings();

  let manifest = chrome.runtime.getManifest();
  let version = document.getElementById('version');
  version.innerText = manifest.version;

  let inputs = document.querySelectorAll('#settings input[type="checkbox"], #settings select');
  inputs.forEach(input => input.addEventListener('change', saveSettings));

  let texts = document.querySelectorAll('#settings input[type="text"]');
  texts.forEach(text => text.addEventListener('input', saveSettings));

  let hash = window.location.hash || '#settings';
  selectTab(hash);

  window.addEventListener('popstate', function(e) {
    selectTab(window.location.hash);
  });
}
