<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import store from '@/store.js'

const router = useRouter()

const profil = ref('')
const nom = ref('')
const email = ref('')
const password = ref('')
const messageErreur = ref('')

function seConnecter() {
    if (!profil.value) {
        messageErreur.value = 'Veuillez sélectionner un profil.'
        return
    }
    if (!nom.value || !email.value || !password.value) {
        messageErreur.value = 'Tous les champs sont obligatoires.'
        return
    }

    const comptes = JSON.parse(localStorage.getItem('ihse_comptes') || '[]')
    const compte  = comptes.find(c => c.email === email.value && c.password === password.value)

    if (!compte) {
        messageErreur.value = 'Email ou mot de passe incorrect.'
        return
    }

    store.setUser(compte)
    router.push('/dashboard')
}
</script>

<template>
    <div class="auth-bg">
        <div class="auth-carte">

        <img class="auth-logo" src="/logo.svg" alt="Innov'HSE" />

        <h1 class="auth-titre">Connexion</h1>

        <div class="auth-select-wrap">
            <select class="auth-select" v-model="profil">
            <option value="" disabled>Sélectionner votre profil</option>
            <option value="admin">Administrateur</option>
            <option value="consultant">Consultant</option>
            </select>
            <span class="auth-select-fleche">&#8964;</span>
        </div>

        <form class="auth-form" @submit.prevent="seConnecter">
            <input class="auth-input" type="text"     v-model="nom"      placeholder="nom" />
            <input class="auth-input" type="email"    v-model="email"    placeholder="adresse mail" />
            <input class="auth-input" type="password" v-model="password" placeholder="mot de passe" />

            <p class="erreur">{{ messageErreur }}</p>

            <button class="auth-btn" type="submit">Se connecter</button>
        </form>

        <p class="auth-lien-texte">
            Vous n'avez pas de compte ?<br>
            <router-link class="auth-lien" to="/inscription">Inscrivez-vous ici</router-link>
        </p>

        </div>
    </div>
</template>