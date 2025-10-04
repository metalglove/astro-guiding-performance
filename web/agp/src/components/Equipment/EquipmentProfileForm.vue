<template>
  <div class="equipment-form">
    <div class="form-header">
      <h3 class="form-title">
        {{ isEditing ? 'Edit Equipment Profile' : 'Create Equipment Profile' }}
      </h3>
      <button @click="$emit('cancel')" class="btn-close">
        <span class="close-icon">✕</span>
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="profile-form">
      <!-- Basic Information -->
      <div class="form-section">
        <h4 class="section-title">Profile Information</h4>
        <div class="form-grid">
          <div class="form-group">
            <label for="name">Profile Name</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              required
              placeholder="e.g., My Setup"
              class="form-input"
            >
          </div>
          <div class="form-group full-width">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="formData.description"
              placeholder="Brief description of this equipment setup"
              class="form-textarea"
              rows="2"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Telescope Section -->
      <div class="form-section">
        <h4 class="section-title">Telescope</h4>
        <div class="form-grid">
          <div class="form-group">
            <label for="telescope-preset">Preset</label>
            <select
              id="telescope-preset"
              v-model="selectedTelescopePreset"
              @change="loadTelescopePreset"
              class="form-select"
            >
              <option value="">Custom Telescope</option>
              <option
                v-for="preset in presetTelescopes"
                :key="preset.id"
                :value="preset.id"
              >
                {{ preset.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="telescope-name">Telescope Name</label>
            <input
              id="telescope-name"
              v-model="formData.telescope.name"
              type="text"
              required
              placeholder="e.g., Newtonian 800/203 F4"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="telescope-type">Type</label>
            <select
              id="telescope-type"
              v-model="formData.telescope.type"
              required
              class="form-select"
            >
              <option value="newtonian">Newtonian</option>
              <option value="refractor">Refractor</option>
              <option value="schmidt-cassegrain">Schmidt-Cassegrain</option>
              <option value="maksutov">Maksutov</option>
              <option value="ritchey-chretien">Ritchey-Chrétien</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label for="aperture">Aperture (mm)</label>
            <input
              id="aperture"
              v-model.number="formData.telescope.aperture"
              type="number"
              required
              min="1"
              step="1"
              placeholder="203"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="focal-length">Focal Length (mm)</label>
            <input
              id="focal-length"
              v-model.number="formData.telescope.focalLength"
              type="number"
              required
              min="1"
              step="1"
              placeholder="800"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="focal-ratio">f-ratio</label>
            <input
              id="focal-ratio"
              v-model.number="formData.telescope.focalRatio"
              type="number"
              required
              min="0.5"
              step="0.1"
              placeholder="4.0"
              class="form-input"
              readonly
            >
          </div>
          <div class="form-group">
            <label for="obstruction">Central Obstruction (%)</label>
            <input
              id="obstruction"
              v-model.number="formData.telescope.centralObstruction"
              type="number"
              min="0"
              max="50"
              step="1"
              placeholder="20"
              class="form-input"
            >
          </div>
        </div>
      </div>

      <!-- Imaging Camera Section -->
      <div class="form-section">
        <h4 class="section-title">Imaging Camera</h4>
        <div class="form-grid">
          <div class="form-group">
            <label for="imaging-camera-preset">Preset</label>
            <select
              id="imaging-camera-preset"
              v-model="selectedImagingCameraPreset"
              @change="loadImagingCameraPreset"
              class="form-select"
            >
              <option value="">Custom Camera</option>
              <option
                v-for="preset in imagingCameras"
                :key="preset.id"
                :value="preset.id"
              >
                {{ preset.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="imaging-camera-name">Camera Name</label>
            <input
              id="imaging-camera-name"
              v-model="formData.imagingCamera.name"
              type="text"
              required
              placeholder="e.g., ASI 2600 MM Pro"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="imaging-pixel-size">Pixel Size (μm)</label>
            <input
              id="imaging-pixel-size"
              v-model.number="formData.imagingCamera.pixelSize"
              type="number"
              required
              min="0.1"
              step="0.01"
              placeholder="3.76"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="imaging-width">Width (pixels)</label>
            <input
              id="imaging-width"
              v-model.number="formData.imagingCamera.width"
              type="number"
              required
              min="1"
              step="1"
              placeholder="6248"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="imaging-height">Height (pixels)</label>
            <input
              id="imaging-height"
              v-model.number="formData.imagingCamera.height"
              type="number"
              required
              min="1"
              step="1"
              placeholder="4176"
              class="form-input"
            >
          </div>
        </div>
      </div>

      <!-- Guide Camera Section -->
      <div class="form-section">
        <h4 class="section-title">Guide Camera (Optional)</h4>
        <div class="form-checkbox">
          <input
            id="has-guide-camera"
            v-model="hasGuideCamera"
            type="checkbox"
            class="checkbox-input"
          >
          <label for="has-guide-camera" class="checkbox-label">
            Include guide camera specifications
          </label>
        </div>

        <div v-if="hasGuideCamera" class="form-grid">
          <div class="form-group">
            <label for="guide-camera-preset">Preset</label>
            <select
              id="guide-camera-preset"
              v-model="selectedGuideCameraPreset"
              @change="loadGuideCameraPreset"
              class="form-select"
            >
              <option value="">Custom Camera</option>
              <option
                v-for="preset in guidingCameras"
                :key="preset.id"
                :value="preset.id"
              >
                {{ preset.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="guide-camera-name">Camera Name</label>
            <input
              id="guide-camera-name"
              v-model="formData.guidingCamera!.name"
              type="text"
              placeholder="e.g., ASI 224 MC"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="guide-pixel-size">Pixel Size (μm)</label>
            <input
              id="guide-pixel-size"
              v-model.number="formData.guidingCamera!.pixelSize"
              type="number"
              min="0.1"
              step="0.01"
              placeholder="3.75"
              class="form-input"
            >
          </div>
        </div>
      </div>

      <!-- Mount Section -->
      <div class="form-section">
        <h4 class="section-title">Mount</h4>
        <div class="form-grid">
          <div class="form-group">
            <label for="mount-preset">Preset</label>
            <select
              id="mount-preset"
              v-model="selectedMountPreset"
              @change="loadMountPreset"
              class="form-select"
            >
              <option value="">Custom Mount</option>
              <option
                v-for="preset in presetMounts"
                :key="preset.id"
                :value="preset.id"
              >
                {{ preset.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="mount-name">Mount Name</label>
            <input
              id="mount-name"
              v-model="formData.mount.name"
              type="text"
              required
              placeholder="e.g., Celestron AVX"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="mount-payload">Payload (kg)</label>
            <input
              id="mount-payload"
              v-model.number="formData.mount.payload"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="13.6"
              class="form-input"
            >
          </div>
        </div>
      </div>

      <!-- Calculated Values -->
      <div v-if="calculatedValues.pixelScale" class="form-section calculated-section">
        <h4 class="section-title">Calculated Performance</h4>
        <div class="calculated-grid">
          <div class="calculated-item">
            <span class="calculated-label">Pixel Scale:</span>
            <span class="calculated-value">{{ calculatedValues.pixelScale }}″/px</span>
          </div>
          <div class="calculated-item" v-if="calculatedValues.fieldOfView">
            <span class="calculated-label">Field of View:</span>
            <span class="calculated-value">{{ calculatedValues.fieldOfView.width }}′ × {{ calculatedValues.fieldOfView.height }}′</span>
          </div>
          <div class="calculated-item" v-if="calculatedValues.resolution">
            <span class="calculated-label">Theoretical Resolution:</span>
            <span class="calculated-value">{{ calculatedValues.resolution }}″</span>
          </div>
          <div class="calculated-item" v-if="calculatedValues.samplingRatio">
            <span class="calculated-label">Sampling Ratio:</span>
            <span class="calculated-value">{{ calculatedValues.samplingRatio }}</span>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary">
          {{ isEditing ? 'Update Profile' : 'Create Profile' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEquipmentStore } from '../../store';
import { EquipmentProfile, TelescopeSpecs, CameraSpecs, MountSpecs, AccessorySpecs } from '../../store/modules/Equipment/Equipment.types';
import { EquipmentGetterTypes } from '../../store/modules/Equipment/Equipment.getters';
import { 
  calculatePixelScale, 
  calculateTheoreticalResolution, 
  calculateSamplingRatio,
  calculateFieldOfView
} from '../../utilities/computations';

interface Props {
  profile?: EquipmentProfile | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['save', 'cancel']);

const equipmentStore = useEquipmentStore();

// Computed properties for presets
const presetTelescopes = computed(() => equipmentStore.getters(EquipmentGetterTypes.PRESET_TELESCOPES));
const presetMounts = computed(() => equipmentStore.getters(EquipmentGetterTypes.PRESET_MOUNTS));
const imagingCameras = computed(() => equipmentStore.getters(EquipmentGetterTypes.IMAGING_CAMERAS));
const guidingCameras = computed(() => equipmentStore.getters(EquipmentGetterTypes.GUIDING_CAMERAS));

// Form state
const selectedTelescopePreset = ref('');
const selectedImagingCameraPreset = ref('');
const selectedGuideCameraPreset = ref('');
const selectedMountPreset = ref('');
const hasGuideCamera = ref(false);

const isEditing = computed(() => !!props.profile);

// Create default camera spec
const createDefaultCamera = (type: 'imaging' | 'guiding'): CameraSpecs => ({
  id: `${type}-${Date.now()}`,
  name: '',
  type,
  manufacturer: '',
  model: '',
  pixelSize: type === 'imaging' ? 3.76 : 3.75,
  width: type === 'imaging' ? 6248 : 1304,
  height: type === 'imaging' ? 4176 : 976,
  sensorType: 'CMOS',
  cooled: type === 'imaging'
});

// Form data
const formData = ref({
  name: '',
  description: '',
  telescope: {
    id: `telescope-${Date.now()}`,
    name: 'Newtonian 800/203 F4',
    type: 'newtonian' as const,
    aperture: 203,
    focalLength: 800,
    focalRatio: 4.0,
    centralObstruction: 20,
    manufacturer: 'Generic',
    model: '8" F4 Newtonian'
  } as TelescopeSpecs,
  imagingCamera: createDefaultCamera('imaging'),
  guidingCamera: createDefaultCamera('guiding'),
  mount: {
    id: `mount-${Date.now()}`,
    name: '',
    manufacturer: '',
    model: '',
    type: 'equatorial' as const,
    payload: 13.6
  } as MountSpecs,
  accessories: [] as AccessorySpecs[]
});

// Calculated values
const calculatedValues = computed(() => {
  const telescope = formData.value.telescope;
  const camera = formData.value.imagingCamera;

  if (!telescope.focalLength || !camera.pixelSize) {
    return {};
  }

  const pixelScale = calculatePixelScale(camera.pixelSize, telescope.focalLength);
  const fieldOfView = {
    width: Number(calculateFieldOfView(camera.width, pixelScale).toFixed(1)),
    height: Number(calculateFieldOfView(camera.height, pixelScale).toFixed(1))
  };

  // Theoretical resolution (Dawes limit)
  const resolution = Number(calculateTheoreticalResolution(telescope.aperture).toFixed(2));

  // Sampling ratio
  const samplingRatio = Number(calculateSamplingRatio(pixelScale, resolution).toFixed(1));

  return {
    pixelScale: Number(pixelScale.toFixed(2)),
    fieldOfView,
    resolution,
    samplingRatio
  };
});

// Watch for focal length and aperture changes to update f-ratio
watch([() => formData.value.telescope.focalLength, () => formData.value.telescope.aperture], () => {
  if (formData.value.telescope.focalLength && formData.value.telescope.aperture) {
    formData.value.telescope.focalRatio = Number((formData.value.telescope.focalLength / formData.value.telescope.aperture).toFixed(1));
  }
});

// Preset loading functions
const loadTelescopePreset = () => {
  if (!selectedTelescopePreset.value) return;
  const preset = presetTelescopes.value.find((t: TelescopeSpecs) => t.id === selectedTelescopePreset.value);
  if (preset) {
    formData.value.telescope = { ...preset };
  }
};

const loadImagingCameraPreset = () => {
  if (!selectedImagingCameraPreset.value) return;
  const preset = imagingCameras.value.find((c: CameraSpecs) => c.id === selectedImagingCameraPreset.value);
  if (preset) {
    formData.value.imagingCamera = { ...preset };
  }
};

const loadGuideCameraPreset = () => {
  if (!selectedGuideCameraPreset.value) return;
  const preset = guidingCameras.value.find((c: CameraSpecs) => c.id === selectedGuideCameraPreset.value);
  if (preset) {
    formData.value.guidingCamera = { ...preset };
  }
};

const loadMountPreset = () => {
  if (!selectedMountPreset.value) return;
  const preset = presetMounts.value.find((m: MountSpecs) => m.id === selectedMountPreset.value);
  if (preset) {
    formData.value.mount = { ...preset };
  }
};

// Handle guide camera checkbox
watch(hasGuideCamera, (newValue) => {
  if (!newValue) {
    formData.value.guidingCamera = undefined;
  } else if (!formData.value.guidingCamera) {
    formData.value.guidingCamera = createDefaultCamera('guiding');
  }
});

// Form submission
const handleSubmit = () => {
  const profileData = {
    ...formData.value,
    guidingCamera: hasGuideCamera.value ? formData.value.guidingCamera : undefined
  };

  emit('save', profileData);
};

// Initialize form for editing
onMounted(() => {
  if (props.profile) {
    formData.value = {
      name: props.profile.name,
      description: props.profile.description,
      telescope: { ...props.profile.telescope },
      imagingCamera: { ...props.profile.imagingCamera },
      guidingCamera: props.profile.guidingCamera ? { ...props.profile.guidingCamera } : createDefaultCamera('guiding'),
      mount: { ...props.profile.mount },
      accessories: props.profile.accessories ? [...props.profile.accessories] : []
    };

    hasGuideCamera.value = !!props.profile.guidingCamera;
  } else {
    // Set default Newtonian 800/203 F4 for new profiles
    selectedTelescopePreset.value = 'newtonian-800-203-f4';
    loadTelescopePreset();

    // Set default ASI 2600 MM Pro
    selectedImagingCameraPreset.value = 'asi2600mm-pro';
    loadImagingCameraPreset();

    // Set default mount
    selectedMountPreset.value = 'celestron-avx';
    loadMountPreset();
  }
});
</script>

<style scoped>
.equipment-form {
  padding: 32px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.form-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: var(--hover-bg);
  color: var(--text-color);
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.form-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.form-input,
.form-select,
.form-textarea {
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input:read-only {
  background: var(--disabled-bg);
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.checkbox-input {
  width: 16px;
  height: 16px;
}

.checkbox-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  cursor: pointer;
}

.calculated-section {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-color: rgba(99, 102, 241, 0.3);
}

.calculated-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.calculated-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.calculated-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
}

.calculated-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: var(--card-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--hover-bg);
}

@media (max-width: 768px) {
  .equipment-form {
    padding: 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .calculated-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
