<template>
  <div class="telescope-simulator">
    <!-- No Data State -->
    <div v-if="showNoDataState" class="no-data-state">
      <div class="no-data-content">
        <div class="no-data-icon">🔭</div>
        <h2>Load Guiding Data First</h2>
        <p class="no-data-message">
          To use the telescope simulator, you need to load PHD2 guiding log files first.
        </p>
        <div class="action-buttons">
          <button @click="goToHome" class="upload-btn primary">
            <span class="btn-icon">📁</span>
            Go to Home & Upload Files
          </button>
          <button @click="loadExampleData" class="upload-btn secondary" :disabled="isLoadingExample">
            <span v-if="isLoadingExample" class="loading-spinner-small"></span>
            <span v-else class="btn-icon">🚀</span>
            {{ isLoadingExample ? 'Loading...' : 'Try Example Data' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="loading-state">
      <div class="loading-content">
        <div class="loading-spinner">🔄</div>
        <h3>Initializing Simulator...</h3>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h3>Failed to Initialize Simulator</h3>
        <p class="error-message">{{ error }}</p>
        <button @click="retry" class="btn-primary">Try Again</button>
      </div>
    </div>

    <!-- Main Simulator Content -->
    <template v-else>
      <div class="simulator-header">
        <h1 class="simulator-title">
          <span class="title-icon">🔭</span>
          Telescope Positioning Simulator
        </h1>
        <p class="simulator-subtitle">
          Visualize telescope orientation and tracking performance
        </p>
      </div>

      <!-- Session Selector -->
      <div v-if="phdLog && phdLog.guidingSessions && phdLog.guidingSessions.length > 1" class="session-selector-card">
        <h3>Select Guiding Session</h3>
        <div class="selector-wrapper">
          <select v-model="selectedSessionIndex" @change="onSessionChange" class="session-select">
            <option v-for="(session, index) in phdLog.guidingSessions" :key="index" :value="index">
              Session {{ index + 1 }}: {{ new Date(session.startTime).toLocaleString() }} - {{ timeDifference(session.startTime, session.endTime) }}
            </option>
          </select>
        </div>
      </div>

      <!-- Session Info -->
      <div v-if="sessionMetadata" class="session-info-card">
        <h3>Session Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Duration:</span>
            <span class="value">{{ formatDuration(sessionMetadata.duration) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Frames:</span>
            <span class="value">{{ frameCount }}</span>
          </div>
          <div class="info-item">
            <span class="label">Mount:</span>
            <span class="value">{{ sessionMetadata.mount.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">Pixel Scale:</span>
            <span class="value">{{ sessionMetadata.pixelScale.toFixed(2) }}" /px</span>
          </div>
          <div class="info-item">
            <span class="label">FOV:</span>
            <span class="value">{{ sessionMetadata.fov.width.toFixed(1) }}' × {{ sessionMetadata.fov.height.toFixed(1) }}'</span>
          </div>
        </div>
      </div>

      <!-- Current Frame Info -->
      <div v-if="currentFrame" class="current-frame-card">
        <h3>Current Frame</h3>
        <div class="frame-data">
          <div class="data-row">
            <span class="label">Frame:</span>
            <span class="value">{{ currentFrame.frameNumber }} / {{ frameCount }}</span>
          </div>
          <div class="data-row">
            <span class="label">Timestamp:</span>
            <span class="value">{{ formatTimestamp(currentFrame.timestamp) }}</span>
          </div>
          <div class="data-row">
            <span class="label">RA:</span>
            <span class="value">{{ currentFrame.ra.toFixed(2) }}°</span>
          </div>
          <div class="data-row">
            <span class="label">Dec:</span>
            <span class="value">{{ currentFrame.dec.toFixed(2) }}°</span>
          </div>
          <div class="data-row">
            <span class="label">Hour Angle:</span>
            <span class="value">{{ currentFrame.hourAngle.toFixed(2) }} hr</span>
          </div>
          <div class="data-row">
            <span class="label">Pier Side:</span>
            <span class="value">{{ currentFrame.pierSide }}</span>
          </div>
          <div class="data-row">
            <span class="label">Total Error:</span>
            <span class="value">{{ currentFrame.totalError.toFixed(2) }}"</span>
          </div>
          <div class="data-row">
            <span class="label">SNR:</span>
            <span class="value">{{ currentFrame.snr.toFixed(1) }}</span>
          </div>
        </div>
      </div>

      <!-- Basic Playback Controls -->
      <div class="playback-controls-card">
        <h3>Playback Controls</h3>
        <div class="controls">
          <button @click="stepBackward" :disabled="currentFrameIndex === 0" class="control-btn">
            ⏮ Step Back
          </button>
          <button @click="togglePlayPause" class="control-btn play-pause">
            {{ isPlaying ? '⏸ Pause' : '▶️ Play' }}
          </button>
          <button @click="stepForward" :disabled="currentFrameIndex >= frameCount - 1" class="control-btn">
            Step Forward ⏭
          </button>
        </div>

        <div class="timeline-container">
          <input
            type="range"
            v-model.number="currentFrameIndex"
            :min="0"
            :max="frameCount - 1"
            class="timeline-slider"
          />
          <div class="timeline-labels">
            <span>{{ currentFrameIndex + 1 }} / {{ frameCount }}</span>
            <span>{{ getSessionProgress.toFixed(1) }}%</span>
          </div>
        </div>

        <div class="speed-selector">
          <label>Playback Speed:</label>
          <button
            v-for="speed in [1, 10, 100, 1000]"
            :key="speed"
            @click="setPlaybackSpeed(speed)"
            :class="['speed-btn', { active: playbackSpeed === speed }]"
          >
            {{ speed }}x
          </button>
        </div>
      </div>

      <!-- Placeholder for future visualizations -->
      <div class="visualizations-placeholder">
        <div class="placeholder-card">
          <h3>3D Telescope View</h3>
          <p>Coming in Phase 4: Three.js 3D visualization of mount orientation</p>
        </div>
        <div class="placeholder-card">
          <h3>2D Sky Chart</h3>
          <p>Coming in Phase 3: Star field with FOV overlay</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSimulatorStore } from '@/store';
import { usePHDStore, useASIAIRStore, useAppStore } from '@/store';
import { SimulatorGetterTypes } from '@/store/modules/Simulator/Simulator.getters';
import { SimulatorActionTypes } from '@/store/modules/Simulator/Simulator.actions';
import { PHDGetterTypes } from '@/store/modules/PHD/PHD.getters';
import { ASIAIRGetterTypes } from '@/store/modules/ASIAIR/ASIAIR.getters';
import { AppGetterTypes } from '@/store/modules/App/App.getters';
import { PHDActionTypes } from '@/store/modules/PHD/PHD.actions';
import { ASIAIRActionTypes } from '@/store/modules/ASIAIR/ASIAIR.actions';
import { AppActionTypes } from '@/store/modules/App/App.actions';
import PHDLogReader from '@/services/PHDLogReader';
import ASIAIRLogReader from '@/services/ASIAIRLogReader';

const router = useRouter();
const simulatorStore = useSimulatorStore();
const phdStore = usePHDStore();
const asiairStore = useASIAIRStore();
const appStore = useAppStore();

const isLoadingExample = ref(false);
const loadingMessage = ref('Preparing session data...');
const animationFrameId = ref<number | null>(null);
const selectedSessionIndex = ref(0);

// Computed properties from store
const isLoading = computed(() => simulatorStore.getters(SimulatorGetterTypes.GET_IS_LOADING));
const error = computed(() => simulatorStore.getters(SimulatorGetterTypes.GET_ERROR));
const sessionMetadata = computed(() => simulatorStore.getters(SimulatorGetterTypes.GET_SESSION_METADATA));
const currentFrame = computed(() => simulatorStore.getters(SimulatorGetterTypes.GET_CURRENT_FRAME));
const frameCount = computed(() => simulatorStore.getters(SimulatorGetterTypes.GET_FRAME_COUNT));
const isPlaying = computed(() => simulatorStore.getters(SimulatorGetterTypes.GET_IS_PLAYING));
const playbackSpeed = computed(() => simulatorStore.getters(SimulatorGetterTypes.GET_PLAYBACK_SPEED));
const getSessionProgress = computed(() => simulatorStore.getters(SimulatorGetterTypes.GET_SESSION_PROGRESS));

// Check if files are uploaded
const filesUploaded = computed(() => appStore.getters(AppGetterTypes.GET_FILES_UPLOADED));
const phdLog = computed(() => phdStore.getters(PHDGetterTypes.GET_PHD_LOG));
const asiairLog = computed(() => asiairStore.getters(ASIAIRGetterTypes.GET_ASIAIR_LOG));

const showNoDataState = computed(() => !filesUploaded.value && frameCount.value === 0);

// Local state for scrubber
const currentFrameIndex = computed({
  get: () => simulatorStore.state.currentFrameIndex,
  set: (value: number) => {
    simulatorStore.dispatch(SimulatorActionTypes.SEEK_TO_FRAME, value);
  },
});

// Lifecycle
onMounted(async () => {
  if (filesUploaded.value && phdLog.value) {
    await initializeSimulator();
  }
});

onUnmounted(() => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
  }
  simulatorStore.dispatch(SimulatorActionTypes.PAUSE);
});

// Watch for playback state changes
watch(isPlaying, (playing) => {
  if (playing) {
    startAnimationLoop();
  } else {
    stopAnimationLoop();
  }
});

// Methods
async function initializeSimulator() {
  try {
    loadingMessage.value = 'Loading guiding session...';
    await simulatorStore.dispatch(SimulatorActionTypes.INITIALIZE_SESSION, {
      phdLog: phdLog.value,
      asiairLog: asiairLog.value || undefined,
      sessionIndex: selectedSessionIndex.value,
    });
  } catch (err) {
    console.error('Failed to initialize simulator:', err);
  }
}

function goToHome() {
  router.push('/');
}

async function loadExampleData() {
  isLoadingExample.value = true;
  try {
    // Load example files
    const phdResponse = await fetch('/data/PHD2_GuideLog_2022-03-18_210258.txt');
    const asiairResponse = await fetch('/data/Autorun_Log_2022-03-18_211302.txt');

    const phdText = await phdResponse.text();
    const asiairText = await asiairResponse.text();

    // Parse logs
    const phdLogReader = new PHDLogReader();
    const asiairLogReader = new ASIAIRLogReader();

    const parsedPHDLog = phdLogReader.parseText(phdText);
    const parsedASIAIRLog = asiairLogReader.parseText(asiairText);

    // Set in stores
    await phdStore.dispatch(PHDActionTypes.SET_PHD_LOG, parsedPHDLog);
    await asiairStore.dispatch(ASIAIRActionTypes.SET_ASIAIR_LOG, parsedASIAIRLog);
    await appStore.dispatch(AppActionTypes.SET_FILES_UPLOADED, true);

    // Reset session index for new data
    selectedSessionIndex.value = 0;

    // Initialize simulator
    await initializeSimulator();
  } catch (error) {
    console.error('Error loading example data:', error);
  } finally {
    isLoadingExample.value = false;
  }
}

function retry() {
  initializeSimulator();
}

function onSessionChange() {
  initializeSimulator();
}

function timeDifference(startTime: Date, endTime: Date) {
  let mills = Math.abs(new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
  const hours = Math.floor(mills / 3600) % 24;
  mills -= hours * 3600;
  const minutes = Math.floor(mills / 60) % 60;
  mills -= minutes * 60;
  return `(${hours}h ${String(minutes).padStart(2, '0')}m)`;
}

function togglePlayPause() {
  simulatorStore.dispatch(SimulatorActionTypes.TOGGLE_PLAY_PAUSE);
}

function stepForward() {
  simulatorStore.dispatch(SimulatorActionTypes.STEP_FORWARD);
}

function stepBackward() {
  simulatorStore.dispatch(SimulatorActionTypes.STEP_BACKWARD);
}

function setPlaybackSpeed(speed: number) {
  simulatorStore.dispatch(SimulatorActionTypes.SET_PLAYBACK_SPEED, speed);
}

function startAnimationLoop() {
  const frameDelay = 1000 / (30 * playbackSpeed.value); // Target 30fps at 1x
  let lastTime = performance.now();

  const animate = (currentTime: number) => {
    if (!isPlaying.value) {
      return;
    }

    const deltaTime = currentTime - lastTime;

    if (deltaTime >= frameDelay) {
      simulatorStore.dispatch(SimulatorActionTypes.STEP_FORWARD);
      lastTime = currentTime;

      // Stop at end
      if (currentFrameIndex.value >= frameCount.value - 1) {
        simulatorStore.dispatch(SimulatorActionTypes.PAUSE);
        return;
      }
    }

    animationFrameId.value = requestAnimationFrame(animate);
  };

  animationFrameId.value = requestAnimationFrame(animate);
}

function stopAnimationLoop() {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = null;
  }
}

// Formatters
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString();
}
</script>

<style scoped>
.telescope-simulator {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* No Data State */
.no-data-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.no-data-content {
  text-align: center;
  max-width: 600px;
}

.no-data-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-data-message {
  color: var(--text-muted);
  margin: 1rem 0 2rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.upload-btn.primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: var(--white);
}

.upload-btn.secondary {
  background-color: var(--gray-200);
  color: var(--gray-700);
}

.upload-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Loading/Error States */
.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.loading-content,
.error-content {
  text-align: center;
}

.loading-spinner,
.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-icon {
  animation: none;
}

/* Header */
.simulator-header {
  margin-bottom: 2rem;
}

.simulator-title {
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.simulator-subtitle {
  color: var(--text-muted);
}

/* Cards */
.session-info-card,
.current-frame-card,
.playback-controls-card,
.placeholder-card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.session-info-card h3,
.current-frame-card h3,
.playback-controls-card h3,
.placeholder-card h3 {
  margin-bottom: 1rem;
  color: var(--gray-800);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item,
.data-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--gray-200);
}

.label {
  font-weight: 600;
  color: var(--gray-600);
}

.value {
  font-family: 'Courier New', monospace;
  color: var(--gray-900);
}

/* Playback Controls */
.controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.control-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--primary-color);
  background: var(--white);
  color: var(--primary-color);
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.control-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: var(--white);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-btn.play-pause {
  background: var(--primary-color);
  color: var(--white);
}

.timeline-container {
  margin-bottom: 1.5rem;
}

.timeline-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  outline: none;
  background: var(--gray-200);
  -webkit-appearance: none;
}

.timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
}

.timeline-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  border: none;
}

.timeline-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--gray-600);
}

.speed-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.speed-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--gray-300);
  background: var(--white);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
}

.speed-btn:hover {
  background: var(--gray-100);
}

.speed-btn.active {
  background: var(--primary-color);
  color: var(--white);
  border-color: var(--primary-color);
}

/* Visualizations Placeholder */
.visualizations-placeholder {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.placeholder-card {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--gray-300);
  background: var(--gray-50);
}

.placeholder-card p {
  color: var(--text-muted);
  text-align: center;
  padding: 0 2rem;
}

@media (max-width: 768px) {
  .simulator-title {
    font-size: 1.5rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .controls {
    flex-direction: column;
  }

  .visualizations-placeholder {
    grid-template-columns: 1fr;
  }
}
</style>
