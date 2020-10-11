import Vue from 'vue';
import Countdown from './Countdown';
import { M, refreshLang } from '../Messages';
import { SettingsClient } from '../background/Services';

Vue.config.productionTip = false;
Vue.config.devtools = false;

Vue.mixin({
  computed: {
    M() {
      return M;
    }
  }
});

new SettingsClient().getSettings().then( settings => {
  refreshLang(settings).then(() => {
    new Vue({
      render: h => h(Countdown)
    }).$mount('#app');
  })
} )
