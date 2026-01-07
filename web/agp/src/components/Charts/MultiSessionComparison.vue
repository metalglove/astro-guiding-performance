<template>
  <div class="multi-session-comparison">
    <div class="comparison-header">
      <h3 class="comparison-title">
        <span class="comparison-icon">📊</span>
        Multi-Session Comparison
      </h3>
      <p class="comparison-subtitle">
        Compare guiding performance across multiple sessions to track improvements and identify trends
      </p>
    </div>

    <!-- Session Management -->
    <div class="session-management">
      <div class="session-controls">
        <button @click="loadExampleSessions" class="btn-primary" :disabled="isLoading">
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? 'Loading...' : 'Load Example Sessions' }}
        </button>
        <div class="session-count">
          {{ comparison.sessions.length }} session{{ comparison.sessions.length !== 1 ? 's' : '' }} loaded
        </div>
      </div>

      <!-- Session List -->
      <div v-if="comparison.sessions.length > 0" class="session-list">
        <div class="session-item" v-for="(session, index) in comparison.sessions" :key="session.sessionId">
          <div class="session-info">
            <div class="session-name">{{ session.sessionId }}</div>
            <div class="session-date">{{ formatDate(session.sessionDate) }}</div>
            <div class="session-stats">
              <span class="stat-item">RMS: {{ session.rmsTotal.toFixed(2) }}"</span>
              <span class="stat-item">{{ session.perfectPercentage.toFixed(1) }}% perfect</span>
            </div>
          </div>
          <div class="session-equipment">
            <div class="equipment-item" v-if="session.equipment.mount">
              <span class="equipment-label">Mount:</span> {{ session.equipment.mount }}
            </div>
            <div class="equipment-item" v-if="session.equipment.camera">
              <span class="equipment-label">Camera:</span> {{ session.equipment.camera }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Overall Statistics -->
    <div v-if="comparison.sessions.length > 0" class="overall-stats">
      <h4>Overall Performance</h4>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Average RMS</div>
          <div class="stat-value">{{ comparison.overallStats.averageRMS.toFixed(2) }}"</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Best RMS</div>
          <div class="stat-value">{{ comparison.overallStats.bestRMS.toFixed(2) }}"</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Worst RMS</div>
          <div class="stat-value">{{ comparison.overallStats.worstRMS.toFixed(2) }}"</div>
        </div>
        <div class="stat-card" :class="getTrendClass(comparison.overallStats.improvementTrend)">
          <div class="stat-label">Trend</div>
          <div class="stat-value">
            {{ comparison.overallStats.improvementTrend >= 0 ? '+' : '' }}{{ comparison.overallStats.improvementTrend.toFixed(1) }}%
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Consistency</div>
          <div class="stat-value">{{ comparison.overallStats.consistencyScore.toFixed(1) }}%</div>
        </div>
      </div>
    </div>

    <!-- Equipment Changes -->
    <div v-if="comparison.equipmentChanges.length > 0" class="equipment-changes">
      <h4>Equipment Changes Detected</h4>
      <div class="changes-list">
        <div class="change-item" v-for="change in comparison.equipmentChanges" :key="change.sessionIndex + change.changeType">
          <div class="change-info">
            <div class="change-type">{{ formatChangeType(change.changeType) }}</div>
            <div class="change-description">
              Session {{ change.sessionIndex + 1 }}: {{ change.oldValue }} → {{ change.newValue }}
            </div>
          </div>
          <div class="change-impact" :class="change.impact">
            {{ change.impact.charAt(0).toUpperCase() + change.impact.slice(1) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Comparison Charts -->
    <div v-if="comparison.sessions.length > 0" class="comparison-charts">
      <h4>Performance Comparison</h4>

      <!-- RMS Trend Chart -->
      <div class="chart-container">
        <LineChartComponent
          title="RMS Error Trend Across Sessions"
          :chartData="rmsTrendChartData"
          :chartOptions="rmsTrendChartOptions"
        />
      </div>

      <!-- Quality Comparison Chart -->
      <div class="chart-container">
        <LineChartComponent
          title="Data Quality Comparison"
          :chartData="qualityChartData"
          :chartOptions="qualityChartOptions"
        />
      </div>
    </div>

    <!-- No Data State -->
    <div v-else class="no-data-state">
      <div class="no-data-content">
        <span class="no-data-icon">📈</span>
        <h4>No Sessions to Compare</h4>
        <p>Load example sessions or upload your own guiding logs to start comparing performance across multiple sessions.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import LineChartComponent from './LineChartComponent.vue';
import { compareMultipleSessions, generateMultiSessionOverlay, type MultiSessionComparison } from '@/utilities/computations';
import PHDLogReader from '@/services/PHDLogReader';
import ASIAIRLogReader from '@/services/ASIAIRLogReader';

const isLoading = ref(false);
const comparison = ref<MultiSessionComparison>({
  sessions: [],
  overallStats: {
    averageRMS: 0,
    bestRMS: 0,
    worstRMS: 0,
    improvementTrend: 0,
    consistencyScore: 0
  },
  equipmentChanges: []
});

// Load example sessions for comparison
async function loadExampleSessions() {
  isLoading.value = true;
  try {
    // Load multiple example sessions
    const sessions = [];

    // Session 1 - ASI2600MM Pro
    const phdResponse1 = await fetch('/data/PHD2_GuideLog_2022-03-18_210258.txt');
    const asiairResponse1 = await fetch('/data/Autorun_Log_2022-03-18_211302.txt');

    const phdText1 = await phdResponse1.text();
    const asiairText1 = await asiairResponse1.text();

    // Parse and add first session
    const phdLog1 = await parsePHDLog(phdText1);
    const asiairLog1 = await parseASIAIRLog(asiairText1);

    if (phdLog1.guidingSessions.length > 0) {
      sessions.push(phdLog1.guidingSessions[0]);
    }

    // For demonstration, create additional "sessions" by modifying the data slightly
    if (sessions.length > 0) {
      const baseSession = sessions[0];

      // Create a "better" session (simulate improvement)
      const improvedSession = {
        ...baseSession,
        startTime: new Date(baseSession.startTime.getTime() + 24 * 60 * 60 * 1000), // Next day
        guidingFrames: baseSession.guidingFrames.map(frame => ({
          ...frame,
          dx: frame.dx * 0.7, // 30% improvement
          dy: frame.dy * 0.7
        }))
      };

      // Create a "worse" session (simulate issue)
      const worseSession = {
        ...baseSession,
        startTime: new Date(baseSession.startTime.getTime() + 2 * 24 * 60 * 60 * 1000), // Two days later
        guidingFrames: baseSession.guidingFrames.map(frame => ({
          ...frame,
          dx: frame.dx * 1.5, // 50% worse
          dy: frame.dy * 1.5
        }))
      };

      sessions.push(improvedSession, worseSession);
    }

    // Perform comparison
    comparison.value = compareMultipleSessions(sessions);

  } catch (error) {
    console.error('Error loading example sessions:', error);
  } finally {
    isLoading.value = false;
  }
}

// Helper functions for parsing
async function parsePHDLog(text: string) {
  const reader = new PHDLogReader();
  return reader.parseText(text);
}

async function parseASIAIRLog(text: string) {
  const reader = new ASIAIRLogReader();
  return reader.parseText(text);
}

// Chart data
const rmsTrendChartData = computed(() => {
  if (comparison.value.sessions.length === 0) return { datasets: [] };

  const labels = comparison.value.sessions.map((_, i) => `Session ${i + 1}`);
  const rmsData = comparison.value.sessions.map(s => s.rmsTotal);

  return {
    labels,
    datasets: [{
      label: 'RMS Error (arcseconds)',
      data: rmsData,
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.1)',
      borderWidth: 2,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };
});

const rmsTrendChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'RMS Error (arcseconds)'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Session'
      }
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const
    }
  }
}));

