function loadOptions() {
  chrome.runtime.sendMessage({ command: 'get-duration' }, function(settings) {
    var focusElem = document.getElementById('focus-duration');
    var breakElem = document.getElementById('break-duration');

    focusElem.value = settings.focusDuration;
    breakElem.value = settings.breakDuration;
  });
}

function saveOptions() {
  var statusElem = document.getElementById('status');
  statusElem.innerText = '';

  var focusElem = document.getElementById('focus-duration');
  var breakElem = document.getElementById('break-duration');

  var focusDuration = focusElem.value;
  var breakDuration = breakElem.value;

  var message = {
    command: 'set-duration',
    focusDuration: focusDuration,
    breakDuration: breakDuration
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
