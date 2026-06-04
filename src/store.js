import { reactive } from 'vue'

import clientsData from './data/clients.json'
import employesData from './data/employes.json'
import missionsData from './data/missions.json'

const store = reactive({
    clients: clientsData,
    employes: employesData,
    missions: missionsData,

    prospects: [],
    facturations: [],
    charges: {},

    user: JSON.parse(localStorage.getItem('ihse_user') || 'null'),
    clientsExtra: JSON.parse(localStorage.getItem('ihse_clients_extra') || '{}'),

    setUser(data) {
        this.user = data
        if (data) localStorage.setItem('ihse_user', JSON.stringify(data))
        else localStorage.removeItem('ihse_user')
    },

    setClientExtra(clientId, champ, valeur) {
        const id = String(clientId)
        this.clientsExtra[id] = { ...this.clientsExtra[id], [champ]: valeur }
        localStorage.setItem('ihse_clients_extra', JSON.stringify(this.clientsExtra))
    },

    getClientExtra(clientId, champ, defaut = '') {
        return this.clientsExtra[String(clientId)]?.[champ] ?? defaut
    }
})

export default store