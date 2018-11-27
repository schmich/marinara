import Vue from 'vue';
import App from './App';
import router from './router';
import M from '../Messages';

Vue.config.productionTip = false;
Vue.config.devtools = false;

Vue.mixin({
  computed: {
    M() {
      return M;
    }
  }
});

new Vue({
  router,
  render: h => h(App)
}).$mount('#app');