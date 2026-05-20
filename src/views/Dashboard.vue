<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import ToastAlertes from '../components/ToastAlertes.vue'
import { alertesActives } from '../services/alertes.js'

const employes = ref(JSON.parse(localStorage.getItem('ihse_employes') || '[]'))
const clients = ref(JSON.parse(localStorage.getItem('ihse_clients')  || '[]'))
const missions = ref(JSON.parse(localStorage.getItem('ihse_missions') || '[]'))
const user = ref(JSON.parse(localStorage.getItem('ihse_user')     || '{}'))

const annee = new Date().getFullYear()
const moisEnCours = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
const dernierSync = ref(null)

const couleurs = ['#1B4F8A','#E8A020','#1A7A4A','#C0392B','#7B2D8B','#1A6B8A']
const moisLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

const voirAlertes = ref(false)

const alertes   = computed(() => alertesActives(clients.value, missions.value))
const nbAlertes = computed(() => alertes.value.length)

const missionsDuMois = computed(() => {
    const now = new Date()
    return missions.value.filter(m => {
        const d = new Date(m.date_debut)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
})

const totalJours = computed(() =>
    missions.value.filter(m => m.statut === 'valide').reduce((s, m) => s + (m.nb_jours || 0), 0)
)

const totalCapacite = computed(() =>
    employes.value.reduce((s, e) => s + (e.capacite_jours || 0), 0)
)

const tauxMoyen = computed(() => {
    if (!employes.value.length) return 0
    const total = employes.value.reduce((s, e) => {
        const jours = missions.value.filter(m => m.employe_id === e.id && m.statut === 'valide').reduce((a, m) => a + (m.nb_jours || 0), 0)
        return s + Math.round((jours / (e.capacite_jours || 1)) * 100)
    }, 0)
    return Math.round(total / employes.value.length)
})

const missionsRecentes = computed(() =>
    [...missions.value].sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut)).slice(0, 5)
)

function joursClient(clientId) {
    return missions.value.filter(m => m.client_id === clientId && m.statut === 'valide').reduce((s, m) => s + (m.nb_jours || 0), 0)
}

function joursParClient(employeId) {
    return clients.value.map(c => ({
        client: c,
        jours: missions.value.filter(m => m.employe_id === employeId && m.client_id === c.id).reduce((s, m) => s + (m.nb_jours || 0), 0)
    })).filter(r => r.jours > 0)
}

function tauxCharge(employeId) {
    const emp   = employes.value.find(e => e.id === employeId)
    if (!emp) return 0
    const jours = missions.value.filter(m => m.employe_id === employeId && m.statut === 'valide').reduce((s, m) => s + (m.nb_jours || 0), 0)
    return Math.min(Math.round((jours / (emp.capacite_jours || 1)) * 100), 100)
}

function joursParMois() {
    const tab = Array(12).fill(0)
    missions.value.filter(m => m.statut === 'valide' && new Date(m.date_debut).getFullYear() === annee)
        .forEach(m => { tab[new Date(m.date_debut).getMonth()] += m.nb_jours || 0 })
    return tab
}

function nomEmploye(id)  { return employes.value.find(e => e.id === id)?.nom?.split(' ')[0] || '—' }
function formaterDate(d) { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) }
function labelStatut(s)  { return { valide: 'Validé', en_attente: 'En attente', outlook: 'Outlook' }[s] || s }
function classeBadge(s)  { return { valide: 'badge--valide', en_attente: 'badge--attente', outlook: 'badge--outlook' }[s] || '' }

const barRef = ref(null)
const donutRef = ref(null)
const lineRef = ref(null)
let barChart = null, donutChart = null, lineChart = null

async function chargerChartJS() {
    if (window.Chart) return
    await new Promise((ok, ko) => {
        const s = document.createElement('script')
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
        s.onload = ok; s.onerror = ko
        document.head.appendChild(s)
    })
}

