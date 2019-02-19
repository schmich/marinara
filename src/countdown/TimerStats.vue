<script>
import { TimerState } from '../background/Timer';
import { PomodoroClient } from '../background/Services';
import { clamp } from '../Filters';

export default {
  data() {
    return {
      elapsed: null,
      state: null,
      phase: null,
      duration: null,
      checkpointElapsed: null,
      checkpointStartAt: null,
      timeInterval: null,
      pomodoroClient: new PomodoroClient()
    };
  },
  async mounted() {
    const update = ({ state, phase, duration, checkpointElapsed, checkpointStartAt }) => {
      this.state = state;
      this.phase = phase;
      this.duration = duration;
      this.checkpointElapsed = checkpointElapsed;
      this.checkpointStartAt = checkpointStartAt;
    };

    this.pomodoroClient.on('start', update);
    this.pomodoroClient.on('resume', update);
    this.pomodoroClient.on('stop', update);
    this.pomodoroClient.on('pause', update);
    this.pomodoroClient.on('expire', update);

    let status = await this.pomodoroClient.getStatus();
    update(status);
    this.updateElapsed();
  },
  beforeDestroy() {
    clearInterval(this.timeInterval);
    this.pomodoroClient.dispose();
  },
  computed: {
    remaining() {
      return this.duration - this.elapsed;
    },
    remainingSeconds() {
      return Math.ceil(this.remaining);
    },
    elapsedSeconds() {
      return Math.ceil(this.elapsed);
    },
    hasTime() {
      return this.duration != null &&
             this.checkpointStartAt != null &&
             this.checkpointElapsed != null;
    }
  },
  watch: {
    checkpointStartAt() {
      this.updateElapsed();
    },
    checkpointElapsed() {
      this.updateElapsed();
    },
    duration() {
      this.updateElapsed();
    },
    state(to) {
      clearInterval(this.timeInterval);

      // Set time update interval based on angular velocity (500px radius circle)
      // to ensure smooth animation. Clamp interval between 20-1000ms.
      let interval = clamp(1000 / (500 * (2 * Math.PI / this.duration)), 20, 1000);

      if (to == TimerState.Running) {
        this.timeInterval = setInterval(() => this.updateElapsed(), interval);
      } else {
        this.updateElapsed();
      }
    }
  },
  methods: {
    updateElapsed() {
      if (!this.hasTime) {
        this.elapsed = 0;
        return;
      }

      let totalElapsed = this.checkpointElapsed;
      if (this.checkpointStartAt && this.state == TimerState.Running) {
        totalElapsed += (Date.now() - this.checkpointStartAt) / 1000;
      }

      this.elapsed = Math.min(this.duration, totalElapsed);

      let remaining = Math.ceil(this.duration - this.elapsed);
      if (remaining == 0) {
        clearInterval(this.timeInterval);
      }
    }
  }
};
</script>