<template>
  <div class="guiding-performance">
    <div class="performance-header">
      <h1 class="performance-title">
        <span class="performance-icon">📊</span>
        Guiding Performance Analysis
      </h1>
      <p class="performance-subtitle">
        Comprehensive analysis of your telescope guiding performance based on uploaded log files
      </p>
    </div>
    
    <!-- Loading State -->
    <div v-if="!isDataLoaded" class="loading-state">
      <div class="loading-content">
        <div class="loading-spinner">🔄</div>
        <h3>Processing Log Files...</h3>
        <p>Analyzing your guiding data and generating performance metrics.</p>
        <div class="loading-steps">
          <div class="loading-step" :class="{ active: phdLog }">
            <span class="step-icon">📋</span>
            PHD2 Log Processing
          </div>
          <div class="loading-step" :class="{ active: asiairLog }">
            <span class="step-icon">🖥️</span>
            ASIAIR Log Processing
          </div>
          <div class="loading-step" :class="{ active: selectedGuidingSession }">
            <span class="step-icon">⚙️</span>
            Session Initialization
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main Content - Only show when data is loaded -->
    <template v-else>
      <div class="analysis-grid">
        <div class="analysis-card asiair-card">
          <AutorunLogDetails :asiairLog="asiairLog" />
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
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import AutorunLogDetails from './ASIAIRLogDetails.vue';
import PHDLogDetails from './PHDLogDetails.vue';
import PHDLogGuidingCharts from './PHDLogGuidingCharts.vue';
import { GuidingSession } from '../store/modules/PHD/PHD.types';
import { PHDGetterTypes } from '../store/modules/PHD/PHD.getters';
import { useASIAIRStore, usePHDStore } from '../store';
import { ASIAIRGetterTypes } from '../store/modules/ASIAIR/ASIAIR.getters';

export default defineComponent({
  name: 'GuidingPerformance',
  components: {
    AutorunLogDetails,
    PHDLogDetails,
    PHDLogGuidingCharts,
  },
  setup() {
    const phdStore = usePHDStore();
    const asiairStore = useASIAIRStore();
    
    // Use computed properties to make data reactive
    const phdLog = computed(() => phdStore.getters(PHDGetterTypes.GET_PHD_LOG));
    const asiairLog = computed(() => asiairStore.getters(ASIAIRGetterTypes.GET_ASIAIR_LOG));

    // Use computed for selectedGuidingSession to handle loading states
    const selectedGuidingSession = ref<GuidingSession | null>(null);

    // Watch for phdLog changes and set initial session
    const initializeGuidingSession = () => {
      if (phdLog.value && phdLog.value.guidingSessions && phdLog.value.guidingSessions.length > 0) {
        if (!selectedGuidingSession.value) {
          selectedGuidingSession.value = phdLog.value.guidingSessions[0];
        }
      }
    };

    // Initialize on mount and when data changes
    onMounted(() => {
      initializeGuidingSession();
    });

    // Watch for phdLog changes using proper watch
    watch(phdLog, (newValue: any) => {
      if (newValue) {
        initializeGuidingSession();
      }
    }, { immediate: true });

    function updateSelectedGuidingSession(guidingSession: GuidingSession) {
      selectedGuidingSession.value = guidingSession;
    }

    // Computed properties to check if data is loaded
    const isDataLoaded = computed(() => {
      return phdLog.value && 
             asiairLog.value && 
             phdLog.value.guidingSessions && 
             phdLog.value.guidingSessions.length > 0 &&
             selectedGuidingSession.value;
    });

    return {
      updateSelectedGuidingSession, 
      selectedGuidingSession,
      asiairLog, 
      phdLog,
      isDataLoaded,
    };
  },
});
</script>

<style scoped>
.guiding-performance {
  max-width: 1200px;
  margin: 0 auto;
}

.performance-header {
  text-align: center;
  margin-bottom: 3rem;
}

.performance-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: 1rem;
}

.performance-icon {
  font-size: 3rem;
}

.performance-subtitle {
  font-size: 1.125rem;
  color: var(--gray-600);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

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
  border-top: 4px solid var(--primary-color);
}

.phd-card {
  border-top: 4px solid var(--secondary-color);
}

.charts-section {
  margin-top: 2rem;
}

.charts-card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 2rem;
  border-top: 4px solid var(--accent-color);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 3rem;
}

.loading-content {
  text-align: center;
  max-width: 500px;
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
  margin-bottom: 2rem;
  line-height: 1.6;
}

.loading-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.loading-step {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--gray-100);
  border-radius: var(--border-radius);
  color: var(--gray-600);
  transition: var(--transition);
}

.loading-step.active {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: var(--white);
  box-shadow: var(--shadow);
}

.step-icon {
  font-size: 1.25rem;
}

@media (max-width: 768px) {
  .analysis-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .performance-title {
    font-size: 2rem;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .charts-card {
    padding: 1.5rem;
  }
  
  .loading-state {
    padding: 2rem 1rem;
    min-height: 300px;
  }
  
  .loading-steps {
    gap: 0.75rem;
  }
  
  .loading-step {
    padding: 0.75rem;
    font-size: 0.875rem;
  }
}
</style>
