<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import store from '../../store.js'
import { loginUser } from '../services/dataService.js'

const router = useRouter()

const profil = ref('')
const nom = ref('')
const email = ref('')
const password = ref('')
const messageErreur = ref('')
const chargement = ref(false)

async function seConnecter() {
    if (!email.value || !password.value) {
        messageErreur.value = 'Tous les champs sont obligatoires.'
        return
    }

    chargement.value = true
    messageErreur.value = ''

    try {
        const user = await loginUser(email.value, password.value)
        store.user = user
        router.push('/tableau-bord')
    } catch (e) {
        messageErreur.value = 'Email ou mot de passe incorrect.'
    } finally {
        chargement.value = false
    }
}
</script>

<template>
    <div class="auth-bg">
        <div class="auth-carte">

        <img class="auth-logo" src="/images/logo.svg" alt="Innov'HSE" />

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

            <button class="auth-btn" type="submit" :disabled="chargement">
                {{ chargement ? 'Connexion...' : 'Se connecter' }}
            </button>
        </form>

        <p class="auth-lien-texte">
            Vous n'avez pas de compte ?<br>
            <router-link class="auth-lien" to="/inscription">Inscrivez-vous ici</router-link>
        </p>

        </div>
    </div>
</template>