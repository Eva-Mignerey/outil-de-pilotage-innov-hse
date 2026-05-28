<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import ChargeCard from '../components/ChargeCard.vue'
import store from '@/store.js'

const user = computed(() => store.user || {})

const nomsMois = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const moisActuel = new Date().getMonth()
const annee = new Date().getFullYear()

//catégories et indicateurs
const categories = [
{
    id: 'frais',
    label: 'Frais',
    couleur: '#459AE9',
    picto: '/src/assets/images/frais.svg',
    indicateurs: [
        { cle: 'carburant', label: 'Carburant', unite: '€', source: 'DKV + Tickets' },
        { cle: 'peage', label: 'Péage', unite: '€', source: 'DKV + Tickets' },
        { cle: 'restauration', label: 'Restauration', unite: '€', source: 'Tickets' },
        { cle: 'km', label: 'Km parcourus', unite: 'km', source: 'Feuilles émargement' },
        { cle: 'cout_km', label: 'Coût / km', unite: '€', source: 'KM/CARBURANT' },
    ]
},
{
    id: 'rh',
    label: 'RH',
    couleur: '#84EE57',
    picto: '/src/assets/images/rh.svg',
    indicateurs: [
        { cle: 'taux_absence', label: "Taux d'absence", unite: '%', source: 'Planning congés' },
        { cle: 'conges', label: 'Congés restants', unite: 'j', source: 'Compta' },
        { cle: 'taux_occup', label: "Taux d'occupation", unite: '%', source: 'Planning' },
        { cle: 'entretien_vh', label: 'Entretien véhicules', unite: '€', source: 'Factures' },
        { cle: 'formation', label: 'Temps avant expiration', unite: 'j', source: 'Zeendoc' },
    ]
},
{
    id: 'finances',
    label: 'Finances',
    couleur: '#EDC95C',
    picto: '/src/assets/images/finances.svg',
    indicateurs: [
        { cle: 'nb_factures', label: 'Nb factures', source: 'EBP' },
        { cle: 'ca', label: "Chiffre d'affaires", unite: '€', source: 'EBP' },
        { cle: 'taux_marge', label: 'Taux de marge', unite: '%', source: '' },
        { cle: 'encours', label: 'Encours factures', unite: '€', source: 'EBP' },
        { cle: 'tresorerie', label: 'Trésorerie', unite: '€', source: 'Banque', autoriserNegatif: true },
    ]
},
{
    id: 'clients',
    label: 'Clients',
    couleur: '#E84B4B',
    picto: '/src/assets/images/clients.svg',
    indicateurs: [
        { cle: 'delai_interv', label: "Délai d'intervention", unite: 'j', source: 'Équipes' },
        { cle: 'satisfaction', label: 'Satisfaction', unite: '/5', source: 'Équipes' },
        { cle: 'pb_terrain', label: 'Problèmes terrain', source: 'Équipes' },
        { cle: 'tps_resolution', label: 'Tps résolution pb', unite: 'j', source: 'Équipes' },
    ]
},
{
    id: 'commerce',
    label: 'Commerce',
    couleur: '#7B2D8B',
    picto: '/src/assets/images/commerce.svg',
    indicateurs: [
        { cle: 'devis', label: 'Devis envoyés', source: 'EBP' },
        { cle: 'commandes', label: 'Commandes reçues', source: 'EBP' },
        { cle: 'ca_salarie', label: 'CA par salarié', unite: '€' },
        { cle: 'ca_restant', label: 'CA restant / objectif', unite: '€' },
        { cle: 'factures_imp', label: 'Factures impayées', unite: '€', source: 'EBP' },
    ]
},
{
    id: 'communication',
    label: 'Communication',
    couleur: '#1A6B8A',
    picto: '/src/assets/images/communication.svg',
    indicateurs: [
        { cle: 'publications', label: 'Publications', source: 'LinkedIn' },
        { cle: 'reactions', label: 'Réactions', source: 'LinkedIn' },
        { cle: 'retours', label: 'Retours (réel)', source: 'Équipes' },
    ]
}
]

// données
const charges = ref(
    store.charges
    || Object.fromEntries(
        categories.flatMap(c =>
            c.indicateurs.map(i => [i.cle, Array(12).fill('')])
        )
    )
)

const moisSaisie = ref(moisActuel)

const valeur = (cle, m = moisSaisie.value) =>
    charges.value[cle]?.[m] || ''

const erreurNegatif = ref(false)
let erreurTimer = null

