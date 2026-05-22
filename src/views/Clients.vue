<script setup>
import { ref, computed } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import ToastAlertes from '../components/ToastAlertes.vue'
import { alertesActives, niveauAlerte, messageAlerte } from '../services/alertes.js'
import store from '@/store.js'

const clients  = ref([...store.clients])
const missions = computed(() => store.missions)
const user     = computed(() => store.user || {})

const recherche = ref('')
const modale = ref(false)
const edition = ref(null)
const form = ref({ nom: '', secteur: '', jours_contractualises: 10 })

const clientsFiltres = computed(() =>
    clients.value.filter(c =>
        c.nom.toLowerCase().includes(recherche.value.toLowerCase())
    )
)

const totalContrat = computed(() =>
    clients.value.reduce((s, c) => s + (c.jours_contractualises || 0), 0)
)

const totalRealise = computed(() =>
    missions.value.filter(m => m.statut === 'valide').reduce((s, m) => s + (m.nb_jours || 0), 0)
)

const voirAlertes = ref(false)

// Alertes actives : clients à risque ou dépassés
const alertes = computed(() => alertesActives(clients.value, missions.value))
const nbAlertes = computed(() => alertes.value.length)

function joursRealises(clientId) {
    return missions.value
        .filter(m => m.client_id === clientId && m.statut === 'valide')
        .reduce((s, m) => s + (m.nb_jours || 0), 0)
}

function pct(realise, contrat) {
    if (!contrat) return 0
    return Math.min(Math.round((realise / contrat) * 100), 100)
}

function classeProgression(realise, contrat) {
    const p = pct(realise, contrat)
    if (p >= 90) return 'progression__barre--danger'
    if (p >= 70) return 'progression__barre--alerte'
    return 'progression__barre--ok'
}

// Classe du badge alerte dans le tableau
function classeAlerte(clientId) {
    const r = joursRealises(clientId)
    const c = clients.value.find(x => x.id === clientId)
    const n = niveauAlerte(r, c?.jours_contractualises)
    return {
        surplus: 'badge--alerte-surplus',
        depasse: 'badge--alerte-depasse',
        attention: 'badge--alerte-attention',
        ok: ''
    }[n]
}

function texteAlerte(clientId) {
    const r = joursRealises(clientId)
    const c = clients.value.find(x => x.id === clientId)
    const n = niveauAlerte(r, c?.jours_contractualises)
    return { surplus: 'Dépassé', depasse: 'Critique', attention: 'Attention', ok: '' }[n]
}

function sauvegarder() {
    if (!form.value.nom || !form.value.jours_contractualises) return
    if (edition.value) {
        const i = clients.value.findIndex(c => c.id === edition.value.id)
        clients.value[i] = { ...edition.value, ...form.value }
    } else {
        clients.value.push({ id: Date.now(), ...form.value })
    }
    store.setClients(clients.value)
    fermerModale()
}

const confirmerSuppr = ref(null) // client à supprimer

function demanderSuppression(c) {
    confirmerSuppr.value = c
}

function supprimer() {
    if (!confirmerSuppr.value) return
    const id = confirmerSuppr.value.id

    // Supprimer le client
    clients.value = clients.value.filter(c => c.id !== id)
    store.setClients(clients.value)

    // Supprimer aussi le prospect lié s'il existe
    const prospectsMAJ = store.prospects.filter(p => p.client_id !== id)
    store.setProspects(prospectsMAJ)

    confirmerSuppr.value = null
}

function ouvrirAjout() { form.value = { nom: '', secteur: '', jours_contractualises: 10 }; edition.value = null; modale.value = true }
function ouvrirEdition(c) { form.value = { ...c }; edition.value = c; modale.value = true }
function fermerModale() { modale.value = false; edition.value = null }
</script>

