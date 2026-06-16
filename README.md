# Innov'HSE Outil de pilotage

Outil de gestion et de planification des missions HSE développé dans le cadre d'un stage de 10 semaines (BUT MMI).

Avant cet outil, la gestion des missions, du plan de charge et des clients se faisait manuellement sur Excel et Outlook, sans vue consolidée. L'objectif est de centraliser l'ensemble dans une application unique, accessible depuis un navigateur, avec des données persistantes et synchronisées en temps réel.

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

Copier le fichier `.htaccess` dans le dossier `dist/` avant de déployer pour assurer le bon fonctionnement de Vue Router en mode history.

---

## Authentification

L'authentification est gérée via **Firebase Authentication** (email / mot de passe).

Les comptes sont créés depuis la page `/inscription` ou directement depuis la console Firebase. Le rôle de chaque utilisateur est stocké dans Firestore dans la collection `users` :

```
users/{uid} → { role: "admin" | "consultant" | "prof" }
```

| Rôle        | Accès                                                              |
| ----------- | ------------------------------------------------------------------ |
| admin       | Accès complet, y compris facturation                               |
| consultant  | Accès complet sauf facturation                                     |
| prof        | Lecture seule, aucun bouton d'ajout, modification ou suppression  |

---

## Fonctionnalités principales

| Domaine           | Fonctionnalités                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Dashboard         | KPIs globaux, graphiques équipe/client, alertes de dépassement, bilan mensuel            |
| Planning          | Vue mensuelle et trimestrielle, détail mission avec liens vers fiche client et missions  |
| Prospects         | Suivi commercial, besoins en tags, conversion prospect → client, statuts et relances     |
| Clients           | Suivi des contrats, avancement, alertes de dépassement en temps réel                    |
| Fiche client      | Contact, référents, types de missions en tags, missions liées, progression du contrat    |
| Missions          | Navigation par mois, multi-clients, commentaires persistants, export PDF                 |
| Équipe            | Taux de charge par consultant, jours restants, capacité annuelle                         |
| Facturation       | Suivi financier théorique / réel / objectif / facturé par client (admin uniquement)     |
| Indicateurs       | Saisie mensuelle par catégorie (frais, RH, finances, clients, commerce, communication)  |
| Recherche globale | Ctrl+K, recherche instantanée dans clients, missions, prospects                         |
| Notifications     | Alertes de dépassement contrat via toast (une fois/session) et cloche persistante        |

---

## Pages de l'application

| Page              | Route          | Description                              |
| ----------------- | -------------- | ---------------------------------------- |
| Connexion         | `/connexion`   | Authentification Firebase                |
| Inscription       | `/inscription` | Création de compte (rôle au choix)       |
| Dashboard         | `/tableau-bord`| Indicateurs globaux + alertes            |
| Planning          | `/planning`    | Vue planning mensuelle/trimestrielle     |
| Prospects         | `/prospects`   | Suivi commercial et conversion clients   |
| Clients           | `/clients`     | Liste des clients et suivi contrats      |
| Fiche client      | `/clients/:id` | Détail d'un client                       |
| Missions          | `/missions`    | Gestion des tâches par mois              |
| Équipe            | `/equipe`      | Gestion des collaborateurs               |
| Facturation       | `/facturation` | Suivi financier (admin uniquement)       |
| Indicateurs       | `/indicateurs` | Indicateurs mensuels par catégorie       |

---

## Stack technique