function creerGraphiques() {
    if (barChart) barChart.destroy()
    barChart = new window.Chart(barRef.value.getContext('2d'), {
        type: 'bar',
        data: {
            labels: employes.value.map(e => e.nom.split(' ')[0]),
            datasets: [
                { label: 'Charge', data: employes.value.map(e => tauxCharge(e.id)), backgroundColor: employes.value.map((_, i) => couleurs[i % couleurs.length] + 'CC'), borderRadius: 6 },
                { label: 'Dispo', data: employes.value.map(e => 100 - tauxCharge(e.id)), backgroundColor: '#E8EAF0', borderRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, max: 100, ticks: { callback: v => v + '%' } }
            }
        }
    })

    if (donutChart) donutChart.destroy()
    const data  = clients.value.map(c => joursClient(c.id))
    const total = data.reduce((s, v) => s + v, 0)
    donutChart = new window.Chart(donutRef.value.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: clients.value.map(c => c.nom),
            datasets: [{ data: total ? data : clients.value.map(() => 1), backgroundColor: clients.value.map((_, i) => couleurs[i % couleurs.length]), borderColor: '#fff', borderWidth: 3 }]
        },
        options: { cutout: '65%', plugins: { legend: { display: false } } }
    })

    if (lineChart) lineChart.destroy()

    lineChart = new window.Chart(lineRef.value.getContext('2d'), {
        type: 'line',
        data: {
            labels: moisLabels,
            datasets: [
                {
                    label: 'Activité réelle',
                    data: joursParMois(),
                    borderColor: '#315691',
                    backgroundColor: 'rgba(49,86,145,.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,

                    pointBackgroundColor: ctx =>
                        ctx.raw >= 25 ? '#1A7A4A' : '#C0392B',

                    pointBorderWidth: 2
                },
                {
                    label: 'Objectif',
                    data: Array(12).fill(27), // changer 27 par la vraie valeur
                    borderColor: '#E8A020',
                    borderDash: [6, 6],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true }
            }
        }
    })
    }

onMounted(async () => {
    await chargerChartJS()
    await nextTick()
    creerGraphiques()
})

watch([employes, clients, missions], async () => {
    await nextTick()
    creerGraphiques()
}, { deep: true })

