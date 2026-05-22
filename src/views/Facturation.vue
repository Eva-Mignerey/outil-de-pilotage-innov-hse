<script setup>
import { ref, computed } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import store from '@/store.js'

const clients = computed(() => store.clients)
const missions = computed(() => store.missions)
const user = computed(() => store.user || {})
const facturations = ref([...store.facturations])

const modale = ref(false)
const clientSel = ref(null)
const formFact = ref({ theorique: '', reel: '', objectif: '', facture: '', commentaire: '' })

function joursRealises(clientId) {
    return missions.value.filter(m => m.client_id === clientId && m.statut === 'valide').reduce((s, m) => s + (m.nb_jours || 0), 0)
}

function pct(realise, contrat) {
    if (!contrat) return 0
    return Math.min(Math.round((realise / contrat) * 100), 100)
}

function classeProgression(p) {
    if (p >= 90) return 'progression__barre--danger'
    if (p >= 70) return 'progression__barre--alerte'
    return 'progression__barre--ok'
}

function factClient(clientId) {
    return facturations.value.find(f => f.client_id === clientId) || {}
}

function ecart(clientId) {
    const f = factClient(clientId)
    if (!f.theorique || !f.reel) return null
    return Number(f.reel) - Number(f.theorique)
}

function ouvrirFacturation(c) {
    clientSel.value = c
    const f = factClient(c.id)
    formFact.value = {
        theorique: f.theorique || '',
        reel: f.reel || '',
        objectif: f.objectif || '',
        facture: f.facture || '',
        commentaire: f.commentaire || ''
    }
    modale.value = true
}

function sauvegarder() {
    const list = facturations.value.filter(f => f.client_id !== clientSel.value.id)
    list.push({ client_id: clientSel.value.id, ...formFact.value })
    facturations.value = list
    store.setFacturations(list)
    modale.value = false
}

const totalTheorique = computed(() =>
    clients.value.reduce((s, c) => s + (Number(factClient(c.id).theorique) || 0), 0)
)
const totalReel = computed(() =>
    clients.value.reduce((s, c) => s + (Number(factClient(c.id).reel) || 0), 0)
)
const totalFacture = computed(() =>
    clients.value.reduce((s, c) => s + (Number(factClient(c.id).facture) || 0), 0)
)
</script>

<template>
    <div class="layout">
        <Sidebar :user="user" />

        <div class="layout__main">
            <div class="topbar">
                <span class="topbar__titre">Facturation / Contrats</span>
            </div>

            <div class="page">

                <!-- KPIs globaux -->
                <div class="kpi-grille" style="grid-template-columns:repeat(3,1fr)">
                    <div class="kpi kpi--accent">
                        <div class="kpi__label">Total théorique</div>
                        <div class="kpi__valeur">{{ totalTheorique.toLocaleString('fr-FR') }} €</div>
                    </div>
                    <div class="kpi" :class="totalReel >= totalTheorique ? 'kpi--vert' : 'kpi--rouge'">
                        <div class="kpi__label">Total réel</div>
                        <div class="kpi__valeur">{{ totalReel.toLocaleString('fr-FR') }} €</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi__label">Total facturé</div>
                        <div class="kpi__valeur">{{ totalFacture.toLocaleString('fr-FR') }} €</div>
                    </div>
                </div>

                <!-- Tableau contrats -->
                <div class="carte">
                    <div class="carte__entete">
                        <h2>Suivi par client</h2>
                        <span style="font-size:.78rem;color:#8092A4">Cliquer sur ✎ pour saisir les données</span>
                    </div>
                    <div class="carte__corps" style="padding:0">
                        <div class="tableau-wrap">
                            <table class="tableau">
                                <thead>
                                    <tr>
                                        <th>Client</th>
                                        <th>Jours contrat</th>
                                        <th>Jours réalisés</th>
                                        <th>Avancement</th>
                                        <th>Théorique (€)</th>
                                        <th>Réel (€)</th>
                                        <th>Objectif (€)</th>
                                        <th>Facturé (€)</th>
                                        <th>Écart</th>
                                        <th>Saisir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="c in clients" :key="c.id">
                                        <td><span class="clients__nom">{{ c.nom }}</span></td>
                                        <td style="text-align:center"><strong>{{ c.jours_contractualises }}j</strong></td>
                                        <td style="text-align:center">{{ joursRealises(c.id) }}j</td>
                                        <td style="min-width:100px">
                                            <div class="progression">
                                                <div
                                                    class="progression__barre"
                                                    :class="classeProgression(pct(joursRealises(c.id), c.jours_contractualises))"
                                                    :style="{ width: pct(joursRealises(c.id), c.jours_contractualises) + '%' }"
                                                ></div>
                                            </div>
                                            <div class="clients__pct">{{ pct(joursRealises(c.id), c.jours_contractualises) }}%</div>
                                        </td>
                                        <td style="text-align:right">{{ factClient(c.id).theorique ? Number(factClient(c.id).theorique).toLocaleString('fr-FR') + ' €' : '—' }}</td>
                                        <td style="text-align:right">{{ factClient(c.id).reel ? Number(factClient(c.id).reel).toLocaleString('fr-FR') + ' €' : '—' }}</td>
                                        <td style="text-align:right">{{ factClient(c.id).objectif ? Number(factClient(c.id).objectif).toLocaleString('fr-FR') + ' €' : '—' }}</td>
                                        <td style="text-align:right">{{ factClient(c.id).facture ? Number(factClient(c.id).facture).toLocaleString('fr-FR') + ' €' : '—' }}</td>
                                        <td style="text-align:center;font-weight:700">
                                            <span v-if="ecart(c.id) !== null" :style="{ color: ecart(c.id) >= 0 ? '#1A7A4A' : '#E84B4B' }">
                                                {{ ecart(c.id) >= 0 ? '+' : '' }}{{ Number(ecart(c.id)).toLocaleString('fr-FR') }} €
                                            </span>
                                            <span v-else style="color:#8092A4">—</span>
                                        </td>
                                        <td>
                                            <button class="btn btn--fantome btn--petit" @click="ouvrirFacturation(c)">✎</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- Modale saisie facturation -->
        <div v-if="modale" class="modale-fond" @click.self="modale = false">
            <div class="modale">
                <div class="modale__entete">
                    <h2>Facturation — {{ clientSel?.nom }}</h2>
                    <button class="modale__fermer" @click="modale = false">✕</button>
                </div>
                <div class="modale__corps">
                    <div class="missions__form-grille">
                        <div class="champ">
                            <label>Théorique contrat (€)</label>
                            <input v-model="formFact.theorique" type="number" />
                        </div>
                        <div class="champ">
                            <label>Réel réalisé (€)</label>
                            <input v-model="formFact.reel" type="number" />
                        </div>
                        <div class="champ">
                            <label>Objectif (€)</label>
                            <input v-model="formFact.objectif" type="number" />
                        </div>
                        <div class="champ">
                            <label>Facturé (€)</label>
                            <input v-model="formFact.facture" type="number" />
                        </div>
                    </div>
                    <div class="champ">
                        <label>Commentaire / justification</label>
                        <textarea v-model="formFact.commentaire" rows="3"></textarea>
                    </div>
                </div>
                <div class="modale__pied">
                    <button class="btn btn--fantome" @click="modale = false">Annuler</button>
                    <button class="btn btn--primaire" @click="sauvegarder">Enregistrer</button>
                </div>
            </div>
        </div>

    </div>
</template>