# Innov'HSE — Outil de pilotage

Outil de planification et de suivi des missions HSE, développé en stage de 10 semaines.

Avant cet outil, tout passait par Excel et Outlook séparément, sans vue consolidée ni alertes. L'idée c'était de centraliser ça en un seul endroit.

---

## Ce que fait l'appli

- Planning mensuel de l'équipe avec vue calendrier (desktop) et vue liste (mobile)
- Suivi des contrats clients avec alertes quand on approche ou dépasse le nombre de jours prévu
- Tableau de bord avec graphiques de taux de charge
- Gestion des missions par consultant
- Synchronisation Outlook via Microsoft Graph API (lecture des calendriers)

---

## Stack

- Vue.js 3 + Vue Router
- SCSS (un fichier par page)
- Chart.js pour les graphiques
- localStorage pour les données
- Microsoft Graph API pour Outlook
- Vite

---

## Lancer le projet

```bash
npm install
npm run dev
```

Accessible sur `http://localhost:5173`

Les données de démo se chargent automatiquement au premier lancement.

**Comptes de démo** (mot de passe : `demo1234`) :
- `demo@innov-hse.fr` — administrateur
- `andrea@innov-hse.fr` — consultant
- `antonin@innov-hse.fr` — consultant

---

## Structure

```
src/
├── views/          pages de l'appli
├── components/     Sidebar.vue
├── services/       alertes.js, outlook.js
├── data/           données de démo (JSON)
└── scss/           un fichier par page + _layout.scss partagé
```

---

## Alertes de dépassement

Gérées dans `services/alertes.js`, elles s'affichent sur le dashboard et la page clients.

| Niveau | Seuil |
|--------|-------|
| attention | 70–90% du contrat consommé |
| dépassé | 90–100% |
| surplus | au-delà du contrat |

---

## Config Outlook

Dans `services/outlook.js`, remplacer :
```js
clientId: 'VOTRE_CLIENT_ID_AZURE'
authority: 'https://login.microsoftonline.com/VOTRE_TENANT_ID'
```

L'app doit être enregistrée sur portal.azure.com avec la permission `Calendars.Read`.

---

## Ce qui reste à faire (v2)

- Sync Outlook en écriture (bidirectionnelle)
- Page facturation avec écarts théorique/réel
- Export PDF et Excel
- Migration vers Firebase pour le multi-utilisateurs en temps réel
- Questionnaire satisfaction client
- Objectifs financiers
