<script setup lang="ts">
import { AirVent, AlertTriangle, Blinds, Droplets, Fan, Lightbulb, Loader2, Power, Settings, Thermometer, Tv, Zap } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { haSocket } from '../api'
import { useConfigStore } from '../stores/config'
import { useHAStore } from '../stores/ha'

const configStore = useConfigStore()
const haStore = useHAStore()
const { haConfig, haLayout, showDrawer, activeTab } = storeToRefs(configStore)
const { entitiesStates } = storeToRefs(haStore)
const { t } = useI18n()

const isConnecting = ref(false)

const loadingStates = ref<Record<string, boolean>>({})

function openSettings() {
  activeTab.value = 'smart'
  showDrawer.value = true
}

const connectErrorText = ref('')

// 计算网格列数的CSS类
const gridColsClass = computed(() => {
  const cols = haLayout.value.columns
  return {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  }[cols] || 'grid-cols-3'
})

// 计算要在顶部标题显示的温湿度信息（取第一个空调设备的数据）
const headerClimateInfo = computed(() => {
  const climateEntity = haConfig.value.entities.find(e => e.id.startsWith('climate.'))
  if (!climateEntity)
    return null

  const state = entitiesStates.value[climateEntity.id]
  if (!state || !state.attributes)
    return null

  const { current_temperature, current_humidity } = state.attributes
  if (current_temperature === undefined && current_humidity === undefined)
    return null

  return {
    temp: current_temperature,
    humi: current_humidity,
  }
})

function isEntityOn(entityId: string) {
  const state = entitiesStates.value[entityId]?.state
  if (entityId.startsWith('cover.')) {
    return state === 'open'
  }
  if (entityId.startsWith('climate.')) {
    return state && state !== 'off' && state !== 'unavailable'
  }
  return state === 'on'
}

function getIcon(domain: string, _isOn: boolean) {
  if (domain === 'light')
    return Lightbulb
  if (domain === 'switch')
    return Power
  if (domain === 'fan')
    return Fan
  if (domain === 'media_player')
    return Tv
  if (domain === 'cover')
    return Blinds
  if (domain === 'climate')
    return AirVent
  return Zap
}

async function initConnection() {
  if (!haConfig.value.url || !haConfig.value.token) return

  try {
    isConnecting.value = true
    await haSocket.connect(haConfig.value.url, haConfig.value.token)
    connectErrorText.value = ''
    haSocket.subscribeToEntities((entities) => {
      isConnecting.value = false
      haStore.setEntitiesStates(entities)
    })
  }
  catch (e) {
    console.error('HA Connection Error:', e)
    isConnecting.value = false
    entitiesStates.value = {}
    connectErrorText.value = t('smartHome.connectFailed')
  }
}

async function toggleEntity(entityId: string) {
  if (!entitiesStates.value[entityId]) return

  if (isConnecting.value) return

  const domain = entityId.split('.')[0]
  const isOn = isEntityOn(entityId)

  let service = ''
  if (domain === 'cover') {
    service = isOn ? 'close_cover' : 'open_cover'
  }
  else if (domain === 'climate') {
    service = isOn ? 'turn_off' : 'turn_on'
  }
  else {
    service = isOn ? 'turn_off' : 'turn_on'
  }

  loadingStates.value[entityId] = true

  try {
    await haSocket.callService(domain, service, { entity_id: entityId })

    loadingStates.value[entityId] = false
  }
  catch (e) {
    alert(t('smartHome.actionFailed'))
    loadingStates.value[entityId] = false
  }
}

onUnmounted(() => {
  haSocket.disconnect()
})

watch([() => haConfig.value.url, () => haConfig.value.token], () => {
  initConnection()
}, { deep: true, immediate: true })
</script>