| Technologie      | Usage                                                        |
| ---------------- | ------------------------------------------------------------ |
| Vue.js 3         | Framework frontend (Composition API)                         |
| Vue Router       | Navigation + guards d'authentification                       |
| Vite             | Build tool                                                   |
| SCSS             | Styles modulaires avec variables globales                    |
| Chart.js         | Graphiques (barres, donut, courbes d'évolution)              |
| jsPDF            | Export PDF (missions, indicateurs, tableau de bord)          |
| Firebase Auth    | Authentification email/mot de passe                          |
| Firestore        | Base de données temps réel, synchronisation multi-utilisateur|
| Store réactif    | Partage d'état entre vues (sans Pinia)                       |

---

## Structure du projet

```
store.js                      Store réactif partagé entre toutes les vues
firebase.js                   Configuration Firebase

src/
├── main.js                   Point d'entrée + initialisation Firebase
├── App.vue                   Layout principal
├── permissions.js            Gestion des rôles (admin / consultant / prof)
├── router/
│   └── index.js              Routes + guards (authReadyPromise Firebase)
│
├── components/
│   ├── Sidebar.vue           Navigation latérale + déconnexion
│   ├── ToastAlertes.vue      Notifications d'alerte (une fois par session)
│   ├── ChargeCard.vue        Carte indicateur pour la page Indicateurs
│   ├── IndicateursMois.vue   Bloc bilan mensuel du dashboard
│   └── RechercheGlobale.vue  Recherche globale (Ctrl+K)
│
├── views/
│   ├── Connexion.vue
│   ├── Inscription.vue
│   ├── TableauBord.vue       Aperçu global + graphiques + alertes
│   ├── Planning.vue          Vue mensuelle et trimestrielle
│   ├── Prospects.vue         Liste des prospects + besoins en tags
│   ├── Clients.vue           Liste des clients + suivi des contrats
│   ├── FicheClient.vue       Détail client + référents + missions
│   ├── Missions.vue          Missions par mois + multi-clients + commentaires
│   ├── Equipe.vue            Collaborateurs + taux de charge
│   ├── Facturation.vue       Suivi financier (admin)
│   └── Indicateurs.vue       Indicateurs mensuels par catégorie
│
├── services/
│   ├── dataService.js        Couche d'accès aux données (Firebase)
│   └── alertes.js            Logique de calcul et niveaux d'alerte
│
├── data/
│   ├── employes.json         Données initiales employés (fallback)
│   ├── clients.json          Données initiales clients (fallback)
│   └── missions.json         Données initiales missions (fallback)
│
└── scss/
    ├── styles.scss
    ├── _layout.scss
    ├── _sidebar.scss
    ├── _alertes.scss
    ├── _modales.scss
    ├── _tableaubord.scss
    ├── _planning.scss
    ├── _clients.scss
    ├── _prospects.scss
    ├── _missions.scss
    ├── _employes.scss
    ├── _indicateurs.scss
    ├── _connexion.scss
    └── _inscription.scss
```

---

## Architecture des données

### Firebase / Firestore

Toutes les données sont stockées dans Firestore et synchronisées en temps réel via `onSnapshot`. Les collections utilisées :

| Collection      | Contenu                                      |
| --------------- | -------------------------------------------- |
| `clients`       | Liste des clients                            |
| `employes`      | Liste des employés                           |
| `missions`      | Missions / tâches                            |
| `prospects`     | Prospects commerciaux                        |
| `clients_extra` | Données éditables fiche client (référents, tags, facturation) |
| `missions_extra`| Commentaires persistants par mission         |
| `charges`       | Indicateurs mensuels (un seul doc `global`)  |
| `users`         | Rôle par utilisateur (`admin`, `consultant`, `prof`) |

### Couche dataService

Toutes les opérations Firebase passent exclusivement par `src/services/dataService.js`. Le store et les composants n'appellent jamais Firebase directement. Cette architecture permet une migration future vers une API REST (Symfony / Node + SQL) sans modifier le front :

```js
// Aujourd'hui, Firebase
dataService.getClients() → Firestore

// Demain, API REST
dataService.getClients() → fetch('https://api.innov-hse.fr/clients')
```

### Fallback JSON

Au premier lancement, si les collections Firestore sont vides, les données sont importées automatiquement depuis les fichiers JSON statiques (`src/data/`). Un flag `meta/seed_done` dans Firestore empêche toute réimportation ultérieure.

### Store réactif (`store.js`)

Le store centralise l'état de l'application et s'abonne aux collections Firestore au démarrage via `store.init()` :

```js
import store from './store.js'

// Lire (réactif)
const clients = computed(() => store.clients)

// Écrire (persiste dans Firestore)
await store.setClients(nouveauxClients)
await store.setClientExtra(id, 'champ', valeur)
```

---

## Système d'alertes

Géré dans `services/alertes.js`, partagé entre Dashboard, Clients et Planning.

| Niveau      | Seuil    | Affichage     |
| ----------- | -------- | ------------- |
| Attention   | 70–90%   | Alerte jaune  |
| Dépassement | 90–100%  | Alerte orange |
| Surplus     | > 100%   | Alerte rouge  |

Les alertes sont affichées sous forme de toasts **une seule fois par session**, puis accessibles via l'icône 🔔 dans la topbar.

---

## Système de prospects

Les prospects et les clients sont deux listes distinctes mais synchronisées :

- Un prospect peut être **converti en client** via le bouton "→ Client"
- La conversion crée un lien (`client_id` / `prospect_id`) entre les deux entrées
- **Supprimer un client supprime le prospect lié**, et inversement
- La page Prospects affiche aussi les clients existants (badge "Client")
- Les besoins sont saisis sous forme de **tags libres**

---

## Gestion des rôles

Les permissions sont centralisées dans `src/permissions.js` :

```js
export const estAdmin = computed(() => profil.value === 'admin')
export const peutEcrire = computed(() => profil.value === 'admin' || profil.value === 'consultant')
export const estProf = computed(() => profil.value === 'prof')
```

Pour supprimer le rôle `prof` : supprimer le compte depuis Firebase Console → Authentication.

---

## Points à finaliser pour la prochaine équipe

### Synchronisation Outlook
La synchronisation avec Outlook (Microsoft Graph API) n'a pas été implémentée faute de temps. L'objectif serait de lire et écrire les missions directement dans les calendriers Outlook des consultants. Il faudra créer une application Azure Active Directory avec la permission `Calendars.ReadWrite`.

### Backend et base de données
Actuellement Firebase est utilisé comme solution temporaire. L'architecture `dataService.js` est conçue pour permettre une migration vers une API REST (Symfony, Node.js...) + base SQL sans modifier le front, seul `src/services/dataService.js` est à réécrire.

### Sécurisation des données
Les règles Firestore actuelles autorisent tout utilisateur connecté à lire et écrire toutes les données. Une vraie sécurisation impliquerait des règles Firestore par rôle, ou une API backend qui gère les autorisations côté serveur.

### Gestion des permissions
Le système de rôles actuel (`admin`, `consultant`, `prof`) est fonctionnel mais basique. Une vraie gestion des permissions permettrait de définir des droits plus fins (par client, par consultant, par type de donnée).

### Espace personnel par consultant
Il a été évoqué que chaque consultant pourrait avoir une vue personnelle de ses missions et de son planning, avec seulement le planning et les missions en commun entre tous. Cette fonctionnalité n'a pas été précisée et reste à définir avec les utilisateurs.

---

## Reprise du projet à lire en priorité

### Clés Firebase

Les clés de connexion Firebase sont dans `firebase.js` à la racine de `src/`. Ce fichier contient les identifiants du projet Firebase actuel, il faudra les remplacer par ceux d'un nouveau projet Firebase ou d'une autre solution backend.

```js
const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    ...
}
```

### Données existantes

Toutes les données métier (clients, missions, employés, prospects, indicateurs) sont stockées dans **Firestore**. Avant de migrer vers une nouvelle infrastructure, il faudra exporter ces données depuis la console Firebase :

**Firebase Console → Firestore → Importer/Exporter → Exporter**

En cas de migration vers une API REST + SQL, seul `src/services/dataService.js` est à réécrire, aucune autre modification du front n'est nécessaire (voir section Architecture des données).

### Règles Firestore à sécuriser

Les règles Firestore actuelles sont ouvertes pour le développement. Avant toute mise en production, les remplacer par des règles restrictives :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Créer le premier compte admin

1. Firebase Console → **Authentication** → Ajouter un utilisateur
2. Firebase Console → **Firestore** → collection `users` → nouveau document avec l'uid → champ `role: "admin"`