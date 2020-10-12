import Vue from 'vue';
import Expire from './Expire';
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
  console.log('doing expired', settings.language_override)
  refreshLang(settings).then(() => {
    new Vue({
      render: h => h(Expire)
    }).$mount('#app');
  })
} )
