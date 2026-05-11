import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHAStore = defineStore('ha', () => {
  const entitiesStates = ref<Record<string, any>>({})

  function setEntitiesStates(states: Record<string, any>) {
    entitiesStates.value = states
  }

  return {
    entitiesStates,
    setEntitiesStates,
  }
}, {
  persist: {
    omit: [],
  },
})
