import Vue from 'vue';
import Router from 'vue-router';
import Options from './Options';
import Settings from './Settings';
import History from './History';
import Feedback from './Feedback';

Vue.use(Router);

const router = new Router({
  mode: 'hash',
  base: '/',
  routes: [
    {
      path: '/',
      component: Options,
      children: [
        {
          path: '',
          redirect: 'settings'
        },
        {
          path: 'settings',
          name: 'settings',
          component: Settings,
          meta: { title: 'Settings' }
        },
        {
          path: 'history',
          name: 'history',
          component: History,
          meta: { title: 'History' }
        },
        {
          path: 'feedback',
          name: 'feedback',
          component: Feedback,
          meta: { title: 'Feedback' }
        }
      ]
    }
  ]
});

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} - Marinara`;
  next();
});

export default router;