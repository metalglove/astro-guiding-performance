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
        <PHDLogGuidingCharts :selectedGuidingSession="selectedGuidingSession" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import AutorunLogDetails from './ASIAIRLogDetails.vue';
import PHDLogDetails from './PHDLogDetails.vue';
import PHDLogGuidingCharts from './PHDLogGuidingCharts.vue';
import { ASIAIRLog } from '../store/modules/ASIAIR/ASIAIR.types';
import { GuidingSession, PHDLog } from '../store/modules/PHD/PHD.types';
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
  setup(props, { emit }) {
    const phdStore = usePHDStore();
    const asiairStore = useASIAIRStore();
    const phdLog: PHDLog = phdStore.getters(PHDGetterTypes.GET_PHD_LOG);
    const asiairLog: ASIAIRLog = asiairStore.getters(ASIAIRGetterTypes.GET_ASIAIR_LOG);

    const selectedGuidingSession = ref(phdLog.guidingSessions[0]);

    function updateSelectedGuidingSession(guidingSession: GuidingSession) {
      selectedGuidingSession.value = guidingSession;
    }

    return {
      updateSelectedGuidingSession, selectedGuidingSession,
      asiairLog, phdLog,
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
}
</style>
