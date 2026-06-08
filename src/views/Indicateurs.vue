<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import ChargeCard from '../components/ChargeCard.vue'
import store from '../../store.js'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const user = computed(() => store.user || {})

const nomsMois = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const moisActuel = new Date().getMonth()
const annee = new Date().getFullYear()

const categories = [
{
    id: 'frais',
    label: 'Frais',
    couleur: '#459AE9',
    picto: 'images/frais.svg',
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
    picto: 'images/rh.svg',
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
    picto: 'images/finances.svg',
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
    picto: 'images/clients.svg',
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
    picto: 'images/commerce.svg',
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
    picto: 'images/communication.svg',
    indicateurs: [
        { cle: 'nb_abonnes', label: "Nombre d'abonnés" },
        { cle: 'impressions', label: 'Impressions' },
        { cle: 'taux_engagement', label: "Taux d'engagement", unite: '%' },
        { cle: 'nb_publication', label: 'Publications' },
        { cle: 'ctr', label: 'CTR', unite: '%' },
        { cle: 'nb_reactions', label: 'Nombre de réactions' },
        { cle: 'nb_prise_contact_linkedin', label: 'Prises de contact grâce à LinkedIn', source: 'LinkedIn' },
    ]
}
]

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

function exportPDF() {
    const doc = new jsPDF()
    const labelMois = nomsMois[moisSaisie.value] + ' ' + annee

    doc.setFontSize(18)
    doc.setTextColor(49, 86, 145)
    doc.text("Innov'HSE — Indicateurs de pilotage", 14, 18)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(labelMois, 14, 26)
    doc.setDrawColor(220)
    doc.line(14, 30, 196, 30)

    let y = 36

    for (const cat of categories) {
        const lignes = cat.indicateurs.map(ind => {
            const v = valeur(ind.cle, moisSaisie.value)
            return [
                ind.label,
                v !== '' ? `${v}${ind.unite || ''}` : '—',
                ind.source || ''
            ]
        })

        doc.setFontSize(11)
        doc.setFont(undefined, 'bold')
        doc.setTextColor(30)
        doc.text(cat.label, 14, y)
        doc.setFont(undefined, 'normal')

        autoTable(doc, {
            startY: y + 3,
            head: [['Indicateur', 'Valeur', 'Source']],
            body: lignes,
            theme: 'striped',
            headStyles: { fillColor: cat.couleur.match(/\w\w/g).map(h => parseInt(h, 16)) },
            margin: { left: 14, right: 14 },
            styles: { fontSize: 9 },
        })

        y = doc.lastAutoTable.finalY + 10

        if (y > 260) {
            doc.addPage()
            y = 16
        }
    }

    const nomFichier = `indicateurs-${annee}-${String(moisSaisie.value + 1).padStart(2, '0')}.pdf`
    doc.save(nomFichier)
}
</script>

<template>
<div class="layout">
    <Sidebar :user="user" />

    <div class="layout__main">
        <div class="topbar">
            <span class="topbar__titre">Tableau de bord</span>
            <div class="topbar__actions">
                <div class="mois-select">
                    <select v-model="moisSaisie" class="mois-select__input">
                        <option v-for="(m,i) in nomsMois" :key="i" :value="i">
                            {{ m }} {{ annee }}
                        </option>
                    </select>
                    <span class="mois-select__arrow"></span>
                </div>
                <button class="btn btn--fantome btn--petit" @click="exportPDF">↓ PDF</button>
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
.topbar__actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.alerte-negatif {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 16px;
    background: #fffaeb;
    color: #8d6900;
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