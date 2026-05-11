import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router/index.js'
import '@/assets/scss/styles.scss'

import employesData from './data/employes.json'
import clientsData  from './data/clients.json'
import missionsData from './data/missions.json'

const VERSION_DONNEES = '1.2'

function initDonnees() {
    const versionActuelle = localStorage.getItem('ihse_version')

    if (versionActuelle !== VERSION_DONNEES) {
        localStorage.setItem('ihse_employes', JSON.stringify(employesData))
        localStorage.setItem('ihse_clients',  JSON.stringify(clientsData))
        localStorage.setItem('ihse_missions', JSON.stringify(missionsData))
        localStorage.setItem('ihse_version',  VERSION_DONNEES)
        console.log(`Données mises à jour vers la version ${VERSION_DONNEES}`)
    }

    if (!localStorage.getItem('ihse_comptes')) {
        localStorage.setItem('ihse_comptes', JSON.stringify([
            { nom: 'Matthieu Roche', email: 'demo@innov-hse.fr', profil: 'admin', password: 'demo1234' },
            { nom: 'Damaris Quintin', email: 'damaris@innov-hse.fr', profil: 'admin', password: 'demo1234' },
            { nom: 'Andrea Romary', email: 'andrea@innov-hse.fr', profil: 'consultant', password: 'demo1234' },
            { nom: 'Antonin Guay Hemard', email: 'antonin@innov-hse.fr', profil: 'consultant', password: 'demo1234' }
        ]))
    }
}

initDonnees()

createApp(App).use(router).mount('#app')