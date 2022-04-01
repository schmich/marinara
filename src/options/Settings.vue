<template>
  <form v-if="settings">
    <div class="section">
      <h2>{{ M.focus }}</h2>
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
          <select v-model="focusTimerSound">
            <option :value="null">{{ M.none }}</option>
            <optgroup :label="M.periodic_beat">
              <option v-for="sound in timerSounds" :value="sound.files">{{ sound.name }}</option>
            </optgroup>
            <optgroup :label="M.noise">
              <option :value="'brown-noise'">{{ M.brown_noise }}</option>
              <option :value="'pink-noise'">{{ M.pink_noise }}</option>
              <option :value="'white-noise'">{{ M.white_noise }}</option>
            </optgroup>
          </select>
          <transition name="fade">
            <span v-if="canPlayTimerSound" @mouseover="playTimerSound" @mouseout="stopTimerSound" class="preview">
              <i class="icon-play"></i>
              <span>{{ M.hover_preview }}</span>
              <img src="/images/spinner.svg" :class="{ active: !!timerSound }">
            </span>
          </transition>
        </p>
        <p class="field" v-if="focusTimerBpm != null">
          <label>
            <span>{{ M.speed_label }}</span>
            <input
              type="number"
              class="duration"
              min="1"
              max="1000"
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
      <h2>{{ M.short_break }}</h2>
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
      <h2>{{ M.long_break }}</h2>
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
      <div v-if="showSettingsSaved" @click="dismissSettingsSaved" class="save">
        <p>
          <img src="/images/check.svg"> {{ M.settings_saved }}
        </p>
      </div>
    </transition>
  </form>
</template>

<style lang="scss">
@import '../fontello.css';

input[type="number"] {
  padding: 0;
}
.slide-up-enter-active {
  transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.55, 0.055, 0.675, 0.19);
}
.slide-up-enter, .slide-up-leave-to {
  transform: translateY(300%);
}
.section.autostart {
  display: none;
}
.save {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  padding: 0;
  p {
    margin: 40px;
    padding: 10px 20px;
    display: inline-flex;
    align-items: center;
    color: #080;
    background: #fff;
    border: 1px solid #080;
    border-radius: 40px;
    font-size: 18px;
    img {
      width: 32px;
      height: 32px;
      margin-right: 10px;
    }
  }
}
.preview {
  margin-left: 10px;
  cursor: default;
  color: #31ae64;
  img {
    vertical-align: middle;
    margin-left: 10px;
    height: 8px;
    opacity: 1;
    transition: opacity 0.5s;
    &:not(.active) {
      opacity: 0;
    }
  }
}
</style>

<script>
import { SettingsClient, SoundsClient } from '../background/Services';
import Mutex from '../Mutex';
import SoundSelect from './SoundSelect';
import CountdownSettings from './CountdownSettings';
import M from '../Messages';
import createTimerSound from '../TimerSound';
import { focus } from '../Directives';

export default {
  data() {
    return {
      settingsClient: new SettingsClient(),
      soundsClient: new SoundsClient(),
      settings: null,
      showSettingsSaved: false,
      showSettingsSavedTimeout: null,
      notificationSounds: null,
      timerSounds: null,
      timerSound: null,
      timerSoundMutex: new Mutex()
    };
  },
  async mounted() {
    [this.settings, this.notificationSounds, this.timerSounds] = await Promise.all([
      this.settingsClient.getSettings(),
      this.soundsClient.getNotificationSounds(),
      this.soundsClient.getTimerSounds()
    ]);
  },
  beforeDestroy() {
    this.settingsClient.dispose();
    this.soundsClient.dispose();
  },
  methods: {
    async saveSettings() {
      try {
        await this.settingsClient.setSettings(this.settings);
      } catch (e) {
        // Ignore errors when saving settings.
        return;
      }

      clearTimeout(this.showSettingsSavedTimeout);
      this.showSettingsSavedTimeout = setTimeout(() => {
        this.showSettingsSaved = false;
      }, 5000);

      this.showSettingsSaved = true;
    },
    async playTimerSound() {
      this.timerSoundMutex.exclusive(async () => {
        this.timerSound = await createTimerSound(this.settings.focus.timerSound);
        await this.timerSound.start();
      });
    },
    stopTimerSound() {
      this.timerSoundMutex.exclusive(async () => {
        await this.timerSound.close();
        this.timerSound = null;
      });
    },
    dismissSettingsSaved() {
      this.showSettingsSaved = false;
      clearTimeout(this.showSettingsSavedTimeout);
    }
  },
  computed: {
    focusTimerSound: {
      get() {
        let sound = this.settings.focus.timerSound;
        return sound && (sound.procedural || sound.metronome.files);
      },
      set(value) {
        let focus = this.settings.focus;
        if (!value) {
          focus.timerSound = null;
        } else if (!Array.isArray(value)) {
          focus.timerSound = {
            procedural: value
          };
        } else if (focus.timerSound && focus.timerSound.metronome) {
          focus.timerSound.metronome.files = value;
        } else {
          focus.timerSound = {
            metronome: {
              files: value,
              bpm: 60
            }
          };
        }
      }
    },
    focusTimerBpm: {
      get() {
        let sound = this.settings.focus.timerSound;
        return sound
            && sound.metronome
            && sound.metronome.bpm;
      },
      set(bpm) {
        let sound = this.settings.focus.timerSound;
        if (!sound || !sound.metronome) {
          return;
        }

        sound.metronome.bpm = bpm;
      }
    },
    canPlayTimerSound() {
      let bpm = this.focusTimerBpm;
      return this.focusTimerSound
          && ((bpm == null) || (bpm > 0 && bpm <= 1000));
    }
  },
  watch: {
    settings: {
      handler(to, from) {
        if (!from) {
          return;
        }

        // Settings changed, save them.
        this.saveSettings();
      },
      deep: true
    }
  },
  directives: {
    focus
  },
  components: {
    CountdownSettings,
    SoundSelect
  }
};
</script>