<template>
    <div class="layout">
        <Sidebar :user="user" :nbAlertes="nbAlertes" @voirAlertes="voirAlertes = true" />
        <ToastAlertes :clients="clients" :missions="missions" />

        <div class="layout__main">
            <div class="topbar">
                <span class="topbar__titre">Clients</span>
                <div class="topbar__actions">
                    <button v-if="nbAlertes" class="topbar__cloche" @click="voirAlertes = true">
                        🔔 <span class="topbar__cloche-badge">{{ nbAlertes }}</span>
                    </button>
                </div>
            </div>

            <div class="page">

                <!-- KPIs -->
                <div class="kpi-grille clients__kpi">
                    <div class="kpi">
                        <div class="kpi__label">Clients actifs</div>
                        <div class="kpi__valeur">{{ clients.length }}</div>
                    </div>
                    <div class="kpi kpi--accent">
                        <div class="kpi__label">Jours contractualisés</div>
                        <div class="kpi__valeur">{{ totalContrat }}</div>
                    </div>
                    <div class="kpi" :class="totalRealise > totalContrat ? 'kpi--rouge' : 'kpi--vert'">
                        <div class="kpi__label">Jours réalisés</div>
                        <div class="kpi__valeur">{{ totalRealise }}</div>
                        <div class="kpi__sous" v-if="totalRealise > totalContrat">⚠ Dépassement global</div>
                    </div>
                </div>

                <!-- Tableau clients -->
                <div class="carte clients__carte">
                    <div class="carte__entete">
                        <h2>Liste des clients</h2>
                        <input class="clients__recherche" v-model="recherche" placeholder="Rechercher..." />
                    </div>
                    <div class="carte__corps">
                        <div class="tableau-wrap">
                            <table class="tableau">
                                <thead>
                                    <tr>
                                        <th>Client</th>
                                        <th>Secteur</th>
                                        <th>Jours contrat</th>
                                        <th>Jours réalisés</th>
                                        <th>Avancement</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="c in clientsFiltres" :key="c.id">
                                        <td><span class="clients__nom">{{ c.nom }}</span></td>
                                        <td><span class="clients__secteur">{{ c.secteur || '—' }}</span></td>
                                        <td><strong>{{ c.jours_contractualises }}j</strong></td>
                                        <td>{{ joursRealises(c.id) }}j</td>
                                        <td class="clients__avancement">
                                            <div class="progression">
                                                <div
                                                    class="progression__barre"
                                                    :class="classeProgression(joursRealises(c.id), c.jours_contractualises)"
                                                    :style="{ width: pct(joursRealises(c.id), c.jours_contractualises) + '%' }"
                                                ></div>
                                            </div>
                                            <div class="clients__pct">{{ pct(joursRealises(c.id), c.jours_contractualises) }}%</div>
                                        </td>
                                        <!-- Badge alerte -->
                                        <td>
                                            <span
                                                v-if="texteAlerte(c.id)"
                                                class="badge"
                                                :class="classeAlerte(c.id)"
                                            >
                                                {{ texteAlerte(c.id) }}
                                            </span>
                                            <span v-else class="badge badge--valide">OK</span>
                                        </td>
                                        <td>
                                            <div class="clients__actions">
                                                <router-link :to="'/clients/' + c.id" class="btn btn--fantome btn--petit" title="Voir la fiche">👁</router-link>
                                                <button class="btn btn--fantome btn--petit" @click="ouvrirEdition(c)">Éditer</button>
                                                <button class="btn btn--danger btn--petit" @click="demanderSuppression(c)">Suppr.</button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- Modale -->
        <div v-if="modale" class="modale-fond" @click.self="fermerModale">
            <div class="modale">
                <div class="modale__entete">
                    <h2>{{ edition ? 'Modifier client' : 'Nouveau client' }}</h2>
                    <button class="modale__fermer" @click="fermerModale">✕</button>
                </div>
                <div class="modale__corps">
                    <div class="champ">
                        <label>Nom du client *</label>
                        <input v-model="form.nom" placeholder="Ex : WITZENMANN" />
                    </div>
                    <div class="champ">
                        <label>Secteur</label>
                        <input v-model="form.secteur" placeholder="Ex : Industrie, BTP..." />
                    </div>
                    <div class="champ">
                        <label>Jours contractualisés *</label>
                        <input v-model.number="form.jours_contractualises" type="number" min="1" />
                    </div>
                </div>
                <div class="modale__pied">
                    <button class="btn btn--fantome" @click="fermerModale">Annuler</button>
                    <button class="btn btn--primaire" @click="sauvegarder">
                        {{ edition ? 'Modifier' : 'Ajouter' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Confirmation suppression -->
        <div v-if="confirmerSuppr" class="modale-fond" @click.self="confirmerSuppr = null">
            <div class="modale" style="max-width:400px">
                <div class="modale__entete">
                    <h2>Supprimer ce client ?</h2>
                    <button class="modale__fermer" @click="confirmerSuppr = null">✕</button>
                </div>
                <div class="modale__corps">
                    <p style="color:#4A5568">Tu es sur le point de supprimer <strong>{{ confirmerSuppr.nom }}</strong>. Cette action est irréversible.</p>
                </div>
                <div class="modale__pied">
                    <button class="btn btn--fantome" @click="confirmerSuppr = null">Annuler</button>
                    <button class="btn btn--danger" @click="supprimer">Supprimer</button>
                </div>
            </div>
        </div>
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
                    <button class="btn btn--fantome btn--petit" @click="voirAlertes = false">Fermer</button>
                </div>
            </div>
        </div>

    </div>
</template>