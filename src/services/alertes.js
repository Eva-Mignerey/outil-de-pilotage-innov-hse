function joursRealises(missions, clientId) {
    return missions
        .filter(m => m.client_id === clientId && m.statut === 'valide')
        .reduce((s, m) => s + (m.nb_jours || 0), 0)
}

export function niveauAlerte(realise, contrat) {
    if (!contrat) return 'ok'
    const pct = (realise / contrat) * 100
    if (pct > 100) return 'surplus'
    if (pct >= 90) return 'depasse'
    if (pct >= 70) return 'attention'
    return 'ok'
}

export function messageAlerte(realise, contrat) {
    if (!contrat) return null
    const reste = contrat - realise
    const pct   = Math.round((realise / contrat) * 100)
    if (realise > contrat) return ` → Dépassement de ${realise - contrat}j (${pct}% du contrat)`
    if (pct >= 90) return ` → Plus que ${reste}j disponible sur ce contrat`
    if (pct >= 70) return ` → Reste ${reste}j — bientôt à la limite du contrat`
    return null
}

export function alertesActives(clients, missions) {
    const ordre = { surplus: 0, depasse: 1, attention: 2, ok: 3 }
    return clients
        .map(c => {
            const realise = joursRealises(missions, c.id)
            const niveau = niveauAlerte(realise, c.jours_contractualises)
            const message = messageAlerte(realise, c.jours_contractualises)
            return { client: c, realise, niveau, message }
        })
        .filter(a => a.niveau !== 'ok')
        .sort((a, b) => ordre[a.niveau] - ordre[b.niveau])
}
