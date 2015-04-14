function loadOptions() {
  chrome.runtime.sendMessage({ command: 'get-settings' }, function(settings) {
    var focusElem = document.getElementById('focus-duration');
    var breakElem = document.getElementById('break-duration');
    var desktopNotification = document.getElementById('desktop-notification');
    var newTabNotification = document.getElementById('new-tab-notification');

    focusElem.value = settings.focusDuration;
    breakElem.value = settings.breakDuration;
    desktopNotification.checked = settings.showDesktopNotification;
    newTabNotification.checked = settings.showNewTabNotification;
  });
}

function saveOptions() {
  var statusElem = document.getElementById('status');
  statusElem.innerText = '';

  var focusElem = document.getElementById('focus-duration');
  var breakElem = document.getElementById('break-duration');
  var desktopNotification = document.getElementById('desktop-notification');
  var newTabNotification = document.getElementById('new-tab-notification');

  var message = {
    command: 'set-settings',
    settings: {
      focusDuration: focusElem.value,
      breakDuration: breakElem.value,
      showDesktopNotification: desktopNotification.checked,
      showNewTabNotification: newTabNotification.checked
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
  loadOptions();
});
