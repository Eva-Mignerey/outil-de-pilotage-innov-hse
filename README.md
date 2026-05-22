# Innov'HSE — Outil de pilotage

Outil de gestion et de planification des missions HSE développé dans le cadre d'un stage de 10 semaines (BUT MMI).

Avant cet outil, la gestion des missions, du plan de charge et des clients se faisait manuellement sur Excel et Outlook, sans vue consolidée. L'objectif est de centraliser l'ensemble dans une application unique, accessible depuis un navigateur.

---

## Lancer le projet

```bash
npm install
npm run dev
```

Application accessible sur [http://localhost:5173](http://localhost:5173)

---

## Build production

```bash
npm run build
```

Après le build, copier le fichier `.htaccess` dans le dossier `dist/` pour assurer le bon fonctionnement de Vue Router en production.

---

## Authentification

L'application inclut un système de connexion local basé sur le `localStorage`.

Les comptes sont initialisés automatiquement au premier lancement depuis `main.js` :

| Nom                  | Email                       | Profil      | Mot de passe |
| -------------------- | --------------------------- | ----------- | ------------ |
| Matthieu Roche       | demo@innov-hse.fr           | Admin       | demo1234     |
| Damaris Quintin      | damaris@innov-hse.fr        | Admin       | demo1234     |
| Andrea Romary        | andrea@innov-hse.fr         | Consultant  | demo1234     |
| Antonin Guay Hemard  | antonin@innov-hse.fr        | Consultant  | demo1234     |

---

## Fonctionnalités principales

| Domaine          | Fonctionnalités                                                          |
| ---------------- | ------------------------------------------------------------------------ |
| Dashboard        | KPIs globaux, graphiques par client/employé, alertes de dépassement      |
| Planning         | Vue mensuelle et trimestrielle, assignation des missions par employé     |
| Prospects        | Suivi commercial, conversion prospect → client, statuts et relances      |
| Clients          | Suivi des contrats, avancement, alertes de dépassement en temps réel     |
| Fiche client     | Détail complet : missions, jours réalisés, progression du contrat        |
| Missions         | Création, validation et suppression de tâches par employé et client      |
| Équipe           | Taux de charge par consultant, jours restants, capacité annuelle         |
| Facturation      | Suivi financier théorique / réel / objectif par client                   |
| Tableau de bord charges | Suivi mensuel des charges par catégorie avec graphiques d'évolution |

---

## Pages de l'application

| Page              | Route              | Description                              |
| ----------------- | ------------------ | ---------------------------------------- |
| Connexion         | `/connexion`       | Authentification utilisateur             |
| Inscription       | `/inscription`     | Création de compte                       |
| Dashboard         | `/dashboard`       | Indicateurs globaux + alertes            |
| Planning          | `/planning`        | Vue planning mensuelle/trimestrielle     |
| Prospects         | `/prospects`       | Suivi commercial et conversion clients   |
| Clients           | `/clients`         | Liste des clients et suivi contrats      |
| Fiche client      | `/clients/:id`     | Détail d'un client                       |
| Missions          | `/missions`        | Gestion des tâches et temps passé        |
| Équipe            | `/employes`        | Gestion des collaborateurs               |
| Facturation       | `/facturation`     | Suivi financier                          |
| Tableau de charges| `/tableau-charges` | Indicateurs mensuels par catégorie       |

---

## Stack technique

| Technologie         | Usage                                      |
| ------------------- | ------------------------------------------ |
| Vue.js 3            | Framework frontend (Composition API)       |
| Vue Router          | Navigation + guards d'authentification     |
| Vite                | Build tool                                 |
| SCSS                | Styles modulaires avec variables globales  |
| Chart.js            | Graphiques (évolution, barres, courbes)    |
| Store réactif       | Partage de données entre vues (sans Pinia) |
| localStorage        | Persistance des données                    |
| Microsoft Graph API | Préparation synchronisation Outlook        |

---

## Structure du projet

```
src/
├── main.js                   Point d'entrée + initialisation et versioning des données
├── App.vue                   Layout principal
├── store.js                  Store réactif partagé entre toutes les vues
├── router/
│   └── index.js              Routes + guards d'authentification
│
├── components/
│   ├── Sidebar.vue           Navigation latérale + déconnexion
│   ├── ToastAlertes.vue      Notifications d'alerte (affichées une fois par session)
│   └── ChargeCard.vue        Carte indicateur pour le tableau de charges
│
├── views/
│   ├── Connexion.vue
│   ├── Inscription.vue
│   ├── Dashboard.vue
│   ├── Planning.vue
│   ├── Prospects.vue
│   ├── Clients.vue
│   ├── FicheClient.vue
│   ├── Missions.vue
│   ├── Employes.vue
│   ├── Facturation.vue
│   └── TableauCharges.vue
│
├── services/
│   ├── alertes.js            Logique de calcul et niveaux d'alerte
│   ├── db.js                 Utilitaires données
│   └── outlook.js            Préparation Microsoft Graph API
│
├── data/
│   ├── employes.json         Données initiales employés
│   ├── clients.json          Données initiales clients (21 clients)
│   └── missions.json         Données initiales missions
│
└── scss/
    ├── styles.scss           Fichier principal (imports)
    ├── _layout.scss
    ├── _sidebar.scss
    ├── _alertes.scss
    ├── _modales.scss
    ├── _dashboard.scss
    ├── _planning.scss
    ├── _clients.scss
    ├── _prospects.scss
    ├── _missions.scss
    ├── _employes.scss
    ├── _tableaucharges.scss
    ├── _connexion.scss
    └── _inscription.scss
```

---

## Gestion des données

### Initialisation automatique

Au premier lancement, `main.js` injecte les données de démonstration dans le `localStorage` via un système de versioning :

```js
const VERSION_DONNEES = '1.3'
```

Changer ce numéro réinitialise toutes les données au prochain rechargement.

### Store réactif (`store.js`)

Les données sont chargées **une seule fois** au démarrage et partagées entre toutes les vues via un store réactif léger (sans Pinia). Chaque écriture met à jour simultanément le store et le `localStorage`.

```js
import store from '@/store.js'

// Lire
const clients = computed(() => store.clients)

// Écrire
store.setClients(nouveauxClients)
```

---

## Système d'alertes

Géré dans `services/alertes.js`, partagé entre Dashboard, Clients et Planning.

| Niveau      | Seuil    | Affichage     |
| ----------- | -------- | ------------- |
| Attention   | 70–90%   | Alerte jaune  |
| Dépassement | 90–100%  | Alerte orange |
| Surplus     | > 100%   | Alerte rouge  |

Les alertes sont affichées sous forme de toasts **une seule fois par session** (mémorisé via `sessionStorage`), puis accessibles à tout moment via l'icône 🔔 dans la topbar.

---

## Système de prospects

Les prospects et les clients sont deux listes distinctes mais synchronisées :

- Un prospect peut être **converti en client** via le bouton "→ Client"
- La conversion crée un lien (`client_id` / `prospect_id`) entre les deux entrées
- **Supprimer un client supprime le prospect lié**, et inversement
- La page Prospects affiche aussi les clients existants (badge bleu "Client")

---

## Logique de planning

```
Jours planifiés + Jours à planifier = Jours dûs
Jours non chargés + Jours dûs = Jours ouvrés
```

Deux vues disponibles : mensuelle et trimestrielle.

---

## Synchronisation Outlook (Microsoft Graph API)

Préparée mais non active. Configuration dans `services/outlook.js` :

```js
clientId: 'VOTRE_CLIENT_ID_AZURE'
authority: 'https://login.microsoftonline.com/VOTRE_TENANT_ID'
```

Permission requise : `Calendars.Read`

---

## Évolutions prévues

- Migration vers une base de données (Firebase ou API REST)
- Synchronisation multi-utilisateurs en temps réel
- Export PDF / Excel
- Amélioration du système de gestion des rôles
- Intégration avancée Outlook (lecture + écriture)