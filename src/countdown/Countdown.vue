<template>
  <div>
    <div class="countdown">
      <Timer
        :class="timerClass"
        :state="state"
        :duration="duration"
        :elapsed="elapsed"
        :enabled="hasTime">
      </Timer>
    </div>
    <button @click="showSettings" class="settings" :title="M.settings">
      <Sprite src="/images/settings.svg"></Sprite>
      <span>{{ M.settings }}</span>
    </button>
    <button @click="showHistory" class="history" :title="M.view_history">
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
body, html, button, select, input {
  font-family: 'Source Sans Pro', sans-serif;
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
.settings {
  position: absolute;
  left: 10px;
  bottom: 10px;
  svg {
    margin-right: 10px;
  }
}
.history {
  position: absolute;
  right: 10px;
  bottom: 10px;
  svg {
    margin-left: 10px;
  }
}
@media (min-width: 400px) {
  .settings {
    left: 20px;
    bottom: 20px;
  }
  .history {
    right: 20px;
    bottom: 20px;
  }
}
button {
  flex: 0 0 150px;
  outline: 0 !important;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: #555;
  border: 0;
  text-decoration: none;
  display: flex;
  align-items: center;
  span {
    display: none;
  }
  svg {
    width: 28px;
    height: 28px;
  }
  &:hover {
    color: #a00;
  }
}
@media (min-width: 600px) {
  button span {
    display: inherit;
  }
}
</style>

<script>
import TimerStats from './TimerStats';
import Timer from './Timer';
import Sprite from '../Sprite';
import { TimerState, Phase } from '../background/Timer';
import { OptionsClient, SettingsClient } from '../background/Services';
import { mmss } from '../Filters';
import M from '../Messages';

export default {
  mixins: [TimerStats],
  created() {
    document.title = `${M.countdown_title} - ${M.app_name_short}`;
  },
  methods: {
    showSettings() {
      OptionsClient.once.showPage('settings');
    },
    showHistory() {
      OptionsClient.once.showPage('history');
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
      let phase = M.countdown_title;
      let remaining = '';
      if (this.checkpointStartAt) {
        phase = {
          null: M.countdown_title,
          [Phase.Focus]: M.focus_title,
          [Phase.ShortBreak]: M.short_break_title,
          [Phase.LongBreak]: M.long_break_title
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