<script setup>
import { ref, computed } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import ToastAlertes from '../components/ToastAlertes.vue'

const employes = ref(JSON.parse(localStorage.getItem('ihse_employes') || '[]'))
const clients = ref(JSON.parse(localStorage.getItem('ihse_clients')  || '[]'))
const missions = ref(JSON.parse(localStorage.getItem('ihse_missions') || '[]'))
const user = ref(JSON.parse(localStorage.getItem('ihse_user')     || '{}'))

const filtreEmploye = ref('')
const filtreStatut = ref('')
const filtreClient = ref('')
const modale = ref(false)
const edition = ref(null)

const form = ref({
    titre: '',
    employe_id: null,
    client_id: null,
    date_debut: '',
    date_fin: '',
    nb_jours: 1,
    // Heures fractionnées — saisie manuelle simple
    heures_supp_client: '',   // ex: "1h pour CARBONEX"
    statut: 'en_attente'
})

const missionsFiltrees = computed(() =>
    missions.value.filter(m => {
        if (filtreEmploye.value && m.employe_id !== Number(filtreEmploye.value)) return false
        if (filtreStatut.value  && m.statut !== filtreStatut.value)              return false
        return !(filtreClient.value && m.client_id !== Number(filtreClient.value));

    }).sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut))
)

function nomEmploye(id) { return employes.value.find(e => e.id === id)?.nom || '—' }
function nomClient(id)  { return clients.value.find(c => c.id === id)?.nom  || '—' }
function formaterDate(d){ return d ? new Date(d).toLocaleDateString('fr-FR') : '—' }
function labelStatut(s) { return { valide: 'Validé', en_attente: 'En attente', outlook: 'Outlook' }[s] || s }
function classeBadge(s) { return { valide: 'badge--valide', en_attente: 'badge--attente', outlook: 'badge--outlook' }[s] || '' }

function sauvegarder() {
    if (!form.value.titre || !form.value.employe_id || !form.value.client_id) return
    if (edition.value) {
        const i = missions.value.findIndex(m => m.id === edition.value.id)
        missions.value[i] = { ...edition.value, ...form.value }
    } else {
        missions.value.push({ id: Date.now(), ...form.value })
    }
    localStorage.setItem('ihse_missions', JSON.stringify(missions.value))
    fermerModale()
}

function valider(m) {
    const i = missions.value.findIndex(x => x.id === m.id)
    missions.value[i].statut = 'valide'
    localStorage.setItem('ihse_missions', JSON.stringify(missions.value))
}

function supprimer(id) {
    if (!confirm('Supprimer cette tâche ?')) return
    missions.value = missions.value.filter(m => m.id !== id)
    localStorage.setItem('ihse_missions', JSON.stringify(missions.value))
}

function ouvrirAjout() {
    form.value = { titre: '', employe_id: null, client_id: null, date_debut: '', date_fin: '', nb_jours: 1, heures_supp_client: '', statut: 'en_attente' }
    edition.value = null
    modale.value  = true
}

function ouvrirEdition(m) { form.value = { heures_supp_client: '', ...m }; edition.value = m; modale.value = true }
function fermerModale() { modale.value = false; edition.value = null }
</script>

