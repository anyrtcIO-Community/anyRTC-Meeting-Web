import Vue from 'vue';
import Router from 'vue-router';
import Join from './views/Join.vue';
import Meeting from './views/Meeting.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'Join',
      component: Join,
    },
    {
      // path: '/meet/:roomId/:isHoster',
      path: '/meet/:roomId',
      name: 'meeting',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: Meeting,
    },
  ],
});