<template>
  <div class="glass-panel py-[6vh] text-white h-full overflow-y-auto w-full">
    <div class="flex items-center justify-between w-full mb-[2vh] px-[5vh]">
      <div class="flex items-baseline space-x-6">
        <h2 class="text-[4vh] font-bold tracking-widest text-nowrap leading-[5vh]">
          {{ t('smartHome.title') }}
        </h2>
        <div v-if="headerClimateInfo" class="flex items-center space-x-6 opacity-60">
          <div v-if="headerClimateInfo.temp !== undefined" class="flex items-center space-x-2">
            <Thermometer class="w-[3vh] h-[3vh] text-orange-400" />
            <span class="text-[3vh] font-medium tabular-nums">{{ headerClimateInfo.temp }}°</span>
          </div>
          <div v-if="headerClimateInfo.humi !== undefined" class="flex items-center space-x-2">
            <Droplets class="w-[3vh] h-[3vh] text-blue-400" />
            <span class="text-[3vh] font-medium tabular-nums">{{ headerClimateInfo.humi }}%</span>
          </div>
        </div>
      </div>
      <div class="flex space-x-4 items-center">
        <div v-if="connectErrorText" class="flex items-center space-x-2">
          <AlertTriangle class="w-[4vh] h-[4vh] text-red-400" />
          <span class="text-red-400 text-[4vh]">{{ connectErrorText }}</span>
        </div>
        <button class="p-[1.5vh] bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-all" @click="openSettings">
          <Settings class="w-[3vh] h-[3vh]" />
        </button>
      </div>
    </div>

    <div v-if="haConfig.url && haConfig.token" id="ha-entities" class="grid w-full px-[4vh]" :class="gridColsClass">
      <div
        v-for="entity in haConfig.entities"
        :key="entity.id"
        class="ha-card"
        :class="{ 'on': isEntityOn(entity.id), 'opacity-50 pointer-events-none': isConnecting || loadingStates[entity.id] }"
        @click="toggleEntity(entity.id)"
      >
        <div class="flex items-center justify-between w-full mb-4">
          <div
            class="w-[6vh] h-[6vh] flex items-center justify-center rounded-full transition-colors flex-shrink-0"
            :class="isEntityOn(entity.id) ? 'bg-white text-black' : 'bg-white/10 text-white'"
          >
            <Loader2 v-if="isConnecting || loadingStates[entity.id]" class="w-[3.5vh] h-[3.5vh] animate-spin" />
            <AlertTriangle v-else-if="!entitiesStates[entity.id]" class="w-[3.5vh] h-[3.5vh] text-orange-400" />
            <component :is="getIcon(entity.id.split('.')[0], isEntityOn(entity.id))" v-else class="w-[3.5vh] h-[3.5vh]" />
          </div>

          <!-- 右侧温湿度 (针对空调/climate) -->
          <div v-if="entity.id.startsWith('climate.') && entitiesStates[entity.id]?.attributes" class="flex flex-wrap justify-end overflow-x-hidden opacity-80">
            <div v-if="entitiesStates[entity.id].attributes.current_temperature !== undefined" class="flex items-center">
              <Thermometer class="w-[2.5vh] h-[2.5vh] text-orange-400 mr-[0.8vh]" />
              <span class="text-[2vh]">{{ entitiesStates[entity.id].attributes.current_temperature }}°</span>
            </div>
            <div v-if="entitiesStates[entity.id].attributes.current_humidity !== undefined" class="flex items-center ml-4">
              <Droplets class="w-[2.5vh] h-[2.5vh] text-blue-400 mr-[0.8vh]" />
              <span class="text-[2vh]">{{ entitiesStates[entity.id].attributes.current_humidity }}%</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col overflow-hidden w-full">
          <div class="font-bold text-[2.4vh] truncate w-full">
            {{ entity.name || (entitiesStates[entity.id] && entitiesStates[entity.id].attributes && entitiesStates[entity.id].attributes.friendly_name) || entity.id }}
          </div>
          <div class="text-[2vh] opacity-50 uppercase tracking-widest">
            <template v-if="entity.id.startsWith('climate.') && isEntityOn(entity.id)">
              {{ entitiesStates[entity.id]?.attributes?.temperature ? `${entitiesStates[entity.id].attributes.temperature}°C` : t('smartHome.statusOn') }}
            </template>
            <template v-else>
              {{ !entitiesStates[entity.id] ? t('smartHome.notFound') : isEntityOn(entity.id) ? t('smartHome.statusOn') : t('smartHome.statusOff') }}
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="col-span-full text-center py-20 opacity-50">
      <p>{{ t('smartHome.setupTip') }}</p>
    </div>
  </div>
</template>

<style scoped>
.ha-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 3vh;
  padding: 3vh;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  margin: 1.5vh;
}

.ha-card.on {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.ha-card:active {
  transform: scale(0.95);
}

.glass-panel {
  max-width: 1200px;
}
</style>
