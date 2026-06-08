<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const nom = ref('')
const email = ref('')
const profil = ref('')
const password = ref('')
const password2 = ref('')
const messageErreur = ref('')

function sInscrire() {
    if (!nom.value || !email.value || !profil.value || !password.value || !password2.value) {
        messageErreur.value = 'Tous les champs sont obligatoires.'
        return
    }
    if (!email.value.includes('@')) {
        messageErreur.value = 'Adresse mail invalide.'
        return
    }
    if (password.value.length < 6) {
        messageErreur.value = 'Le mot de passe doit contenir au moins 6 caractères.'
        return
    }
    if (password.value !== password2.value) {
        messageErreur.value = 'Les mots de passe ne correspondent pas.'
        return
    }

    const comptes = JSON.parse(localStorage.getItem('ihse_comptes') || '[]')
    if (comptes.find(c => c.email === email.value)) {
        messageErreur.value = 'Un compte avec cet email existe déjà.'
        return
    }

    comptes.push({ nom: nom.value, email: email.value, profil: profil.value, password: password.value })
    localStorage.setItem('ihse_comptes', JSON.stringify(comptes))
    router.push('/tableau-bord')
}
</script>

<template>
    <div class="auth-bg">
        <div class="auth-carte auth-carte--inscription">

        <img class="auth-logo" src="/images/logo.svg" alt="Innov'HSE" />

        <h1 class="auth-titre">Inscription</h1>

        <form class="auth-form" @submit.prevent="sInscrire">
            <input class="auth-input" type="text"     v-model="nom"       placeholder="nom" />
            <input class="auth-input" type="email"    v-model="email"     placeholder="adresse mail" />

            <div class="auth-select-wrap">
            <select class="auth-select" v-model="profil">
                <option value="" disabled>Sélectionner votre type de profil</option>
                <option value="admin">Administrateur</option>
                <option value="consultant">Consultant</option>
            </select>
            <span class="auth-select-fleche">&#8964;</span>
            </div>

            <input class="auth-input" type="password" v-model="password"  placeholder="mot de passe" />
            <input class="auth-input" type="password" v-model="password2" placeholder="confirmez votre mot de passe" />

            <p class="erreur">{{ messageErreur }}</p>

            <button class="auth-btn auth-btn--inscription" type="submit">S'inscrire</button>
        </form>

        </div>
    </div>
</template>