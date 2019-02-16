import Vue from 'vue';
import Countdown from './Countdown';
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
  render: h => h(Countdown)
}).$mount('#app');