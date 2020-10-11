<template>
  <select :value="value" @input="setLanguage($event.target.value)">
    <option :value="null">{{ M.browser_default }}</option>
    <option v-for="(translation, locale) in languages" v-bind:key="translation.id" :value="locale">{{ translation }}</option>
  </select>
</template>

<script>
export default {
  props: ['value', 'languages'],
  methods: {
    setLanguage(locale) {
      this.$emit('input', locale);
    }
  }
};
</script>
