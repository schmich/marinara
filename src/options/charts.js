function pomodoroCount(count) {
  if (count === 0) {
    return 'No Pomodoros';
  } else if (count === 1) {
    return '1 Pomodoro';
  } else {
    return `${count.toLocaleString()} Pomodoros`;
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

  let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let long = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

  let x = d3.scaleBand().domain(d3.range(0, 7)).rangeRound([0, width - pad]).padding(0.5);
  let y = d3.scaleLinear().domain([0, max]).range([height - 30, 0]);

  let xAxis = d3.axisBottom(x)
    .tickSize(5)
    .tickFormat(t => days[t]);

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
        return `<strong>${pomodoroCount(buckets[d])}</strong> on ${long[d]}`;
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

  let hourFormat = h => {
    return [h % 12 || 12, (h % 24) < 12 ? 'a' : 'p'];
  };
 
  let xScale = d3.scaleLinear().domain([0, bucketCount]).range([0, width]);
  let yScale = d3.scaleLinear().domain([0, max]).range([height - 30, 0]);

  let xAxis = d3.axisBottom(xScale)
    .tickSize(5)
    .tickFormat(t => {
      let [hr, ap] = hourFormat(t / bucketsPerHour);
      return `${hr}${ap}`;
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
    let [hr, ap] = hourFormat(hour);
    return `${hr}:${min || '00'}${ap}`;
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
        return `<strong>${pomodoroCount(buckets[d])}</strong> between ${start}&ndash;${end}`;
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
  heatmap.selectAll('text.dow')
    .data(['Mon', 'Wed', 'Fri'])
    .enter()
    .append('text')
      .attr('transform', (d, i) => `translate(-10,${cellSize * 2 * (i + 1)})`)
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
        let date = d3.timeFormat('%b %d, %Y')(new Date(d));
        return `<strong>${pomodoroCount(count)}</strong> on ${date}`;
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
