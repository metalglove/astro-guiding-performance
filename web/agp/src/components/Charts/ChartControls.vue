<template>
  <div class="controls-section">
    <div class="controls-grid">
      <div class="control-group">
        <label class="control-label">
          <span class="label-icon">📏</span>
          Scale
        </label>
        <div class="select-wrapper">
          <select :value="selectedScale" @change="handleScaleChange" class="control-select">
            <option v-for="option in selectScaleOptions" :key="option.id" :value="option.value">
              {{ option.value }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="control-group">
        <label class="control-label">
          <span class="label-icon">🎯</span>
          Axes
        </label>
        <div class="select-wrapper">
          <select :value="JSON.stringify(selectedAxes)" @change="handleAxesChange" class="control-select">
            <option v-for="option in selectAxesOptions" :key="option.id" :value="JSON.stringify(option.value)">
              {{ option.value.title }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="control-group">
        <label class="control-label">
          <span class="label-icon">📊</span>
          Data Density
        </label>
        <div class="density-info">
          <div class="density-stats">
            <span class="density-total">{{ dataPointsCount.toLocaleString() }} total points</span>
            <span class="density-sampled" v-if="dataPointsCount > 1000">
              ({{ sampledPointsCount.toLocaleString() }} displayed)
            </span>
          </div>
          <div class="density-indicator">
            <div class="density-bar">
              <div 
                class="density-fill" 
                :class="densityClass"
                :style="{ width: densityPercent + '%' }"
              ></div>
            </div>
            <span class="density-label">{{ densityLabel }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface AxesOption {
  title: string;
  code: number;
}

interface Props {
  selectedScale: string;
  selectedAxes: AxesOption;
  selectScaleOptions: Array<{ id: string; value: string }>;
  selectAxesOptions: Array<{ id: string; value: AxesOption }>;
  dataPointsCount: number;
  sampledPointsCount: number;
}

const props = defineProps<Props>();

const emit = defineEmits(['scale-changed', 'axes-changed']);

const handleScaleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit('scale-changed', target.value);
};

const handleAxesChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const selectedOption = props.selectAxesOptions.find(option => 
    JSON.stringify(option.value) === target.value
  );
  if (selectedOption) {
    emit('axes-changed', selectedOption.value);
  }
};

const densityClass = computed(() => {
  if (props.dataPointsCount < 1000) return 'density-low';
  if (props.dataPointsCount < 5000) return 'density-medium';
  if (props.dataPointsCount < 15000) return 'density-high';
  return 'density-extreme';
});

const densityPercent = computed(() => {
  const maxExpected = 50000;
  return Math.min((props.dataPointsCount / maxExpected) * 100, 100);
});

const densityLabel = computed(() => {
  if (props.dataPointsCount < 1000) return 'Light';
  if (props.dataPointsCount < 5000) return 'Moderate';
  if (props.dataPointsCount < 15000) return 'Dense';
  return 'Very Dense';
});
</script>

<style scoped>
.controls-section {
  background: linear-gradient(135deg, var(--card-bg) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  align-items: start;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-color);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.label-icon {
  font-size: 16px;
}

.select-wrapper {
  position: relative;
}

.control-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  font-weight: 500;
  appearance: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-select:hover {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.control-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
}

.select-wrapper::after {
  content: '▼';
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
  font-size: 12px;
}

.density-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.density-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.density-total {
  font-weight: 600;
  color: var(--text-color);
  font-size: 16px;
}

.density-sampled {
  color: var(--text-muted);
  font-size: 14px;
}

.density-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.density-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.density-fill {
  height: 100%;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.density-low { background: linear-gradient(90deg, #10b981, #34d399); }
.density-medium { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.density-high { background: linear-gradient(90deg, #ef4444, #f87171); }
.density-extreme { background: linear-gradient(90deg, #7c3aed, #a855f7); }

.density-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 80px;
  text-align: right;
}

@media (max-width: 768px) {
  .controls-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .controls-section {
    padding: 16px;
  }
}
</style>
