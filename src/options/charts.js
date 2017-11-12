function pomodoroCount(count) {
  if (count === 0) {
    return T('pomodoro_count_zero');
  } else if (count === 1) {
    return T('pomodoro_count_one');
  } else {
    return T('pomodoro_count_many', count.toLocaleString());
  }
}

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
    .tickFormat(t => Locale.shortDays[t]);

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
      .attr('title', d => {
        return T('weekly_tooltip', `<strong>${pomodoroCount(buckets[d])}</strong>`, Locale.days[d]);
      })
      .attr('x', d => x(d))
      .attr('y', d => y(buckets[d]))
      .attr('width', x.bandwidth())
      .attr('height', d => (height - 30) - y(buckets[d]));

  tippy(`${el} rect`, {
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
      return Locale.format(T('hour_format'))(date);
    } else {
      return Locale.format(T('hour_minute_format'))(date);
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
      .attr('title', d => {
        let start = timeLabel(d);
        let end = timeLabel(d + 1);
        return T('daily_tooltip', `<strong>${pomodoroCount(buckets[d])}</strong>`, start, end);
      })
      .attr('x', d => d * (width / bucketCount))
      .attr('y', d => yScale(buckets[d]))
      .style('width', barWidth)
      .style('height', d => (height - 30) - yScale(buckets[d]));

  tippy(`${el} rect`, {
    arrow: true,
    duration: 0,
    animation: null
  });
}

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
        .text(d => Locale.format('%b')(d[1]));

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
  heatmap.selectAll('text.dow')
    .data([1, 3, 5].map(d => Locale.shortDays[d]))
    .enter()
    .append('text')
      .attr('transform', (d, i) => `translate(-5,${cellSize * 2 * (i + 1)})`)
      .style('text-anchor', 'end')
      .attr('class', 'label')
      .text(d => d);

  let dayRange = d3.timeDays(start, end);
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
      .datum(d => +d)
      // Tooltip title.
      .attr('title', d => {
        let count = data[d] || 0;
        let date = Locale.format(T('heatmap_date_format'))(new Date(d));
        return T('heatmap_tooltip', `<strong>${pomodoroCount(count)}</strong>`, `${date}`);
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
