<template>
  <div v-if="stats" class="history">
    <div id="sparkline"></div>
    <div class="stats">
      <div class="stat">
        <div class="value">{{ stats.day | integer }}</div>
        <div class="bucket">{{ M.today }}</div>
        <div class="average">{{ stats.dayAverage | float(2) | average_stat }}</div>
      </div>
      <div class="stat">
        <div class="value">{{ stats.week | integer }}</div>
        <div class="bucket">{{ M.this_week }}</div>
        <div class="average">{{ stats.weekAverage | float(2) | average_stat }}</div>
      </div>
      <div class="stat">
        <div class="value">{{ stats.month | integer }}</div>
        <div class="bucket">{{ new Date() | strftime('%B') | in_month }}</div>
        <div class="average">{{ stats.monthAverage | float(2) | average_stat }}</div>
      </div>
      <div class="stat">
        <div class="value">{{ stats.total | integer }}</div>
        <div class="bucket">{{ M.total }}</div>
      </div>
    </div>
    <section class="day-distribution chart">
      <div class="title">
        <h2>{{ M.daily_distribution }}</h2>
        <div v-if="stats.total > 0" class="options chart-content" key="actions">
          <input type="radio" id="day-15" name="day-distribution" v-model.number="dayDistributionBucket" value="15">
          <label for="day-15">{{ M.min_suffix(15) }}</label>
          <input type="radio" id="day-30" name="day-distribution" v-model.number="dayDistributionBucket" value="30">
          <label for="day-30">{{ M.min_suffix(30) }}</label>
          <input type="radio" id="day-60" name="day-distribution" v-model.number="dayDistributionBucket" value="60">
          <label for="day-60">{{ M.hr_suffix(1) }}</label>
          <input type="radio" id="day-120" name="day-distribution" v-model.number="dayDistributionBucket" value="120">
          <label for="day-120">{{ M.hr_suffix(2) }}</label>
        </div>
      </div>
      <div v-if="stats.total > 0" ref="dayDistribution" class="chart-content" key="chart"></div>
      <div v-else class="empty" key="empty">{{ M.daily_empty_placeholder }}</div>
    </section>
    <section class="chart">
      <div class="title">
        <h2>{{ M.weekly_distribution }}</h2>
      </div>
      <div v-if="stats.total > 0" ref="weekDistribution" class="chart-content" key="chart"></div>
      <div v-else class="empty" key="empty">{{ M.weekly_empty_placeholder }}</div>
    </section>
    <section id="heatmap-section" class="chart">
      <div class="title">
        <h2>{{ stats.period | pomodoroCount | last_9_months }}</h2>
      </div>
      <div v-if="stats.total > 0" ref="heatmap" class="heatmap chart-content" key="chart"></div>
      <div v-else class="empty" key="empty">{{ M.history_empty_placeholder }}</div>
    </section>
    <div class="actions">
      <button @click="importHistory">{{ M.import_history }}</button>
      <button @click="exportHistory">{{ M.export_history }}</button>
    </div>
  </div>
</template>

