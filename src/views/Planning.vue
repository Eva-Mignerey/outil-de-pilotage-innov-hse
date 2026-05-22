<script setup>
import { ref, computed } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import ToastAlertes from '../components/ToastAlertes.vue'
import { alertesActives } from '../services/alertes.js'
import store from '@/store.js'

const employes = computed(() => store.employes)
const clients  = computed(() => store.clients)
const missions = computed(() => store.missions)
const user     = computed(() => store.user || {})

const now           = new Date()
const annee         = ref(now.getFullYear())
const mois          = ref(now.getMonth())
const filtreEmploye = ref('')
const detail        = ref(null)
const popupAlerte   = ref(null)
const voirAlertes   = ref(false)
const vueGlobale    = ref(false) // bascule vue mois / vue trimestrielle

const couleurs = ['#1B4F8A','#E8A020','#1A7A4A','#C0392B','#7B2D8B','#1A6B8A','#E67E22','#2E86C1','#8E44AD','#16A085']

const alertes   = computed(() => alertesActives(clients.value, missions.value))
const nbAlertes = computed(() => alertes.value.length)

const titreMois = computed(() =>
    new Date(annee.value, mois.value).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
)

// Jours du mois pour le calendrier
const jours = computed(() => {
    const nb = new Date(annee.value, mois.value + 1, 0).getDate()
    return Array.from({ length: nb }, (_, i) => {
        const d   = new Date(annee.value, mois.value, i + 1)
        const dow = d.getDay()
        return {
            date:    d.toISOString().split('T')[0],
            num:     i + 1,
            lettre:  ['D','L','M','M','J','V','S'][dow],
            weekend: dow === 0 || dow === 6
        }
    })
})

// Jours ouvrés d'un mois donné
function joursOuvres(a, m) {
    const nb = new Date(a, m + 1, 0).getDate()
    let count = 0
    for (let i = 1; i <= nb; i++) {
        const dow = new Date(a, m, i).getDay()
        if (dow !== 0 && dow !== 6) count++
    }
    return count
}

const joursOuvresMois = computed(() => joursOuvres(annee.value, mois.value))

// Missions d'un employé pour un mois donné
function missionsDuMois(empId, a, m) {
    const debut = new Date(a, m, 1).toISOString().split('T')[0]
    const fin   = new Date(a, m + 1, 0).toISOString().split('T')[0]
    return missions.value.filter(x =>
        x.employe_id === empId && x.date_fin >= debut && x.date_debut <= fin
    )
}

// Jours planifiés (validés) d'un employé pour un mois
function joursPlannifies(empId, a, m) {
    return missionsDuMois(empId, a, m)
        .filter(x => x.statut === 'valide')
        .reduce((s, x) => s + (x.nb_jours || 0), 0)
}

// Jours à planifier (en attente) d'un employé pour un mois
function joursAPlanifier(empId, a, m) {
    return missionsDuMois(empId, a, m)
        .filter(x => x.statut === 'en_attente')
        .reduce((s, x) => s + (x.nb_jours || 0), 0)
}

// Formules :
// jours_dus = jours_plannifies + jours_a_planifier
// jours_non_charges = jours_ouvres - jours_dus
function joursDus(empId, a, m) {
    return joursPlannifies(empId, a, m) + joursAPlanifier(empId, a, m)
}

function joursNonCharges(empId, a, m) {
    return Math.max(joursOuvres(a, m) - joursDus(empId, a, m), 0)
}

// 3 mois du trimestre en cours
const trimestre = computed(() => {
    // On prend le mois du calendrier et les 2 suivants
    return [0, 1, 2].map(i => {
        const m2 = (mois.value + i) % 12
        const a2 = annee.value + Math.floor((mois.value + i) / 12)
        return {
            mois: m2,
            annee: a2,
            label: new Date(a2, m2).toLocaleDateString('fr-FR', { month: 'long' }),
            joursOuvres: joursOuvres(a2, m2)
        }
    })
})

// Filtrage des employés pour le tableau
const employesFiltres = computed(() =>
    filtreEmploye.value
        ? employes.value.filter(e => e.id === Number(filtreEmploye.value))
        : employes.value
)

// Mission du jour pour un employé donné
function missionDuJour(empId, date) {
    return missions.value.find(m =>
        m.employe_id === empId && date >= m.date_debut && date <= m.date_fin
    )
}

// Couleur associée à un client
function couleurClient(clientId) {
    const i = clients.value.findIndex(c => c.id === clientId)
    return couleurs[i % couleurs.length]
}

