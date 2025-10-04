<template>
  <div class="phd-analysis">
    <!-- No Data State -->
    <div v-if="showNoDataState" class="no-data-state">
      <div class="no-data-content">
        <div class="no-data-icon">📊</div>
        <h2>Load Data First</h2>
        <p class="no-data-message">
          To view the PHD analysis, you need to load your astrophotography log files first.
        </p>
        <div class="data-requirements">
          <h3>Required Files:</h3>
          <ul>
            <li><span class="file-icon">🖥️</span> ASIAIR Autorun Log</li>
            <li><span class="file-icon">📊</span> PHD2 Guiding Log</li>
          </ul>
        </div>
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

    <!-- Analysis Content -->
    <template v-else>
      <div class="analysis-header">
        <h1 class="analysis-title">
          <span class="analysis-icon">📊</span>
          Guiding Performance Analysis
        </h1>
        <p class="analysis-subtitle">
          Comprehensive analysis of your telescope guiding performance
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="!isDataLoaded" class="loading-state">
        <div class="loading-content">
          <div class="loading-spinner">🔄</div>
          <h3>Processing Log Files...</h3>
          <p>Analyzing your guiding data and generating performance metrics.</p>
        </div>
      </div>

      <!-- Main Analysis Content -->
      <template v-else>
        <div class="analysis-grid">
          <div class="analysis-card asiair-card">
            <ASIAIRLogDetails :asiairLog="asiairLog" />
          </div>

          <div class="analysis-card phd-card">
            <PHDLogDetails :phdLog="phdLog" @selectedGuidingSessionChanged="updateSelectedGuidingSession"/>
          </div>
        </div>

        <div class="charts-section">
          <div class="charts-card">
            <PHDLogGuidingCharts v-if="selectedGuidingSession" :selectedGuidingSession="selectedGuidingSession" />
          </div>
        </div>

        <!-- Temperature and Autofocus Analysis -->
        <div v-if="asiairLog && flattenedAutoFocusEvents.length > 0" class="additional-analysis">
          <TemperatureChart :autoFocusEvents="flattenedAutoFocusEvents" />
          <AutofocusTimeline :autoFocusEvents="flattenedAutoFocusEvents" />
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PHDLogDetails from '../components/PHDLogDetails.vue';
import PHDLogGuidingCharts from '../components/PHDLogGuidingCharts.vue';
import ASIAIRLogDetails from '../components/ASIAIRLogDetails.vue';
import TemperatureChart from '../components/Charts/TemperatureChart.vue';
import AutofocusTimeline from '../components/Charts/AutofocusTimeline.vue';
import { GuidingSession, PHDLog } from '../store/modules/PHD/PHD.types';
import { ASIAIRLog } from '../store/modules/ASIAIR/ASIAIR.types';
import { usePHDStore, useASIAIRStore, useAppStore, useEquipmentStore } from '../store/';
import { PHDGetterTypes } from '../store/modules/PHD/PHD.getters';
import { ASIAIRGetterTypes } from '../store/modules/ASIAIR/ASIAIR.getters';
import { AppGetterTypes } from '../store/modules/App/App.getters';
import { PHDActionTypes } from '../store/modules/PHD/PHD.actions';
import { ASIAIRActionTypes } from '../store/modules/ASIAIR/ASIAIR.actions';
import { AppActionTypes } from '../store/modules/App/App.actions';
import { EquipmentActionTypes } from '../store/modules/Equipment/Equipment.actions';
import ASIAIRLogReader from '../services/ASIAIRLogReader';
import PHDLogReader from '../services/PHDLogReader';

