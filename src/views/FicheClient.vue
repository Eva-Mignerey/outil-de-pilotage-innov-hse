<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
import store from '@/store.js'

const route = useRoute()
const router = useRouter()

const clients = computed(() => store.clients)
const missions = computed(() => store.missions)
const employes = computed(() => store.employes)
const user = computed(() => store.user || {})

// Récupérer le client par son id dans l'URL
const client = computed(() =>
    clients.value.find(c => c.id === Number(route.params.id))
)

// Missions de ce client
const missionsClient = computed(() =>
    missions.value
        .filter(m => m.client_id === Number(route.params.id))
        .sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut))
)

const joursRealises = computed(() =>
    missionsClient.value.filter(m => m.statut === 'valide').reduce((s, m) => s + (m.nb_jours || 0), 0)
)

const pct = computed(() => {
    if (!client.value?.jours_contractualises) return 0
    return Math.min(Math.round((joursRealises.value / client.value.jours_contractualises) * 100), 100)
})

function nomEmploye(id) { return employes.value.find(e => e.id === id)?.nom || '—' }
function formaterDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '—' }
function labelStatut(s) { return { valide: 'Validé', en_attente: 'En attente', outlook: 'Outlook' }[s] || s }
function classeBadge(s) { return { valide: 'badge--valide', en_attente: 'badge--attente', outlook: 'badge--outlook' }[s] || '' }

function classeProgression(p) {
    if (p >= 90) return 'progression__barre--danger'
    if (p >= 70) return 'progression__barre--alerte'
    return 'progression__barre--ok'
}
</script>

<template>
    <div class="layout">
        <Sidebar :user="user" />

        <div class="layout__main">
            <div class="topbar">
                <span class="topbar__titre">
                    <button class="fiche__retour" @click="router.push('/clients')">⇽ Retour page Clients</button> |
                    {{ client?.nom }}
                </span>
            </div>

            <div class="page" v-if="client">

                <!-- KPIs du client -->
                <div class="kpi-grille" style="grid-template-columns: repeat(3, 1fr)">
                    <div class="kpi kpi--accent">
                        <div class="kpi__label">Jours contractualisés</div>
                        <div class="kpi__valeur">{{ client.jours_contractualises }}</div>
                    </div>
                    <div class="kpi" :class="joursRealises > client.jours_contractualises ? 'kpi--rouge' : 'kpi--vert'">
                        <div class="kpi__label">Jours réalisés</div>
                        <div class="kpi__valeur">{{ joursRealises }}</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi__label">Jours restants</div>
                        <div class="kpi__valeur">{{ Math.max(client.jours_contractualises - joursRealises, 0) }}</div>
                    </div>
                </div>

                <!-- Barre de progression -->
                <div class="carte" style="margin-bottom:18px">
                    <div class="carte__corps">
                        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-family:'Poppins',sans-serif;font-size:.85rem">
                            <span><strong>{{ client.nom }}</strong> — {{ client.secteur || 'Secteur non renseigné' }}</span>
                            <span style="font-weight:700;color:#315691">{{ pct }}%</span>
                        </div>
                        <div class="progression" style="height:12px">
                            <div
                                class="progression__barre"
                                :class="classeProgression(pct)"
                                :style="{ width: pct + '%' }"
                            ></div>
                        </div>
                        <div style="margin-top:6px;font-size:.78rem;color:#8092A4;font-family:'Poppins',sans-serif">
                            {{ joursRealises }}j réalisés sur {{ client.jours_contractualises }}j contractualisés
                        </div>
                    </div>
                </div>

                <!-- Liste des missions -->
                <div class="carte">
                    <div class="carte__entete">
                        <h2>Missions ({{ missionsClient.length }})</h2>
                    </div>
                    <div class="carte__corps" style="padding:0">
                        <div class="tableau-wrap">
                            <table class="tableau">
                                <thead>
                                    <tr>
                                        <th>Mission</th>
                                        <th>Consultant</th>
                                        <th>Dates</th>
                                        <th>Jours</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="m in missionsClient" :key="m.id">
                                        <td style="font-weight:600">{{ m.titre }}</td>
                                        <td style="font-size:.85rem">{{ nomEmploye(m.employe_id) }}</td>
                                        <td style="font-size:.8rem;color:#8092A4">
                                            {{ formaterDate(m.date_debut) }} → {{ formaterDate(m.date_fin) }}
                                        </td>
                                        <td style="font-weight:700;text-align:center">{{ m.nb_jours }}</td>
                                        <td>
                                            <span class="badge" :class="classeBadge(m.statut)">
                                                {{ labelStatut(m.statut) }}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr v-if="missionsClient.length === 0">
                                        <td colspan="5" class="missions__vide">Aucune mission pour ce client</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Client introuvable -->
            <div class="page" v-else>
                <div class="carte">
                    <div class="carte__corps" style="text-align:center;padding:40px;color:#8092A4">
                        Client introuvable.
                        <br>
                        <button class="btn btn--fantome" style="margin-top:16px" @click="router.push('/clients')">
                            ← Retour aux clients
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
.fiche__retour {
    border: none;
    padding: 6px 12px;
    border-radius: 100px;
    background-color: #008BD0;
    font-size: 0.75rem;
    font-weight: 700;
    color: white;
    cursor: pointer;
    transition: 0.2s;
}

.fiche__retour:hover {
    background-color: #315691;
    color: white;
}
</style>