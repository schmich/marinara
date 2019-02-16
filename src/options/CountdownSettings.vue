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
          <span>{{ M.open_tab }}</span>
        </label>
      </p>
      <p class="field">
        <label>
          <input type="radio" v-model="settings.countdown.host" value="window">
          <span>{{ M.open_window }}</span>
        </label>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    settings: {
      type: Object,
      required: true
    }
  }
};
</script>