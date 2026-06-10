<script setup>
import { ref, computed } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import store from '../../store.js'
import { estAdmin } from '../permissions.js'

const user = computed(() => store.user || {})

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
    besoins: []
})

const clientsCommeProspects = computed(() =>
    store.clients.map(c => ({
        _estClient: true,
        id: 'client-' + c.id,
        nom: c.nom,
        entreprise: c.nom,
        secteur: c.secteur || '',
        email: '',
        telephone: '',
        date_contact: '',
        date_relance: '',
        statut: 'termine',
        priorite: 'normale',
        besoins: []
    }))
)

const tousLesProspects = computed(() => [
    ...store.prospects,
    ...clientsCommeProspects.value
])

const statuts = [
    { val: 'en_retard', label: 'En retard', classe: 'badge--alerte-surplus' },
    { val: 'en_cours', label: 'En cours', classe: 'badge--attente' },
    { val: 'a_venir', label: 'À venir', classe: 'badge--outlook' },
    { val: 'termine', label: 'Terminé', classe: 'badge--valide' },
]

function labelStatut(val) { return statuts.find(s => s.val === val)?.label || val }
function classeStatut(val) { return statuts.find(s => s.val === val)?.classe || '' }

const compteurs = computed(() => {
    const c = {}
    statuts.forEach(s => { c[s.val] = tousLesProspects.value.filter(p => p.statut === s.val).length })
    return c
})

const prospectsFiltres = computed(() => {
    return tousLesProspects.value.filter(p => {
        const matchRecherche = !recherche.value ||
            p.nom.toLowerCase().includes(recherche.value.toLowerCase()) ||
            p.entreprise?.toLowerCase().includes(recherche.value.toLowerCase())
        const matchStatut = !filtreStatut.value || p.statut === filtreStatut.value
        return matchRecherche && matchStatut
    }).sort((a, b) => {
        const ordre = { en_retard: 0, en_cours: 1, a_venir: 2, termine: 3 }
        return (ordre[a.statut] || 0) - (ordre[b.statut] || 0)
    })
})

function sauvegarder() {
    if (!form.value.nom) return
    if (edition.value?._clientId) {
        sauvegarderClient()
        return
    }
    if (edition.value) {
        const liste = store.prospects.map(p =>
            p.id === edition.value.id ? { ...p, ...form.value } : p
        )
        store.setProspects(liste)
    } else {
        store.setProspects([...store.prospects, { id: Date.now(), ...form.value }])
    }
    fermerModale()
}

const confirmerSuppr = ref(null)

function demanderSuppression(p) {
    confirmerSuppr.value = p
}

function supprimer() {
    const p = confirmerSuppr.value
    if (!p) return

    if (p._estClient) {
        const id = p.id.toString().replace('client-', '')
        store.setClients(store.clients.filter(c => c.id.toString() !== id))
        store.setProspects(store.prospects.filter(x => x.client_id?.toString() !== id))
    } else {
        const clientId = p.client_id
        store.setProspects(store.prospects.filter(x => x.id !== p.id))
        if (clientId) {
            store.setClients(store.clients.filter(c => c.id !== clientId))
        }
    }
    confirmerSuppr.value = null
}

function ouvrirEditionClient(p) {
    const id = p.id.toString().replace('client-', '')
    const client = store.clients.find(c => c.id.toString() === id)
    if (!client) return
    form.value = { ...client, besoins: Array.isArray(client.besoins) ? [...client.besoins] : [], _clientId: client.id }
    edition.value = { ...p, _clientId: client.id }
    modale.value = true
}

function sauvegarderClient() {
    const id = edition.value._clientId
    store.setClients(store.clients.map(c =>
        c.id === id ? { ...c, nom: form.value.nom, secteur: form.value.secteur } : c
    ))
    fermerModale()
}

function convertirEnClient(prospect) {
    if (!confirm(`Convertir "${prospect.nom}" en client ?`)) return
    const clientId = Date.now()
    store.setClients([...store.clients, {
        id: clientId,
        nom: prospect.entreprise || prospect.nom,
        secteur: prospect.secteur || '',
        jours_contractualises: 0,
        prospect_id: prospect.id
    }])
    store.setProspects(store.prospects.map(p =>
        p.id === prospect.id ? { ...p, statut: 'termine', client_id: clientId } : p
    ))
    alert(`"${prospect.nom}" ajouté à la liste des clients !`)
}