const qualityChartData = computed(() => {
  if (comparison.value.sessions.length === 0) return { datasets: [] };

  const labels = comparison.value.sessions.map((_, i) => `Session ${i + 1}`);
  const perfectData = comparison.value.sessions.map(s => s.perfectPercentage);
  const goodData = comparison.value.sessions.map(s => s.goodPercentage);

  return {
    labels,
    datasets: [
      {
        label: 'Perfect Data (%)',
        data: perfectData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        borderWidth: 2,
        fill: false,
        pointRadius: 4
      },
      {
        label: 'Good Data (%)',
        data: goodData,
        borderColor: 'rgba(255, 205, 86, 1)',
        backgroundColor: 'rgba(255, 205, 86, 0.1)',
        borderWidth: 2,
        fill: false,
        pointRadius: 4
      }
    ]
  };
});

const qualityChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      title: {
        display: true,
        text: 'Percentage (%)'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Session'
      }
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const
    }
  }
}));

// Formatting functions
function formatDate(date: Date): string {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function getTrendClass(trend: number): string {
  if (trend > 5) return 'positive';
  if (trend < -5) return 'negative';
  return 'neutral';
}

function formatChangeType(type: string): string {
  const types = {
    mount: 'Mount Change',
    camera: 'Camera Change',
    telescope: 'Telescope Change',
    pixelScale: 'Pixel Scale Change'
  };
  return types[type as keyof typeof types] || type;
}

// Auto-load example data on mount
onMounted(() => {
  // Don't auto-load to avoid overwhelming the user
});
</script>

<style scoped>
.multi-session-comparison {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.comparison-header {
  text-align: center;
  margin-bottom: 2rem;
}

.comparison-title {
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: var(--gray-800);
}

.comparison-subtitle {
  color: var(--text-muted);
  font-size: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.session-management {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.session-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: var(--white);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--white);
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.session-count {
  font-weight: 600;
  color: var(--gray-700);
}

.session-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.session-item {
  background: var(--gray-50);
  border-radius: var(--border-radius);
  padding: 1rem;
  border: 1px solid var(--gray-200);
}

.session-info {
  margin-bottom: 0.75rem;
}

.session-name {
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 0.25rem;
}

.session-date {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.session-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  background: var(--primary-color);
  color: var(--white);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.equipment-item {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: 0.25rem;
}

.equipment-label {
  font-weight: 600;
  color: var(--gray-700);
}

.overall-stats {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.overall-stats h4 {
  margin-bottom: 1rem;
  color: var(--gray-800);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--gray-50);
  border-radius: var(--border-radius);
  padding: 1rem;
  text-align: center;
  border: 1px solid var(--gray-200);
}

.stat-card.positive {
  border-color: var(--success-color);
  background: var(--success-light);
}

.stat-card.negative {
  border-color: var(--error-color);
  background: var(--error-light);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.equipment-changes {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.equipment-changes h4 {
  margin-bottom: 1rem;
  color: var(--gray-800);
}

.changes-list {
  display: grid;
  gap: 0.75rem;
}

.change-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--gray-50);
  border-radius: var(--border-radius);
  padding: 1rem;
  border: 1px solid var(--gray-200);
}

.change-info {
  flex: 1;
}

.change-type {
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 0.25rem;
}

.change-description {
  color: var(--gray-600);
  font-size: 0.875rem;
}

.change-impact {
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.change-impact.positive {
  background: var(--success-color);
  color: white;
}

.change-impact.negative {
  background: var(--error-color);
  color: white;
}

.change-impact.neutral {
  background: var(--warning-color);
  color: white;
}

.comparison-charts {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.comparison-charts h4 {
  margin-bottom: 1.5rem;
  color: var(--gray-800);
}

.chart-container {
  margin-bottom: 2rem;
}

.chart-container:last-child {
  margin-bottom: 0;
}

.no-data-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-muted);
}

.no-data-content h4 {
  margin: 1rem 0 0.5rem;
  color: var(--gray-700);
}

@media (max-width: 768px) {
  .multi-session-comparison {
    padding: 1rem 0.5rem;
  }

  .comparison-title {
    font-size: 1.5rem;
  }

  .session-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .session-list {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .change-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .session-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
