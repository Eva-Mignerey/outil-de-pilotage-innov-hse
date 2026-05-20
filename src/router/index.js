import { createRouter, createWebHistory } from 'vue-router'

import Connexion   from '../views/Connexion.vue'
import Inscription from '../views/Inscription.vue'
import Dashboard   from '../views/Dashboard.vue'
import Planning    from '../views/Planning.vue'
import Clients     from '../views/Clients.vue'
import FicheClient from '../views/FicheClient.vue'
import Missions    from '../views/Missions.vue'
import Employes    from '../views/Employes.vue'
import Prospects   from '../views/Prospects.vue'
import Facturation from '../views/Facturation.vue'
import TableauCharges from '../views/TableauCharges.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { 
            path: '/',
            redirect: '/connexion'  
        },
        { 
            path: '/connexion', 
            component: Connexion, 
            name: 'connexion'
        },
        { 
            path: '/inscription', 
            component: Inscription, 
            name: 'inscription'  
        },
        { 
            path: '/dashboard',   
            component: Dashboard,   
            name: 'dashboard'    
        },
        { 
            path: '/planning',    
            component: Planning,    
            name: 'planning'     
        },
        { 
            path: '/clients',     
            component: Clients,     
            name: 'clients'      
        },
        { 
            path: '/clients/:id', 
            component: FicheClient, 
            name: 'fiche-client' 
        },
        { 
            path: '/missions',    
            component: Missions,    
            name: 'missions'     
        },
        { 
            path: '/employes',
            component: Employes,    
            name: 'employes'     
        },
        { 
            path: '/prospects',   
            component: Prospects,   
            name: 'prospects'    
        },
        { 
            path: '/facturation',   
            component: Facturation,   
            name: 'facturation'    
        },
        { 
            path: '/tableau-charges',   
            component: TableauCharges,   
            name: 'tableau-charges'    
        }
    ]
})

router.beforeEach((to) => {
    const pagesPubliques = ['/connexion', '/inscription']
    const connecte = localStorage.getItem('ihse_user')
    if (!pagesPubliques.includes(to.path) && !connecte) {
        return '/connexion'
    }
})

export default router
