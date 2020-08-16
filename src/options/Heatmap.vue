<template>
  <div class="heatmap"></div>
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
</style>

<script>
import * as d3 from 'd3';
import { formatter, shortDays } from '../LocaleFormat';
import { pomodoroCount } from '../Filters';
import M from '../Messages';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

function createHeatmap(data, start, el) {
  // Inspired by https://github.com/vinnyoodles/reddit-heatmap/blob/master/js/index.js.
  let max = Math.max(...Object.values(data));

  const cellSize = 14;
  const colorCount = 4;
  const cellClass = 'day';

  const width = 700;
  const height = 110;
  const dx = 40;

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
      // Avoid label overlaps.
      if (i === 1) {
        months.shift();
      }

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
        .text(d => formatter('%b')(d[1]));

  let heatmap = d3.select(el).selectAll('svg.heatmap')
    .enter()
    .append('svg')
    .data([1])
    .enter()
    .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'color days')
    .append('g')
    .attr('transform', `translate(${dx},0)`);

  // Add day-of-week labels (left side).
  heatmap.selectAll('text.dow')
    .data([1, 3, 5].map(d => shortDays[d]))
    .enter()
    .append('text')
      .attr('transform', (d, i) => `translate(-7,${cellSize * 2 * (i + 1)})`)
      .style('text-anchor', 'end')
      .attr('class', 'label')
      .text(d => d);

  let dayRange = d3.timeDays(start, end);

  // Add day-of-week labels (right side).
  let numColumns = Math.ceil(dayRange.length / 7);
  heatmap.selectAll('text.dow')
    .data([1, 3, 5].map(d => shortDays[d]))
    .enter()
    .append('text')
      .attr('transform', (d, i) => `translate(${numColumns * cellSize + 7},${cellSize * 2 * (i + 1)})`)
      .style('text-anchor', 'start')
      .attr('class', 'label')
      .text(d => d);

  heatmap.selectAll('.day')
    // Heatmap of all days in the range.
    .data(dayRange)
    .enter()
    .append('rect')
      .attr('class', cellClass)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('x', (d, i) => Math.floor(i / 7) * cellSize)
      .attr('y', (d, i) => (i % 7) * cellSize)
      .attr('rx', 3)
      .attr('ry', 3)
      .datum(d => +d)
      // Tooltip title.
      .attr('data-tippy-content', d => {
        let count = data[d] || 0;
        let date = formatter(M.heatmap_date_format)(new Date(d));
        return M.heatmap_tooltip(`<strong>${pomodoroCount(count)}</strong>`, `${date}`);
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
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('class', d => `day color${d - 1}`);

  let tooltips = tippy(el.querySelectorAll('.days .day'), {
    arrow: true,
    duration: 0,
    animation: null
  });

  return function cleanup() {
    tooltips.destroyAll();
  };
}

export default {
  props: ['pomodoros', 'start'],
  data() {
    return {
      cleanup: null
    };
  },
  mounted() {
    this.updateHeatmap();
  },
  methods: {
    updateHeatmap() {
      if (this.cleanup) {
        this.cleanup();
      }
      this.cleanup = createHeatmap(this.pomodoros || {}, this.start, this.$el);
    }
  },
  watch: {
    pomodoros(to) {
      this.updateHeatmap();
    },
    start(to) {
      this.updateHeatmap();
    }
  }
};
</script>
