<template>
  <div class="statistics-section">
    <div class="statistics-header">
      <h3 class="statistics-title">
        <span class="statistics-icon">📊</span>
        Performance Statistics
      </h3>
      <p class="statistics-subtitle">
        Key metrics for guiding accuracy analysis
      </p>
    </div>

    <!-- Equipment Profile Warning -->
    <div v-if="!hasActiveProfile" class="equipment-warning">
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <div class="warning-text">
          <h4>No Equipment Profile Found</h4>
          <p>Create an equipment profile to see detailed pixel-scale analysis and performance calculations.</p>
        </div>
      </div>
    </div>

    <!-- Camera Selection -->
    <div v-if="hasActiveProfile" class="camera-selection">
      <div class="camera-selection-header">
        <h4 class="camera-selection-title">
          <span class="camera-icon">📷</span>
          Main Camera Selection
        </h4>
        <p class="camera-selection-subtitle">
          Select your imaging camera for pixel-well analysis
        </p>
      </div>
      
      <div class="camera-dropdown">
        <select v-model="selectedCamera" @change="updateCameraSpecs" class="camera-select">
          <option value="active-profile">Active Profile Camera</option>
          <option v-for="camera in presetCameras.filter(c => c.type === 'imaging')" :key="camera.id" :value="camera.id">
            {{ camera.name }}
          </option>
          <option value="guide-camera">Use Guide Camera ({{ guideCameraInfo }})</option>
          <option value="custom">Custom Camera</option>
        </select>
      </div>

      <div v-if="selectedCamera === 'custom'" class="custom-camera-inputs">
        <div class="input-group">
          <label>Pixel Size (μm):</label>
          <input v-model.number="customPixelSize" type="number" step="0.1" min="1" max="50" />
        </div>
        <div class="input-group">
          <label>Sensor Width (pixels):</label>
          <input v-model.number="customWidth" type="number" min="1000" max="10000" />
        </div>
        <div class="input-group">
          <label>Sensor Height (pixels):</label>
          <input v-model.number="customHeight" type="number" min="1000" max="10000" />
        </div>
      </div>
    </div>

    <div class="statistics-grid">
      <div class="stat-card rms-card">
        <div class="stat-header">
          <span class="stat-icon">🎯</span>
          <span class="stat-label">RMS Error</span>
        </div>
        <div class="stat-values">
          <div class="stat-primary">
            <span class="stat-value">{{ rmsStats.total.toFixed(3) }}</span>
            <span class="stat-unit">″</span>
          </div>
          <div class="stat-breakdown">
            <div class="stat-component">
              <span class="component-label">RA:</span>
              <span class="component-value">{{ rmsStats.ra.toFixed(3) }}″</span>
            </div>
            <div class="stat-component">
              <span class="component-label">Dec:</span>
              <span class="component-value">{{ rmsStats.dec.toFixed(3) }}″</span>
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card max-error-card">
        <div class="stat-header">
          <span class="stat-icon">⚠️</span>
          <span class="stat-label">Max Error</span>
        </div>
        <div class="stat-values">
          <div class="stat-primary">
            <span class="stat-value">{{ maxError.toFixed(3) }}</span>
            <span class="stat-unit">″</span>
          </div>
          <div class="stat-note">Peak deviation</div>
        </div>
      </div>

      <div class="stat-card duration-card">
        <div class="stat-header">
          <span class="stat-icon">⏱️</span>
          <span class="stat-label">Session Duration</span>
        </div>
        <div class="stat-values">
          <div class="stat-primary">
            <span class="stat-value">{{ formatDuration(sessionDuration) }}</span>
          </div>
          <div class="stat-note">Total guiding time</div>
        </div>
      </div>

      <div class="stat-card points-card">
        <div class="stat-header">
          <span class="stat-icon">📈</span>
          <span class="stat-label">Data Points</span>
        </div>
        <div class="stat-values">
          <div class="stat-primary">
            <span class="stat-value">{{ dataPointsCount.toLocaleString() }}</span>
          </div>
          <div class="stat-note">Total measurements</div>
        </div>
      </div>

      <!-- Perfect Data Analysis (only show in arcsecond mode and with equipment profile) -->
      <div v-if="isArcsecondScale && hasActiveProfile" class="stat-card perfect-card">
        <div class="stat-header">
          <span class="stat-icon">🎯</span>
          <span class="stat-label">Perfect Data</span>
        </div>
        <div class="stat-values">
          <div class="stat-primary">
            <span class="stat-value">{{ (props.perfectDataPercentage || 0).toFixed(1) }}</span>
            <span class="stat-unit">%</span>
          </div>
          <div class="stat-note">Within 0.5px ({{ perfectThreshold.toFixed(3) }}″)</div>
        </div>
      </div>

      <div v-if="isArcsecondScale && hasActiveProfile" class="stat-card good-card">
        <div class="stat-header">
          <span class="stat-icon">✨</span>
          <span class="stat-label">Good Data</span>
        </div>
        <div class="stat-values">
          <div class="stat-primary">
            <span class="stat-value">{{ (props.goodDataPercentage || 0).toFixed(1) }}</span>
            <span class="stat-unit">%</span>
          </div>
          <div class="stat-note">Within 1.0px ({{ goodThreshold.toFixed(3) }}″)</div>
        </div>
      </div>

      <div class="stat-card camera-info-card">
        <div class="stat-header">
          <span class="stat-icon">📷</span>
          <span class="stat-label">Camera Specs</span>
        </div>
        <div class="stat-values">
          <div class="camera-specs">
            <div class="spec-row">
              <span class="spec-label">Model:</span>
              <span class="spec-value">{{ currentCameraSpecs.name }}</span>
            </div>
            <div class="spec-row">
              <span class="spec-label">Pixel Size:</span>
              <span class="spec-value">{{ currentCameraSpecs.pixelSize }}μm</span>
            </div>
            <div class="spec-row">
              <span class="spec-label">Resolution:</span>
              <span class="spec-value">{{ currentCameraSpecs.width }}×{{ currentCameraSpecs.height }}</span>
            </div>
            <div class="spec-row">
              <span class="spec-label">Binning:</span>
              <span class="spec-value">{{ binning }}×{{ binning }}</span>
            </div>
            <div class="spec-row">
              <span class="spec-label">Scale:</span>
              <span class="spec-value">{{ calculatedPixelScale.toFixed(3) }}″/px</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useEquipmentStore } from '../../store';
