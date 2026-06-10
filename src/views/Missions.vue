<script setup>
import { ref, computed } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import ToastAlertes from '../components/ToastAlertes.vue'
import store from '../../store.js'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const employes = computed(() => store.employes)
const clients = computed(() => store.clients)
const user = computed(() => store.user || {})
const missions = computed(() => store.missions)

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
    heures_supp_client: '',
    statut: 'en_attente'
})

const missionsFiltrees = computed(() =>
    missions.value.filter(m => {
        if (filtreEmploye.value && m.employe_id !== Number(filtreEmploye.value)) return false
        if (filtreStatut.value && m.statut !== filtreStatut.value) return false
        return !(filtreClient.value && m.client_id !== Number(filtreClient.value))
    }).sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut))
)

function nomEmploye(id) { return employes.value.find(e => e.id === id)?.nom || '—' }
function nomClient(id) { return clients.value.find(c => c.id === id)?.nom || '—' }
function formaterDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '—' }
function formaterDatePDF(d) {
    if (!d) return '—'
    const [y, m, j] = d.split('-')
    return `${j}/${m}/${y}`
}
function labelStatut(s) { return { valide: 'Validé', en_attente: 'En attente', outlook: 'Outlook' }[s] || s }
function classeBadge(s) { return { valide: 'badge--valide', en_attente: 'badge--attente', outlook: 'badge--outlook' }[s] || '' }

async function sauvegarder() {
    if (!form.value.titre || !form.value.employe_id || !form.value.client_id) return
    if (edition.value) {
        await store.setMissions(store.missions.map(m =>
            m.id === edition.value.id ? { ...m, ...form.value } : m
        ))
    } else {
        await store.setMissions([...store.missions, { id: Date.now(), ...form.value }])
    }
    fermerModale()
}

async function valider(m) {
    await store.setMissions(store.missions.map(x =>
        x.id === m.id ? { ...x, statut: 'valide' } : x
    ))
}

async function supprimer(id) {
    if (!confirm('Supprimer cette tâche ?')) return
    await store.setMissions(store.missions.filter(m => m.id !== id))
}

function ouvrirAjout() {
    form.value = { titre: '', employe_id: null, client_id: null, date_debut: '', date_fin: '', nb_jours: 1, heures_supp_client: '', statut: 'en_attente' }
    edition.value = null
    modale.value = true
}

function ouvrirEdition(m) { form.value = { heures_supp_client: '', ...m }; edition.value = m; modale.value = true }
function fermerModale() { modale.value = false; edition.value = null }

const lignesOuvertes = ref(new Set())
function toggleLigne(id) {
    if (lignesOuvertes.value.has(id)) lignesOuvertes.value.delete(id)
    else lignesOuvertes.value.add(id)
    lignesOuvertes.value = new Set(lignesOuvertes.value)
}

const inputsCommentaire = ref({})
const editionCommentaire = ref({})

function getCommentaires(missionId) {
    const raw = store.getMissionExtra(missionId, 'commentaires', '')
    return raw ? raw.split('\n').filter(l => l) : []
}

function ajouterLigne(missionId) {
    const val = (inputsCommentaire.value[missionId] || '').trim()
    if (!val) return
    const lignes = getCommentaires(missionId)
    store.setMissionExtra(missionId, 'commentaires', [...lignes, val].join('\n'))
    inputsCommentaire.value[missionId] = ''
}

function supprimerLigne(missionId, index) {
    const lignes = getCommentaires(missionId)
    lignes.splice(index, 1)
    store.setMissionExtra(missionId, 'commentaires', lignes.join('\n'))
}

function commencerEdition(missionId, index, texte) {
    editionCommentaire.value = { missionId, index, texte }
}

function sauvegarderEdition() {
    const { missionId, index, texte } = editionCommentaire.value
    const lignes = getCommentaires(missionId)
    lignes[index] = texte
    store.setMissionExtra(missionId, 'commentaires', lignes.join('\n'))
    editionCommentaire.value = {}
}

