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
    <button @click="showSettings" class="settings">
      <Sprite src="/images/settings.svg"></Sprite>
      {{ M.settings }}
    </button>
    <button @click="showHistory" class="history">
      {{ M.view_history }}
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
  left: 20px;
  bottom: 20px;
  svg {
    margin-right: 10px;
  }
}
.history {
  position: absolute;
  right: 20px;
  bottom: 20px;
  svg {
    margin-left: 10px;
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
  svg {
    width: 28px;
    height: 28px;
  }
  &:hover {
    color: #a00;
  }
}
</style>

<script>
import TimerStats from './TimerStats';
import Timer from './Timer';
import Sprite from '../Sprite';
import { Phase } from '../background/Timer';
import { OptionsClient } from '../background/Services';
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