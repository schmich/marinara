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

  ['day', 'week', 'month', 'year', 'all'].forEach(bucket => {
    let value = document.getElementById(`stat-${bucket}`);
    value.innerText = stats[bucket].toLocaleString();
  });

  let month = document.getElementById('bucket-month');
  month.innerText = d3.timeFormat('In %B')(now);

  let year = document.getElementById('bucket-year');
  year.innerText = `In ${now.getFullYear()}`;

  let data = stats.daily;
  createHeatmap(data, start, '#heatmap');
}

function createHeatmap(data, start, el) {
  // Inspired strongly by https://github.com/vinnyoodles/reddit-heatmap/blob/master/js/index.js.
  let max = Math.max(...Object.values(data));

  const cellSize = 14;
  const colorCount = 4;
  const cellClass = 'day';

  const width = 700;
  const height = 110;
  const dx = 35;

  let formatColor = d3.scaleQuantize()
    .domain([0, max])
    .range(d3.range(colorCount).map(d => `color${d}`));

  let now = new Date();
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  // Determine month label positions.
  let months = [];
  let active = null;
  let cursor = new Date(start);
  for (let i = 0; cursor < end; ++i) {
    let month = cursor.getMonth();
    if (active !== month) {
      active = month;
      months.push([i, new Date(cursor)]);
    }
    cursor.setDate(cursor.getDate() + 7);
  }

  // Clear heatmap.
  d3.select(el).html(null);

  // Add month labels.
  d3.select(el).selectAll('svg.months')
    .enter()
    .append('svg')
    .data([1])
    .enter()
    .append('svg')
      .attr('width', 800)
      .attr('height', 17)
    .append('g')
      .attr('transform', 'translate(0,10)')
      .selectAll('.month')
      .data(() => months)
      .enter()
      .append('text')
        .attr('x', d => d[0] * cellSize + dx)
        .attr('class', 'label')
        .text(d => d3.timeFormat('%b')(d[1]));

  let heatmap = d3.select(el).selectAll('svg.heatmap')
    .enter()
    .append('svg')
    .data([1])
    .enter()
    .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'color')
    .append('g')
    .attr('transform', `translate(${dx},0)`);

  // Add day-of-week labels.
  let labels = ['Mon', 'Wed', 'Fri'];
  heatmap.selectAll('text.dow')
    .data(() => d3.zip(d3.range(labels.length), labels))
    .enter()
    .append('text')
      .attr('transform', d => `translate(-10,${cellSize * 2 * (d[0] + 1)})`)
      .style('text-anchor', 'end')
      .attr('class', 'label')
      .text(d => d[1]);

  let dayRange = d3.timeDays(start, end);
  heatmap.selectAll('.day')
    // Heatmap of all days in the range.
    .data(d => d3.zip(d3.range(dayRange.length), dayRange))
    .enter()
    .append('rect')
      .attr('class', cellClass)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('x', d => Math.floor(d[0] / 7) * cellSize)
      .attr('y', d => (d[0] % 7) * cellSize)
      .datum(d => +d[1])
      // Tooltip title.
      .attr('title', d => {
        let count = data[d];
        let date = d3.timeFormat('%b %d, %Y')(new Date(d));
        if (!count) {
          return `<strong>No Pomodoros</strong> on ${date}`;
        } else {
          return `<strong>${count} Pomodoro${count === 1 ? '' : 's'}</strong> on ${date}`;
        }
      })
      // Add the colors to the grids.
      .filter(d => !!data[d])
      .attr('class', d => `${cellClass} ${formatColor(data[d])}`)

  // Add color legend.
  d3.select(el).selectAll('svg.legend')
    .enter()
    .append('svg')
    .data([1])
    .enter()
    .append('svg')
      .attr('width', 800)
      .attr('height', 20)
    .append('g')
      .selectAll('.legend-grid')
      .data(() => d3.range(colorCount + 1))
      .enter()
      .append('rect')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('x', d => d * (cellSize + 2) + dx)
        .attr('class', d => `day color${d - 1}`);

  tippy(`${el} .day`, {
    arrow: true,
    duration: 0,
    animation: null
  });
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

  let exportButton = document.getElementById('export-history');
  exportButton.onclick = exportHistory;

  let importButton = document.getElementById('import-history');
  importButton.onclick = importHistory;

  window.addEventListener('popstate', function(e) {
    selectTab(window.location.hash);
  });
}

document.addEventListener('DOMContentLoaded', load);