async function syncOutlook() {
    await new Promise(r => setTimeout(r, 1000))
    dernierSync.value = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
    <div class="layout">
        <Sidebar :user="user" :nbAlertes="nbAlertes" @voirAlertes="voirAlertes = true" />
        <ToastAlertes :clients="clients" :missions="missions" />

        <div class="layout__main">
            <div class="topbar">
                <span class="topbar__titre">Tableau de bord</span>
                <div class="topbar__actions">
                    <button class="btn btn--fantome btn--petit" @click="syncOutlook">⟳ Sync Outlook</button>
                    <span v-if="dernierSync" class="dashboard__sync">Mis à jour {{ dernierSync }}</span>
                    <button v-if="nbAlertes" class="topbar__cloche" @click="voirAlertes = true">
                        🔔 <span class="topbar__cloche-badge">{{ nbAlertes }}</span>
                    </button>
                </div>
            </div>

            <div class="page">

                <!-- KPIs -->
                <div class="kpi-grille">
                    <div class="kpi">
                        <div class="kpi__label">Missions ce mois</div>
                        <div class="kpi__valeur">{{ missionsDuMois }}</div>
                        <div class="kpi__sous">{{ moisEnCours }}</div>
                    </div>
                    <div class="kpi kpi--accent">
                        <div class="kpi__label">Jours réalisés</div>
                        <div class="kpi__valeur">{{ totalJours }}</div>
                        <div class="kpi__sous">sur {{ totalCapacite }} jours dispo</div>
                    </div>
                    <div class="kpi kpi--vert">
                        <div class="kpi__label">Taux de charge moyen</div>
                        <div class="kpi__valeur">{{ tauxMoyen }}%</div>
                        <div class="kpi__sous">équipe Troyes</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi__label">Alertes actives</div>
                        <div class="kpi__valeur" :style="{ color: alertes.length ? '#E84B4B' : '#84EE57' }">
                            {{ alertes.length }}
                        </div>
                        <div class="kpi__sous">{{ alertes.length ? 'clients à surveiller' : 'tout est OK ✓' }}</div>
                    </div>
                </div>

                <!-- Graphiques -->
                <div class="dashboard__grille">

                    <div class="carte">
                        <div class="carte__entete">
                            <h2>Taux de charge — équipe</h2>
                            <span class="dashboard__sous-titre">{{ annee }}</span>
                        </div>
                        <div class="carte__corps">
                            <canvas ref="barRef" height="200"></canvas>
                            <div v-for="emp in employes" :key="emp.id">
                                <div class="dashboard__pills">
                                    <span v-for="r in joursParClient(emp.id)" :key="r.client.id" class="dashboard__pill">
                                        {{ emp.nom.split(' ')[0] }} · {{ r.client.nom }} · {{ r.jours }}j
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="carte">
                        <div class="carte__entete">
                            <h2>Répartition par client</h2>
                            <span class="dashboard__sous-titre">jours réalisés</span>
                        </div>
                        <div class="carte__corps dashboard__donut">
                            <div class="dashboard__donut-canvas">
                                <canvas ref="donutRef"></canvas>
                            </div>
                            <div class="dashboard__legende">
                                <div v-for="(c, i) in clients" :key="c.id" class="dashboard__legende-ligne">
                                    <div class="dashboard__legende-point" :style="{ background: couleurs[i % couleurs.length] }"></div>
                                    <span class="dashboard__legende-nom">{{ c.nom }}</span>
                                    <span class="dashboard__legende-val">{{ joursClient(c.id) }}j</span>
                                    <span class="dashboard__legende-max">/ {{ c.jours_contractualises }}j</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="carte">
                        <div class="carte__entete">
                            <h2>Activité mensuelle</h2>
                            <span class="dashboard__sous-titre">{{ annee }}</span>
                        </div>
                        <div class="carte__corps">
                            <canvas ref="lineRef" height="180"></canvas>
                        </div>
                    </div>

                    <div class="carte dashboard__carte-tableau">
                        <div class="carte__entete">
                            <h2>Missions récentes</h2>
                            <router-link to="/missions" class="btn btn--primaire btn--petit">Voir tout</router-link>
                        </div>
                        <div class="carte__corps">
                            <div class="tableau-wrap">
                                <table class="tableau">
                                    <thead>
                                        <tr>
                                            <th>Mission</th>
                                            <th>Consultant</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="m in missionsRecentes" :key="m.id">
                                            <td>
                                                <div class="dashboard__mission-nom">{{ m.titre }}</div>
                                                <div class="dashboard__mission-date">{{ formaterDate(m.date_debut) }}</div>
                                            </td>
                                            <td class="dashboard__mission-qui">{{ nomEmploye(m.employe_id) }}</td>
                                            <td>
                                                <span class="badge" :class="classeBadge(m.statut)">
                                                    {{ labelStatut(m.statut) }}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>

    <!-- alertes -->
    <div v-if="voirAlertes" class="popup-liste-fond" @click.self="voirAlertes = false">
        <div class="popup-liste">
            <div class="popup-liste__entete">
                <h2>Alertes actives ({{ nbAlertes }})</h2>
                <button @click="voirAlertes = false" style="background:none;font-size:1.1rem;color:#8092A4">✕</button>
            </div>
            <div class="popup-liste__corps">
                <div v-for="a in alertes" :key="a.client.id" class="alerte" :class="'alerte--' + a.niveau" style="margin:6px 16px">
                    <span class="alerte__client">{{ a.client.nom }}</span>
                    <span class="alerte__message">{{ a.message }}</span>
                </div>
            </div>
            <div class="popup-liste__pied">
                <router-link to="/clients" class="btn btn--primaire btn--petit" @click="voirAlertes = false">Voir les clients</router-link>
            </div>
        </div>
    </div>

</template>