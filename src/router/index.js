import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { 
            path: '/', 
            redirect: '/connexion' 
        },
        { 
            path: '/connexion', 
            name: 'connexion', 
            component: () => import('../views/Connexion.vue') 
        },
        { 
            path: '/inscription', 
            name: 'inscription', 
            component: () => import('../views/Inscription.vue') 
        },
        { 
            path: '/tableau-bord', 
            name: 'tableau-bord', 
            component: () => import('../views/TableauBord.vue') 
        },
        { 
            path: '/planning', 
            name: 'planning', 
            component: () => import('../views/Planning.vue') 
        },
        { 
            path: '/clients', 
            name: 'clients', 
            component: () => import('../views/Clients.vue') 
        },
        { 
            path: '/clients/:id', 
            name: 'fiche-client', 
            component: () => import('../views/FicheClient.vue') 
        },
        { 
            path: '/missions', 
            name: 'missions', 
            component: () => import('../views/Missions.vue') 
        },
        { 
            path: '/equipe', 
            name: 'equipe', 
            component: () => import('../views/Equipe.vue') 
        },
        { 
            path: '/prospects', 
            name: 'prospects', 
            component: () => import('../views/Prospects.vue') 
        },
        { 
            path: '/facturation', 
            name: 'facturation', 
            component: () => import('../views/Facturation.vue') 
        },
        { 
            path: '/indicateurs', 
            name: 'indicateurs', 
            component: () => import('../views/Indicateurs.vue') 
        },
    ]
})

router.beforeEach((to) => {
    const pagesPubliques = ['/connexion', '/inscription']
    const user = JSON.parse(localStorage.getItem('ihse_user') || 'null')
    const connecte = !!user

    if (!pagesPubliques.includes(to.path) && !connecte) {
        return '/connexion'
    }

    const pagesAdmin = ['/facturation']
    if (pagesAdmin.includes(to.path) && user?.profil !== 'admin') {
        return '/dashboard'
    }
})

export default router