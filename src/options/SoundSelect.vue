<template>
  <div>
    <select :value="value.sound" @input="setSound($event.target.value)">
      <option :value="null">{{ M.none }}</option>
      <option v-for="sound in sounds" :value="sound.file">{{ sound.name }}</option>
    </select>
    <span>
      <button @click="playSound(value.sound)" :disabled="isPlaying">▶️</button>
      <input
        type="range"
        min="0.1"
        max="1.0"
        step="0.1"
        :value="value.volume"
        @input="setVolume($event.target.value)">Volume: {{value.volume * 10}}
    </span>
  </div>
</template>

<script>
import * as Sounds from '../Sounds';

export default {
  props: ['value', 'sounds'],
  data() {
    return {isPlaying: false}
  },
  methods: {
    setVolume(amount) {
      this.value.volume = parseFloat(amount);
    },

    setSound(filename) {
      this.value.sound = filename;

      this.$emit('input', this.value);
    },

    async playSound(filename) {
      if (filename) {
        this.isPlaying = true;
        await Sounds.play(filename, { volume: this.value.volume });
        this.isPlaying = false;
      }
    }
  }
};
</script>