// Taux de charge d'un employé : (jours planifiés / capacité) * 100
function tauxCharge(empId) {
    const emp = employes.value.find(e => e.id === empId)
    if (!emp) return 0
    const j = missions.value.filter(m => m.employe_id === empId && m.statut === 'valide').reduce((s, m) => s + (m.nb_jours || 0), 0)
    return Math.min(Math.round((j / (emp.capacite_jours || 1)) * 100), 100)
}

// Alerte si un employé à plus de jours planifiés que de jours ouvrés dans le mois 
function alertePlanningEmploye(empId) {
    const realise = joursPlannifies(empId, annee.value, mois.value)
    if (realise > joursOuvresMois.value) return { type: 'surplus', msg: `+${realise - joursOuvresMois.value}j ce mois` }
    if (realise === joursOuvresMois.value) return { type: 'plein', msg: 'Mois complet' }
    return null
}

// Utilitaires
function nomEmploye(id)  { return employes.value.find(e => e.id === id)?.nom || '—' }
function formaterDate(d) { return new Date(d).toLocaleDateString('fr-FR') }
function labelStatut(s)  { return { valide: 'Validé', en_attente: 'En attente', outlook: 'Outlook' }[s] || s }
function classeBadge(s)  { return { valide: 'badge--valide', en_attente: 'badge--attente', outlook: 'badge--outlook' }[s] || '' }

function moisPrecedent() { mois.value === 0  ? (mois.value = 11, annee.value--) : mois.value-- }
function moisSuivant()   { mois.value === 11 ? (mois.value = 0,  annee.value++) : mois.value++ }

// Couleur de l'écart ; rouge = surchargé, vert =sous-chargé, gris = équilibré
function couleurEcart(ecart) {
    if (ecart > 0) return '#E84B4B'
    if (ecart < 0) return '#8092A4'
    return '#1A7A4A'
}
</script>

