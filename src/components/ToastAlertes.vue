<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { alertesActives } from '../services/alertes.js'

const props = defineProps({
    clients: { type: Array, default: () => [] },
    missions: { type: Array, default: () => [] },
    single: { type: Boolean, default: false }
})

const toasts = ref([])

const alertes = computed(() =>
  alertesActives(props.clients, props.missions)
)

const icones = {
  surplus: '🚨',
  depasse: '⚠️',
  attention: '⚡'
}

const CLE_SESSION = 'ihse_toasts_affichés'

function dejaMontres() {
  return sessionStorage.getItem(CLE_SESSION) === '1'
}

function marquerMontres() {
  sessionStorage.setItem(CLE_SESSION, '1')
}

function afficherToasts() {
    if (dejaMontres()) return

    const alertesTriees = [...alertes.value]
    if (alertesTriees.length === 0) return

    marquerMontres()

    alertesTriees.forEach((a, i) => {
        const id = Date.now() + i
        setTimeout(() => {
            toasts.value.push({ id, ...a, sortie: false })
            setTimeout(() => fermer(id), 60000)
        }, i * 200)
    })
}

function fermer(id) {
  const t = toasts.value.find(t => t.id === id)
  if (!t) return
  t.sortie = true
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 250)
}

onMounted(() => {
  if (alertes.value.length) afficherToasts()
})

watch(alertes, (nouvelles) => {
  if (nouvelles.length) afficherToasts()
})
</script>

<template>
  <Teleport to="body">
    <div class="notif-wrap">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="notif"
        :class="[t.niveau, { sortie: t.sortie }]"
      >
        <span>{{ icones[t.niveau] }}</span>

        <div class="contenu">
          <strong>{{ t.client.nom }}</strong>
          <p>{{ t.message }}</p>
        </div>

        <button @click="fermer(t.id)">✕</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.notif-wrap{
  position:fixed;
  top:20px;
  right:20px;
  width:320px;
  display:flex;
  flex-direction:column;
  gap:10px;
  z-index:9999;
}

.notif{
  display:flex;
  gap:12px;
  align-items:flex-start;
  background:#fff;
  padding:14px;
  border-radius:14px;
  box-shadow:0 8px 25px rgba(0,0,0,.15);
  border-left:4px solid #3b82f6;
  animation:slide .3s;
}

.notif.attention{border-color:#eab308}
.notif.depasse{border-color:#ef4444}
.notif.surplus{border-color:#dc2626}

.contenu{flex:1}
p{margin:4px 0 0;font-size:.85rem}

button{
  border:none;
  background:none;
  cursor:pointer;
  opacity:.6;
}

.sortie{
  opacity:0;
  transform:translateX(100%);
  transition:.25s;
}

@keyframes slide{
  from{
    opacity:0;
    transform:translateX(100%);
  }
  to{
    opacity:1;
    transform:translateX(0);
  }
}
</style>