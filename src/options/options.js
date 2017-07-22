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

  return settings;
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

async function saveSettings(settings) {
  settings.focus = getSettingGroup('focus');
  settings.shortBreak = getSettingGroup('short-break');
  settings.longBreak = getSettingGroup('long-break');

  let longBreakInterval = document.getElementById('long-break-interval');
  settings.longBreak.interval = longBreakInterval.value;

  let result = await BackgroundClient.setSettings(settings);
  if (result.error) {
    // TODO
  }
}

async function exportHistory() {
  let json = JSON.stringify(await BackgroundClient.getRawHistory());
  let link = document.createElement('a');
  link.download = 'history.json';
  link.href = 'data:application/octet-stream,' + encodeURIComponent(json);
  link.click();
}

function importHistory() {
  let input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.click();
  input.onchange = e => {
    let file = e.target.files[0];
    let reader = new FileReader();
    reader.onload = async f => {
      try {
        let content = f.target.result;
        let history = JSON.parse(content);

        if (!confirm('Importing history overwrites all existing history. Continue?')) {
          return;
        }

        let result = await BackgroundClient.setRawHistory(history);
        if (result !== true) {
          alert(`Failed to import history: ${result}`);
          return;
        }
      } catch (ex) {
        alert(`Failed to import history: ${ex}`);
        return;
      }
      await loadHistory(true);
    };
    reader.readAsText(file);
  };
}

async function loadHistory(reload = false) {
  if (this.loaded && !reload) {
    return;
  } else {
    this.loaded = true;
  }

  let now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - 273);
  start.setDate(start.getDate() - start.getDay());

  let stats = await BackgroundClient.getHistory(+start);

  for (let bucket of ['day', 'week', 'month', 'period', 'total']) {
    let stat = document.getElementById(`stat-${bucket}`);
    let count = stats[bucket];

    if (bucket === 'period') {
      stat.innerText = pomodoroCount(count);
    } else {
      stat.innerText = count.toLocaleString();
    }

    let el = document.getElementById(`average-${bucket}`);
    if (el) {
      let formatted = stats[`${bucket}Average`].toLocaleString(navigator.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      el.innerText = `${formatted} avg`;
    }
  };

  let month = document.getElementById('bucket-month');
  month.innerText = d3.timeFormat('In %B')(now);

  createHeatmap(stats.daily, start, '#heatmap');
  createWeekDistribution('#week-distribution', stats.pomodoros);
  createOptionGroup('.day-distribution', 1, bucket =>
    createDayDistribution('#day-distribution', bucket, stats.pomodoros)
  );
}

function createOptionGroup(selector, initialActive, callback) {
  let group = document.querySelectorAll(selector);
  for (let el of group) {
    el.onclick = e => {
      for (let el of group) {
        let action = el === e.target ? 'add' : 'remove';
        el.classList[action]('active');
      }
      callback(el.dataset.value);
    };
  }

  group[initialActive].click();
}

function selectTab(id) {
  let active = id.substring(1);
  if (active === 'history') {
    loadHistory();
  }

  let title = active[0].toUpperCase() + active.substr(1);
  document.title = `${title} · Marinara`;

  ['settings', 'history', 'feedback'].forEach(name => {
    document.getElementById(`${name}-tab`).classList.remove('active');
    document.getElementById(`${name}-page`).classList.remove('active');
  });

  document.getElementById(`${active}-tab`).classList.add('active');
  document.getElementById(`${active}-page`).classList.add('active');

  window.requestAnimationFrame(() => window.scrollTo(0, 0));
}

async function load() {
  let settings = await loadSettings();

  let manifest = chrome.runtime.getManifest();
  let version = document.getElementById('version');
  version.innerText = manifest.version;

  let inputs = document.querySelectorAll('#settings input[type="checkbox"], #settings select');
  inputs.forEach(input => input.addEventListener('change', () => saveSettings(settings)));

  let texts = document.querySelectorAll('#settings input[type="text"]');
  texts.forEach(text => text.addEventListener('input', () => saveSettings(settings)));

  let hash = window.location.hash || '#settings';
  selectTab(hash);

  document.getElementById('export-history').onclick = exportHistory;
  document.getElementById('import-history').onclick = importHistory;

  window.addEventListener('popstate', function(e) {
    selectTab(window.location.hash);
  });
}

document.addEventListener('DOMContentLoaded', load);
