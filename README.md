# Innov'HSE — Outil de pilotage

Outil de gestion et de planification des missions HSE développé en stage de 10 semaines (BUT MMI).

Avant cet outil, la gestion des missions, du plan de charge et des clients se faisait manuellement sur Excel et Outlook sans vue consolidée. L'objectif est de centraliser tout ça en un seul endroit.

---

## Lancer le projet

```bash
npm install
npm run dev
```

Accessible sur `http://localhost:5173`

### Build production

```bash
npm run build
```

Copier le `.htaccess` dans le dossier `dist/` après le build pour que Vue Router fonctionne correctement sur le serveur.

---

## Comptes de démo

Au premier lancement les données et comptes sont créés automatiquement.

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| demo@innov-hse.fr | demo1234 | Administrateur |
| andrea@innov-hse.fr | demo1234 | Consultant |
| antonin@innov-hse.fr | demo1234 | Consultant |

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Connexion | `/connexion` | Login avec sélection de profil |
| Inscription | `/inscription` | Création de compte |
| Tableau de bord | `/dashboard` | KPIs, graphiques, alertes pop-up |
| Planning | `/planning` | Calendrier mensuel + données réelles + vue trimestrielle |
| Prospects | `/prospects` | Suivi des contacts avant signature |
| Clients | `/clients` | Contrats, avancement, alertes dépassement |
| Fiche client | `/clients/:id` | Détail d'un client avec toutes ses missions |
| Missions / Tâches | `/missions` | Saisie et validation des tâches |
| Équipe | `/employes` | Consultants, taux de charge, capacité |
| Facturation | `/facturation` | Saisie manuelle théorique / réel / objectif / facturé |

---

## Stack technique

| Technologie | Usage |
|-------------|-------|
| Vue.js 3 | Framework frontend (Composition API) |
| Vue Router | Navigation entre les pages |
| SCSS | Styles modulaires — un fichier par page |
| Chart.js | Graphiques du tableau de bord |
| localStorage | Stockage des données |
| Microsoft Graph API | Synchronisation Outlook (configurée, en attente accès Azure) |
| Vite | Build tool |

---

## Structure

```
src/
├── main.js                  point d'entrée + versioning des données
├── App.vue                  router-view + écran de connexion
├── router/index.js          toutes les routes + garde de navigation
│
├── components/
│   ├── Sidebar.vue          navigation + burger mobile + cloche alertes
│   └── ToastAlertes.vue     notifications style Windows 11 (bas droite)
│
├── views/
│   ├── Connexion.vue
│   ├── Inscription.vue
│   ├── Dashboard.vue        KPIs + 3 graphiques + pop-up alertes
│   ├── Planning.vue         calendrier + liste mobile + données réelles
│   ├── Prospects.vue        CRM léger avant signature client
│   ├── Clients.vue          liste clients + alertes dépassement
│   ├── FicheClient.vue      détail client + historique missions
│   ├── Missions.vue         missions/tâches + heures fractionnées
│   ├── Employes.vue         équipe + taux de charge
│   └── Facturation.vue      suivi financier par client
│
├── services/
│   ├── alertes.js           logique centralisée des alertes (3 niveaux)
│   ├── db.js                CRUD localStorage + import Outlook
│   └── outlook.js           connexion Microsoft Graph API
│
├── data/
│   ├── employes.json        données de démo
│   ├── clients.json         21 vrais clients (Carbonex, Wintzenmann...)
│   └── missions.json        missions Avril / Mai / Juin 2026
│
└── scss/
    ├── styles.scss          point d'entrée — importe tout
    ├── _layout.scss         variables, reset, composants partagés
    ├── _sidebar.scss        sidebar + burger mobile
    ├── _alertes.scss        toasts + bandeau + badges
    ├── _modales.scss        modales
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

## Système d'alertes

Géré dans `services/alertes.js`, partagé entre le Dashboard, la page Clients et le Planning.

| Niveau | Seuil | Affichage |
|--------|-------|-----------|
| `attention` | 70–90% du contrat consommé | Toast jaune |
| `depasse` | 90–100% | Toast orange/rouge |
| `surplus` | > 100% | Toast rouge foncé |

Les toasts apparaissent et se ferment automatiquement après 1 minute. La cloche dans la topbar affiche le nombre d'alertes actives.

---

## Formules Planning — données réelles

```
Jours planifiés + Jours à planifier = Jours dûs
Jours non chargés + Jours dûs       = Jours ouvrés ✓
```

Le tableau affiche une vue par mois et une vue trimestrielle (toggle).

---

## Mise à jour des données

Dans `main.js`, changer le numéro de version pour forcer la réinitialisation des données au prochain chargement :

```js
const VERSION_DONNEES = '1.3' // ← incrémenter ici
```

Les comptes de connexion ne sont jamais écrasés.

---

## Config Outlook (Graph API)

Dans `services/outlook.js`, renseigner après enregistrement sur portal.azure.com :

```js
clientId: 'VOTRE_CLIENT_ID_AZURE'
authority: 'https://login.microsoftonline.com/VOTRE_TENANT_ID'
```

Permission requise : `Calendars.Read`

---

## Roadmap v2

- [ ] Sync Outlook en écriture (bidirectionnelle)
- [ ] Export PDF et Excel par client
- [ ] Questionnaire satisfaction client paramétrable
- [ ] Objectifs financiers avec plan d'action
- [ ] Migration localStorage → Firebase (multi-utilisateurs temps réel)
- [ ] Interfaces séparées admin / consultant
- [ ] Pages personnalisées par consultant

