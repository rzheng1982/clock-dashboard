<script setup lang="ts">
import { Calendar, Clock, CloudSun, Github, Globe, Home, Save, X } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import packageJson from '../../package.json'
import { useConfigStore } from '../stores/config'
import { isIpadIOS15OrLower } from '../utils/device'
import CalendarSettings from './settings/CalendarSettings.vue'
import ClockSettings from './settings/ClockSettings.vue'
import GeneralSettings from './settings/GeneralSettings.vue'
import SmartHomeSettings from './settings/SmartHomeSettings.vue'
import WeatherSettings from './settings/WeatherSettings.vue'

const VERSION = packageJson.version

const configStore = useConfigStore()
const { showDrawer, activeTab } = storeToRefs(configStore)
const { t } = useI18n()

const tabs = [
  { id: 'general', labelKey: 'tabs.general', icon: Globe },
  { id: 'clock', labelKey: 'tabs.clock', icon: Clock },
  { id: 'weather', labelKey: 'tabs.weather', icon: CloudSun },
  { id: 'calendar', labelKey: 'tabs.calendar', icon: Calendar },
  { id: 'smart', labelKey: 'tabs.smart', icon: Home },
] as const

const activeTabLabel = computed(() => t(`tabs.${activeTab.value}`))

const clockSettingsRef = ref<InstanceType<typeof ClockSettings> | null>(null)
const weatherSettingsRef = ref<InstanceType<typeof WeatherSettings> | null>(null)
const calendarSettingsRef = ref<InstanceType<typeof CalendarSettings> | null>(null)
const smartHomeSettingsRef = ref<InstanceType<typeof SmartHomeSettings> | null>(null)
const generalSettingsRef = ref<InstanceType<typeof GeneralSettings> | null>(null)

watch(showDrawer, (isShowing) => {
  if (isShowing) {
    generalSettingsRef.value?.reset()
    clockSettingsRef.value?.reset()
    weatherSettingsRef.value?.reset()
    calendarSettingsRef.value?.reset()
    smartHomeSettingsRef.value?.reset()
  }
})

function saveAll() {
  generalSettingsRef.value?.save()
  clockSettingsRef.value?.save()
  weatherSettingsRef.value?.save()
  calendarSettingsRef.value?.save()
  smartHomeSettingsRef.value?.save()
  showDrawer.value = false
}

function closeDrawer() {
  showDrawer.value = false
}
</script>

<template>
  <div
    v-if="showDrawer"
    class="fixed inset-0 z-[1000] overflow-hidden bg-black/80"
    @click.stop.self="closeDrawer"
    @touchstart.stop
    @touchend.stop
    @mousedown.stop
    @mouseup.stop
  >
    <!-- Drawer Content -->
    <div class="absolute top-0 left-0 bottom-0 w-full max-w-2xl p-2 drawer-content">
      <div class="relative flex w-full h-full border border-white/20 rounded-2xl bg-neutral-950">
        <div v-if="!isIpadIOS15OrLower()" class="absolute inset-20 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

        <!-- Sidebar -->
        <div class="w-20 md:w-48 border-r border-white/10 flex flex-col py-4 flex-shrink-0 overflow-y-auto">
          <div class="px-4 mb-10 hidden md:block">
            <h2 class="text-xl font-bold tracking-tighter text-white/90">
              {{ t('settingsDrawer.title') }}
            </h2>
          </div>
          <nav class="flex-1 space-y-2 px-2">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="w-full rounded-xl transition-all duration-300 border border-white/0 hover:border-white/60"
              :class="activeTab === tab.id ? 'bg-white/[0.09] font-bold shadow-lg border-white/60' : 'text-white/40 hover:text-white/70 hover:bg-white/5'"
              @click="activeTab = tab.id"
            >
              <span class="flex flex-col md:flex-row items-center px-3 py-4 md:py-3">
                <component :is="tab.icon" class="w-6 h-6 mr-0 md:mr-2 mb-2 md:mb-0" />
                <span class="text-xs md:text-base md:tracking-wide">{{ t(tab.labelKey) }}</span>
              </span>
            </button>
          </nav>

          <div class="hidden md:block text-center text-[10px] text-white/30">
            <div>{{ t('settingsDrawer.version', { version: VERSION }) }}</div>
            <div>
              <a href="https://github.com/teojs/clock-dashboard" target="_blank" class="text-blue-500/80 inline-flex items-center">
                {{ t('settingsDrawer.copyright') }}
              </a>
            </div>
          </div>
          <div class="block md:hidden text-center text-[10px] text-white/30 mt-8">
            <a href="https://github.com/teojs/clock-dashboard" target="_blank" class="text-blue-500/80 inline-flex items-center">
              <Github class="w-6 h-6 text-white/40" />
            </a>
          </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col min-w-0">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <h3 class="text-xl font-medium text-white">
              {{ t('settingsDrawer.tabTitle', { tab: activeTabLabel }) }}
            </h3>
            <div class="space-x-2">
              <button class="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all" @click="closeDrawer">
                <X class="w-6 h-6" />
              </button>
              <!-- Save Button -->
              <button class="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all" @click="saveAll">
                <Save class="w-6 h-6" />
              </button>
            </div>
          </div>

          <!-- Scrollable Area -->
          <div class="flex-1 overflow-y-auto p-6">
            <GeneralSettings v-if="activeTab === 'general'" ref="generalSettingsRef" />
            <ClockSettings v-if="activeTab === 'clock'" ref="clockSettingsRef" />
            <WeatherSettings v-if="activeTab === 'weather'" ref="weatherSettingsRef" />
            <CalendarSettings v-if="activeTab === 'calendar'" ref="calendarSettingsRef" />
            <SmartHomeSettings v-if="activeTab === 'smart'" ref="smartHomeSettingsRef" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cubic-bezier {
  transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
}
</style>

<style>
.settings-range {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
}
.settings-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  border: none;
  transition: transform 0.2s;
}
.settings-range::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.settings-toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
}
.settings-toggle-card:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.1);
}
.settings-toggle-card.active {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.toggle-switch {
  width: 2.6rem;
  height: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  position: relative;
  transition: all 0.3s;
  flex-shrink: 0;
}
.settings-toggle-card.active .toggle-switch {
  background: white;
}
.toggle-dot {
  position: absolute;
  top: 0.05rem;
  left: 0.05rem;
  width: 1.4rem;
  height: 1.4rem;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.settings-toggle-card.active .toggle-dot {
  left: 1.15rem;
  background: black;
}

.settings-tab-btn {
  padding: 0.5rem 0.5rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  transition: all 0.3s;
}
.settings-tab-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}
.settings-tab-btn.active {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.6);
  color: white;
  font-weight: bold;
}

.settings-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: white;
  outline: none;
  transition: all 0.3s;
}
.settings-input:focus {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
}

.settings-secondary-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.3s;
}
.settings-secondary-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
  color: white;
}

.animate-fade-in {
  animation: none !important;
}
</style>
