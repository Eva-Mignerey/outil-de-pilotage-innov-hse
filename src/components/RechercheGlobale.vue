<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import store from '../../store.js'

const router = useRouter()
const ouverte = ref(false)
const query = ref('')
const inputRef = ref(null)

const clients = computed(() => store.clients)
const missions = computed(() => store.missions)
const prospects = computed(() => store.prospects)
const user = computed(() => store.user)

const resultats = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (q.length < 2) return []

    const res = []

    clients.value.forEach(c => {
        if (c.nom.toLowerCase().includes(q) || c.secteur?.toLowerCase().includes(q)) {
            res.push({ type: 'Client', label: c.nom, sous: c.secteur || '', route: `/clients/${c.id}` })
        }
    })

    missions.value.forEach(m => {
        if (m.titre?.toLowerCase().includes(q)) {
            const client = clients.value.find(c => c.id === m.client_id)
            res.push({ type: 'Mission', label: m.titre, sous: client?.nom || '', route: '/missions' })
        }
    })

    prospects.value.forEach(p => {
        if (p.nom?.toLowerCase().includes(q) || p.entreprise?.toLowerCase().includes(q)) {
            res.push({ type: 'Prospect', label: p.nom, sous: p.entreprise || '', route: '/prospects' })
        }
    })

    return res.slice(0, 8)
})

function ouvrir() {
    if (!user.value) return
    ouverte.value = true
    query.value = ''
    setTimeout(() => inputRef.value?.focus(), 50)
}

function fermer() {
    ouverte.value = false
    query.value = ''
}

function naviguer(route) {
    fermer()
    router.push(route)
}

function onKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        ouverte.value ? fermer() : ouvrir()
    }
    if (e.key === 'Escape') fermer()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

const icones = { Client: '◎', Mission: '◆', Prospect: '○' }
const couleurs = { Client: '#1B4F8A', Mission: '#1A7A4A', Prospect: '#E8A020' }
</script>

<template>
    <div v-if="user">
        <button class="recherche-fab" @click="ouvrir" title="Recherche globale (Ctrl+K)"><img src="/images/loupe.svg" alt="Recherche"/></button>

        <div v-if="ouverte" class="recherche-fond" @click.self="fermer">
            <div class="recherche-modale">
                <div class="recherche-input-wrap">
                    <span class="recherche-icone">🔍︎</span>
                    <input
                        ref="inputRef"
                        v-model="query"
                        class="recherche-input"
                        placeholder="Rechercher un client, une mission, un prospect..."
                    />
                    <kbd class="recherche-kbd">Esc</kbd>
                </div>

                <div v-if="query.length >= 2" class="recherche-resultats">
                    <div v-if="resultats.length === 0" class="recherche-vide">
                        Aucun résultat pour "{{ query }}"
                    </div>
                    <button
                        v-for="(r, i) in resultats"
                        :key="i"
                        class="recherche-item"
                        @click="naviguer(r.route)"
                    >
                        <span class="recherche-item-badge" :style="{ background: couleurs[r.type] + '18', color: couleurs[r.type] }">
                            {{ icones[r.type] }} {{ r.type }}
                        </span>
                        <span class="recherche-item-label">{{ r.label }}</span>
                        <span v-if="r.sous" class="recherche-item-sous">{{ r.sous }}</span>
                    </button>
                </div>
                
                <div v-else class="recherche-hint">
                    Tapez au moins 2 caractères <kbd>Ctrl+K</kbd> pour ouvrir
                </div>
            </div>
        </div>
    </div>
</template>