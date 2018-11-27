import Vue from 'vue';
import Expire from './Expire';
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
  render: h => h(Expire)
}).$mount('#app');