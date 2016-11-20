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
  var focusDesktopNotificationToggleMode = document.getElementById('focus-desktop-notification-toggle-mode');
  var focusNewTabNotification = document.getElementById('focus-new-tab-notification');
  var focusAudioNotification = document.getElementById('focus-audio-notification');
  var focusSounds = document.getElementById('focus-sounds');

  var breakDuration = document.getElementById('break-duration');
  var breakDesktopNotification = document.getElementById('break-desktop-notification');
  var breakDesktopNotificationToggleMode = document.getElementById('break-desktop-notification-toggle-mode');
  var breakNewTabNotification = document.getElementById('break-new-tab-notification');
  var breakAudioNotification = document.getElementById('break-audio-notification');
  var breakSounds = document.getElementById('break-sounds');

  focusAudioNotification.addEventListener('change', function() {
    focusSounds.disabled = !focusAudioNotification.checked;
  });

  breakAudioNotification.addEventListener('change', function() {
    breakSounds.disabled = !breakAudioNotification.checked;
  });

  chrome.runtime.sendMessage({ command: 'get-settings' }, function(settings) {
    focusDuration.value = settings.focus.duration;
    focusDesktopNotification.checked = settings.focus.desktopNotification;
    focusDesktopNotificationToggleMode.checked = settings.focus.toggleModeOnNotification;
    focusNewTabNotification.checked = settings.focus.newTabNotification;
    focusAudioNotification.checked = (settings.focus.sound !== null);
    focusSounds.disabled = !focusAudioNotification.checked;

    breakDuration.value = settings.break.duration;
    breakDesktopNotification.checked = settings.break.desktopNotification;
    breakDesktopNotificationToggleMode.checked = settings.break.toggleModeOnNotification;
    breakNewTabNotification.checked = settings.break.newTabNotification;
    breakAudioNotification.checked = (settings.break.sound !== null);
    breakSounds.disabled = !breakAudioNotification.checked;

    chrome.runtime.sendMessage({ command: 'get-sounds' }, function(sounds) {
      appendSounds(focusSounds, sounds, settings.focus.sound);
      appendSounds(breakSounds, sounds, settings.break.sound);

      focusSounds.addEventListener('change', function() {
        var option = focusSounds.options[focusSounds.selectedIndex];
        var audio = new Audio();
        audio.src = option.dataset.file;
        audio.play();

        return true;
      });

      breakSounds.addEventListener('change', function() {
        var option = breakSounds.options[breakSounds.selectedIndex];
        var audio = new Audio();
        audio.src = option.dataset.file;
        audio.play();

        return true;
      });
    });
  });
}

function saveOptions() {
  var statusElem = document.getElementById('status');
  statusElem.innerText = '';

  var focusDuration = document.getElementById('focus-duration');
  var focusDesktopNotification = document.getElementById('focus-desktop-notification');
  var focusDesktopNotificationToggleMode = document.getElementById('focus-desktop-notification-toggle-mode');
  var focusNewTabNotification = document.getElementById('focus-new-tab-notification');
  var focusAudioNotification = document.getElementById('focus-audio-notification');
  var focusSounds = document.getElementById('focus-sounds');

  var breakDuration = document.getElementById('break-duration');
  var breakDesktopNotification = document.getElementById('break-desktop-notification');
  var breakDesktopNotificationToggleMode = document.getElementById('break-desktop-notification-toggle-mode');
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
    settings: {
      focus: {
        duration: focusDuration.value,
        desktopNotification: focusDesktopNotification.checked,
        toggleModeOnNotification: focusDesktopNotificationToggleMode.checked,
        newTabNotification: focusNewTabNotification.checked,
        sound: focusSoundFile
      },
      break: {
        duration: breakDuration.value,
        desktopNotification: breakDesktopNotification.checked,
        toggleModeOnNotification: breakDesktopNotificationToggleMode.checked,
        newTabNotification: breakNewTabNotification.checked,
        sound: breakSoundFile
      }
    }
  };

  chrome.runtime.sendMessage(message, function(result) {
    if (!result.error) {
      statusElem.innerText = '✓ Options saved.';
    } else {
      statusElem.innerText = '✗ ' + result.error;
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
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
