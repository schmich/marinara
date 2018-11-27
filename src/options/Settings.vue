<template>
  <form v-if="settings">
    <div class="section">
      <h2>{{ M.focus_title }}</h2>
      <p class="field">
        <label>
          <span>{{ M.duration }}</span>
          <input
            type="number"
            min="1"
            max="999"
            class="duration"
            v-model.number="settings.focus.duration"
            v-focus>
          <span>{{ M.minutes }}</span>
        </label>
      </p>
      <p>{{ M.timer_sound_label }}</p>
      <div class="group">
        <p class="field">
          <select v-model="focusTimerSounds">
            <option :value="null">{{ M.none }}</option>
            <option v-for="sound in timerSounds" :value="sound.files">{{ sound.name }}</option>
          </select>
          <transition name="fade">
            <span v-if="canPlayMetronome" @mouseover="playMetronome" @mouseout="stopMetronome" class="preview">
              <i class="icon-play"></i>
              <span>{{ M.hover_preview }}</span>
              <img src="/images/spinner.svg" :class="{ active: !!metronome }">
            </span>
          </transition>
        </p>
        <p class="field">
          <label>
            <span>{{ M.speed_label }}</span>
            <input
              type="number"
              class="duration"
              min="1"
              max="1000"
              :disabled="focusTimerBpm == null"
              v-model.number="focusTimerBpm">
            <span>{{ M.bpm }}</span>
          </label>
        </p>
      </div>
      <p>{{ M.when_complete }}</p>
      <div class="group">
        <p class="field">
          <label>
            <input type="checkbox" v-model="settings.focus.notifications.desktop">
            <span>{{ M.show_desktop_notification }}</span>
          </label>
        </p>
        <p class="field">
          <label>
            <input type="checkbox" v-model="settings.focus.notifications.tab">
            <span>{{ M.show_new_tab_notification }}</span>
          </label>
        </p>
        <p class="field">
          <label>
            <span>{{ M.play_audio_notification }}</span>
            <SoundSelect v-model="settings.focus.notifications.sound" :sounds="notificationSounds"></SoundSelect>
          </label>
        </p>
      </div>
    </div>
    <div class="section">
      <h2>{{ M.short_break_title }}</h2>
      <p class="field">
        <label>
          <span>{{ M.duration }}</span>
          <input
            type="number"
            min="1"
            max="999"
            class="duration"
            v-model.number="settings.shortBreak.duration">
          <span>{{ M.minutes }}</span>
        </label>
      </p>
      <p>{{ M.when_complete }}</p>
      <div class="group">
        <p class="field">
          <label>
            <input type="checkbox" v-model="settings.shortBreak.notifications.desktop">
            <span>{{ M.show_desktop_notification }}</span>
          </label>
        </p>
        <p class="field">
          <label>
            <input type="checkbox" v-model="settings.shortBreak.notifications.tab">
            <span>{{ M.show_new_tab_notification }}</span>
          </label>
        </p>
        <p class="field">
          <label>
            <span>{{ M.play_audio_notification }}</span>
            <SoundSelect v-model="settings.shortBreak.notifications.sound" :sounds="notificationSounds"></SoundSelect>
          </label>
        </p>
      </div>
    </div>
    <div class="section">
      <h2>{{ M.long_break_title }}</h2>
      <p class="field">
        <label>
          <span>{{ M.take_a_long_break_setting }}</span>
          <select v-model.number="settings.longBreak.interval">
            <option :value="0">{{ M.never }}</option>
            <option :value="2">{{ M.every_2nd_break }}</option>
            <option :value="3">{{ M.every_3rd_break }}</option>
            <option :value="4">{{ M.every_4th_break }}</option>
            <option :value="5">{{ M.every_5th_break }}</option>
            <option :value="6">{{ M.every_6th_break }}</option>
            <option :value="7">{{ M.every_7th_break }}</option>
            <option :value="8">{{ M.every_8th_break }}</option>
            <option :value="9">{{ M.every_9th_break }}</option>
            <option :value="10">{{ M.every_10th_break }}</option>
          </select>
        </label>
      </p>
      <fieldset :disabled="settings.longBreak.interval == 0">
        <p class="field">
          <label>
            <span>{{ M.duration }}</span>
            <input
              type="number"
              min="1"
              max="999"
              class="duration"
              v-model.number="settings.longBreak.duration">
            <span>{{ M.minutes }}</span>
          </label>
        </p>
        <p>{{ M.when_complete }}</p>
        <div class="group">
          <p class="field">
            <label>
              <input type="checkbox" v-model="settings.longBreak.notifications.desktop">
              <span>{{ M.show_desktop_notification }}</span>
            </label>
          </p>
          <p class="field">
            <label>
              <input type="checkbox" v-model="settings.longBreak.notifications.tab">
              <span>{{ M.show_new_tab_notification }}</span>
            </label>
          </p>
          <p class="field">
            <label>
              <span>{{ M.play_audio_notification }}</span>
              <SoundSelect v-model="settings.longBreak.notifications.sound" :sounds="notificationSounds"></SoundSelect>
            </label>
          </p>
        </div>
      </fieldset>
    </div>
    <div class="section autostart">
      <h2>{{ M.autostart_title }}</h2>
      <p>{{ M.autostart_description }}</p>
      <p class="field">
        <label>
          <span>{{ M.time }}</span>
          <input type="time" v-model="settings.autostart.time" class="time" id="autostart-time">
        </label>
      </p>
    </div>
    <transition name="slide-up">
      <div v-if="areSettingsDirty" class="save">
        <button @click.prevent="saveSettings">{{ M.save_changes }}</button>
        <p>{{ M.save_changes_notice }}</p>
      </div>
    </transition>
  </form>
