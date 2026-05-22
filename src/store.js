import { reactive } from 'vue'

const store = reactive({
    clients:      JSON.parse(localStorage.getItem('ihse_clients')      || '[]'),
    missions:     JSON.parse(localStorage.getItem('ihse_missions')     || '[]'),
    employes:     JSON.parse(localStorage.getItem('ihse_employes')     || '[]'),
    prospects:    JSON.parse(localStorage.getItem('ihse_prospects')    || '[]'),
    facturations: JSON.parse(localStorage.getItem('ihse_facturations') || '[]'),
    charges:      JSON.parse(localStorage.getItem('ihse_charges')      || 'null'),
    user:         JSON.parse(localStorage.getItem('ihse_user')         || 'null'),

    setClients(data)      { this.clients      = data; localStorage.setItem('ihse_clients',      JSON.stringify(data)) },
    setMissions(data)     { this.missions     = data; localStorage.setItem('ihse_missions',     JSON.stringify(data)) },
    setEmployes(data)     { this.employes     = data; localStorage.setItem('ihse_employes',     JSON.stringify(data)) },
    setProspects(data)    { this.prospects    = data; localStorage.setItem('ihse_prospects',    JSON.stringify(data)) },
    setFacturations(data) { this.facturations = data; localStorage.setItem('ihse_facturations', JSON.stringify(data)) },
    setCharges(data)      { this.charges      = data; localStorage.setItem('ihse_charges',      JSON.stringify(data)) },
    setUser(data)         { this.user         = data; if (data) localStorage.setItem('ihse_user', JSON.stringify(data)); else localStorage.removeItem('ihse_user') },
})

export default store