import { EquipmentGetterTypes } from '../../store/modules/Equipment/Equipment.getters';
import { calculatePixelScale, QUALITY_THRESHOLDS } from '../../utilities/computations';

interface Props {
  rmsStats: {
    total: number;
    ra: number;
    dec: number;
  };
  maxError: number;
  sessionDuration: number;
  dataPointsCount: number;
  pixelScale?: number;
  binning?: number;
  selectedScale?: string;
  perfectDataPercentage?: number;
  goodDataPercentage?: number;
  // Guide camera info (from PHD2 log)
  guideCameraPixelSize?: number;
  guideCameraWidth?: number;
  guideCameraHeight?: number;
}

const props = defineProps<Props>();

// Equipment store
const equipmentStore = useEquipmentStore();

// Check if active profile exists
const hasActiveProfile = computed(() => {
  const profile = equipmentStore.getters(EquipmentGetterTypes.ACTIVE_PROFILE);
  return profile && profile !== null;
});

// Camera selection state
const selectedCamera = ref('active-profile');
const customPixelSize = ref(3.8);
const customWidth = ref(6248);
const customHeight = ref(4176);

// Get camera presets from Equipment store
const presetCameras = computed(() => equipmentStore.getters(EquipmentGetterTypes.PRESET_CAMERAS) as any[]);
const activeProfile = computed(() => equipmentStore.getters(EquipmentGetterTypes.ACTIVE_PROFILE) as any);

// Computed properties
const guideCameraInfo = computed(() => {
  if (props.guideCameraPixelSize) {
    return `${props.guideCameraPixelSize}μm`;
  }
  return 'Unknown';
});

const currentCameraSpecs = computed(() => {
  switch (selectedCamera.value) {
    case 'active-profile':
      // Use active profile's imaging camera
      return activeProfile.value?.imagingCamera || defaultCameraSpecs;
    case 'guide-camera':
      return {
        name: 'Guide Camera',
        pixelSize: props.guideCameraPixelSize || 3.8,
        width: props.guideCameraWidth || 1280,
        height: props.guideCameraHeight || 960
      };
    case 'custom':
      return {
        name: 'Custom Camera',
        pixelSize: customPixelSize.value,
        width: customWidth.value,
        height: customHeight.value
      };
    default:
      // Find preset camera by ID or return default
      const presetCamera = presetCameras.value.find(c => c.id === selectedCamera.value);
      return presetCamera || defaultCameraSpecs;
  }
});

