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
    <div v-else>
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
          <button @click="stepBackward" :disabled="is3DLoading || !threeDReady || currentFrameIndex === 0" class="control-btn">
            ⏮ Step Back
          </button>
          <button @click="togglePlayPause" :disabled="is3DLoading || !threeDReady" class="control-btn play-pause">
            {{ isPlaying ? '⏸ Pause' : '▶️ Play' }}
          </button>
          <button @click="stepForward" :disabled="is3DLoading || !threeDReady || currentFrameIndex >= frameCount - 1" class="control-btn">
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
            :disabled="is3DLoading || !threeDReady"
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
            :disabled="is3DLoading || !threeDReady"
          >
            {{ speed }}x
          </button>
        </div>
      </div>

      <!-- 3D Telescope Visualization -->
      <div class="telescope-3d-view">
        <div class="view-header">
          <h3>3D Telescope Position</h3>
          <div class="view-controls">
          <label class="control-label">
            <input type="checkbox" v-model="showEquipmentModels" :disabled="is3DLoading || !threeDReady" />
            Show Equipment Models
          </label>
          <select v-model="selectedMountModel" class="model-select" :disabled="is3DLoading || !threeDReady">
            <option value="generic">Generic Mount</option>
            <option value="celestron-avx">Celestron AVX</option>
            <option value="skywatcher-heq5">Sky-Watcher HEQ5</option>
            <option value="ioptron-cem26">iOptron CEM26</option>
          </select>

          <div class="camera-view-toggle">
            <button
              @click="toggleCameraView"
              :disabled="is3DLoading || !threeDReady"
              class="camera-toggle-btn"
              :class="{ active: cameraViewMode === 'imaging' }"
            >
              <span class="view-icon">{{ cameraViewMode === 'ground' ? '🌍' : '📷' }}</span>
              <span class="view-label">
                {{ cameraViewMode === 'ground' ? 'Ground' : 'Camera' }} View
              </span>
              <span class="view-badge">{{ cameraViewMode === 'ground' ? 'External Observer' : 'Guide Camera' }}</span>
            </button>
          </div>
        </div>
        </div>
        <div ref="threeContainer" class="three-container">
          <div v-if="is3DLoading" class="three-loading">
            <div class="three-loading-spinner"></div>
            <p class="three-loading-text">Initializing 3D Renderer...</p>
          </div>

          <div v-else-if="threeDError" class="three-error">
            <div class="three-error-icon">⚠️</div>
            <p class="three-error-text">Failed to initialize 3D view</p>
            <p class="three-error-detail">{{ threeDError }}</p>
            <button @click="retry3DInit" class="three-retry-btn">Retry</button>
          </div>
        </div>
        <div class="view-info">
          <div class="info-item">
            <span class="info-label">RA:</span>
            <span class="info-value">{{ currentFrame?.ra.toFixed(2) }}°</span>
          </div>
          <div class="info-item">
            <span class="info-label">Dec:</span>
            <span class="info-value">{{ currentFrame?.dec.toFixed(2) }}°</span>
          </div>
          <div class="info-item">
            <span class="info-label">Hour Angle:</span>
            <span class="info-value">{{ currentFrame?.hourAngle.toFixed(2) }} hr</span>
          </div>
          <div class="info-item">
            <span class="info-label">Pier Side:</span>
            <span class="info-value">{{ currentFrame?.pierSide }}</span>
          </div>
        </div>
      </div>

      <!-- Polar Alignment Analysis -->
      <PolarAlignment
        v-if="sessionMetadata && currentFrame"
        :guiding-frames="allFrames"
        :pixel-scale="sessionMetadata.pixelScale"
        :latitude="52.0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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
import { createGenericMount, TelescopeGroups } from '@/utilities/telescope/TelescopeModel';
import PolarAlignment from '@/components/Charts/PolarAlignment.vue';
import { loadBinaryStarCatalog, StarCatalog } from '@/utilities/starfield/binaryStarLoader';
import { createStarField, updateStarFieldRotation, disposeStarField } from '@/utilities/starfield/starfieldRenderer';

