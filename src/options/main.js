import Vue from 'vue';
import App from './App';
import router from './router';
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

const settingsClient = new SettingsClient()

settingsClient.getSettings().then( settings => {
  refreshLang(settings).then(() => {
    new Vue({
      router,
      render: h => h(App)
    }).$mount('#app');
  })
} )

setInterval(() => {
  settingsClient.getSettings().then( settings => refreshLang(settings))
}, 1000)