const saisir = (cle, val) => {
    const ind = categories.flatMap(c => c.indicateurs).find(i => i.cle === cle)
    const num = parseFloat(val)
    if (!isNaN(num) && num < 0 && !ind?.autoriserNegatif) {
        erreurNegatif.value = true
        clearTimeout(erreurTimer)
        erreurTimer = setTimeout(() => { erreurNegatif.value = false }, 3000)
        return
    }
    charges.value[cle] ??= Array(12).fill('')
    charges.value[cle][moisSaisie.value] = val
    store.setCharges(charges.value)
}

// graphique
const graphiqueActif = ref(null)
const categorieGraphique = ref(null)
const canvasRef = ref(null)

const ouvrirGraphique = (cat) => {
    categorieGraphique.value = cat
    graphiqueActif.value = cat.id
}

let chartInstance = null

const palette = [
    '#3b82f6','#22c55e','#f59e0b','#ef4444',
    '#a855f7','#06b6d4','#14b8a6','#f97316'
]

const chargerChartJS = async () => {
    if (window.Chart) return
    await new Promise((ok, ko) => {
        const s = document.createElement('script')
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js'
        s.onload = ok
        s.onerror = ko
        document.head.appendChild(s)
    })
}

watch(graphiqueActif, async () => {
    if (!graphiqueActif.value) return

    await chargerChartJS()
    await nextTick()

    if (!canvasRef.value) return
    if (chartInstance) chartInstance.destroy()

    const cat = categorieGraphique.value

    chartInstance = new window.Chart(canvasRef.value, {
        type: 'line',
        data: {
            labels: nomsMois,
            datasets: cat.indicateurs.map((ind, i) => {
                const color = palette[i % palette.length]

                return {
                    label: ind.label,
                    data: Array(12).fill(0).map((_, m) =>
                        Number(charges.value[ind.cle]?.[m]) || 0
                    ),

                    borderColor: color,
                    backgroundColor: color + '20',

                    pointBackgroundColor: color,
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6,

                    borderWidth: 2,
                    tension: 0.35,
                    fill: false
                }
            })
        }
    })
})
</script>

<template>
<div class="layout">
    <Sidebar :user="user" />

    <div class="layout__main">
        <div class="topbar">
            <span class="topbar__titre">
                Tableau des charges
            </span>
            <div class="mois-select">
                <select v-model="moisSaisie" class="mois-select__input">
                    <option v-for="(m,i) in nomsMois" :key="i" :value="i">
                        {{ m }} {{ annee }}
                    </option>
                </select>
                <span class="mois-select__arrow"></span>
            </div>
        </div>

        <Transition name="alerte">
            <div v-if="erreurNegatif" class="alerte-negatif">
                ⚠︎ Les valeurs négatives ne sont pas autorisées
            </div>
        </Transition>

        <div class="page">

            <div
                v-for="cat in categories"
                :key="cat.id"
                class="charges__ligne"
            >

                <div
                    class="charges__cat-label"
                    :style="{ background: cat.couleur + '18', color: cat.couleur }"
                >
                    <img :src="cat.picto" :alt="cat.label" class="charges__cat-picto" />
                    {{ cat.label }}
                </div>

                <div class="charges__cartes">

                    <ChargeCard
                        v-for="ind in cat.indicateurs"
                        :key="ind.cle"
                        :ind="ind"
                        :cat="cat"
                        :valeur="valeur"
                        :saisir="saisir"
                    />

                    <button
                        class="charges__btn-evolution"
                        @click="ouvrirGraphique(cat)"
                        :style="{ '--cat-couleur': cat.couleur }"
                    >
                        <span>Voir l'évolution</span>
                </button>
                </div>
            </div>
        </div>
    </div>

    <div
        v-if="graphiqueActif"
        class="modale-fond"
        @click.self="graphiqueActif = null"
    >
        <div class="modale">
            <canvas ref="canvasRef" height="280"></canvas>
        </div>
    </div>

</div>
</template>

<style scoped>
.alerte-negatif {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 16px;
    background: #fffaeb;
    color: #755a0b;
    border: 1px solid #fec109;
    border-radius: 8px;
    font-size: 0.82rem;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    max-width: calc(100vw - 32px);
    white-space: normal;
    text-align: center;
}

.alerte-enter-active,
.alerte-leave-active {
    transition: opacity 0.3s ease, top 0.3s ease;
}

.alerte-enter-from,
.alerte-leave-to {
    opacity: 0;
    top: 4px;
}
</style>