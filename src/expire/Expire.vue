<template>
  <div v-if="loaded" class="dialog">
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
    margin: 0 0 10px 0;
    font-weight: normal;
    font-size: 28px;
  }
  p {
    color: #222;
    font-size: 18px;
    margin: 0 0 20px 0;
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
  box-shadow: 0 15px 8px -10px rgba(0, 0, 0, 0.5);
  z-index: 1;
  position: relative;
  &.break, &.short-break, &.long-break {
    background: #2b2;
    color: #fff;
    &:hover {
      background: #2c2;
    }
  }
  &.focus {
    background: #e22;
    color: #fff;
    &:hover {
      background: #f22;
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
  color: #e22 !important;
  text-shadow: 0 2px 2px rgba(200, 0, 0, 0.3);
}
.pomodoros:empty ~ * {
  display: none;
}
</style>

<script>
import M from '../Messages';
import { HistoryClient, PomodoroClient } from '../background/Services';

export default {
  data() {
    return {
      loaded: false,
      title: '',
      action: '',
      message: '',
      phase: '',
      pomodoroCount: 0
    };
  },
  created() {
    document.title = M.expire_title;
    document.body.addEventListener('keypress', this.onKeyPress);
    chrome.runtime.onMessage.addListener(this.onMessage);
  },
  beforeDestroy() {
    document.body.removeEventListener('keypress', this.onKeyPress);
  },
  methods: {
    startSession() {
      PomodoroClient.startSession();
    },
    showHistoryPage() {
      HistoryClient.showHistoryPage();
    },
    onKeyPress(e) {
      // On Enter key press, start next session.
      if (e.keyCode === 13) {
        this.startSession();
      }
    },
    onMessage(request, sender, respond) {
      // TODO: Check message, it should be for expiration information.
      chrome.runtime.onMessage.removeListener(this.onMessage);

      this.title = request.title;
      this.action = request.action;
      this.pomodoroCount = request.pomodoros;
      this.message = request.messages.filter(m => m && m.trim() !== '').join(' – ');
      this.phase = request.phase;
      this.loaded = true;
    }
  }
};
</script>