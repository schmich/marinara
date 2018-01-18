// Support for focus/navigation from an external source (e.g. background script).
async function focus(hash) {
  let tab = await AsyncChrome.tabs.getCurrent();
  await AsyncChrome.tabs.update(tab.id, { active: true, highlighted: true });
  await AsyncChrome.windows.update(tab.windowId, { focused: true });
  window.location.hash = hash;
}

function isEmpty(obj) {
  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }
  return true;
}

function appendNotificationSounds(elem, sounds, selected) {
  for (let sound of sounds) {
    let option = document.createElement('option');
    option.appendChild(document.createTextNode(sound.name));
    option.dataset.file = sound.file;
    option.selected = (sound.file == selected);
    elem.appendChild(option);
  }
}

function arraysEqual(p, q) {
  p = p || [];
  q = q || [];
  return p.length === q.length
      && p.every((e, i) => e == q[i]);
}

function appendTimerSounds(elem, sounds, selected) {
  for (let sound of sounds) {
    let option = document.createElement('option');
    option.appendChild(document.createTextNode(sound.name));
    option.dataset.files = JSON.stringify(sound.files);
    option.selected = arraysEqual(sound.files, selected);
    elem.appendChild(option);
  }
}

function playSound(control) {
  if (control.selectedIndex === 0) {
    return;
  }

  let option = control.options[control.selectedIndex];
  let audio = new Audio();
  audio.src = option.dataset.file;
  audio.play();
}

async function createMetronome(soundControl, bpmControl) {
  let option = soundControl.options[soundControl.selectedIndex];
  let files = JSON.parse(option.dataset.files);
  if (!files) {
    return null;
  }

  let bpm = +bpmControl.value;
  if (isNaN(bpm) || bpm <= 0 || bpm > 1000) {
    return null;
  }

  return await Metronome.create(files, (60 / bpm) * 1000);
}

function loadSettingGroup(name, settings, notificationSounds, timerSounds) {
  let duration = document.getElementById(`${name}-duration`);
  let desktopNotification = document.getElementById(`${name}-desktop-notification`);
  let newTabNotification = document.getElementById(`${name}-new-tab-notification`);
  let soundsSelect = document.getElementById(`${name}-sounds`);

  let timerSoundSelect = document.getElementById(`${name}-timer-sounds`);
  if (timerSoundSelect != null) {
    let metronome = null;
    let timerSoundBpm = document.getElementById(`${name}-timer-sound-bpm`);
    let timerSoundPreview = document.getElementById(`${name}-timer-sound-preview`);
    let timerActive = document.querySelector(`#${name}-timer-sound-preview img`);

    const updatePreview = () => {
      if (+timerSoundBpm.value && !timerSoundBpm.disabled) {
        timerSoundPreview.style.display = null;
      } else {
        timerSoundPreview.style.display = 'none';
      }
    };

    const reloadMetronome = async () => {
      if (metronome) {
        await metronome.close();
      }
      metronome = await createMetronome(timerSoundSelect, timerSoundBpm);
      if (metronome && timerActive.classList.contains('active')) {
        await metronome.start();
      }
    };

    timerSoundBpm.disabled = !settings.timerSound;
    timerSoundBpm.value = settings.timerSound ? settings.timerSound.bpm : '';
    timerSoundBpm.addEventListener('input', async () => {
      await mutex.exclusive(async () => {
        updatePreview();
        await reloadMetronome();
      });
    });

    timerSoundSelect.addEventListener('change', async () => {
      await mutex.exclusive(async () => {
        if (timerSoundBpm.value === '') {
          timerSoundBpm.value = 60;
        }
        timerSoundBpm.disabled = timerSoundSelect.selectedIndex == 0;
        if (timerSoundBpm.disabled) {
          timerSoundBpm.value = '';
        }
        updatePreview();
        await reloadMetronome();
      });
    });

    let mutex = new Mutex();
    timerSoundPreview.addEventListener('mouseover', async () => {
      await mutex.exclusive(async () => {
        timerActive.classList.add('active');
        await reloadMetronome();
      });
    });

    timerSoundPreview.addEventListener('mouseout', async () => {
      await mutex.exclusive(async () => {
        timerActive.classList.remove('active');
        if (metronome) {
          await metronome.close();
        }
      });
    });

    let sounds = [{ name: T('none'), files: null }].concat(timerSounds);
    let selectedSounds = settings.timerSound ? settings.timerSound.files : null;
    appendTimerSounds(timerSoundSelect, sounds, selectedSounds);
    updatePreview();
  }

  soundsSelect.addEventListener('change', () => playSound(soundsSelect));

  duration.value = settings.duration;
  desktopNotification.checked = settings.notifications.desktop;
  newTabNotification.checked = settings.notifications.tab;

  let sounds = [{ name: T('none'), file: null }].concat(notificationSounds);
  appendNotificationSounds(soundsSelect, sounds, settings.notifications.sound);
}

