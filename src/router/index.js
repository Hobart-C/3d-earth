import Vue from 'vue'
import VueRouter from 'vue-router'
import earth from '../views/earth.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'earth',
    component: earth
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.VUE_APP_BASE_URL,
  routes
})

export default router
