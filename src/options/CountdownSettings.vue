<template>
  <div>
    <p>{{ M.countdown_timer }}</p>
    <div class="group">
      <p class="field">
        <label>
          <input type="radio" v-model="settings.countdown.host" :value="null">
          <span>{{ M.do_not_show }}</span>
        </label>
      </p>
      <p class="field">
        <label>
          <input type="radio" v-model="settings.countdown.host" value="tab">
          <span>{{ M.show_in_tab }}</span>
        </label>
        <div v-if="settings.countdown.host === 'tab'" class="group">
          <p class="field">
            <label>
              <input type="checkbox" v-model="settings.countdown.autoclose">
              <span>{{ M.countdown_autoclose_tab }}</span>
            </label>
          </p>
        </div>
      </p>
      <p class="field">
        <label>
          <input type="radio" v-model="settings.countdown.host" value="window">
          <span>{{ M.show_in_window }}</span>
        </label>
        <div v-if="settings.countdown.host === 'window'" class="group">
          <p class="field">
            <label>
              <span>Window size:</span>
              <select v-model="resolution">
                <option v-for="(value, name) of defaultResolutions" :value="value">{{ name }}</option>
                <option value="custom">{{ M.custom }}</option>
              </select>
              <template v-if="showCustomResolution">
                <input v-model.number="settings.countdown.resolution[0]" v-focus type="number" min="1" max="4096" :placeholder="M.width"> &times;
                <input v-model.number="settings.countdown.resolution[1]" type="number" min="1" max="4096" :placeholder="M.height">
              </template>
            </label>
          </p>
          <p class="field">
            <label>
              <input type="checkbox" v-model="settings.countdown.autoclose">
              <span>{{ M.countdown_autoclose_window }}</span>
            </label>
          </p>
        </div>
      </p>
    </div>
  </div>
</template>

<script>
import M from '../Messages';
import { focus } from '../Directives';

export default {
  props: {
    settings: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showCustomResolution: false,
      defaultResolutions: {
        '200x200': [200, 200],
        '300x300': [300, 300],
        '400x400': [400, 400],
        '500x500': [500, 500],
        '600x600': [600, 600],
        '700x700': [700, 700],
        '800x800': [800, 800],
        '900x900': [900, 900],
        '1000x1000': [1000, 1000],
        [M.fullscreen]: 'fullscreen'
      }
    };
  },
  created() {
    this.showCustomResolution = !Object.values(this.defaultResolutions).some(
      r => r.toString() == this.settings.countdown.resolution.toString()
    );
  },
  computed: {
    resolution: {
      get() {
        return this.showCustomResolution ? 'custom' : this.settings.countdown.resolution;
      },
      set(value) {
        if (value !== 'custom') {
          this.showCustomResolution = false;
          this.settings.countdown.resolution = value;
          return;
        }

        this.showCustomResolution = true;
        if (!Array.isArray(this.settings.countdown.resolution)) {
          this.settings.countdown.resolution = [1280, 720];
        }
      }
    }
  },
  directives: {
    focus
  }
};
</script>