// Default camera specs fallback
const defaultCameraSpecs = {
  name: 'ASI 2600 MM Pro',
  pixelSize: 3.76,
  width: 6248,
  height: 4176
};

// Perfect threshold: 0.5 pixels (very tight tolerance)
const perfectThreshold = computed(() => {
  const pixelScale = calculatedPixelScale.value;
  return QUALITY_THRESHOLDS.PERFECT * pixelScale;
});

// Good threshold: 1.0 pixels (practical tolerance)
const goodThreshold = computed(() => {
  const pixelScale = calculatedPixelScale.value;
  return QUALITY_THRESHOLDS.GOOD * pixelScale;
});

const binning = computed(() => props.binning || 1);

// Check if we're viewing in arcsecond scale (pixel well analysis only makes sense in arcseconds)
const isArcsecondScale = computed(() => {
  return props.selectedScale === 'Arc-secs/pixel' || props.selectedScale === 'Arc-secs/pixel RMS (50 sec window)';
});

// Calculate the actual pixel scale for the main imaging camera
// This uses the telescope focal length from PHD2 and the selected camera pixel size
const calculatedPixelScale = computed(() => {
  const specs = currentCameraSpecs.value;
  const effectiveBinning = binning.value;
  
  // Get focal length from active equipment profile
  const activeProfile = equipmentStore.getters(EquipmentGetterTypes.ACTIVE_PROFILE) as any;
  const telescopeFocalLength = activeProfile?.telescope?.focalLength ?? 800; // mm - fallback to 800mm
  
  // Calculate pixel scale using standard astronomical formula
  return calculatePixelScale(specs.pixelSize, telescopeFocalLength, effectiveBinning);
});

const updateCameraSpecs = () => {
  // This method is called when camera selection changes
  // Could emit event to parent component if needed for further analysis
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};
</script>

<style scoped>
.statistics-section {
  background: linear-gradient(135deg, var(--card-bg) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.statistics-header {
  margin-bottom: 20px;
}

.statistics-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.statistics-icon {
  font-size: 24px;
}

.statistics-subtitle {
  color: var(--text-muted);
  font-size: 14px;
  margin: 0;
}

/* Camera Selection Styles */
.camera-selection {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.camera-selection-header {
  margin-bottom: 16px;
}

.camera-selection-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 4px 0;
}

.camera-icon {
  font-size: 18px;
}

.camera-selection-subtitle {
  color: var(--text-muted);
  font-size: 12px;
  margin: 0;
}

.camera-dropdown {
  margin-bottom: 16px;
}

.camera-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  appearance: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.camera-select:hover {
  border-color: var(--primary-color);
}

.camera-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
}

.custom-camera-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-group input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
}

.input-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-icon {
  font-size: 18px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-primary {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color);
}

.stat-unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
}

.stat-breakdown {
  display: flex;
  gap: 16px;
}

.stat-component {
  display: flex;
  gap: 4px;
  font-size: 12px;
}

.component-label {
  color: var(--text-muted);
  font-weight: 500;
}

.component-value {
  color: var(--text-color);
  font-weight: 600;
}

.stat-note {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
}

.camera-specs {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.spec-label {
  color: var(--text-muted);
  font-weight: 500;
}

.spec-value {
  color: var(--text-color);
  font-weight: 600;
}

/* Card-specific colors */
.rms-card {
  border-left: 4px solid #10b981;
}

.max-error-card {
  border-left: 4px solid #ef4444;
}

.duration-card {
  border-left: 4px solid #6366f1;
}

.points-card {
  border-left: 4px solid #f59e0b;
}

.threshold-card {
  border-left: 4px solid #8b5cf6;
}

.perfect-card {
  border-left: 4px solid #dc2626;
}

.good-card {
  border-left: 4px solid #16a34a;
}

.quality-card {
  border-left: 4px solid #06b6d4;
}

.camera-info-card {
  border-left: 4px solid #84cc16;
}

/* Equipment Warning */
.equipment-warning {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.warning-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.warning-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.warning-text h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
}

.warning-text p {
  margin: 0;
  font-size: 0.75rem;
  color: #92400e;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .statistics-grid {
    grid-template-columns: 1fr;
  }
  
  .statistics-section {
    padding: 16px;
  }
  
  .camera-selection {
    padding: 16px;
  }
  
  .custom-camera-inputs {
    grid-template-columns: 1fr;
  }
  
  .stat-breakdown {
    gap: 12px;
  }
}
</style>