function ouvrirAjout() {
    form.value = { nom: '', email: '', telephone: '', entreprise: '', secteur: '', date_contact: new Date().toISOString().split('T')[0], date_relance: '', statut: 'a_venir', priorite: 'normale', besoins: [] }
    edition.value = null
    modale.value = true
}

function ouvrirEdition(p) {
    form.value = { ...p, besoins: Array.isArray(p.besoins) ? [...p.besoins] : [] }
    edition.value = p
    modale.value = true
}

const tagInput = ref('')

const ajouterTag = () => {
    const val = tagInput.value.trim()
    if (!val || form.value.besoins.includes(val)) return
    form.value.besoins = [...form.value.besoins, val]
    tagInput.value = ''
}

const supprimerTag = (tag) => {
    form.value.besoins = form.value.besoins.filter(t => t !== tag)
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
                    <button v-if="estAdmin" class="btn btn--primaire btn--petit" @click="ouvrirAjout">+ Nouveau prospect</button>
                </div>
            </div>

            <div class="page">

                <div class="prospects__pills">
                    <button
                        class="prospects__pill"
                        :class="{ actif: filtreStatut === '' }"
                        @click="filtreStatut = ''"
                    >
                        Tous <span class="prospects__pill-count">{{ tousLesProspects.length }}</span>
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
                                            <span v-if="p._estClient || p.statut === 'termine'" class="badge badge--outlook" style="margin-left:4px">Client</span>
                                        </td>
                                        <td>
                                            <div class="clients__actions">
                                                <template v-if="estAdmin">
                                                    <button
                                                        class="btn btn--fantome btn--petit"
                                                        @click="p._estClient ? ouvrirEditionClient(p) : ouvrirEdition(p)"
                                                        title="Éditer"
                                                    >✎</button>
                                                    <template v-if="!p._estClient">
                                                        <button
                                                            v-if="p.statut !== 'termine'"
                                                            class="btn btn--valider btn--petit"
                                                            @click="convertirEnClient(p)"
                                                            title="Convertir en client"
                                                        >→ Client</button>
                                                    </template>
                                                    <button
                                                        class="btn btn--danger btn--petit"
                                                        @click="demanderSuppression(p)"
                                                        title="Supprimer"
                                                    >✕</button>
                                                </template>
                                                <span v-else style="font-size:.78rem;color:#8092A4">—</span>
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
                            <input v-model="form.nom" />
                        </div>
                        <div class="champ">
                            <label>Entreprise</label>
                            <input v-model="form.entreprise" />
                        </div>
                        <div class="champ">
                            <label>Email</label>
                            <input v-model="form.email" type="email" />
                        </div>
                        <div class="champ">
                            <label>Téléphone</label>
                            <input v-model="form.telephone" />
                        </div>
                        <div class="champ">
                            <label>Secteur</label>
                            <input v-model="form.secteur" />
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
                        <div class="fiche__tags">
                            <span v-for="tag in form.besoins" :key="tag" class="fiche__tag">
                                {{ tag }}
                                <button class="fiche__tag-suppr" @click="supprimerTag(tag)">×</button>
                            </span>
                            <span v-if="form.besoins.length === 0" class="fiche__tags-vide">Aucun besoin renseigné</span>
                        </div>
                        <div class="fiche__tag-input">
                            <input 
                                v-model="tagInput"
                                placeholder="Ajouter un besoin…"
                                @keydown.enter.prevent="ajouterTag"
                            />
                            <button class="btn btn--primaire btn--petit" @click="ajouterTag">Ajouter</button>
                        </div>
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
                    <h2>Supprimer ?</h2>
                    <button class="modale__fermer" @click="confirmerSuppr = null">✕</button>
                </div>
                <div class="modale__corps">
                    <p style="color:#4A5568">
                        Tu es sur le point de supprimer <strong>{{ confirmerSuppr.nom }}</strong>.
                        <template v-if="confirmerSuppr._estClient"> Cette action le supprimera aussi de la page Clients.</template>
                        Cette action est irréversible.
                    </p>
                </div>
                <div class="modale__pied">
                    <button class="btn btn--fantome" @click="confirmerSuppr = null">Annuler</button>
                    <button class="btn btn--danger" @click="supprimer">Supprimer</button>
                </div>
            </div>
        </div>

    </div>
</template>