async function loadSettings() {
  let settings = await BackgroundClient.getSettings();
  let notificationSounds = await BackgroundClient.getNotificationSounds();
  let timerSounds = await BackgroundClient.getTimerSounds();

  loadSettingGroup('focus', settings.focus, notificationSounds, timerSounds);
  loadSettingGroup('short-break', settings.shortBreak, notificationSounds, timerSounds);
  loadSettingGroup('long-break', settings.longBreak, notificationSounds, timerSounds);

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
  let notificationSounds = document.getElementById(`${name}-sounds`);
  let timerSounds = document.getElementById(`${name}-timer-sounds`);

  let soundFile = null;
  if (notificationSounds.selectedIndex > 0) {
    let option = notificationSounds.options[notificationSounds.selectedIndex];
    soundFile = option.dataset.file;
  }

  let timerSound = null;
  if (timerSounds) {
    let timerSoundBpm = document.getElementById(`${name}-timer-sound-bpm`);
    let bpm = +timerSoundBpm.value;
    if (timerSounds.selectedIndex > 0 && bpm > 0) {
      let selectedSound = timerSounds.options[timerSounds.selectedIndex];
      timerSound = {
        files: JSON.parse(selectedSound.dataset.files),
        bpm: bpm
      };
    }
  }

  return {
    duration: duration.value,
    timerSound: timerSound,
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
  input.onchange = e => {
    let file = e.target.files[0];
    let reader = new FileReader();
    reader.onload = async f => {
      try {
        let content = f.target.result;
        let history = JSON.parse(content);

        if (!confirm(T('confirm_import'))) {
          return;
        }

        let result = await BackgroundClient.setRawHistory(history);
        if (result !== true) {
          alert(T('import_failed', `${result}`));
          return;
        }
      } catch (ex) {
        alert(T('import_failed', `${ex}`));
        return;
      }
      await loadHistory(true);
    };
    reader.readAsText(file);
  };
  input.click();
}

async function loadHistory(reload = false) {
  if (this.loaded && !reload) {
    return;
  } else {
    this.loaded = true;
  }

  let now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Start at the first Sunday at least 39 weeks (~9 months) ago.
  start.setDate(start.getDate() - 273);
  start.setDate(start.getDate() - start.getDay());

  let stats = await BackgroundClient.getHistory(+start);

  for (let bucket of ['day', 'week', 'month', 'period', 'total']) {
    let stat = document.getElementById(`stat-${bucket}`);
    let count = stats[bucket];

    if (bucket === 'period') {
      stat.innerText = T('last_9_months', pomodoroCount(count));
    } else {
      stat.innerText = count.toLocaleString();
    }

    let el = document.getElementById(`average-${bucket}`);
    if (el) {
      let formatted = stats[`${bucket}Average`].toLocaleString(navigator.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      el.innerText = T('average_stat', formatted);
    }
  };

  let monthEl = document.getElementById('bucket-month');
  monthEl.innerText = T('in_month', Locale.format('%B')(now));

  let daySection = document.getElementById('day-distribution-section');
  let weekSection = document.getElementById('week-distribution-section');
  let heatmapSection = document.getElementById('heatmap-section');

  let verb = (stats.pomodoros.length === 0) ? 'add' : 'remove';
  [daySection, weekSection].forEach(s => s.classList[verb]('empty'));

  createWeekDistribution('#week-distribution', stats.pomodoros);
  createOptionGroup('.day-distribution', bucket =>
    createDayDistribution('#day-distribution', bucket, stats.pomodoros)
  );

  verb = isEmpty(stats.daily) ? 'add' : 'remove';
  heatmapSection.classList[verb]('empty');

  createHeatmap(stats.daily, start, '#heatmap');
}

function createOptionGroup(selector, callback) {
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

  document.querySelector(`${selector}.active`).click();
}

function selectTab(id) {
  let active = id.substring(1).toLowerCase();
  if (active === 'history') {
    loadHistory();
  }

  document.title = `${T(active)} · ${T('app_name_short')}`;

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
