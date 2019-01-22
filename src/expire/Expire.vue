<template>
  <div class="dialog">
    <h1>{{ title }}</h1>
    <div><p>{{ message }}</p></div>
    <button @click.prevent="startSession" class="button start-session" :class="phase">
      {{ action }}
    </button>
    <div class="pomodoros-today">
      <p class="pomodoros">
        <i v-for="_ of new Array(pomodoroCount)" class="icon-circle"></i>
      </p>
      <p>{{ M.completed_today }}</p>
      <button @click.prevent="showHistoryPage" class="view-history">{{ M.view_history }}</button>
    </div>
  </div>
</template>

<style lang="scss">
@import '../fontello.css';
@import '../fonts.css';

body, html, button {
  font-family: 'Source Sans Pro', sans-serif;
}
body, html {
  height: 100%;
  padding: 0;
  margin: 0;
}
body {
  background: #fff;
}
.dialog {
  position: relative;
  padding: 50px 0px;
  background: #fff;
  top: 15%;
  text-align: center;
  h1 {
    margin: 0 auto 15px auto;
    padding-bottom: 15px;
    border-bottom: 1px solid #ddd;
    font-weight: normal;
    font-size: 32px;
    width: 500px;
  }
  p {
    color: #222;
    font-size: 18px;
    margin: 0 0 30px 0;
  }
  .pomodoros-today p {
    margin-bottom: 15px;
  }
}
.button {
  margin: 0;
  font-size: 20px;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: rgba(0,0,0,0);
  -webkit-touch-callout: none;
  outline: none;
  display: inline-block;
  background-color: #fff;
  color: #646464;
  cursor: pointer;
  border: 0;
  border-radius: 50px;
  padding: 15px 45px;
  text-align: center;
  text-decoration: none !important;
  background: rgba(0,174,255,1);
  background: -webkit-gradient(left top, left bottom, color-stop(0%, rgba(0,174,255,1)), color-stop(92%, rgba(0,174,255,1)), color-stop(100%, rgba(0,144,234,1)));
  background: -webkit-linear-gradient(top, rgba(0,174,255,1) 0%, rgba(0,174,255,1) 92%, rgba(0,144,234,1) 100%);
  color: #fff;
  transition: box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.1s linear;
  z-index: 1;
  position: relative;
  &.break, &.short-break, &.long-break {
    background: #0a0;
    box-shadow: 0 15px 8px -10px #00aa0055;
    color: #fff;
    &:hover {
      background: #0b0;
    }
  }
  &.focus {
    background: #d00;
    box-shadow: 0 15px 8px -10px #bb000055;
    color: #fff;
    &:hover {
      background: #e00;
    }
  }
  &:active {
    box-shadow: none;
    transition-delay: 0s;
  }
  &::not(.focus):not(.break):not(.short-break):not(.long-break) {
    display: none;
  }
}
.start-session {
  margin-top: 10px;
}
.pomodoros-today {
  margin-top: 110px;
  line-height: 100%;
}
.view-history {
  cursor: pointer;
  font-size: 15px;
  background: #fff;
  color: #555;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 8px 25px;
  margin: 5px 0 0 0;
  outline: 0 !important;
  border-radius: 35px;
  &:hover {
    color: #a00;
    border: 1px solid #a00;
    text-decoration: none;
  }
}
.pomodoros i {
  font-size: 35px;
  margin-top: 7px;
  color: #d00 !important;
  text-shadow: 0 2px 2px rgba(200, 0, 0, 0.3);
}
.pomodoros:empty ~ * {
  display: none;
}
</style>

<script>
import M from '../Messages';
import { HistoryClient, PomodoroClient, OptionsClient } from '../background/Services';
import { ExpirationClient } from '../background/Expiration';

export default {
  data() {
    return {
      historyClient: new HistoryClient(),
      pomodoroClient: new PomodoroClient(),
      optionsClient: new OptionsClient(),
      expirationClient: new ExpirationClient(),
      title: '',
      action: '',
      message: '',
      phase: '',
      pomodoroCount: 0
    };
  },
  async created() {
    document.title = M.expire_title;
    document.body.addEventListener('keypress', this.onKeyPress);

    let { title, action, pomodoros, messages, phase } = await this.expirationClient.getProperties();
    this.title = title;
    this.action = action;
    this.pomodoroCount = pomodoros;
    this.message = messages.filter(m => m && m.trim()).join(' – ');
    this.phase = phase;
  },
  beforeDestroy() {
    this.historyClient.dispose();
    this.pomodoroClient.dispose();
    this.optionsClient.dispose();
    document.body.removeEventListener('keypress', this.onKeyPress);
    chrome.runtime.onMessage.removeListener(this.onMessage);
  },
  methods: {
    startSession() {
      this.pomodoroClient.startSession();
    },
    showHistoryPage() {
      this.optionsClient.showHistoryPage();
    },
    onKeyPress(e) {
      // On Enter key press, start next session.
      if (e.keyCode === 13) {
        this.startSession();
      }
    }
  }
};
</script>