const router = useRouter();
const simulatorStore = useSimulatorStore();
const phdStore = usePHDStore();
const asiairStore = useASIAIRStore();
const appStore = useAppStore();

const isLoadingExample = ref(false);
const loadingMessage = ref('Preparing session data...');
const animationFrameId = ref<number | null>(null);
const selectedSessionIndex = ref(0);

// 3D View refs
const threeContainer = ref<HTMLDivElement | null>(null);
const showEquipmentModels = ref(true);
const selectedMountModel = ref('generic');
const is3DLoading = ref(true);
const threeDReady = ref(false);
const threeDError = ref<string | null>(null);
const cameraViewMode = ref<'ground' | 'imaging'>('ground');
const telescopePointingInfo = ref({ ra: 0, dec: 0, targetName: '' });

// Three.js objects
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let mountGroup: THREE.Group;
let telescopeGroups: TelescopeGroups;
let animationId: number;
let frameCount3D = 0;

// Scene views
let groundScene: THREE.Scene;
let groundCamera: THREE.PerspectiveCamera;
let groundRenderer: THREE.WebGLRenderer;
let groundControls: OrbitControls;
let telescopeViewGroup: THREE.Group;
let imagingCamera: THREE.PerspectiveCamera;
let pointingIndicator: THREE.Mesh;
let starField: THREE.Points | null = null;
let starCatalog: StarCatalog | null = null;

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

const allFrames = computed(() => {
  const session = phdLog.value?.guidingSessions?.[selectedSessionIndex.value];
  return session?.guidingFrames || [];
});

// Local state for scrubber
const currentFrameIndex = computed({
  get: () => simulatorStore.state.currentFrameIndex,
  set: (value: number) => {
    simulatorStore.dispatch(SimulatorActionTypes.SEEK_TO_FRAME, value);
  },
});

  // Lifecycle
onMounted(async () => {
  console.log("onMounted called");
  console.log("showNoDataState:", showNoDataState.value);
  console.log("isLoading:", isLoading.value);
  console.log("error:", error.value);

  if (filesUploaded.value && phdLog.value) {
    await initializeSimulator();
  }

  window.addEventListener('resize', onWindowResize);
});

// Camera View Management
function toggleCameraView() {
  console.log("Switching camera view mode:", cameraViewMode.value);
  cameraViewMode.value = cameraViewMode.value === 'ground' ? 'imaging' : 'ground';
}

function getGuideCameraWorldPosition(): THREE.Vector3 {
  if (!telescopeGroups || !telescopeGroups.guideCamera) {
    return new THREE.Vector3(0, 2.5, 0);
  }
  const worldPosition = new THREE.Vector3();
  telescopeGroups.guideCamera.getWorldPosition(worldPosition);
  return worldPosition;
}

function updateImagingCamera() {
  if (!telescopeGroups || !telescopeGroups.telescopeAssemblyGroup || !imagingCamera) return;
  const guideCamPos = getGuideCameraWorldPosition();
  imagingCamera.position.copy(guideCamPos);
  imagingCamera.quaternion.copy(telescopeGroups.raAxisGroup.quaternion);
}

function createPointingIndicator() {
  // Placeholder for Phase 3 - shows telescope pointing direction
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.3, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  cone.rotation.x = Math.PI / 2; // Point forward
  scene.add(cone);
  return cone;
}

async function setupCameraViews() {
  groundScene = scene;
  groundCamera = camera;
  groundRenderer = renderer;
  groundControls = controls;

  const aspectRatio = (threeContainer.value?.clientWidth || 600) / (threeContainer.value?.clientHeight || 800);
  imagingCamera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000);
  imagingCamera.position.set(0, 2.5, 0);

  pointingIndicator = createPointingIndicator();

  await initializeStarField();
}

