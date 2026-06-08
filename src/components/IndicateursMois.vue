<script setup>
import { computed } from 'vue'
import store from '../../store.js'
import { estAdmin } from '../permissions.js'

const now = new Date()
const moisIdx = now.getMonth()
const anneeIdx = now.getFullYear()
const moisKey = `${anneeIdx}-${String(moisIdx + 1).padStart(2, '0')}`

const moisEnCours = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

const missions = computed(() => store.missions)
const facturations = computed(() => store.facturations)

const missionsDuMoisListe = computed(() =>
    missions.value.filter(m => {
        const d = new Date(m.date_debut)
        return d.getMonth() === moisIdx && d.getFullYear() === anneeIdx
    })
)

const nbMissions = computed(() => missionsDuMoisListe.value.length)

const joursPlanifies = computed(() =>
    missionsDuMoisListe.value.reduce((s, m) => s + (m.nb_jours || 0), 0)
)

const caFacture = computed(() =>
    facturations.value
        .filter(f => f.mois === moisKey)
        .reduce((s, f) => s + (Number(f.facture) || 0), 0)
)

const caTheorique = computed(() =>
    facturations.value
        .filter(f => f.mois === moisKey)
        .reduce((s, f) => s + (Number(f.theorique) || 0), 0)
)
</script>

<template>
    <div class="carte dashboard__carte-mois">
        <div class="carte__entete">
            <h2>Indicateurs du mois</h2>
            <span class="dashboard__sous-titre">{{ moisEnCours }}</span>
        </div>
        <div class="carte__corps dashboard__mois-grille">
            <div class="dashboard__mois-bloc">
                <div class="dashboard__mois-label">Planning</div>
                <div class="dashboard__mois-valeur">{{ joursPlanifies }}j</div>
                <div class="dashboard__mois-sous">planifiés ce mois</div>
            </div>
            <div class="dashboard__mois-bloc">
                <div class="dashboard__mois-label">Missions</div>
                <div class="dashboard__mois-valeur">{{ nbMissions }}</div>
                <div class="dashboard__mois-sous">missions ce mois</div>
            </div>
            <div v-if="estAdmin" class="dashboard__mois-bloc">
                <div class="dashboard__mois-label">Facturation</div>
                <div class="dashboard__mois-valeur">{{ caFacture.toLocaleString('fr-FR') }} €</div>
                <div class="dashboard__mois-sous">facturé / {{ caTheorique.toLocaleString('fr-FR') }} € théorique</div>
            </div>
        </div>
    </div>
</template>