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

---


## à retirer ->
## A la fin du projet :


# Il faudra commencer une documentation technique plus détaillée par rapport à : 
- la structure des données (missions, clients, employés)
- le fonctionnement du système des alertes
- la logique et les calculs sur la page de facturation
- les étapes pour ajouter tout ce qui est prévu plus tard (export PDF, synchronisation avec outlouk, etc...)
- les étapes pour faire évoluer le projet vers une architecture backend (choix de technologie, structure de l’API, doubles comptes, etc...)
- les étapes pour transformer le projet en vraie application mobile
- une documentation utilisateur pour expliquer comment utiliser les différentes fonctionnalités de l’application (création de missions, gestion des clients, etc...)
- un guide de contribution pour les futurs développeurs qui souhaiteraient contribuer au projet (comment cloner le repo, comment faire une pull request, etc...)
- une section FAQ pour répondre aux questions fréquentes sur l’utilisation de l’application et la contribution au projet.
- peut-être une ia pour aider à répondre au questions si on ne sait pas répondre à une question de la FAQ ? (à voir)

# Il faudra faire des tests unitaires et d’intégration pour assurer la qualité du code et la fiabilité de l’application.
- tests unitaires pour les fonctions de calcul (facturation, alertes, etc...)
- tests d’intégration pour les différentes pages de l’application (connexion, dashboard, clients, etc...)
- tests de bout en bout pour simuler l’utilisation de l’application par un utilisateur réel
- tests de performance pour s’assurer que l’application est rapide et réactive même avec une grande quantité de données
- tests de sécurité pour s’assurer que les données des utilisateurs sont protégées et que l’application est résistante aux attaques courantes (XSS, CSRF, etc...)

# il faudra avoir une base de données autonome pour stocker les données de l’application (clients, missions, employés, etc...)
- choix de la technologie de base de données (Firebase, MongoDB, PostgreSQL, etc...)
- mise en place de l’API pour communiquer avec la base de données
- gestion de l’authentification et des rôles pour sécuriser l’accès aux données
- mise en place d’un système de sauvegarde et de restauration des données pour éviter les pertes
- mise en place d’un système de synchronisation pour permettre à plusieurs utilisateurs de travailler sur les mêmes données en temps réel

# Il faudra faire une refonte de l’interface utilisateur pour améliorer l’expérience utilisateur et rendre l’application plus agréable à utiliser.
- amélioration de la navigation entre les différentes pages de l’application
- amélioration de la présentation des données (tableaux, graphiques, etc...)
- ajout de fonctionnalités pour personnaliser l’interface (thèmes, dispositions, etc...)
- amélioration de la réactivité de l’application pour une utilisation fluide sur mobile et tablette
- ajout de fonctionnalités pour faciliter l’utilisation de l’application (recherche, filtres, etc...)

# Il faudra faire une campagne de communication pour promouvoir l’application auprès des utilisateurs potentiels et recueillir des feedbacks pour améliorer l’application.
- création d’un site web pour présenter l’application et ses fonctionnalités
- création de comptes sur les réseaux sociaux pour partager des mises à jour et des astuces d’utilisation
- organisation de webinaires ou de démonstrations en ligne pour présenter l’application et répondre aux questions des utilisateurs
- création d’une newsletter pour tenir les utilisateurs informés des nouveautés et des mises à jour de l’application
- mise en place d’un système de feedback pour recueillir les avis des utilisateurs et les suggestions d’amélioration de l’application.

# Il faudra avoir une équipe de développement pour assurer la maintenance et l’évolution de l’application après le stage.
- recrutement de développeurs pour assurer la maintenance et l’évolution de l’application
- mise en place d’un système de gestion de projet pour organiser le travail de l’équipe (Trello, Jira, etc...)
- mise en place d’un système de communication pour faciliter les échanges au sein de l’équipe (Slack, Teams, etc...)
- mise en place d’un système de revue de code pour assurer la qualité du code et partager les connaissances au sein de l’équipe
- mise en place d’un système de documentation pour partager les connaissances sur le projet et faciliter l’intégration de nouveaux développeurs dans l’équipe.

# A retirer à la fin du projet
- faire un nettoyage du code pour retirer console.log, fonctions inutilisées, etc...
- faire une revue de code pour s’assurer que le code est propre, lisible et maintenable à la longue
- faire une optimisation du code pour améliorer les performances de l’application
- faire une optimisation des images et des ressources pour réduire le temps de chargement de l’application
- faire une optimisation du référencement pour améliorer la visibilité de l’application sur les moteurs de recherche
- faire un test sur écoindex pour évaluer l’impact environnemental de l’application et trouver des moyens de le réduire.
