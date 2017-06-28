function showTab(name) {
  var tabs = ['focus', 'break', 'about'];

  for (var i = 0; i < tabs.length; ++i) {
    var tab = document.getElementById(tabs[i] + '-tab');
    var content = document.getElementById(tabs[i] + '-content');

    if (name === tabs[i]) {
      tab.classList.add('active');
      content.classList.add('active');
    } else {
      tab.classList.remove('active');
      content.classList.remove('active');
    }
  }
}

function appendSounds(elem, sounds, selected) {
  for (var i = 0; i < sounds.length; ++i) {
    var sound = sounds[i];
    var option = document.createElement('option');
    option.appendChild(document.createTextNode(sound.name));
    option.dataset.file = sound.file;
    option.selected = (sound.file == selected);
    elem.appendChild(option);
  }
}

function loadOptions() {
  var focusDuration = document.getElementById('focus-duration');
  var focusDesktopNotification = document.getElementById('focus-desktop-notification');
  var focusNewTabNotification = document.getElementById('focus-new-tab-notification');
  var focusAudioNotification = document.getElementById('focus-audio-notification');
  var focusSounds = document.getElementById('focus-sounds');

  var breakDuration = document.getElementById('break-duration');
  var breakDesktopNotification = document.getElementById('break-desktop-notification');
  var breakNewTabNotification = document.getElementById('break-new-tab-notification');
  var breakAudioNotification = document.getElementById('break-audio-notification');
  var breakSounds = document.getElementById('break-sounds');

  function playSound(control) {
    var option = control.options[control.selectedIndex];
    var audio = new Audio();
    audio.src = option.dataset.file;
    audio.play();
  }

  focusAudioNotification.addEventListener('change', () => {
    focusSounds.disabled = !focusAudioNotification.checked;
  });

  breakAudioNotification.addEventListener('change', () => {
    breakSounds.disabled = !breakAudioNotification.checked;
  });

  chrome.runtime.sendMessage({ command: 'get-settings' }, settings => {
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

    chrome.runtime.sendMessage({ command: 'get-sounds' }, sounds => {
      appendSounds(focusSounds, sounds, settings.focus.sound);
      appendSounds(breakSounds, sounds, settings.break.sound);

      focusAudioNotification.addEventListener('change', () => {
        if (focusAudioNotification.checked) {
          playSound(focusSounds);
        }
      });

      focusSounds.addEventListener('change', () => {
        playSound(focusSounds);
      });

      breakAudioNotification.addEventListener('change', () => {
        if (breakAudioNotification.checked) {
          playSound(breakSounds);
        }
      });

      breakSounds.addEventListener('change', () => {
        playSound(breakSounds);
      });
    });
  });
}

function saveOptions() {
  var statusElem = document.getElementById('status');
  statusElem.innerText = '';

  var focusDuration = document.getElementById('focus-duration');
  var focusDesktopNotification = document.getElementById('focus-desktop-notification');
  var focusNewTabNotification = document.getElementById('focus-new-tab-notification');
  var focusAudioNotification = document.getElementById('focus-audio-notification');
  var focusSounds = document.getElementById('focus-sounds');

  var breakDuration = document.getElementById('break-duration');
  var breakDesktopNotification = document.getElementById('break-desktop-notification');
  var breakNewTabNotification = document.getElementById('break-new-tab-notification');
  var breakAudioNotification = document.getElementById('break-audio-notification');
  var breakSounds = document.getElementById('break-sounds');

  var focusSoundFile = null;
  if (focusAudioNotification.checked) {
    var option = focusSounds.options[focusSounds.selectedIndex];
    focusSoundFile = option.dataset.file;
  }

  var breakSoundFile = null;
  if (breakAudioNotification.checked) {
    var option = breakSounds.options[breakSounds.selectedIndex];
    breakSoundFile = option.dataset.file;
  }

  var message = {
    command: 'set-settings',
    params: {
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
    }
  };

  chrome.runtime.sendMessage(message, result => {
    if (!result.error) {
      statusElem.innerText = '✓ Options saved.';
    } else {
      statusElem.innerText = '✗ ' + result.error;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  var save = document.getElementById('save');
  save.onclick = saveOptions;

  var tabs = ['focus', 'break', 'about'];
  for (var i = 0; i < tabs.length; ++i) {
    var tab = document.getElementById(tabs[i] + '-tab');
    tab.onclick = function(tabName) {
      return function() { showTab(tabName); }
    }(tabs[i]);
  }

  showTab('focus');
  loadOptions();
});
