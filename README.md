# Innov’HSE — Outil de pilotage

Outil de gestion et de planification des missions HSE développé dans le cadre d’un stage de 10 semaines (BUT MMI).

Avant cet outil, la gestion des missions, du plan de charge et des clients se faisait manuellement sur Excel et Outlook, sans vue consolidée. L’objectif est de centraliser l’ensemble dans une application unique.

---

## Lancer le projet

```bash id="xk2p91"
npm install
npm run dev
```

Application accessible sur :
[http://localhost:5173](http://localhost:5173)

---

## Build production

```bash id="m3nq7d"
npm run build
```

Après le build, copier le fichier `.htaccess` dans le dossier `dist/` pour assurer le bon fonctionnement de Vue Router en production.

---

## Accès / authentification

L’application inclut un système de connexion local.

Les comptes disponibles dépendent des données présentes dans le stockage local ou des fichiers de démo (`/data`).

---

## Fonctionnalités principales

| Domaine     | Fonctionnalités                               |
| ----------- | --------------------------------------------- |
| Dashboard   | KPIs, graphiques, alertes                     |
| Planning    | Vue mensuelle et trimestrielle                |
| Prospects   | Suivi des contacts avant signature            |
| Clients     | Suivi des contrats et avancement              |
| Missions    | Gestion des tâches et temps passé             |
| Équipe      | Suivi de la charge de travail                 |
| Facturation | Suivi financier (théorique / réel / objectif) |

---

## Pages de l’application

| Page         | Route          | Description                  |
| ------------ | -------------- | ---------------------------- |
| Connexion    | `/connexion`   | Authentification utilisateur |
| Inscription  | `/inscription` | Création de compte           |
| Dashboard    | `/dashboard`   | Indicateurs + alertes        |
| Planning     | `/planning`    | Gestion du planning          |
| Prospects    | `/prospects`   | Suivi commercial             |
| Clients      | `/clients`     | Liste des clients            |
| Fiche client | `/clients/:id` | Détail d’un client           |
| Missions     | `/missions`    | Gestion des tâches           |
| Équipe       | `/employes`    | Gestion des collaborateurs   |
| Facturation  | `/facturation` | Suivi financier              |

---

## Stack technique

| Technologie         | Usage                               |
| ------------------- | ----------------------------------- |
| Vue.js 3            | Framework frontend                  |
| Vue Router          | Navigation                          |
| Vite                | Build tool                          |
| SCSS                | Styles modulaires                   |
| Chart.js            | Graphiques                          |
| localStorage        | Stockage des données                |
| Microsoft Graph API | Préparation synchronisation Outlook |

---

## Structure du projet

```id="z9k2lm"
src/
├── main.js                  point d’entrée + versioning données
├── App.vue                  layout principal
├── router/                 routes + guards
│
├── components/
│   ├── Sidebar.vue
│   └── ToastAlertes.vue
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
│   └── Facturation.vue
│
├── services/
│   ├── alertes.js
│   ├── db.js
│   └── outlook.js
│
├── data/
│   ├── employes.json
│   ├── clients.json
│   └── missions.json
│
└── scss/
    ├── styles.scss
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
    ├── _connexion.scss
    └── _inscription.scss
```

---

## Système d’alertes

Géré dans `services/alertes.js`, partagé entre plusieurs modules (Dashboard, Clients, Planning).

| Niveau      | Seuil   | Affichage     |
| ----------- | ------- | ------------- |
| Attention   | 70–90%  | Alerte jaune  |
| Dépassement | 90–100% | Alerte orange |
| Surplus     | > 100%  | Alerte rouge  |

Les alertes sont affichées sous forme de notifications et centralisées dans une icône dédiée.

---

## Logique de planning

```id="q7m2nd"
Jours planifiés + Jours à planifier = Jours dûs
Jours non chargés + Jours dûs = Jours ouvrés
```

Le planning propose :

* une vue mensuelle
* une vue trimestrielle

---

## Versioning des données

Dans `main.js`, un système de version permet de réinitialiser les données si nécessaire :

```js id="p2k9sd"
const VERSION_DONNEES = '1.3'
```

---

## Synchronisation Outlook (Microsoft Graph API)

Préparée mais non active.

Configuration :

```js id="w8d2kf"
clientId: 'VOTRE_CLIENT_ID_AZURE'
authority: 'https://login.microsoftonline.com/VOTRE_TENANT_ID'
```

Permission requise : `Calendars.Read`

---

## Évolution prévue

* Migration vers une base de données (Firebase ou API REST)
* Synchronisation multi-utilisateurs
* Export PDF / Excel
* Amélioration du système de gestion des rôles
* Intégration avancée Outlook (lecture + écriture)

---

## Résumé

Innov’HSE est une application de gestion interne permettant de centraliser le suivi des missions HSE, d’améliorer la visibilité sur la charge de travail et de structurer le pilotage opérationnel. Le projet est conçu de manière évolutive pour intégrer à terme une architecture backend complète.

