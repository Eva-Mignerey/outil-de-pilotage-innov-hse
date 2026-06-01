<script setup>
import { ref, computed } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import store from '@/store.js'

const employes = ref([...store.employes])
const missions = computed(() => store.missions)
const user = computed(() => store.user || {})

const modale = ref(false)
const edition = ref(null)
const form = ref({ nom: '', email: '', equipe: 'Troyes', capacite_jours: 218, conges_jours: 25, taux_horaire: 450, role: 'consultant' })

// Jours réalisés par un employé
function joursRealises(empId) {
    return missions.value
        .filter(m => m.employe_id === empId && m.statut === 'valide')
        .reduce((s, m) => s + (m.nb_jours || 0), 0)
}

// Taux de charge en %
function tauxCharge(empId) {
    const emp = employes.value.find(e => e.id === empId)
    if (!emp) return 0
    return Math.min(Math.round((joursRealises(empId) / (emp.capacite_jours || 1)) * 100), 100)
}

function classeProgression(taux) {
    if (taux >= 90) return 'progression__barre--danger'
    if (taux >= 70) return 'progression__barre--alerte'
    return 'progression__barre--ok'
}

// Jours restants disponibles
function joursRestants(empId) {
    const emp = employes.value.find(e => e.id === empId)
    if (!emp) return 0
    return Math.max(emp.capacite_jours - joursRealises(empId), 0)
}

function sauvegarder() {
    if (!form.value.nom) return
    if (edition.value) {
        const i = employes.value.findIndex(e => e.id === edition.value.id)
        employes.value[i] = { ...edition.value, ...form.value }
    } else {
        employes.value.push({ id: Date.now(), ...form.value })
    }
    store.setEmployes(employes.value)
    fermerModale()
}

function supprimer(id) {
    if (!confirm('Supprimer ce consultant ?')) return
    employes.value = employes.value.filter(e => e.id !== id)
    store.setEmployes(employes.value)
}

function ouvrirAjout() { form.value = { nom: '', email: '', equipe: 'Troyes', capacite_jours: 218, conges_jours: 25, taux_horaire: 450, role: 'consultant' }; edition.value = null; modale.value = true }
function ouvrirEdition(e) { form.value = { ...e }; edition.value = e; modale.value = true }
function fermerModale() { modale.value = false; edition.value = null }
</script>

<template>
    <div class="layout">
        <Sidebar :user="user" />

        <div class="layout__main">
            <div class="topbar">
                <span class="topbar__titre">Équipe</span>
                <div class="topbar__actions">
                    <button class="btn btn--primaire btn--petit" @click="ouvrirAjout">+ Ajouter</button>
                </div>
            </div>

            <div class="page">

                <!-- KPI global -->
                <div class="kpi-grille">
                    <div class="kpi">
                        <div class="kpi__label">Consultants</div>
                        <div class="kpi__valeur">{{ employes.length }}</div>
                        <div class="kpi__sous">équipe Troyes</div>
                    </div>
                    <div class="kpi kpi--accent">
                        <div class="kpi__label">Capacité totale</div>
                        <div class="kpi__valeur">{{ employes.reduce((s, e) => s + e.capacite_jours, 0) }}j</div>
                        <div class="kpi__sous">jours / an</div>
                    </div>
                    <div class="kpi kpi--vert">
                        <div class="kpi__label">Jours réalisés</div>
                        <div class="kpi__valeur">{{ missions.filter(m => m.statut === 'valide').reduce((s, m) => s + (m.nb_jours || 0), 0) }}j</div>
                        <div class="kpi__sous">toute l'équipe</div>
                    </div>
                </div>

                <!-- Cartes par consultant -->
                <div class="employes__grille">
                    <div v-for="emp in employes" :key="emp.id" class="carte employes__carte">
                        <div class="carte__entete">
                            <h2>{{ emp.nom }}</h2>
                            <span class="badge" :class="emp.role === 'admin' ? 'badge--outlook' : 'badge--valide'">
                                {{ emp.role === 'admin' ? 'Admin' : 'Consultant' }}
                            </span>
                        </div>
                        <div class="carte__corps">

                            <!-- Taux de charge -->
                            <div class="employes__taux-label">
                                Taux de charge — {{ tauxCharge(emp.id) }}%
                            </div>
                            <div class="progression" style="margin-bottom: 16px">
                                <div
                                    class="progression__barre"
                                    :class="classeProgression(tauxCharge(emp.id))"
                                    :style="{ width: tauxCharge(emp.id) + '%' }"
                                ></div>
                            </div>

                            <!-- Infos -->
                            <div class="employes__infos">
                                <div class="employes__info-ligne">
                                    <span class="employes__info-label">Jours réalisés</span>
                                    <span class="employes__info-val">{{ joursRealises(emp.id) }}j / {{ emp.capacite_jours }}j</span>
                                </div>
                                <div class="employes__info-ligne">
                                    <span class="employes__info-label">Jours restants</span>
                                    <span class="employes__info-val">{{ joursRestants(emp.id) }}j</span>
                                </div>
                                <div class="employes__info-ligne">
                                    <span class="employes__info-label">Congés / an</span>
                                    <span class="employes__info-val">{{ emp.conges_jours }}j</span>
                                </div>
                                <div class="employes__info-ligne">
                                    <span class="employes__info-label">Taux horaire</span>
                                    <span class="employes__info-val">{{ emp.taux_horaire }}€ / j</span>
                                </div>
                                <div class="employes__info-ligne" v-if="emp.email">
                                    <span class="employes__info-label">Email</span>
                                    <span class="employes__info-val employes__email">{{ emp.email }}</span>
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="employes__actions">
                                <button class="btn btn--fantome btn--petit" @click="ouvrirEdition(emp)">Éditer</button>
                                <button class="btn btn--danger btn--petit" @click="supprimer(emp.id)">Suppr.</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- Modale -->
        <div v-if="modale" class="modale-fond" @click.self="fermerModale">
            <div class="modale">
                <div class="modale__entete">
                    <h2>{{ edition ? 'Modifier consultant' : 'Nouveau consultant' }}</h2>
                    <button class="modale__fermer" @click="fermerModale">✕</button>
                </div>
                <div class="modale__corps">
                    <div class="missions__form-grille">
                        <div class="champ">
                            <label>Nom *</label>
                            <input v-model="form.nom" placeholder="Ex : Andrea Romary" />
                        </div>
                        <div class="champ">
                            <label>Email</label>
                            <input v-model="form.email" type="email" placeholder="a.romary@innov-hse.fr" />
                        </div>
                        <div class="champ">
                            <label>Équipe</label>
                            <input v-model="form.equipe" placeholder="Troyes" />
                        </div>
                        <div class="champ">
                            <label>Rôle</label>
                            <select v-model="form.role">
                                <option value="consultant">Consultant</option>
                                <option value="admin">Administrateur</option>
                                <option value="autre">Autre</option>
                            </select>
                        </div>
                        <div class="champ">
                            <label>Jours / an</label>
                            <input v-model.number="form.capacite_jours" type="number" min="1" />
                        </div>
                        <div class="champ">
                            <label>Congés / an</label>
                            <input v-model.number="form.conges_jours" type="number" min="0" />
                        </div>
                        <div class="champ">
                            <label>Taux horaire (€/j)</label>
                            <input v-model.number="form.taux_horaire" type="number" min="0" />
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

    </div>
</template>