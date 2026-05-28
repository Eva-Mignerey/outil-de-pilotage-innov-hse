<script setup>
defineProps({
    ind: Object,
    cat: Object,
    valeur: Function,
    saisir: Function
})
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
                {{ ind.source}}
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
    </div>
</template>