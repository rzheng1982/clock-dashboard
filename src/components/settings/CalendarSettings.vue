<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '../../stores/config'

const configStore = useConfigStore()
const { calendarConfig } = storeToRefs(configStore)
const { t } = useI18n()

const calendarDraft = ref({ ...calendarConfig.value })

function save() {
  calendarConfig.value = { ...calendarDraft.value }
}

function reset() {
  calendarDraft.value = { ...calendarConfig.value }
}

defineExpose({ save, reset })
</script>

<template>
  <div class="space-y-10 animate-fade-in">
    <section>
      <h4 class="text-white/60 mb-4 uppercase tracking-widest text-sm font-medium">
        {{ t('calendarSettings.weekStart') }}
      </h4>
      <div class="grid grid-cols-2 space-x-4">
        <button
          class="settings-tab-btn"
          :class="{ active: calendarDraft.weekStartDay === 1 }"
          @click="calendarDraft.weekStartDay = 1"
        >
          {{ t('calendarSettings.monday') }}
        </button>
        <button
          class="settings-tab-btn"
          :class="{ active: calendarDraft.weekStartDay === 0 }"
          @click="calendarDraft.weekStartDay = 0"
        >
          {{ t('calendarSettings.sunday') }}
        </button>
      </div>
    </section>

    <section>
      <h4 class="text-white/60 mb-4 uppercase tracking-widest text-sm font-medium">
        {{ t('calendarSettings.display') }}
      </h4>
      <div
        class="settings-toggle-card"
        :class="{ active: calendarDraft.showHolidays }"
        @click="calendarDraft.showHolidays = !calendarDraft.showHolidays"
      >
        <span class="font-medium">{{ t('calendarSettings.showHolidays') }}</span>
        <div class="toggle-switch">
          <div class="toggle-dot" />
        </div>
      </div>
    </section>
  </div>
</template>
