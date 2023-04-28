import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home/index.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  base: import.meta.env.VITE_BASE_URL,
  routes: [
    {path: '/', name: 'home', component: Home}
  ]
})

export default router
