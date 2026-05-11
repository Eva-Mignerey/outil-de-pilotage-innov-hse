<script setup>
import { ref, computed } from 'vue'
import Sidebar from '../components/Sidebar.vue'

const prospects = ref(JSON.parse(localStorage.getItem('ihse_prospects') || '[]'))
const user = ref(JSON.parse(localStorage.getItem('ihse_user')      || '{}'))

const recherche = ref('')
const filtreStatut = ref('')
const modale = ref(false)
const edition = ref(null)

const form = ref({
    nom: '',
    email: '',
    telephone: '',
    entreprise: '',
    secteur: '',
    date_contact: '',
    date_relance: '',
    statut: 'a_venir',
    priorite: 'normale',
    commentaire:  ''
})

const statuts = [
    { val: 'en_retard', label: 'En retard',  classe: 'badge--alerte-surplus' },
    { val: 'en_cours', label: 'En cours',   classe: 'badge--attente' },
    { val: 'a_venir', label: 'À venir',    classe: 'badge--outlook' },
    { val: 'termine', label: 'Terminé',    classe: 'badge--valide' },
]

function labelStatut(val) { return statuts.find(s => s.val === val)?.label || val }
function classeStatut(val) { return statuts.find(s => s.val === val)?.classe || '' }

// Compteurs par statut
const compteurs = computed(() => {
    const c = {}
    statuts.forEach(s => { c[s.val] = prospects.value.filter(p => p.statut === s.val).length })
    return c
})

const prospectsFiltres = computed(() => {
    return prospects.value.filter(p => {
        const matchRecherche = !recherche.value ||
            p.nom.toLowerCase().includes(recherche.value.toLowerCase()) ||
            p.entreprise?.toLowerCase().includes(recherche.value.toLowerCase())
        const matchStatut = !filtreStatut.value || p.statut === filtreStatut.value
        return matchRecherche && matchStatut
    }).sort((a, b) => {
        // En retard en premier
        const ordre = { en_retard: 0, en_cours: 1, a_venir: 2, termine: 3 }
        return (ordre[a.statut] || 0) - (ordre[b.statut] || 0)
    })
})

function sauvegarder() {
    if (!form.value.nom) return
    if (edition.value) {
        const i = prospects.value.findIndex(p => p.id === edition.value.id)
        prospects.value[i] = { ...edition.value, ...form.value }
    } else {
        prospects.value.push({ id: Date.now(), ...form.value })
    }
    localStorage.setItem('ihse_prospects', JSON.stringify(prospects.value))
    fermerModale()
}

function supprimer(id) {
    if (!confirm('Supprimer ce prospect ?')) return
    prospects.value = prospects.value.filter(p => p.id !== id)
    localStorage.setItem('ihse_prospects', JSON.stringify(prospects.value))
}

// Convertir un prospect en client
function convertirEnClient(prospect) {
    if (!confirm(`Convertir "${prospect.nom}" en client ?`)) return
    const clients = JSON.parse(localStorage.getItem('ihse_clients') || '[]')
    clients.push({
        id: Date.now(),
        nom: prospect.entreprise || prospect.nom,
        secteur: prospect.secteur || '',
        jours_contractualises: 0
    })
    localStorage.setItem('ihse_clients', JSON.stringify(clients))
    // Marquer comme terminé
    const i = prospects.value.findIndex(p => p.id === prospect.id)
    prospects.value[i].statut = 'termine'
    localStorage.setItem('ihse_prospects', JSON.stringify(prospects.value))
    alert(`"${prospect.nom}" ajouté à la liste des clients !`)
}

function ouvrirAjout() {
    form.value = { nom: '', email: '', telephone: '', entreprise: '', secteur: '', date_contact: new Date().toISOString().split('T')[0], date_relance: '', statut: 'a_venir', priorite: 'normale', commentaire: '' }
    edition.value = null
    modale.value = true
}

function ouvrirEdition(p) {
    form.value = { ...p }
    edition.value = p
    modale.value = true
}

function fermerModale() { modale.value = false; edition.value = null }
</script>

