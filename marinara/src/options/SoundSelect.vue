<template>
  <select :value="value" @input="setSound($event.target.value)">
    <option :value="null">{{ M.none }}</option>
    <option v-for="sound in sounds" :value="sound.file">{{ sound.name }}</option>
  </select>
</template>

<script>
import * as Sounds from '../Sounds';

export default {
  props: ['value', 'sounds'],
  methods: {
    setSound(filename) {
      this.$emit('input', filename);
      Sounds.play(filename);
    }
  }
};
</script>