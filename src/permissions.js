import { computed } from 'vue'
import store from '../store.js'

export const profil = computed(() => store.user?.role || 'consultant')
export const estAdmin = computed(() => profil.value === 'admin')