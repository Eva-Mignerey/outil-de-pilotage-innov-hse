<template>
    <div class="mobile-topbar">
        <img src="/logo.svg" alt="Innov'HSE" class="mobile-topbar__logo" />
        <div style="display:flex;align-items:center;gap:8px">
            <button class="topbar__cloche" @click="$emit('voirAlertes')" v-if="nbAlertes > 0">
                🔔
                <span class="topbar__cloche-badge">{{ nbAlertes }}</span>
            </button>
            <button class="burger" @click="ouvert = !ouvert" :class="{ actif: ouvert }">
                <span></span><span></span><span></span>
            </button>
        </div>
    </div>

    <div class="burger-fond" :class="{ visible: ouvert }" @click="ouvert = false"></div>

    <aside class="layout__sidebar" :class="{ 'sidebar--ouvert': ouvert }">
        <div class="sidebar__logo">
            <img class="sidebar__logo-img" src="/logo.svg" alt="Innov'HSE" loading="eager" fetchpriority="high" />
        </div>

        <nav class="sidebar__nav">
            <router-link class="sidebar__btn" to="/dashboard"   active-class="actif" @click="ouvert = false">
                <span class="sidebar__icone">◈</span><span>Tableau de bord</span>
            </router-link>
            <router-link class="sidebar__btn" to="/planning"    active-class="actif" @click="ouvert = false">
                <span class="sidebar__icone">▦</span><span>Planning</span>
            </router-link>
            <router-link class="sidebar__btn" to="/prospects"   active-class="actif" @click="ouvert = false">
                <span class="sidebar__icone">◐</span><span>Prospects</span>
            </router-link>
            <router-link class="sidebar__btn" to="/clients"     active-class="actif" @click="ouvert = false">
                <span class="sidebar__icone">◉</span><span>Clients</span>
            </router-link>
            <router-link class="sidebar__btn" to="/missions"    active-class="actif" @click="ouvert = false">
                <span class="sidebar__icone">◆</span><span>Missions / Tâches</span>
            </router-link>
            <router-link class="sidebar__btn" to="/employes"    active-class="actif" @click="ouvert = false">
                <span class="sidebar__icone">◎</span><span>Équipe</span>
            </router-link>
            <router-link class="sidebar__btn" to="/facturation" active-class="actif" @click="ouvert = false">
                <span class="sidebar__icone">◧</span><span>Facturation</span>
            </router-link>
            <router-link class="sidebar__btn" to="/tableau-charges" active-class="actif" @click="ouvert = false">
                <span class="sidebar__icone">▨</span><span>Tableau de charges</span>
            </router-link>
        </nav>

        <div class="sidebar__user">
            <div class="sidebar__user-info">
                <div class="user-nom">{{ user.nom }}</div>
                <div class="user-role">{{ user.profil === 'admin' ? 'Administrateur' : 'Consultant' }}</div>
            </div>
            <button class="sidebar__deconnexion" @click="seDeconnecter" title="Se déconnecter">⏻</button>
        </div>
    </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import store from '@/store.js'

defineProps({
    user: { type: Object, default: () => ({}) },
    nbAlertes: { type: Number, default: 0          }
})
defineEmits(['voirAlertes'])

const ouvert = ref(false)
const router = useRouter()

function seDeconnecter() {
    store.setUser(null)
    sessionStorage.removeItem('ihse_toasts_affichés')
    router.push('/connexion')
}
</script>