<script setup>
const props = defineProps({
    ind: Object,
    cat: Object,
    valeur: Function,
    saisir: Function
})

const OBJECTIFS_COMMUNICATION = {
    nb_abonnes: 10,
    impressions: 500,
    taux_engagement: 5,
    nb_publication: 4,
    ctr: 10,
    nb_reactions: 150,
    nb_prise_contact_linkedin: 5
}

const objectif = OBJECTIFS_COMMUNICATION[props.ind.cle] ?? null

const atteint = () => {
    if (objectif === null) return null
    const v = parseFloat(props.valeur(props.ind.cle))
    if (isNaN(v)) return null
    return v >= objectif
}
</script>

<template>
    <div
        class="charges__carte"
        :style="{ '--cat-couleur': cat.couleur }"
    >
        <div class="charges__carte-haut">
            <div class="charges__carte-titre">
                {{ ind.label }}
            </div>

            <div
                v-if="ind.source"
                class="charges__carte-source"
            >
                {{ ind.source }}
            </div>
        </div>

        <div class="charges__carte-bas">
            <input
                class="charges__input"
                type="number"
                :placeholder="ind.unite || '0'"
                :value="valeur(ind.cle)"
                :min="ind.autoriserNegatif ? undefined : 0"
                @input="saisir(ind.cle, $event.target.value)"
            />

            <span
                v-if="ind.unite"
                class="charges__unite"
            >
                {{ ind.unite }}
            </span>
        </div>

        <div v-if="objectif !== null" class="charges__objectif">
            <span>Obj. {{ objectif }}{{ ind.unite || '' }}</span>
            <span
                v-if="atteint() !== null"
                class="charges__objectif-badge"
                :class="atteint() ? 'charges__objectif-badge--ok' : 'charges__objectif-badge--ko'"
            >
                {{ atteint() ? '✓' : '✗' }}
            </span>
        </div>
    </div>
</template>
