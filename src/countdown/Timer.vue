<template>
  <div ref="timer" class="timer">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110">
      <path class="duration" :d="arc(2 * Math.PI)"/>
      <path v-if="enabled" class="elapsed" :d="arc(2 * Math.PI * (elapsed / duration))"/>
    </svg>
    <div class="time" :class="{ enabled: enabled, paused: isPaused }" :style="timeStyle">{{ time }}</div>
  </div>
</template>

<style lang="scss">
@keyframes blink  {
  0% {
    opacity: 1;
  }
  49% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
}
.timer {
  height: 100%;
  width: 100%;
  position: relative;
  svg {
    width: 100%;
    height: 100%;
    path.duration {
      stroke: #ddd;
      stroke-width: 3px;
      fill: none;
    }
    path.elapsed {
      stroke-width: 3px;
      stroke-linecap: round;
      fill: none;
    }
  }
  .time {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 600;
    color: #ccc;
    &.enabled {
      color: #333;
    }
    &.paused {
      animation: blink 1s linear infinite;
    }
  }
}
</style>

<script>
import { TimerState } from '../background/Timer';
import { mmss } from '../Filters';

function fromRad(cx, cy, r, rad) {
  let x = cx + r * Math.cos(rad);
  let y = cy + r * Math.sin(rad);
  return [x, y];
}

function arc(rad) {
  rad = Math.max(2 * Math.PI - rad, 0.01);
  let [x, y] = fromRad(55, 55, 50, rad - Math.PI / 2);
  let largeArc = rad > Math.PI ? 0 : 1;
  let path = `M 55 5 A 50 50 0 ${largeArc} 0 ${x} ${y}`;
  if (rad <= 0.01) {
    // Draw closed path.
    path += ' Z';
  }
  return path;
}

export default {
  props: ['state', 'enabled', 'elapsed', 'duration'],
  data() {
    return {
      timeStyle: {}
    };
  },
  mounted() {
    (new ResizeObserver(elements => {
      let { width, height } = elements[0].contentRect;
      let size = Math.floor(Math.min(width, height) * 0.25);
      let offset = Math.ceil(size * 0.16);
      this.timeStyle = {
        marginTop: `-${offset}px`,
        fontSize: `${size}px`
      };
    })).observe(this.$refs.timer);
  },
  computed: {
    time() {
      if (!this.enabled) {
        return '––:––';
      }

      let remaining = Math.max(0, Math.ceil(this.duration - this.elapsed));
      return mmss(remaining);
    },
    isPaused() {
      return this.state == TimerState.Paused;
    }
  },
  methods: {
    arc
  }
};
</script>