<template>
    <div class="layout">
        <Sidebar :user="user" :nbAlertes="nbAlertes" @voirAlertes="voirAlertes = true" />
        <ToastAlertes :clients="clients" :missions="missions" />

        <div class="layout__main">
            <div class="topbar">
                <span class="topbar__titre">Planning</span>
                <div class="topbar__actions planning__nav">
                    <button class="btn btn--fantome btn--petit" @click="moisPrecedent">‹</button>
                    <span class="planning__mois">{{ titreMois }}</span>
                    <button class="btn btn--fantome btn--petit" @click="moisSuivant">›</button>
                    <select class="planning__filtre" v-model="filtreEmploye">
                        <option value="">Toute l'équipe</option>
                        <option v-for="e in employes" :key="e.id" :value="e.id">{{ e.nom.split(' ')[0] }}</option>
                    </select>
                    <button v-if="nbAlertes" class="topbar__cloche" @click="voirAlertes = true">
                        🔔 <span class="topbar__cloche-badge">{{ nbAlertes }}</span>
                    </button>
                </div>
            </div>

            <div class="page">

                <!-- Calendrier -->
                <div class="carte planning__carte">
                    <div class="carte__entete">
                        <h2>Planning {{ titreMois }}</h2>
                        <span style="font-size:.8rem;color:#8092A4">{{ joursOuvresMois }} jours ouvrés</span>
                    </div>
                    <div class="carte__corps">

                        <!-- Desktop : tableau -->
                        <div class="planning__scroll-wrap">
                            <table class="planning__tableau">
                                <thead>
                                    <tr>
                                        <th class="planning__col-consultant">Consultant</th>
                                        <th
                                            v-for="jour in jours" :key="jour.date"
                                            class="planning__en-tete-jour"
                                            :class="{ 'planning__en-tete-jour--weekend': jour.weekend }"
                                        >
                                            <div class="planning__jour-lettre">{{ jour.lettre }}</div>
                                            <div class="planning__jour-num">{{ jour.num }}</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="emp in employesFiltres" :key="emp.id">
                                        <td class="planning__consultant">
                                            {{ emp.nom.split(' ')[0] }}
                                            <div class="planning__taux">{{ tauxCharge(emp.id) }}%</div>
                                            <div
                                                v-if="alertePlanningEmploye(emp.id)"
                                                class="planning__alerte-emp"
                                                :class="'planning__alerte-emp--' + alertePlanningEmploye(emp.id).type"
                                            >{{ alertePlanningEmploye(emp.id).msg }}</div>
                                        </td>
                                        <td
                                            v-for="jour in jours" :key="jour.date"
                                            class="planning__cellule"
                                            :class="{ 'planning__cellule--weekend': jour.weekend }"
                                        >
                                            <div
                                                v-if="missionDuJour(emp.id, jour.date)"
                                                class="planning__mission"
                                                :style="{ background: couleurClient(missionDuJour(emp.id, jour.date).client_id) }"
                                                :title="missionDuJour(emp.id, jour.date).titre"
                                                @click="detail = missionDuJour(emp.id, jour.date)"
                                            >
                                                {{ missionDuJour(emp.id, jour.date).titre.substring(0, 5) }}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Mobile : liste -->
                        <div class="planning__liste-mobile">
                            <div v-for="emp in employesFiltres" :key="emp.id" class="planning__liste-consultant">
                                <div class="planning__liste-nom">
                                    {{ emp.nom.split(' ')[0] }}
                                    <span style="font-weight:400;color:#8092A4;font-size:.78rem"> — {{ tauxCharge(emp.id) }}%</span>
                                </div>
                                <div class="planning__liste-missions">
                                    <div
                                        v-for="m in missionsDuMois(emp.id, annee, mois)"
                                        :key="m.id"
                                        class="planning__liste-mission"
                                        @click="detail = m"
                                    >
                                        <div class="planning__liste-couleur" :style="{ background: couleurClient(m.client_id) }"></div>
                                        <div class="planning__liste-info">
                                            <div class="planning__liste-titre">{{ m.titre }}</div>
                                            <div class="planning__liste-dates">{{ formaterDate(m.date_debut) }} → {{ formaterDate(m.date_fin) }} · {{ m.nb_jours }}j</div>
                                        </div>
                                    </div>
                                    <div v-if="missionsDuMois(emp.id, annee, mois).length === 0" class="planning__liste-vide">
                                        Aucune tâche ce mois
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- données réelles -->
                <div class="carte">
                    <div class="carte__entete">
                        <h2>Données réelles</h2>
                        <div style="display:flex;align-items:center;gap:10px">
                            <!-- <span style="font-size:.78rem;color:#8092A4">
                                Formules :
                                <strong>Planifiés + À planifier = Dûs</strong>
                                &nbsp;|&nbsp;
                                <strong>Non chargés + Dûs = Jours ouvrés</strong>
                            </span> -->
                            <button
                                class="btn btn--fantome btn--petit"
                                @click="vueGlobale = !vueGlobale"
                            >
                                {{ vueGlobale ? 'Vue mois' : 'Vue trimestrielle' }}
                            </button>
                        </div>
                    </div>

                    <div class="carte__corps" style="padding:0">

                        <!-- VUE PAR MOIS (défaut) -->
                        <div v-if="!vueGlobale">

                            <!-- Desktop : tableau -->
                            <div class="planning__donnees-tableau">
                                <div class="tableau-wrap">
                                    <table class="tableau">
                                        <thead>
                                            <tr>
                                                <th>Consultant</th>
                                                <th style="background:#EFF4FF;color:#315691">Jours ouvrés</th>
                                                <th style="background:#E8F5E9;color:#1A7A4A">Planifiés</th>
                                                <th style="background:#FFF8E1;color:#856404">À planifier</th>
                                                <th style="background:#E3F2FD;color:#1B4F8A;font-weight:700">Jours dûs</th>
                                                <th style="background:#FCE4EC;color:#C0392B">Non chargés</th>
                                                <th>Vérification</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="emp in employesFiltres" :key="emp.id">
                                                <td style="font-weight:600">{{ emp.nom.split(' ')[0] }}</td>
                                                <td style="text-align:center;font-weight:600;color:#315691">
                                                    {{ joursOuvresMois }}j
                                                </td>
                                                <td style="text-align:center;color:#1A7A4A;font-weight:600">
                                                    {{ joursPlannifies(emp.id, annee, mois) }}j
                                                </td>
                                                <td style="text-align:center;color:#856404">
                                                    {{ joursAPlanifier(emp.id, annee, mois) }}j
                                                </td>
                                                <td style="text-align:center;font-weight:700;color:#1B4F8A">
                                                    {{ joursDus(emp.id, annee, mois) }}j
                                                </td>
                                                <td style="text-align:center" :style="{ color: joursNonCharges(emp.id, annee, mois) > 0 ? '#C0392B' : '#1A7A4A', fontWeight: '600' }">
                                                    {{ joursNonCharges(emp.id, annee, mois) }}j
                                                </td>
                                                <td style="text-align:center">
                                                    <!-- Vérification : non chargés + dûs doit = jours ouvrés -->
                                                    <span
                                                        :style="{ color: (joursNonCharges(emp.id, annee, mois) + joursDus(emp.id, annee, mois)) === joursOuvresMois ? '#1A7A4A' : '#E84B4B' }"
                                                        :title="'Non chargés + Dûs = ' + (joursNonCharges(emp.id, annee, mois) + joursDus(emp.id, annee, mois)) + 'j'"
                                                    >
                                                        {{ (joursNonCharges(emp.id, annee, mois) + joursDus(emp.id, annee, mois)) === joursOuvresMois ? '✓ OK' : '⚠ ' + (joursNonCharges(emp.id, annee, mois) + joursDus(emp.id, annee, mois)) + 'j / ' + joursOuvresMois + 'j' }}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Mobile : cartes -->
                            <div class="planning__donnees-cartes">
                                <div v-for="emp in employesFiltres" :key="emp.id" class="planning__donnee-carte">
                                    <div class="planning__donnee-nom">{{ emp.nom.split(' ')[0] }}</div>
                                    <div class="planning__donnee-ligne">
                                        <span class="planning__donnee-label">Jours ouvrés</span>
                                        <span class="planning__donnee-val" style="color:#315691">{{ joursOuvresMois }}j</span>
                                    </div>
                                    <div class="planning__donnee-ligne">
                                        <span class="planning__donnee-label">Planifiés ✓</span>
                                        <span class="planning__donnee-val" style="color:#1A7A4A">{{ joursPlannifies(emp.id, annee, mois) }}j</span>
                                    </div>
                                    <div class="planning__donnee-ligne">
                                        <span class="planning__donnee-label">À planifier</span>
                                        <span class="planning__donnee-val" style="color:#856404">{{ joursAPlanifier(emp.id, annee, mois) }}j</span>
                                    </div>
                                    <div class="planning__donnee-ligne" style="border-top:2px solid #E8EAF0;margin-top:4px;padding-top:6px">
                                        <span class="planning__donnee-label"><strong>= Jours dûs</strong></span>
                                        <span class="planning__donnee-val" style="color:#1B4F8A;font-size:1rem">{{ joursDus(emp.id, annee, mois) }}j</span>
                                    </div>
                                    <div class="planning__donnee-ligne">
                                        <span class="planning__donnee-label">Non chargés</span>
                                        <span class="planning__donnee-val" :style="{ color: joursNonCharges(emp.id, annee, mois) > 0 ? '#C0392B' : '#1A7A4A' }">
                                            {{ joursNonCharges(emp.id, annee, mois) }}j
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- VUE TRIMESTRIELLE -->
                        <div v-else>
                            <div class="planning__donnees-tableau">
                                <div class="tableau-wrap">
                                    <table class="tableau">
                                        <thead>
                                            <tr>
                                                <th>Consultant</th>
                                                <th
                                                    v-for="t in trimestre" :key="t.mois"
                                                    colspan="3"
                                                    style="text-align:center;text-transform:capitalize;background:#F0F4F8"
                                                >
                                                    {{ t.label }} ({{ t.joursOuvres }}j ouvrés)
                                                </th>
                                                <th style="background:#E3F2FD;color:#1B4F8A">Total dûs</th>
                                            </tr>
                                            <tr>
                                                <th></th>
                                                <template v-for="t in trimestre" :key="'h-' + t.mois">
                                                    <th style="background:#E8F5E9;color:#1A7A4A;font-size:.72rem">Planif.</th>
                                                    <th style="background:#E3F2FD;color:#1B4F8A;font-size:.72rem">Dûs</th>
                                                    <th style="background:#FCE4EC;color:#C0392B;font-size:.72rem">Non ch.</th>
                                                </template>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="emp in employesFiltres" :key="emp.id">
                                                <td style="font-weight:600">{{ emp.nom.split(' ')[0] }}</td>
                                                <template v-for="t in trimestre" :key="'d-' + t.mois + '-' + emp.id">
                                                    <td style="text-align:center;color:#1A7A4A;font-weight:600">
                                                        {{ joursPlannifies(emp.id, t.annee, t.mois) }}j
                                                    </td>
                                                    <td style="text-align:center;font-weight:700;color:#1B4F8A">
                                                        {{ joursDus(emp.id, t.annee, t.mois) }}j
                                                    </td>
                                                    <td style="text-align:center" :style="{ color: joursNonCharges(emp.id, t.annee, t.mois) > 0 ? '#C0392B' : '#1A7A4A' }">
                                                        {{ joursNonCharges(emp.id, t.annee, t.mois) }}j
                                                    </td>
                                                </template>
                                                <!-- Total dûs sur le trimestre -->
                                                <td style="text-align:center;font-weight:700;color:#1B4F8A;background:#EFF4FF">
                                                    {{ trimestre.reduce((s, t) => s + joursDus(emp.id, t.annee, t.mois), 0) }}j
                                                </td>
                                            </tr>
                                            <!-- Ligne totaux -->
                                            <tr style="background:#F0F4F8;font-weight:700">
                                                <td>TOTAL</td>
                                                <template v-for="t in trimestre" :key="'tot-' + t.mois">
                                                    <td style="text-align:center;color:#1A7A4A">
                                                        {{ employesFiltres.reduce((s, e) => s + joursPlannifies(e.id, t.annee, t.mois), 0) }}j
                                                    </td>
                                                    <td style="text-align:center;color:#1B4F8A">
                                                        {{ employesFiltres.reduce((s, e) => s + joursDus(e.id, t.annee, t.mois), 0) }}j
                                                    </td>
                                                    <td style="text-align:center;color:#C0392B">
                                                        {{ employesFiltres.reduce((s, e) => s + joursNonCharges(e.id, t.annee, t.mois), 0) }}j
                                                    </td>
                                                </template>
                                                <td style="text-align:center;color:#1B4F8A;background:#EFF4FF">
                                                    {{ trimestre.reduce((s, t) => s + employesFiltres.reduce((s2, e) => s2 + joursDus(e.id, t.annee, t.mois), 0), 0) }}j
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Mobile trimestrielle : cartes par mois -->
                            <div class="planning__donnees-cartes">
                                <div v-for="t in trimestre" :key="t.mois" style="padding:14px 16px;border-bottom:1px solid #E8EAF0">
                                    <div style="font-family:'Archivo Black',sans-serif;font-size:.9rem;color:#315691;margin-bottom:10px;text-transform:capitalize">
                                        {{ t.label }} — {{ t.joursOuvres }}j ouvrés
                                    </div>
                                    <div v-for="emp in employesFiltres" :key="emp.id" class="planning__donnee-carte" style="border:1px solid #E8EAF0;border-radius:8px;margin-bottom:8px">
                                        <div class="planning__donnee-nom">{{ emp.nom.split(' ')[0] }}</div>
                                        <div class="planning__donnee-ligne">
                                            <span class="planning__donnee-label">Planifiés</span>
                                            <span class="planning__donnee-val" style="color:#1A7A4A">{{ joursPlannifies(emp.id, t.annee, t.mois) }}j</span>
                                        </div>
                                        <div class="planning__donnee-ligne">
                                            <span class="planning__donnee-label">Dûs</span>
                                            <span class="planning__donnee-val" style="color:#1B4F8A">{{ joursDus(emp.id, t.annee, t.mois) }}j</span>
                                        </div>
                                        <div class="planning__donnee-ligne">
                                            <span class="planning__donnee-label">Non chargés</span>
                                            <span class="planning__donnee-val" :style="{ color: joursNonCharges(emp.id, t.annee, t.mois) > 0 ? '#C0392B' : '#1A7A4A' }">
                                                {{ joursNonCharges(emp.id, t.annee, t.mois) }}j
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Légende -->
                <div class="planning__legende">
                    <div v-for="(c, i) in clients" :key="c.id" class="planning__legende-item">
                        <div class="planning__legende-point" :style="{ background: couleurs[i % couleurs.length] }"></div>
                        {{ c.nom }}
                    </div>
                </div>

            </div>
        </div>

        <!-- Modale détail tâche -->
        <div v-if="detail" class="modale-fond" @click.self="detail = null">
            <div class="modale">
                <div class="modale__entete">
                    <h2>{{ detail.titre }}</h2>
                    <button class="modale__fermer" @click="detail = null">✕</button>
                </div>
                <div class="modale__corps planning__detail">
                    <p><strong>Consultant :</strong> {{ nomEmploye(detail.employe_id) }}</p>
                    <p><strong>Dates :</strong> {{ formaterDate(detail.date_debut) }} → {{ formaterDate(detail.date_fin) }}</p>
                    <p><strong>Jours :</strong> {{ detail.nb_jours }}</p>
                    <p><span class="badge" :class="classeBadge(detail.statut)">{{ labelStatut(detail.statut) }}</span></p>
                </div>
            </div>
        </div>

        <!-- Modale liste alertes -->
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

    </div>
</template>