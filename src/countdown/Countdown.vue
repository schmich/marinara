<template>
  <div>
    <div class="countdown">
      <Timer
        :class="timerClass"
        :state="state"
        :duration="duration"
        :elapsed="elapsed"
        :enabled="hasTime"
        @pause="onPause"
        @resume="onResume"
        @restart="onRestart">
      </Timer>
    </div>
    <button @click="showSettings" class="settings nav" :title="M.settings">
      <Sprite src="/images/settings.svg"></Sprite>
      <span>{{ M.settings }}</span>
    </button>
    <button @click="showHistory" class="history nav" :title="M.view_history">
      <span>{{ M.view_history }}</span>
      <Sprite src="/images/history.svg"></Sprite>
    </button>
  </div>
</template>

<style lang="scss">
@import '../fonts.css';

body {
  margin: 0;
  padding: 0;
}
.countdown {
  display: flex;
  height: 100vh;
  max-width: 100vw;
  justify-content: center;
  align-items: center;
  .timer {
    height: 90%;
    width: 90%;
  }
  .timer svg path.elapsed {
    stroke: #42d;
  }
  .timer.focus svg path.elapsed {
    stroke: #d42;
  }
  .timer.break svg path.elapsed {
    stroke: #5a4;
  }
}
button.nav {
  flex: 0 0 150px;
  outline: 0 !important;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: #555;
  border: 0;
  text-decoration: none;
  position: absolute;
  display: none;
  align-items: center;
  &:hover {
    color: #19fe76;
  }
  span {
    display: none;
  }
  svg {
    width: 28px;
    height: 28px;
  }
  @media (min-width: 250px) {
    display: flex;
  }
  @media (min-width: 600px) {
    span {
      display: inherit;
    }
  }
}
.settings {
  left: 10px;
  bottom: 10px;
  @media (min-width: 400px) {
    left: 20px;
    bottom: 20px;
  }
  svg {
    margin-right: 10px;
  }
}
.history {
  right: 10px;
  bottom: 10px;
  @media (min-width: 400px) {
    right: 20px;
    bottom: 20px;
  }
  svg {
    margin-left: 10px;
  }
}
</style>

<script>
import TimerStats from './TimerStats';
import Timer from './Timer';
import Sprite from '../Sprite';
import { TimerState, Phase } from '../background/Timer';
import { OptionsClient, SettingsClient, PomodoroClient } from '../background/Services';
import { mmss } from '../Filters';
import M from '../Messages';

export default {
  mixins: [TimerStats],
  created() {
    document.title = `${M.countdown} - ${M.app_name_short}`;
    document.addEventListener('keydown', this.onKeyDown);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.onKeyDown);
  },
  methods: {
    showSettings() {
      OptionsClient.once.showPage('settings');
    },
    showHistory() {
      OptionsClient.once.showPage('history');
    },
    onKeyDown(e) {
      if (e.key != ' ') {
        return;
      }

      if (this.state == TimerState.Running) {
        PomodoroClient.once.pause();
      } else if (this.state == TimerState.Paused) {
        PomodoroClient.once.resume();
      }
    },
    onPause() {
      PomodoroClient.once.pause();
    },
    onResume() {
      PomodoroClient.once.resume();
    },
    onRestart() {
      PomodoroClient.once.restart();
    }
  },
  computed: {
    timerClass() {
      return {
        null: '',
        [Phase.Focus]: 'focus',
        [Phase.ShortBreak]: 'break',
        [Phase.LongBreak]: 'break'
      }[this.phase];
    },
    title() {
      let phase = M.countdown;
      let remaining = '';
      if (this.checkpointStartAt) {
        phase = {
          null: M.countdown,
          [Phase.Focus]: M.focus,
          [Phase.ShortBreak]: M.short_break,
          [Phase.LongBreak]: M.long_break
        }[this.phase];

        remaining = `[${mmss(this.remainingSeconds)}] `;
      }

      return `${remaining}${phase} - ${M.app_name_short}`;
    }
  },
  watch: {
    async state(to) {
      if (to != TimerState.Stopped) {
        return;
      }

      let settings = await SettingsClient.once.getSettings();
      let { countdown } = settings[{
        [Phase.Focus]: 'focus',
        [Phase.ShortBreak]: 'shortBreak',
        [Phase.LongBreak]: 'longBreak'
      }[this.phase]];

      if (countdown.autoclose) {
        window.close();
      }
    },
    title(to) {
      document.title = to;
    }
  },
  components: {
    Timer,
    Sprite
  }
};
</script>