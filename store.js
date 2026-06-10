import { reactive } from 'vue'

import clientsData from './src/data/clients.json'
import employesData from './src/data/employes.json'
import missionsData from './src/data/missions.json'

import {
    initData,
    getCharges, setCharges as svcSetCharges,
    setClientExtra as svcSetClientExtra,
    setMissionExtra as svcSetMissionExtra,
    updateClient as svcUpdateClient,
    setProspect as svcSetProspect,
    deleteProspect as svcDeleteProspect,
    subscribeToClients,
    subscribeToMissions,
    subscribeToEmployes,
    subscribeToProspects,
    onAuthChange,
    logoutUser
} from './src/services/dataService.js'

const store = reactive({
    clients: clientsData,
    employes: employesData,
    missions: missionsData,

    prospects: [],
    facturations: [],
    charges: {},

    user: JSON.parse(localStorage.getItem('ihse_user') || 'null'),
    clientsExtra: {},
    missionsExtra: {},

    _ready: false,

    async init() {
        await initData()

        subscribeToClients(data => { this.clients = data })
        subscribeToMissions(data => { this.missions = data })
        subscribeToEmployes(data => { this.employes = data })
        subscribeToProspects(data => { this.prospects = data })

        onAuthChange(user => {
            this.user = user
            if (user) localStorage.setItem('ihse_user', JSON.stringify(user))
            else localStorage.removeItem('ihse_user')
        })

        this.charges = await getCharges()
        this._ready = true
    },

    async setUser(data) {
        this.user = data
        if (data) localStorage.setItem('ihse_user', JSON.stringify(data))
        else {
            localStorage.removeItem('ihse_user')
            await logoutUser()
        }
    },

    async setProspects(data) {
        const anciens = this.prospects.map(p => String(p.id))
        const nouveaux = data.map(p => String(p.id))
        for (const p of data) {
            await svcSetProspect(String(p.id), p)
        }
        for (const id of anciens) {
            if (!nouveaux.includes(id)) await svcDeleteProspect(id)
        }
    },

    async setClients(data) {
        for (const c of data) {
            await svcUpdateClient(String(c.id), c)
        }
    },

    async setMissions(data) {
    for (const m of data) {
        await svcUpdateMission(String(m.id), m)
    }
    },

    async setCharges(data) {
        this.charges = data
        await svcSetCharges(data)
    },

    async setClientExtra(clientId, champ, valeur) {
        const id = String(clientId)
        this.clientsExtra[id] = { ...this.clientsExtra[id], [champ]: valeur }
        await svcSetClientExtra(id, champ, valeur)
    },

    getClientExtra(clientId, champ, defaut = '') {
        return this.clientsExtra[String(clientId)]?.[champ] ?? defaut
    },

    async setMissionExtra(missionId, champ, valeur) {
        const id = String(missionId)
        this.missionsExtra[id] = { ...this.missionsExtra[id], [champ]: valeur }
        await svcSetMissionExtra(id, champ, valeur)
    },

    getMissionExtra(missionId, champ, defaut = '') {
        return this.missionsExtra[String(missionId)]?.[champ] ?? defaut
    }
})

export default store