</template>

<style lang="scss">
@import '../fontello.css';

.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}
.slide-up-enter, .slide-up-leave-to {
  transform: translateY(300%);
}
.section.autostart {
  display: none;
}
.save {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 40px 65px;
  background: #fff;
  border: 1px solid #f3f3f3;
  border-top: 3px solid #c00;
  box-shadow: 0px 12px 31px -9px rgba(0,0,0,0.75);
  text-align: center;
  button {
    outline: 0;
    cursor: pointer;
    font-size: 20px;
    border: 0;
    border-radius: 40px;
    padding: 13px 35px;
    background: #c00;
    color: #fff;
    transition: background-color 0.2s ease;
    &:hover {
      background: #e00;
    }
  }
  p {
    margin-bottom: 0;
  }
}
.preview {
  margin-left: 10px;
  cursor: default;
  color: #a00;
}
.preview img {
  vertical-align: middle;
  margin-left: 10px;
  height: 8px;
  opacity: 1;
  transition: opacity 0.5s;
}
.preview img:not(.active) {
  opacity: 0;
}
</style>

<script>
import { SettingsClient, SoundsClient } from '../background/Services';
import Metronome from '../Metronome';
import Mutex from '../Mutex';
import SoundSelect from './SoundSelect';
import M from '../Messages';

function deepEqual(x, y) {
  const ok = Object.keys, tx = typeof x, ty = typeof y;
  return x && y && tx === 'object' && tx === ty ? (
    ok(x).length === ok(y).length &&
      ok(x).every(key => deepEqual(x[key], y[key]))
  ) : (x === y);
}

export default {
  data() {
    return {
      settings: null,
      originalSettings: null,
      areSettingsDirty: false,
      notificationSounds: null,
      timerSounds: null,
      metronome: null,
      metronomeMutex: new Mutex()
    };
  },
  async mounted() {
    [this.settings, this.notificationSounds, this.timerSounds] = await Promise.all([
      SettingsClient.getSettings(),
      SoundsClient.getNotificationSounds(),
      SoundsClient.getTimerSounds()
    ]);

    // Clone settings.
    this.originalSettings = JSON.parse(JSON.stringify(this.settings));
  },
  methods: {
    async saveSettings() {
      try {
        await SettingsClient.setSettings(this.settings);
      } catch (e) {
        alert(M.error_saving_settings(e));
      }

      // Clone settings.
      this.originalSettings = JSON.parse(JSON.stringify(this.settings));
      this.areSettingsDirty = false;
    },
    async playMetronome() {
      let { files, bpm } = this.settings.focus.timerSound;
      this.metronomeMutex.exclusive(async () => {
        this.metronome = await Metronome.create(files, (60 / bpm) * 1000);
        await this.metronome.start();
      });
    },
    stopMetronome() {
      this.metronomeMutex.exclusive(async () => {
        await this.metronome.close();
        this.metronome = null;
      });
    }
  },
  computed: {
    focusTimerSounds: {
      get() {
        return this.settings.focus.timerSound
            && this.settings.focus.timerSound.files;
      },
      set(files) {
        if (!files) {
          this.settings.focus.timerSound = null;
        } else if (!this.settings.focus.timerSound) {
          this.settings.focus.timerSound = {
            files: files,
            bpm: 60
          };
        } else {
          this.settings.focus.timerSound.files = files;
        }
      }
    },
    focusTimerBpm: {
      get() {
        return this.settings.focus.timerSound
            && this.settings.focus.timerSound.bpm;
      },
      set(bpm) {
        if (!this.settings.focus.timerSound) {
          return;
        }

        this.settings.focus.timerSound.bpm = bpm;
      }
    },
    canPlayMetronome() {
      return this.focusTimerSounds
          && this.focusTimerBpm > 0
          && this.focusTimerBpm <= 1000;
    }
  },
  watch: {
    settings: {
      handler(to, from) {
        this.areSettingsDirty = !deepEqual(to, this.originalSettings);
      },
      deep: true
    }
  },
  components: {
    SoundSelect
  },
  directives: {
    focus: {
      inserted(el) {
        let input = el.querySelector('input');
        (input || el).focus();
      }
    }
  }
};
</script>