<template>
    <div class="layout">
        <Sidebar :user="user" />

        <div class="layout__main">
            <div class="topbar">
                <span class="topbar__titre">Prospects</span>
                <div class="topbar__actions">
                    <button class="btn btn--primaire btn--petit" @click="ouvrirAjout">+ Nouveau prospect</button>
                </div>
            </div>

            <div class="page">

                <!-- Filtres statut style pills -->
                <div class="prospects__pills">
                    <button
                        class="prospects__pill"
                        :class="{ actif: filtreStatut === '' }"
                        @click="filtreStatut = ''"
                    >
                        Tous <span class="prospects__pill-count">{{ prospects.length }}</span>
                    </button>
                    <button
                        v-for="s in statuts"
                        :key="s.val"
                        class="prospects__pill"
                        :class="{ actif: filtreStatut === s.val, ['prospects__pill--' + s.val]: true }"
                        @click="filtreStatut = s.val"
                    >
                        {{ s.label }} <span class="prospects__pill-count">{{ compteurs[s.val] }}</span>
                    </button>
                </div>

                <!-- Tableau -->
                <div class="carte prospects__carte">
                    <div class="carte__entete">
                        <h2>Prospects <span style="font-weight:400;color:#8092A4;font-size:.85rem">{{ prospectsFiltres.length }} résultat(s)</span></h2>
                        <input class="clients__recherche" v-model="recherche" placeholder="Rechercher..." />
                    </div>
                    <div class="carte__corps">
                        <div class="tableau-wrap">
                            <table class="tableau">
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Entreprise</th>
                                        <th>Contact</th>
                                        <th>Date contact</th>
                                        <th>Relance</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="p in prospectsFiltres" :key="p.id">
                                        <td>
                                            <div class="clients__nom">{{ p.nom }}</div>
                                            <div v-if="p.priorite === 'haute'" style="font-size:.72rem;color:#E84B4B;font-weight:600">⬆ Priorité haute</div>
                                        </td>
                                        <td><span class="clients__secteur">{{ p.entreprise || '—' }}</span></td>
                                        <td>
                                            <div style="font-size:.82rem">{{ p.email || '—' }}</div>
                                            <div style="font-size:.78rem;color:#8092A4">{{ p.telephone || '' }}</div>
                                        </td>
                                        <td style="font-size:.82rem;color:#8092A4">{{ p.date_contact || '—' }}</td>
                                        <td style="font-size:.82rem" :style="{ color: p.date_relance && new Date(p.date_relance) < new Date() && p.statut !== 'termine' ? '#E84B4B' : '#8092A4' }">
                                            {{ p.date_relance || '—' }}
                                        </td>
                                        <td>
                                            <span class="badge" :class="classeStatut(p.statut)">
                                                {{ labelStatut(p.statut) }}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="clients__actions">
                                                <button class="btn btn--fantome btn--petit" @click="ouvrirEdition(p)" title="Éditer">✎</button>
                                                <button class="btn btn--valider btn--petit" @click="convertirEnClient(p)" title="Convertir en client">→ Client</button>
                                                <button class="btn btn--danger btn--petit" @click="supprimer(p.id)" title="Supprimer">✕</button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr v-if="prospectsFiltres.length === 0">
                                        <td colspan="7" class="missions__vide">Aucun prospect trouvé</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- Modale ajout / édition -->
        <div v-if="modale" class="modale-fond" @click.self="fermerModale">
            <div class="modale" style="max-width:560px">
                <div class="modale__entete">
                    <h2>{{ edition ? 'Modifier prospect' : 'Nouveau prospect' }}</h2>
                    <button class="modale__fermer" @click="fermerModale">✕</button>
                </div>
                <div class="modale__corps">
                    <div class="missions__form-grille">
                        <div class="champ">
                            <label>Nom du contact *</label>
                            <input v-model="form.nom" placeholder="Ex : Jean Dupont" />
                        </div>
                        <div class="champ">
                            <label>Entreprise</label>
                            <input v-model="form.entreprise" placeholder="Ex : Nom de l'entreprise" />
                        </div>
                        <div class="champ">
                            <label>Email</label>
                            <input v-model="form.email" type="email" placeholder="jean.dupont@..." />
                        </div>
                        <div class="champ">
                            <label>Téléphone</label>
                            <input v-model="form.telephone" placeholder="0X XX XX XX XX" />
                        </div>
                        <div class="champ">
                            <label>Secteur</label>
                            <input v-model="form.secteur" placeholder="Ex : Commerce, BTP..." />
                        </div>
                        <div class="champ">
                            <label>Priorité</label>
                            <select v-model="form.priorite">
                                <option value="normale">Normale</option>
                                <option value="haute">Haute</option>
                            </select>
                        </div>
                        <div class="champ">
                            <label>Date de contact</label>
                            <input v-model="form.date_contact" type="date" />
                        </div>
                        <div class="champ">
                            <label>Date de relance</label>
                            <input v-model="form.date_relance" type="date" />
                        </div>
                        <div class="champ">
                            <label>Statut</label>
                            <select v-model="form.statut">
                                <option v-for="s in statuts" :key="s.val" :value="s.val">{{ s.label }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="champ">
                        <label>Commentaire</label>
                        <textarea v-model="form.commentaire" rows="3" placeholder="Notes, contexte..."></textarea>
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

    </div>
</template>