async function initializeStarField() {
  console.log('[StarField] Initializing star field...');
  
  try {
    starCatalog = await loadBinaryStarCatalog('/data/hygdata.bin.gz');
    console.log(`[StarField] Loaded ${starCatalog.stars.length} stars from HYG binary catalog`);
    
    starField = createStarField(starCatalog, {
      sphereRadius: 500,
      baseSizeMultiplier: 10,
      minStarSize: 3,
      maxStarSize: 40
    });
    
    scene.add(starField);
    console.log('[StarField] Star field added to scene');
    
    if (currentFrame.value) {
      updateStarFieldRotation(starField, currentFrame.value.ra, currentFrame.value.dec);
    }
  } catch (error) {
    console.error('[StarField] Failed to initialize:', error);
    throw error;
  }
}

onUnmounted(() => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
  }
  cleanupThreeJS();
  simulatorStore.dispatch(SimulatorActionTypes.PAUSE);
});

// Watch for when 3D container should be available
watch([showNoDataState, isLoading, error], async ([noData, loading, err]) => {
  await nextTick();

  if ((noData || loading || err) && scene) {
    console.log("Leaving active state, cleaning up Three.js");
    cleanupThreeJS();
  }

  if (!noData && !loading && !err && threeContainer.value && !scene) {
    console.log("Container now available, initializing Three.js...");
    console.log("threeContainer.value:", threeContainer.value);
    console.log("Container dimensions:", threeContainer.value.clientWidth, threeContainer.value.clientHeight);
    initThreeJS();
  }
}, { immediate: false });

// Watch for 3D model changes
watch(showEquipmentModels, () => {
  if (!scene || !telescopeGroups) return;
  updateMountModel();
});

watch(selectedMountModel, () => {
  if (!scene || !telescopeGroups) return;
  updateMountModel();
});

// Watch for frame changes to update telescope position
watch(currentFrame, () => {
  if (!telescopeGroups || !telescopeGroups.raAxisGroup || !telescopeGroups.decAxisGroup || !telescopeGroups.telescopeAssemblyGroup) return;
  updateTelescopePosition();
});

watch(isPlaying, (playing) => {
  if (playing) {
    startAnimationLoop();
  } else {
    stopAnimationLoop();
  }
});