export default defineComponent({
  name: 'PHDLogViewer',
  components: {
    PHDLogDetails,
    PHDLogGuidingCharts,
    ASIAIRLogDetails,
    TemperatureChart,
    AutofocusTimeline,
  },
  setup() {
    const phdStore = usePHDStore();
    const asiairStore = useASIAIRStore();
    const appStore = useAppStore();
    const equipmentStore = useEquipmentStore();
    const router = useRouter();

    // Check if files are uploaded and redirect if not
    const filesUploaded = computed(() => {
      const uploaded = appStore.getters(AppGetterTypes.GET_FILES_UPLOADED);
      return uploaded;
    });

    onMounted(() => {
      if (!filesUploaded.value) {
        // No data available, showing notification to load data first
      } else {
        initializeGuidingSession();
      }
    });

    const phdLog = computed(() => phdStore.getters(PHDGetterTypes.GET_PHD_LOG));
    const asiairLog = computed(() => asiairStore.getters(ASIAIRGetterTypes.GET_ASIAIR_LOG));

    const selectedGuidingSession = ref<GuidingSession | null>(null);
    const isLoadingExample = ref(false);

    // Initialize services
    const asiairLogReader = new ASIAIRLogReader();
    const phdLogReader = new PHDLogReader();

    // Initialize guiding session when data is available
    const initializeGuidingSession = () => {
      if (phdLog.value && phdLog.value.guidingSessions && phdLog.value.guidingSessions.length > 0) {
        if (!selectedGuidingSession.value) {
          selectedGuidingSession.value = phdLog.value.guidingSessions[0];
        }
      }
    };

    onMounted(() => {
      initializeGuidingSession();
    });

    function updateSelectedGuidingSession(guidingSession: GuidingSession) {
      selectedGuidingSession.value = guidingSession;
    }

    function goToHome() {
      router.push('/');
    }

    // Clear data for testing (can be called from console)
    const clearData = () => {
      appStore.dispatch(AppActionTypes.SET_FILES_UPLOADED, false);
      localStorage.removeItem('AppState.filesUploaded');
    };

    // Expose clearData to window for debugging
    if (typeof window !== 'undefined') {
      (window as { clearData?: () => void }).clearData = clearData;
    }

    const loadExampleData = async () => {
      isLoadingExample.value = true;

      try {
        // Fetch the example files from the data directory
        const [asiairResponse, phdResponse] = await Promise.all([
          fetch('/data/Autorun_Log_2022-03-18_211302.txt'),
          fetch('/data/PHD2_GuideLog_2022-03-18_210258.txt')
        ]);

        if (!asiairResponse.ok || !phdResponse.ok) {
          throw new Error('Failed to fetch example data files');
        }

        const asiairText = await asiairResponse.text();
        const phdText = await phdResponse.text();

        // Process ASIAIR log
        const asiairLog: ASIAIRLog = asiairLogReader.parseText(asiairText);
        asiairStore.dispatch(ASIAIRActionTypes.SET_ASIAIR_LOG, asiairLog);

        // Process PHD log
        const phdLogData: PHDLog = phdLogReader.parseText(phdText);
        phdStore.dispatch(PHDActionTypes.SET_PHD_LOG, phdLogData);

        // Ensure example equipment profile exists
        equipmentStore.dispatch(EquipmentActionTypes.ENSURE_EXAMPLE_PROFILE, undefined);

        // Set files as uploaded
        appStore.dispatch(AppActionTypes.SET_FILES_UPLOADED, true);

        // Initialize the guiding session
        setTimeout(() => {
          initializeGuidingSession();
        }, 100);
      } catch (error) {
        console.error('Error loading example data:', error);
        alert(`Error loading example data: ${(error as Error).message || error}`);
      } finally {
        isLoadingExample.value = false;
      }
    };

    // Check if we should show the no data state
    const showNoDataState = computed(() => {
      const uploaded = filesUploaded.value;
      return uploaded === null || uploaded === false;
    });

    // Check if data is loaded
    const isDataLoaded = computed(() => {
      return phdLog.value &&
             asiairLog.value &&
             phdLog.value.guidingSessions &&
             phdLog.value.guidingSessions.length > 0 &&
             selectedGuidingSession.value;
    });

    // Flatten autofocus events from all autoruns
    const flattenedAutoFocusEvents = computed(() => {
      if (!asiairLog.value || !asiairLog.value.autoruns) return [];

      return asiairLog.value.autoruns.flatMap((autorun: { autoFocusEvents?: unknown[] }) =>
        autorun.autoFocusEvents || []
      );
    });

    return {
      filesUploaded,
      showNoDataState,
      phdLog,
      asiairLog,
      updateSelectedGuidingSession,
      selectedGuidingSession,
      isDataLoaded,
      flattenedAutoFocusEvents,
      goToHome,
      loadExampleData,
      isLoadingExample,
    };
  },
});
</script>

<style scoped>
.phd-analysis {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
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
  max-width: 400px;
}

.no-data-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.7;
}

.no-data-content h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 1rem;
}

.no-data-message {
  color: var(--gray-600);
  margin-bottom: 2rem;
  line-height: 1.6;
  font-size: 1.1rem;
}

.data-requirements {
  background: var(--gray-50);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.data-requirements h3 {
  color: var(--gray-800);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: center;
}

.data-requirements ul {
  list-style: none;
  padding: 0;
}

.data-requirements li {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  color: var(--gray-700);
  font-weight: 500;
}

.file-icon {
  font-size: 1.5rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.upload-btn {
  border: none;
  color: white;
  padding: 0.875rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 200px;
}

.upload-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.upload-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.upload-btn.secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);
}

.upload-btn.secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(240, 147, 251, 0.4);
}

.upload-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
}

.loading-spinner-small {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.btn-icon {
  font-size: 1.2rem;
}

/* Analysis Header */
.analysis-header {
  text-align: center;
  margin-bottom: 3rem;
}

.analysis-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: 1rem;
}

.analysis-icon {
  font-size: 3rem;
}

.analysis-subtitle {
  font-size: 1.125rem;
  color: var(--gray-600);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Loading State */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 3rem;
}

.loading-content {
  text-align: center;
  max-width: 400px;
}

.loading-spinner {
  font-size: 3rem;
  animation: spin 2s linear infinite;
  margin-bottom: 2rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 0.5rem;
}

.loading-content p {
  color: var(--gray-600);
  line-height: 1.6;
}

/* Analysis Grid */
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.analysis-card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  transition: var(--transition);
  overflow: hidden;
}

.analysis-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.asiair-card {
  border-top: 4px solid #667eea;
}

.phd-card {
  border-top: 4px solid #764ba2;
}

.temperature-card {
  border-top: 4px solid #f093fb;
}

.autofocus-card {
  border-top: 4px solid #f5576c;
}

/* Charts Section */
.charts-section {
  margin-bottom: 3rem;
}

.charts-card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 2rem;
  border-top: 4px solid #4facfe;
}

/* Additional Analysis */
.additional-analysis {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 2rem;
  max-width: 100%;
}

/* Responsive Design */
@media (max-width: 768px) {
  .phd-analysis {
    padding: 1rem;
  }

  .analysis-grid,
  .additional-analysis {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .analysis-title {
    font-size: 2rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .charts-card {
    padding: 1.5rem;
  }

  .loading-state {
    padding: 2rem 1rem;
    min-height: 250px;
  }

  .no-data-content {
    padding: 0 1rem;
  }

  .upload-btn {
    width: 100%;
    justify-content: center;
    min-width: auto;
  }

  .action-buttons {
    width: 100%;
  }

  .data-requirements {
    padding: 1rem;
  }

  .data-requirements li {
    font-size: 0.9rem;
  }
}
</style>
