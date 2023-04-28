import Vue from 'vue'
import { createPinia, PiniaVuePlugin } from 'pinia'

import App from './App.vue'
import router from './router'

//基本样式
import './style/main.scss'

//全局Vant
import Vant from 'vant';
import 'vant/lib/index.css';
Vue.use(Vant);

//全局组件注册
Vue.use(PiniaVuePlugin)

new Vue({
  router,
  pinia: createPinia(),
  render: (h) => h(App)
}).$mount('#app')
