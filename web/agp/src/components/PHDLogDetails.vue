<template>
  <div class="phd-log-details">
    <div class="details-header">
      <h2 class="details-title">
        <span class="details-icon">📋</span>
        PHD2 Log Details
      </h2>
    </div>
    
    <div class="session-selector">
      <label class="selector-label">
        <span class="label-icon">🕐</span>
        Select Guiding Session:
      </label>
      <div class="select-wrapper">
        <select v-model="selectedGuidingSession" @change="selectedGuidingSessionChange" class="session-select">
          <option v-for="guidingSession in phdLog.guidingSessions" v-bind:key="guidingSession.startTime" v-bind:value="guidingSession">
            {{ new Date(guidingSession.startTime).toLocaleString() + ' ' + timeDifference(guidingSession.startTime, guidingSession.endTime) }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="details-grid">
      <div class="detail-card mount-card">
        <div class="card-header">
          <span class="card-icon">🔭</span>
          <h3>Mount Information</h3>
        </div>
        <div class="card-content">
          <div class="detail-item">
            <span class="detail-value">{{ selectedGuidingSession.mount }}</span>
          </div>
        </div>
      </div>
      
      <div class="detail-card camera-card">
        <div class="card-header">
          <span class="card-icon">📷</span>
          <h3>Guiding Camera</h3>
        </div>
        <div class="card-content">
          <div class="detail-item">
            <span class="detail-label">Camera:</span>
            <span class="detail-value">{{ selectedGuidingSession.camera }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Resolution:</span>
            <span class="detail-value">{{ selectedGuidingSession.cameraWidth }}×{{ selectedGuidingSession.cameraHeight }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pixel Size:</span>
            <span class="detail-value">{{ selectedGuidingSession.cameraPixelSize }}μm</span>
          </div>
        </div>
      </div>
      
      <div class="detail-card scope-card">
        <div class="card-header">
          <span class="card-icon">🔍</span>
          <h3>Guiding Scope</h3>
        </div>
        <div class="card-content">
          <div class="detail-item">
            <span class="detail-label">Focal Length:</span>
            <span class="detail-value">{{ selectedGuidingSession.focalLength }}mm</span>
          </div>
        </div>
      </div>
      
      <div class="detail-card settings-card">
        <div class="card-header">
          <span class="card-icon">⚙️</span>
          <h3>Camera Settings</h3>
        </div>
        <div class="card-content">
          <div class="detail-item">
            <span class="detail-label">Binning:</span>
            <span class="detail-value">{{ selectedGuidingSession.binning }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Gain:</span>
            <span class="detail-value">{{ selectedGuidingSession.cameraGain }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Exposure:</span>
            <span class="detail-value">{{ selectedGuidingSession.exposureTime }}ms</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pixel Scale:</span>
            <span class="detail-value">{{ selectedGuidingSession.pixelScale }}"/px</span>
          </div>
        </div>
      </div>
      
      <div class="detail-card algorithms-card">
        <div class="card-header">
          <span class="card-icon">🧮</span>
          <h3>Guiding Algorithms</h3>
        </div>
        <div class="card-content">
          <div class="detail-item">
            <span class="detail-label">X-Axis:</span>
            <span class="detail-value">{{ selectedGuidingSession.xGuidingAlgorithm }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Y-Axis:</span>
            <span class="detail-value">{{ selectedGuidingSession.yGuidingAlgorithm }}</span>
          </div>
        </div>
      </div>
      
      <div class="detail-card guide-settings-card">
        <div class="card-header">
          <span class="card-icon">🎯</span>
          <h3>Guide Settings</h3>
        </div>
        <div class="card-content">
          <div class="detail-item">
            <span class="detail-label">Backlash Compensation:</span>
            <span class="detail-value">{{ selectedGuidingSession.backlashCompensation }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">X-Rate:</span>
            <span class="detail-value">{{ selectedGuidingSession.xRate }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Y-Rate:</span>
            <span class="detail-value">{{ selectedGuidingSession.yRate }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { PHDLog } from '../store/modules/PHD/PHD.types';

export default defineComponent({
  name: 'PHDLogDetails',
  props: {
    phdLog: {
      type: Object as PropType<PHDLog>,
      required: true
    },
  },
  components: {
  },
  emits: [
    'selectedGuidingSessionChanged'
  ],
  setup(props, { emit }) {
    const selectedGuidingSession = ref(props.phdLog.guidingSessions[0]);

    function selectedGuidingSessionChange() {
      emit('selectedGuidingSessionChanged', selectedGuidingSession.value);
    }

    function timeDifference(startTime: Date, endTime: Date) {
      let mills = Math.abs(new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
      const hours = Math.floor(mills / 3600) % 24;
      mills -= hours * 3600
      const minutes = Math.floor(mills / 60) % 60;
      mills -= minutes * 60;
      return `(${hours}h ${String(minutes).padStart(2, '0')}m)`;
    }

    return { timeDifference, selectedGuidingSessionChange, selectedGuidingSession };
  },
});
</script>

<style scoped>
.phd-log-details {
  padding: 1.5rem;
}

.details-header {
  margin-bottom: 1.5rem;
}

.details-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0;
}

.details-icon {
  font-size: 1.75rem;
}

.session-selector {
  margin-bottom: 2rem;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--gray-700);
  margin-bottom: 0.5rem;
}

.label-icon {
  font-size: 1.1rem;
}

.select-wrapper {
  position: relative;
}

.session-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  background: var(--white);
  color: var(--gray-700);
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition);
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

.session-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.session-select:hover {
  border-color: var(--gray-400);
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.detail-card {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius);
  overflow: hidden;
  transition: var(--transition);
}

.detail-card:hover {
  border-color: var(--gray-300);
  box-shadow: var(--shadow-sm);
}

.card-header {
  background: var(--white);
  padding: 1rem;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-icon {
  font-size: 1.25rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
}

.card-content {
  padding: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  gap: 1rem;
}

.detail-item:not(:last-child) {
  border-bottom: 1px solid var(--gray-200);
}

.detail-label {
  font-weight: 500;
  color: var(--gray-600);
  font-size: 0.875rem;
  flex-shrink: 0;
}

.detail-value {
  font-weight: 600;
  color: var(--gray-800);
  font-size: 0.875rem;
  text-align: right;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

/* Specific card styling */
.mount-card {
  border-left: 4px solid var(--primary-color);
}

.camera-card {
  border-left: 4px solid var(--secondary-color);
}

.scope-card {
  border-left: 4px solid var(--accent-color);
}

.settings-card {
  border-left: 4px solid var(--success-color);
}

.algorithms-card {
  border-left: 4px solid var(--warning-color);
}

.guide-settings-card {
  border-left: 4px solid var(--error-color);
}

@media (max-width: 768px) {
  .phd-log-details {
    padding: 1rem;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .detail-value {
    text-align: left;
  }
  
  .session-select {
    font-size: 0.8rem;
  }
}
</style>