function exportPDF() {
    const doc = new jsPDF()

    const titre = "Innov'HSE — Missions / Tâches"
    const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

    let sous = []
    if (filtreEmploye.value) sous.push(nomEmploye(Number(filtreEmploye.value)))
    if (filtreClient.value) sous.push(nomClient(Number(filtreClient.value)))
    if (filtreStatut.value) sous.push(labelStatut(filtreStatut.value))
    const sousTitre = sous.length ? sous.join(' · ') : 'Toutes les missions'

    doc.setFontSize(18)
    doc.setTextColor(49, 86, 145)
    doc.text(titre, 14, 18)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`${sousTitre} — ${date}`, 14, 26)
    doc.setDrawColor(220)
    doc.line(14, 30, 196, 30)

    const lignes = missionsFiltrees.value.map(m => [
        m.titre,
        nomEmploye(m.employe_id),
        nomClient(m.client_id),
        `${formaterDatePDF(m.date_debut)} - ${formaterDatePDF(m.date_fin)}`,
        `${m.nb_jours || 0}j`,
        m.heures_supp_client || '—',
        labelStatut(m.statut)
    ])

    autoTable(doc, {
        startY: 36,
        head: [['Tâche', 'Consultant', 'Client', 'Dates', 'Jours', 'Heures supp.', 'Statut']],
        body: lignes.length ? lignes : [['Aucune mission trouvée', '', '', '', '', '', '']],
        theme: 'striped',
        headStyles: { fillColor: [49, 86, 145] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 40 },
            3: { cellWidth: 42 },
        }
    })

    doc.save(`missions-${new Date().toISOString().slice(0, 10)}.pdf`)
}
</script>

<template>
    <div class="layout">
        <Sidebar :user="user" />
        <ToastAlertes :clients="clients" :missions="missions" :single="true" />

        <div class="layout__main">
            <div class="topbar">
                <span class="topbar__titre">Missions / Tâches</span>
                <div class="topbar__actions">
                    <button class="btn btn--fantome btn--petit" @click="exportPDF">↓ PDF</button>
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
                                    <template v-for="m in missionsFiltrees" :key="m.id">
                                        <tr>
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
                                                    <button
                                                        class="btn btn--fantome btn--petit missions__btn-commentaire"
                                                        :class="{ 'missions__btn-commentaire--actif': lignesOuvertes.has(m.id) }"
                                                        @click="toggleLigne(m.id)"
                                                        title="Commentaire"
                                                    >▼<span v-if="getCommentaires(m.id).length" class="missions__commentaire-dot"></span></button>
                                                    <button class="btn btn--danger btn--petit" @click="supprimer(m.id)">✕</button>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr v-if="lignesOuvertes.has(m.id)" class="missions__tr-commentaire">
                                            <td colspan="8" class="missions__td-commentaire">
                                                <ul class="missions__commentaire-liste">
                                                    <li v-for="(ligne, i) in getCommentaires(m.id)" :key="i">
                                                        <template v-if="editionCommentaire.missionId === m.id && editionCommentaire.index === i">
                                                            <input
                                                                class="missions__commentaire-edit"
                                                                v-model="editionCommentaire.texte"
                                                                @keydown.enter.prevent="sauvegarderEdition"
                                                                @keydown.escape="editionCommentaire = {}"
                                                            />
                                                            <button class="missions__commentaire-suppr" @click="sauvegarderEdition">✓</button>
                                                            <button class="missions__commentaire-suppr" @click="editionCommentaire = {}">✕</button>
                                                        </template>
                                                        <template v-else>
                                                            {{ ligne }}
                                                            <button class="missions__commentaire-suppr missions__commentaire-edit-btn" @click="commencerEdition(m.id, i, ligne)">✎</button>
                                                            <button class="missions__commentaire-suppr" @click="supprimerLigne(m.id, i)">×</button>
                                                        </template>
                                                    </li>
                                                </ul>
                                                <input
                                                    class="missions__commentaire-input"
                                                    v-model="inputsCommentaire[m.id]"
                                                    placeholder="Ajouter un élément…"
                                                    @keydown.enter.prevent="ajouterLigne(m.id)"
                                                    />
                                            </td>
                                        </tr>
                                    </template>
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
                        <input v-model="form.titre" />
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
                    <div class="champ">
                        <label>Heures pour un autre client (optionnel)</label>
                        <input v-model="form.heures_supp_client" />
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