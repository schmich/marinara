import * as d3 from 'd3';
import { formatter, shortDays, days } from '../LocaleFormat';
import M from '../Messages';
import { pomodoroCount } from '../Filters';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

function createWeekDistribution(el, data) {
  let buckets = {};
  for (let date of data) {
    let day = new Date(date).getDay();
    buckets[day] = buckets[day] || 0;
    buckets[day]++;
  }

  let max = Math.max(...Object.values(buckets));

  const width = 600;
  const height = 150;
  const pad = 30;

  // Clear chart.
  d3.select(el).html(null);

  let svg = d3.select(el)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'distribution');

  let x = d3.scaleBand().domain(d3.range(0, 7)).rangeRound([0, width - pad]).padding(0.5);
  let y = d3.scaleLinear().domain([0, max]).range([height - 30, 0]);

  let xAxis = d3.axisBottom(x)
    .tickSize(5)
    .tickFormat(t => shortDays[t]);

  let step = Math.max(max / 4, 1);
  let yAxis = d3.axisLeft(y)
    .tickSize(3)
    .tickValues(d3.range(0, max + step, step))
    .tickFormat(t => Math.floor(t));

  svg.append('g')
    .attr('transform', `translate(${pad},${height - 20})`)
    .call(xAxis);

  svg.append('g')
    .attr('transform', `translate(${pad},10)`)
    .call(yAxis);

  svg.append('g')
    .attr('transform', `translate(${pad},10)`)
    .selectAll('rect')
    .data(Object.keys(buckets))
    .enter()
    .append('rect')
      .datum(d => +d)
      .attr('data-tippy-content', d => {
        return M.weekly_tooltip(`<strong>${pomodoroCount(buckets[d])}</strong>`, days[d]);
      })
      .attr('x', d => x(d))
      .attr('y', d => y(buckets[d]))
      .attr('width', x.bandwidth())
      .attr('height', d => (height - 30) - y(buckets[d]));

  tippy(el.querySelectorAll('rect'), {
    arrow: true,
    duration: 0,
    animation: null
  });
}

function createDayDistribution(el, bucketSize, data) {
  let buckets = {};
  let offset = (new Date).getTimezoneOffset();
  for (let date of data) {
    // Adjust for timezone.
    date -= (offset * 60 * 1000);

    // Day-relative milliseconds.
    let dayRelative = date % (24 * 60 * 60 * 1000);

    // 15-minute bucket of the day.
    let bucket = Math.floor(dayRelative / (bucketSize * 60 * 1000));

    buckets[bucket] = buckets[bucket] || 0;
    buckets[bucket]++;
  }

  let max = Math.max(...Object.values(buckets));

  // Clear chart.
  d3.select(el).html(null);

  const bucketsPerHour = 60 / bucketSize;
  const bucketCount = 24 * bucketsPerHour;
  const barWidth = 480 / bucketCount + Math.floor(84 / bucketCount)
  const height = 150;
  const width = bucketCount * (barWidth + 1); // Bar width + padding.
  const lpad = 25;

  let svg = d3.select(el)
    .append('svg')
    .attr('width', 610)
    .attr('height', height)
    .attr('class', 'distribution');

  let timeFormat = (h, m) => {
    const date = new Date(0, 0, 0, h, m || 0);
    if (m === undefined) {
      return formatter(M.hour_format)(date);
    } else {
      return formatter(M.hour_minute_format)(date);
    }
  };

  let xScale = d3.scaleLinear().domain([0, bucketCount]).range([0, width]);
  let yScale = d3.scaleLinear().domain([0, max]).range([height - 30, 0]);

  let xAxis = d3.axisBottom(xScale)
    .tickSize(5)
    .tickFormat(t => {
      return timeFormat(t / bucketsPerHour);
    })
    .tickValues(d3.range(0, bucketCount + 1, bucketsPerHour));

  let step = Math.max(max / 4, 1);
  let yAxis = d3.axisLeft(yScale)
    .tickSize(3)
    .tickValues(d3.range(0, max + step, step))
    .tickFormat(t => Math.floor(t));

  svg.append('g')
    .attr('transform', `translate(${lpad},${height - 20})`)
    .call(xAxis);

  svg.append('g')
    .attr('transform', `translate(${lpad},10)`)
    .call(yAxis);

  let timeLabel = bucket => {
    let hour = Math.floor(bucket / bucketsPerHour);
    let min = (bucket % bucketsPerHour) * bucketSize;
    return timeFormat(hour, min);
  };

  svg.append('g')
    .attr('transform', `translate(${lpad},10)`)
    .selectAll('rect')
    .data(Object.keys(buckets))
    .enter()
    .append('rect')
      .datum(d => +d)
      .attr('data-tippy-content', d => {
        let start = timeLabel(d);
        let end = timeLabel(d + 1);
        return M.daily_tooltip(`<strong>${pomodoroCount(buckets[d])}</strong>`, start, end);
      })
      .attr('x', d => d * (width / bucketCount))
      .attr('y', d => yScale(buckets[d]))
      .style('width', barWidth)
      .style('height', d => (height - 30) - yScale(buckets[d]));

  tippy(el.querySelectorAll('rect'), {
    arrow: true,
    duration: 0,
    animation: null
  });
}

export {
  createWeekDistribution,
  createDayDistribution
};