// Watch for camera view mode changes
watch(cameraViewMode, () => {
  console.log("Camera view mode changed to:", cameraViewMode.value);
  // Update imaging camera immediately when switching to imaging view
  if (cameraViewMode.value === 'imaging' && imagingCamera) {
    updateImagingCamera();
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
    const phdResponse = await fetch('/data/PHD2_GuideLog_2022-03-18_210258.txt');
    const asiairResponse = await fetch('/data/Autorun_Log_2022-03-18_211302.txt');

    const phdText = await phdResponse.text();
    const asiairText = await asiairResponse.text();

    const phdLogReader = new PHDLogReader();
    const asiairLogReader = new ASIAIRLogReader();

    const parsedPHDLog = phdLogReader.parseText(phdText);
    const parsedASIAIRLog = asiairLogReader.parseText(asiairText);

    await phdStore.dispatch(PHDActionTypes.SET_PHD_LOG, parsedPHDLog);
    await asiairStore.dispatch(ASIAIRActionTypes.SET_ASIAIR_LOG, parsedASIAIRLog);
    await appStore.dispatch(AppActionTypes.SET_FILES_UPLOADED, true);

    selectedSessionIndex.value = 0;

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
  const frameDelay = 1000 / (30 * playbackSpeed.value);
  let lastTime = performance.now();

  const animate = (currentTime: number) => {
    if (!isPlaying.value) {
      return;
    }

    const deltaTime = currentTime - lastTime;

    if (deltaTime >= frameDelay) {
      simulatorStore.dispatch(SimulatorActionTypes.STEP_FORWARD);
      lastTime = currentTime;

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

function initThreeJS() {
  console.log("Initializing Three.js scene");
  is3DLoading.value = true;
  threeDReady.value = false;
  threeDError.value = null;

  if (!threeContainer.value) {
    console.error("Three.js container not available");
    threeDError.value = "Container element not found";
    is3DLoading.value = false;
    return;
  }
  console.log("Three.js container found, initializing...");
  console.log("Container clientWidth:", threeContainer.value.clientWidth);
  console.log("Container clientHeight:", threeContainer.value.clientHeight);

  try {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    console.log("Scene created");

    const aspectRatio = (threeContainer.value.clientWidth || 600) / (threeContainer.value.clientHeight || 800);
    camera = new THREE.PerspectiveCamera(50, aspectRatio, 0.1, 1000);
    camera.position.set(4, 3, 4);
    camera.lookAt(0, 2.0, 0);
    console.log("Camera created and positioned");

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    console.log("WebGLRenderer created");

    const width = threeContainer.value.clientWidth || 600;
    const height = threeContainer.value.clientHeight || 800;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    console.log("Appending renderer to container...");
    threeContainer.value.appendChild(renderer.domElement);
    console.log("Renderer created and appended to container");

    const rendererCanvas = renderer.domElement;
    console.log("Canvas width:", rendererCanvas.width);
    console.log("Canvas height:", rendererCanvas.height);

    try {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 2;
      controls.maxDistance = 10;
      controls.target.set(0, 2.0, 0);
      console.log("OrbitControls initialized");
    } catch (controlsError) {
      console.error("Failed to initialize OrbitControls:", controlsError);
    }

    // Setup dual camera view system
    setupCameraViews();
    console.log("Dual camera view system initialized");

    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    mountGroup = new THREE.Group();
    scene.add(mountGroup);

    updateMountModel();

    console.log("Animation started");
    animate();

    is3DLoading.value = false;
    threeDReady.value = true;
    console.log("3D Renderer ready!");
  } catch (error) {
    console.error("Error initializing Three.js:", error);
    threeDError.value = error instanceof Error ? error.message : 'Unknown error';
    is3DLoading.value = false;
  }
}

function updateMountModel() {
  if (!mountGroup || !scene) {
    console.log("Mount group or scene not initialized");
    return;
  }

  if (!showEquipmentModels.value) {
    while (mountGroup.children.length > 0) {
      mountGroup.remove(mountGroup.children[0]);
    }
    return;
  }

  telescopeGroups = createGenericMount(mountGroup, scene);
}

function updateTelescopePosition() {
  if (!currentFrame.value || !telescopeGroups || !telescopeGroups.raAxisGroup || !telescopeGroups.decAxisGroup || !telescopeGroups.telescopeAssemblyGroup) return;

  const ra = (currentFrame.value.ra * Math.PI) / 180;
  const dec = (currentFrame.value.dec * Math.PI) / 180;

  telescopeGroups.raAxisGroup.rotation.y = ra;
  telescopeGroups.telescopeAssemblyGroup.rotation.x = -dec;
}

function animate() {
  animationId = requestAnimationFrame(animate);

  updateTelescopePosition();

  if (starField && currentFrame.value) {
    updateStarFieldRotation(starField, currentFrame.value.ra, currentFrame.value.dec);
  }

  if (cameraViewMode.value === 'ground') {
    if (groundControls) {
      groundControls.update();
    }
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  } else {
    updateImagingCamera();
    if (pointingIndicator && telescopeGroups) {
      const guideCamPos = getGuideCameraWorldPosition();
      pointingIndicator.position.copy(guideCamPos);
      pointingIndicator.quaternion.copy(telescopeGroups.raAxisGroup.quaternion);
    }
    if (renderer && scene && imagingCamera) {
      renderer.render(scene, imagingCamera);
    }
  }

  frameCount3D++;
  if (frameCount3D % 60 === 0) {
    console.log("3D Animation running, frame:", frameCount3D, "mode:", cameraViewMode.value);
  }
}

function cleanupThreeJS() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  if (starField && scene) {
    scene.remove(starField);
    disposeStarField(starField);
    starField = null;
  }
  starCatalog = null;

  if (pointingIndicator && scene) {
    scene.remove(pointingIndicator);
    pointingIndicator.geometry.dispose();
    if (Array.isArray(pointingIndicator.material)) {
      pointingIndicator.material.forEach(m => m.dispose());
    } else {
      pointingIndicator.material.dispose();
    }
    pointingIndicator = null as any;
  }

  // Cleanup imaging camera
  imagingCamera = null as any;

  // Cleanup controls
  if (controls) {
    controls.dispose();
  }
  if (groundControls && groundControls !== controls) {
    groundControls.dispose();
  }

  // Cleanup renderer and DOM
  if (renderer && threeContainer.value) {
    threeContainer.value.removeChild(renderer.domElement);
    renderer.dispose();
  }
  if (groundRenderer && groundRenderer !== renderer && threeContainer.value) {
    threeContainer.value.removeChild(groundRenderer.domElement);
    groundRenderer.dispose();
  }

  // Clear scene
  if (scene) {
    scene.clear();
  }

  // Clear references
  scene = null as any;
  camera = null as any;
  renderer = null as any;
  controls = null as any;
  mountGroup = null as any;
  telescopeGroups = null as any;

  groundScene = null as any;
  groundCamera = null as any;
  groundRenderer = null as any;
  groundControls = null as any;
  telescopeViewGroup = null as any;

  window.removeEventListener('resize', onWindowResize);
}

function onWindowResize() {
  if (!camera || !renderer || !threeContainer.value) return;

  const width = threeContainer.value.clientWidth || 600;
  const height = threeContainer.value.clientHeight || 400;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // Update imaging camera aspect ratio if it exists
  if (imagingCamera) {
    imagingCamera.aspect = width / height;
    imagingCamera.updateProjectionMatrix();
  }

  renderer.setSize(width, height);
  console.log("3D Renderer resized to:", width, "x", height);
}

function retry3DInit() {
  console.log("Retrying 3D initialization...");
  threeDError.value = null;
  initThreeJS();
}

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

.session-selector-card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.session-selector-card h3 {
  margin-bottom: 1rem;
  color: var(--gray-800);
}

.selector-wrapper {
  margin-bottom: 1rem;
}

.session-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  background: var(--white);
  font-size: 1rem;
}

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

.telescope-3d-view {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.view-header h3 {
  margin: 0;
  color: var(--gray-800);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-header h3::after {
  content: "🖱️ Drag to rotate • Scroll to zoom";
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 400;
  margin-left: 0.5rem;
  display: none;
}

@media (min-width: 768px) {
  .view-header h3::after {
    display: inline;
  }
}

.view-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--gray-700);
  cursor: pointer;
}

.model-select {
  padding: 0.5rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  background: var(--white);
  font-size: 0.875rem;
}

.three-container {
  width: 100%;
  height: 800px;
  border-radius: var(--border-radius);
  overflow: hidden;
  background: var(--gray-100);
  margin-bottom: 1rem;
  position: relative;
}

.three-container canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.three-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--gray-100);
  z-index: 10;
}

.three-loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--gray-300);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.three-loading-text {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0;
}

.three-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--gray-100);
  z-index: 10;
  padding: 2rem;
  text-align: center;
}

.three-error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.three-error-text {
  color: var(--gray-800);
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.three-error-detail {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}

.three-retry-btn {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  background: var(--primary-color);
  color: var(--white);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.three-retry-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.view-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.view-info .info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: var(--border-radius);
  border: 1px solid var(--gray-200);
}

.info-label {
  font-weight: 600;
  color: var(--gray-700);
  font-size: 0.875rem;
}

.info-value {
  font-family: 'Courier New', monospace;
  color: var(--primary-color);
  font-weight: 600;
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
}
</style>
