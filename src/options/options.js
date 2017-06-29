function showTab(name) {
  ['focus', 'break', 'about'].forEach(tabName => {
    let tab = document.getElementById(tabName + '-tab');
    let content = document.getElementById(tabName + '-content');

    if (name === tabName) {
      tab.classList.add('active');
      content.classList.add('active');
    } else {
      tab.classList.remove('active');
      content.classList.remove('active');
    }
  });

  let save = document.getElementById('save-status');
  save.style.display = (name === 'about') ? 'none' : 'block';
}

function appendSounds(elem, sounds, selected) {
  for (let sound of sounds) {
    let option = document.createElement('option');
    option.appendChild(document.createTextNode(sound.name));
    option.dataset.file = sound.file;
    option.selected = (sound.file == selected);
    elem.appendChild(option);
  }
}

async function loadOptions() {
  let focusDuration = document.getElementById('focus-duration');
  let focusDesktopNotification = document.getElementById('focus-desktop-notification');
  let focusNewTabNotification = document.getElementById('focus-new-tab-notification');
  let focusAudioNotification = document.getElementById('focus-audio-notification');
  let focusSounds = document.getElementById('focus-sounds');

  let breakDuration = document.getElementById('break-duration');
  let breakDesktopNotification = document.getElementById('break-desktop-notification');
  let breakNewTabNotification = document.getElementById('break-new-tab-notification');
  let breakAudioNotification = document.getElementById('break-audio-notification');
  let breakSounds = document.getElementById('break-sounds');

  function playSound(control) {
    let option = control.options[control.selectedIndex];
    let audio = new Audio();
    audio.src = option.dataset.file;
    audio.play();
  }

  focusAudioNotification.addEventListener('change', () => {
    focusSounds.disabled = !focusAudioNotification.checked;
  });

  breakAudioNotification.addEventListener('change', () => {
    breakSounds.disabled = !breakAudioNotification.checked;
  });

  let settings = await BackgroundClient.getSettings();

  focusDuration.value = settings.focus.duration;
  focusDesktopNotification.checked = settings.focus.desktopNotification;
  focusNewTabNotification.checked = settings.focus.newTabNotification;
  focusAudioNotification.checked = (settings.focus.sound !== null);
  focusSounds.disabled = !focusAudioNotification.checked;

  breakDuration.value = settings.break.duration;
  breakDesktopNotification.checked = settings.break.desktopNotification;
  breakNewTabNotification.checked = settings.break.newTabNotification;
  breakAudioNotification.checked = (settings.break.sound !== null);
  breakSounds.disabled = !breakAudioNotification.checked;

  let sounds = await BackgroundClient.getSounds();
  appendSounds(focusSounds, sounds, settings.focus.sound);
  appendSounds(breakSounds, sounds, settings.break.sound);

  focusAudioNotification.addEventListener('change', () => {
    if (focusAudioNotification.checked) {
      playSound(focusSounds);
    }
  });

  focusSounds.addEventListener('change', () => playSound(focusSounds));

  breakAudioNotification.addEventListener('change', () => {
    if (breakAudioNotification.checked) {
      playSound(breakSounds);
    }
  });

  breakSounds.addEventListener('change', () => playSound(breakSounds));
}

async function saveOptions() {
  let statusElem = document.getElementById('status');
  statusElem.innerText = '';

  let focusDuration = document.getElementById('focus-duration');
  let focusDesktopNotification = document.getElementById('focus-desktop-notification');
  let focusNewTabNotification = document.getElementById('focus-new-tab-notification');
  let focusAudioNotification = document.getElementById('focus-audio-notification');
  let focusSounds = document.getElementById('focus-sounds');

  let breakDuration = document.getElementById('break-duration');
  let breakDesktopNotification = document.getElementById('break-desktop-notification');
  let breakNewTabNotification = document.getElementById('break-new-tab-notification');
  let breakAudioNotification = document.getElementById('break-audio-notification');
  let breakSounds = document.getElementById('break-sounds');

  let focusSoundFile = null;
  if (focusAudioNotification.checked) {
    let option = focusSounds.options[focusSounds.selectedIndex];
    focusSoundFile = option.dataset.file;
  }

  let breakSoundFile = null;
  if (breakAudioNotification.checked) {
    let option = breakSounds.options[breakSounds.selectedIndex];
    breakSoundFile = option.dataset.file;
  }

  let params = {
    focus: {
      duration: focusDuration.value,
      desktopNotification: focusDesktopNotification.checked,
      newTabNotification: focusNewTabNotification.checked,
      sound: focusSoundFile
    },
    break: {
      duration: breakDuration.value,
      desktopNotification: breakDesktopNotification.checked,
      newTabNotification: breakNewTabNotification.checked,
      sound: breakSoundFile
    }
  };

  let result = await BackgroundClient.setSettings(params);
  if (!result.error) {
    statusElem.innerText = '✓ Options saved.';
  } else {
    statusElem.innerText = '✗ ' + result.error;
  }
}

document.addEventListener('DOMContentLoaded', () => setTimeout(async () => await load()));

async function load() {
  let save = document.getElementById('save');
  save.onclick = async () => await saveOptions();

  ['focus', 'break', 'about'].forEach(tabName => {
    let tab = document.getElementById(tabName + '-tab');
    tab.onclick = () => showTab(tabName);
  });

  showTab('focus');

  await loadOptions();
}
