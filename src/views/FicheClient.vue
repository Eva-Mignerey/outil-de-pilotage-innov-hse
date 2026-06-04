<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
import store from '@/store.js'

const route = useRoute()
const router = useRouter()

const user = computed(() => store.user || {})
const employes = computed(() => store.employes)

const client = computed(() =>
    store.clients.find(c => c.id === Number(route.params.id))
)

const missionsClient = computed(() =>
    store.missions
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

const extra = (champ, defaut = '') => store.getClientExtra(client.value?.id, champ, defaut)
const sauver = (champ, valeur) => store.setClientExtra(client.value.id, champ, valeur)

const mail = computed({ get: () => extra('mail'), set: (v) => sauver('mail', v) })
const telephone = computed({ get: () => extra('telephone'), set: (v) => sauver('telephone', v) })
const titulaire = computed({ get: () => extra('titulaire_id'), set: (v) => sauver('titulaire_id', v ? Number(v) : null) })
const suppleant = computed({ get: () => extra('suppleant_id'), set: (v) => sauver('suppleant_id', v ? Number(v) : null) })
const missionsTypes = computed(() => extra('missions_types', []))

const tagInput = ref('')

const ajouterTag = () => {
    const val = tagInput.value.trim()
    if (!val || missionsTypes.value.includes(val)) return
    sauver('missions_types', [...missionsTypes.value, val])
    tagInput.value = ''
}

const supprimerTag = (tag) => {
    sauver('missions_types', missionsTypes.value.filter(t => t !== tag))
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

                <div class="carte" style="margin-bottom:18px">
                    <div class="carte__corps">
                        <div class="fiche__progression-header">
                            <span><strong>{{ client.nom }}</strong> — {{ client.secteur || 'Secteur non renseigné' }}</span>
                            <span class="fiche__progression-pct">{{ pct }}%</span>
                        </div>
                        <div class="progression" style="height:12px">
                            <div
                                class="progression__barre"
                                :class="classeProgression(pct)"
                                :style="{ width: pct + '%' }"
                            ></div>
                        </div>
                        <div class="fiche__progression-label">
                            {{ joursRealises }}j réalisés sur {{ client.jours_contractualises }}j contractualisés
                        </div>
                    </div>
                </div>

                <div class="fiche__grille">

                    <div class="carte">
                        <div class="carte__entete"><h2>Contact</h2></div>
                        <div class="carte__corps">
                            <div class="champ">
                                <label>Adresse e-mail</label>
                                <input type="email" :value="mail" @change="mail = $event.target.value" placeholder="contact@exemple.fr" />
                            </div>
                            <div class="champ" style="margin-bottom:0">
                                <label>Téléphone</label>
                                <input type="tel" :value="telephone" @change="telephone = $event.target.value" placeholder="06 00 00 00 00" />
                            </div>
                        </div>
                    </div>

                    <div class="carte">
                        <div class="carte__entete"><h2>Personnes référentes</h2></div>
                        <div class="carte__corps">
                            <div class="champ">
                                <label>Titulaire</label>
                                <select :value="titulaire" @change="titulaire = $event.target.value">
                                    <option value="">— Sélectionner —</option>
                                    <option v-for="e in employes" :key="e.id" :value="e.id">{{ e.nom }}</option>
                                </select>
                            </div>
                            <div class="champ" style="margin-bottom:0">
                                <label>Suppléant</label>
                                <select :value="suppleant" @change="suppleant = $event.target.value">
                                    <option value="">— Sélectionner —</option>
                                    <option v-for="e in employes" :key="e.id" :value="e.id">{{ e.nom }}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="carte fiche__grille-full">
                        <div class="carte__entete"><h2>Types de missions demandées</h2></div>
                        <div class="carte__corps">
                            <div class="fiche__tags">
                                <span v-for="tag in missionsTypes" :key="tag" class="fiche__tag">
                                    {{ tag }}
                                    <button class="fiche__tag-suppr" @click="supprimerTag(tag)">×</button>
                                </span>
                                <span v-if="missionsTypes.length === 0" class="fiche__tags-vide">Aucun type renseigné</span>
                            </div>
                            <div class="fiche__tag-input">
                                <input
                                    v-model="tagInput"
                                    placeholder="Ajouter un type de mission…"
                                    @keydown.enter.prevent="ajouterTag"
                                />
                                <button class="btn btn--primaire btn--petit" @click="ajouterTag">Ajouter</button>
                            </div>
                        </div>
                    </div>
                </div>

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