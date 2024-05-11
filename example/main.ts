import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import ErpUI from '@muerp/ui'

import 'element-plus/dist/index.css'
import '@muerp/ui/dist/index.css'

import MUMindMap from '../src'
const app = createApp(App).use(router)
app.use(ElementPlus);
app.use(ErpUI);
app.use(MUMindMap);
app.mount('#app')