<template>
    <div class="layout">
        <Sidebar :user="user" />
        <ToastAlertes
            :clients="clients"
            :missions="missions"
            :single="true"
        />

        <div class="layout__main">
            <div class="topbar">
                <span class="topbar__titre">Missions / Tâches</span>
                <div class="topbar__actions">
                    <button class="btn btn--primaire btn--petit" @click="ouvrirAjout">+ Ajouter</button>
                </div>
            </div>

            <div class="page">

                <div class="missions__filtres">
                    <select class="missions__filtre" v-model="filtreEmploye">
                        <option value="">Tous les consultants</option>
                        <option v-for="e in employes" :key="e.id" :value="e.id">{{ e.nom }}</option>
                    </select>
                    <select class="missions__filtre" v-model="filtreStatut">
                        <option value="">Tous les statuts</option>
                        <option value="valide">Validé</option>
                        <option value="en_attente">En attente</option>
                        <option value="outlook">Outlook</option>
                    </select>
                    <select class="missions__filtre" v-model="filtreClient">
                        <option value="">Tous les clients</option>
                        <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.nom }}</option>
                    </select>
                </div>

                <div class="carte missions__carte">
                    <div class="carte__corps">
                        <div class="tableau-wrap">
                            <table class="tableau">
                                <thead>
                                    <tr>
                                        <th>Tâche</th>
                                        <th>Consultant</th>
                                        <th>Client</th>
                                        <th>Dates</th>
                                        <th>Jours</th>
                                        <th>Heures supp.</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="m in missionsFiltrees" :key="m.id">
                                        <td>
                                            <div class="missions__titre">{{ m.titre }}</div>
                                            <div v-if="m.type === 'outlook'" class="missions__outlook">↔ Outlook</div>
                                        </td>
                                        <td>{{ nomEmploye(m.employe_id) }}</td>
                                        <td><span class="missions__client">{{ nomClient(m.client_id) }}</span></td>
                                        <td>
                                            <div class="missions__dates">
                                                {{ formaterDate(m.date_debut) }}<br>→ {{ formaterDate(m.date_fin) }}
                                            </div>
                                        </td>
                                        <td class="missions__jours">{{ m.nb_jours }}</td>
                                        <td style="font-size:.8rem;color:#8092A4;max-width:140px">
                                            {{ m.heures_supp_client || '—' }}
                                        </td>
                                        <td><span class="badge" :class="classeBadge(m.statut)">{{ labelStatut(m.statut) }}</span></td>
                                        <td>
                                            <div class="missions__actions">
                                                <button v-if="m.statut === 'en_attente'" class="btn btn--primaire btn--petit" @click="valider(m)">✓</button>
                                                <button class="btn btn--fantome btn--petit" @click="ouvrirEdition(m)">Éditer</button>
                                                <button class="btn btn--danger btn--petit" @click="supprimer(m.id)">✕</button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr v-if="missionsFiltrees.length === 0">
                                        <td colspan="8" class="missions__vide">Aucune tâche trouvée</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div v-if="modale" class="modale-fond" @click.self="fermerModale">
            <div class="modale">
                <div class="modale__entete">
                    <h2>{{ edition ? 'Modifier la tâche' : 'Nouvelle tâche' }}</h2>
                    <button class="modale__fermer" @click="fermerModale">✕</button>
                </div>
                <div class="modale__corps">
                    <div class="champ">
                        <label>Titre *</label>
                        <input v-model="form.titre" placeholder="Ex : WITZENMANN - Audit sécurité" />
                    </div>
                    <div class="missions__form-grille">
                        <div class="champ">
                            <label>Consultant *</label>
                            <select v-model.number="form.employe_id">
                                <option v-for="e in employes" :key="e.id" :value="e.id">{{ e.nom }}</option>
                            </select>
                        </div>
                        <div class="champ">
                            <label>Client *</label>
                            <select v-model.number="form.client_id">
                                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.nom }}</option>
                            </select>
                        </div>
                        <div class="champ">
                            <label>Date début *</label>
                            <input v-model="form.date_debut" type="date" />
                        </div>
                        <div class="champ">
                            <label>Date fin *</label>
                            <input v-model="form.date_fin" type="date" />
                        </div>
                        <div class="champ">
                            <label>Nombre de jours *</label>
                            <input v-model.number="form.nb_jours" type="number" min="0.5" step="0.5" />
                        </div>
                        <div class="champ">
                            <label>Statut</label>
                            <select v-model="form.statut">
                                <option value="valide">Validé</option>
                                <option value="en_attente">En attente</option>
                            </select>
                        </div>
                    </div>
                    <!-- Heures fractionnées — saisie libre -->
                    <div class="champ">
                        <label>Heures pour un autre client (optionnel)</label>
                        <input
                            v-model="form.heures_supp_client"
                            placeholder="Ex : 1h pour CARBONEX, 30min pour DEBO"
                        />
                        <small style="color:#8092A4;font-size:.75rem;margin-top:3px;display:block">
                            Saisir librement les heures passées pour d'autres clients durant cette journée
                        </small>
                    </div>
                </div>
                <div class="modale__pied">
                    <button class="btn btn--fantome" @click="fermerModale">Annuler</button>
                    <button class="btn btn--primaire" @click="sauvegarder">{{ edition ? 'Modifier' : 'Ajouter' }}</button>
                </div>
            </div>
        </div>

    </div>
</template>
