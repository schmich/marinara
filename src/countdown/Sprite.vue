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
export default {
  props: {
    src: {
      type: String,
      required: true
    }
  },
  async mounted() {
    let response = await fetch(this.src);
    let content = await response.text();
    let { rootElement } = new DOMParser().parseFromString(content, 'image/svg+xml');
    this.$el.appendChild(rootElement);
  }
};
</script>