<style lang="scss">
.heatmap {
  font-size: 14px;
  margin-left: -10px;
}
.heatmap .day {
  fill: #eee;
  stroke: #fff;
  stroke-width: 2px;
  outline: 0 !important;
}
.heatmap .label {
  fill: #777;
}
.heatmap .color0 {
  fill: #c6e48b;
}
.heatmap .color1 {
  fill: #7bc96f;
}
.heatmap .color2 {
  fill: #239a3b;
}
.heatmap .color3 {
  fill: #196127;
}
.history {
  justify-content: space-between;
}
.history .actions {
  display: flex;
  justify-content: flex-end;
  margin: 25px 0 35px 0;
}
.history .actions button {
  outline: 0 !important;
  font-size: 15px;
  cursor: pointer;
  background: transparent;
  color: #555;
  padding: 10px 20px;
  border: 1px solid #555;
  border-radius: 5px;
  text-decoration: none;
  display: inline-block;
  margin-left: 15px;
}
.history .actions button:hover {
  color: #a00;
  border: 1px solid #a00;
  text-decoration: none;
}
.history section {
  margin-bottom: 60px;
}
.history .title {
  margin: 0 0 15px 0;
  border-bottom: 1px solid #aaa;
}
.history .title .options {
  float: right;
}
.history .title h2 {
  color: #444;
  font-size: 16px;
  display: inline;
  font-weight: normal;
}
.day-distribution .options input {
  display: none;
}
.day-distribution .options label {
  cursor: pointer;
  border: 0;
  background: transparent;
  text-transform: uppercase;
  outline: 0 !important;
  padding: 1px 6px;
  border-radius: 2px;
  font-size: 12px;
  position: relative;
  top: -1px;
}
.day-distribution .options input:checked + label {
  border-radius: 3px;
  background: #777;
  color: #fff;
}
.stats {
  margin: 20px 40px 80px 40px;
  display: flex;
  justify-content: space-between;
}
.stats .stat {
  display: flex;
  align-items: center;
  flex-flow: column;
}
.stats .stat .value {
  color: #a00;
  font-size: 30px;
  margin-bottom: 5px;
}
.stats .stat .bucket {
  color: #333;
  font-size: 17px;
}
.stats .stat .average {
  color: #555;
  margin-top: 3px;
}
.distribution rect {
  fill: #2b2;
  outline: 0 !important;
}
.distribution .domain {
  stroke: #777;
}
.chart .empty {
  display: flex;
  justify-content: center;
  padding: 50px 100px;
  font-size: 15px;
  background: #eee;
  color: #333;
  border-radius: 5px;
}
.tippy-tooltip {
  opacity: 0.9 !important;
  padding: 10px 17px;
  font-size: 16px;
}
</style>

<script>
import BackgroundClient from '../BackgroundClient';
import { createWeekDistribution, createDayDistribution, createHeatmap } from './Graphs';
import { integer, float, strftime, pomodoroCount } from '../Filters';
import M from '../Messages';

export default {
  data() {
    return {
      stats: null,
      dayDistributionBucket: null
    };
  },
  async mounted() {
    this.updateStats();
  },
  methods: {
    async exportHistory() {
      let json = JSON.stringify(await BackgroundClient.getRawHistory());
      let link = document.createElement('a');
      link.download = 'history.json';
      link.href = `data:application/octet-stream,${encodeURIComponent(json)}`;
      link.click();
    },
    importHistory() {
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

            if (!confirm(M.confirm_import)) {
              return;
            }

            let result = await BackgroundClient.setRawHistory(history);
            if (result !== true) {
              alert(M.import_failed(`${result}`));
              return;
            }
          } catch (ex) {
            alert(M.import_failed(`${ex}`));
            return;
          }
          this.updateStats();
        };
        reader.readAsText(file);
      };
      input.click();
    },
    async updateStats() {
      let now = new Date();
      let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Start at the first Sunday at least 39 weeks (~9 months) ago.
      start.setDate(start.getDate() - 273);
      start.setDate(start.getDate() - start.getDay());
      this.stats = await BackgroundClient.getHistory(+start);

      this.$nextTick(() => {
        if (this.stats.total === 0) {
          return;
        }

        this.dayDistributionBucket = 30;
        createWeekDistribution(this.$refs.weekDistribution, this.stats.pomodoros);
        createHeatmap(this.stats.daily, start, this.$refs.heatmap);
      });
    }
  },
  watch: {
    dayDistributionBucket(to) {
      if (this.stats.total === 0) {
        return;
      }
      createDayDistribution(this.$refs.dayDistribution, to, this.stats.pomodoros);
    }
  },
  filters: {
    integer,
    float,
    pomodoroCount,
    strftime,
    in_month: M.in_month,
    average_stat: M.average_stat,
    last_9_months: M.last_9_months
  }
};
</script>