import clientsData from '@/data/clients.json'
import employesData from '@/data/employes.json'
import missionsData from '@/data/missions.json'

const KEYS = { clients: 'ihse_clients', employes: 'ihse_employes', missions: 'ihse_missions' }

function load(key, fallback) {
    try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) : fallback
    } catch { return fallback }
    }

    function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data))
    } 

    export const db = {
    // clients
    getClients: () => load(KEYS.clients, clientsData),
    saveClients: (data) => save(KEYS.clients, data),
    addClient(client) {
        const list = db.getClients()
        client.id = Date.now()
        list.push(client)
        save(KEYS.clients, list)
        return client
    },
    deleteClient(id) {
        const list = db.getClients().filter(c => c.id !== id)
        save(KEYS.clients, list)
    },

    // employés
    getEmployes: () => load(KEYS.employes, employesData),
    saveEmployes: (data) => save(KEYS.employes, data),
    addEmploye(emp) {
        const list = db.getEmployes()
        emp.id = Date.now()
        list.push(emp)
        save(KEYS.employes, list)
        return emp
    },

    // missions
    getMissions: () => load(KEYS.missions, missionsData),
    saveMissions: (data) => save(KEYS.missions, data),
    addMission(mission) {
        const list = db.getMissions()
        mission.id = Date.now()
        list.push(mission)
        save(KEYS.missions, list)
        return mission
    },
    updateMission(updated) {
        const list = db.getMissions().map(m => m.id === updated.id ? updated : m)
        save(KEYS.missions, list)
    },
    deleteMission(id) {
        const list = db.getMissions().filter(m => m.id !== id)
        save(KEYS.missions, list)
    },
    getMissionsParEmploye(employe_id) {
        return db.getMissions().filter(m => m.employe_id === employe_id)
    },

    // import Outlook
    importerDepuisOutlook(evenements, clientsConnus) {
        const missions = db.getMissions()
        let ajouts = 0
        evenements.forEach(evt => {
        const clientMatch = clientsConnus.find(c =>
            evt.subject?.toUpperCase().includes(c.nom.toUpperCase())
        )
        if (!clientMatch) return
        const dejaPresent = missions.some(m => m.outlook_id === evt.id)
        if (dejaPresent) return
        const nouvelle = {
            id: Date.now() + ajouts,
            outlook_id: evt.id,
            employe_id: evt.employe_id,
            client_id: clientMatch.id,
            titre: evt.subject,
            date_debut: evt.start?.dateTime?.split('T')[0],
            date_fin: evt.end?.dateTime?.split('T')[0],
            nb_jours: 1,
            statut: 'valide',
            type: 'outlook'
        }
        missions.push(nouvelle)
        ajouts++
        })
        save(KEYS.missions, missions)
        return ajouts
    },

    // calculs du plan de charge
    getTauxCharge(employe_id, annee = new Date().getFullYear()) {
        const emp = db.getEmployes().find(e => e.id === employe_id)
        if (!emp) return 0
        const missions = db.getMissionsParEmploye(employe_id).filter(m => {
        const y = new Date(m.date_debut).getFullYear()
        return y === annee && m.statut === 'valide'
        })
        const joursTotal = missions.reduce((s, m) => s + (m.nb_jours || 0), 0)
        return Math.round((joursTotal / emp.capacite_jours) * 100)
    },

    getJoursClientParEmploye(employe_id) {
        const clients = db.getClients()
        const missions = db.getMissionsParEmploye(employe_id)
        return clients.map(c => ({
        client: c,
        jours: missions.filter(m => m.client_id === c.id).reduce((s, m) => s + (m.nb_jours || 0), 0)
        })).filter(r => r.jours > 0)
    },

    reset() {
        Object.values(KEYS).forEach(k => localStorage.removeItem(k))
    }
}