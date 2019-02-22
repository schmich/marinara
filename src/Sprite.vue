<template>
  <div></div>
</template>

<style lang="scss" scoped>
div {
  display: contents;
}
/deep/ svg {
  fill: currentColor;
}
</style>

<script>
const ContentCache = {};

export default {
  props: {
    src: {
      required: true
    }
  },
  async mounted() {
    await this.load(this.src);
  },
  methods: {
    async load(filename) {
      if (this.$el.childNodes.length > 0) {
        this.$el.removeChild(this.$el.childNodes[0]);
      }

      if (!filename) {
        return;
      }

      let content = ContentCache[filename];
      if (!content) {
        let response = await fetch(filename);
        content = await response.text();
        ContentCache[filename] = content;
      }

      let { rootElement } = new DOMParser().parseFromString(content, 'image/svg+xml');
      this.$el.appendChild(rootElement);
    }
  },
  watch: {
    async src(to) {
      await this.load(to);
    }
  }
};
</script>