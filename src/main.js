import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router/index.js'
import store from '../store.js'

import '@/assets/scss/styles.scss'

store.init().then(() => {
    const app = createApp(App)
    app.use(router)
    app.mount('#app')
}).catch(err => {
    console.error('Erreur init store:', err)
    const app = createApp(App)
    app.use(router)
    app.mount('#app')
})