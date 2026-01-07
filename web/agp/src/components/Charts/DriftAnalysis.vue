<template>
  <div class="drift-analysis-section">
    <div class="drift-header">
      <h3 class="drift-title">
        <span class="drift-icon">🌊</span>
        Drift Analysis
      </h3>
      <p class="drift-subtitle">
        Analyze drift patterns and telescope stability over time
      </p>
    </div>

    <!-- Drift Statistics -->
    <div v-if="driftAnalysis && driftAnalysis.driftVectors.length > 0" class="drift-statistics">
      <div class="drift-stats-grid">
        <div class="drift-stat-card">
          <div class="stat-label">Average Drift Rate</div>
          <div class="stat-value">{{ formatDriftRate(driftAnalysis.averageDriftRate) }}</div>
          <div class="stat-unit">arcsec/min</div>
        </div>

        <div class="drift-stat-card">
          <div class="stat-label">Max Drift Rate</div>
          <div class="stat-value">{{ formatDriftRate(driftAnalysis.maxDriftRate) }}</div>
          <div class="stat-unit">arcsec/min</div>
        </div>

        <div class="drift-stat-card">
          <div class="stat-label">Dominant Direction</div>
          <div class="stat-value">{{ formatDirection(driftAnalysis.dominantDirection) }}</div>
          <div class="stat-unit">{{ getDirectionName(driftAnalysis.dominantDirection) }}</div>
        </div>

        <div class="drift-stat-card">
          <div class="stat-label">Stability</div>
          <div class="stat-value">{{ (driftAnalysis.driftStability * 100).toFixed(1) }}</div>
          <div class="stat-unit">% variation</div>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else class="no-drift-data">
      <div class="no-data-content">
        <span class="no-data-icon">📊</span>
        <h4>Insufficient Data for Drift Analysis</h4>
        <p>Need at least 2 guiding frames to calculate drift rates.</p>
      </div>
    </div>

    <!-- Backlash Events -->
    <div v-if="backlashEvents && backlashEvents.length > 0" class="backlash-section">
      <div class="backlash-header">
        <h4 class="backlash-title">
          <span class="backlash-icon">⚠️</span>
          Detected Backlash Events
        </h4>
        <span class="event-count">{{ backlashEvents.length }} event{{ backlashEvents.length !== 1 ? 's' : '' }}</span>
      </div>

      <div class="backlash-events">
        <div v-for="event in backlashEvents.slice(0, 5)" :key="event.timestamp.toString() + event.magnitude" class="backlash-event">
          <div class="event-time">{{ formatTime(event.timestamp) }}</div>
          <div class="event-details">
            <span class="event-direction">{{ event.directionChange }}</span>
            <span class="event-magnitude">{{ event.magnitude.toFixed(2) }}″ jump</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Drift Charts -->
    <div v-if="driftAnalysis && driftAnalysis.driftVectors.length > 0" class="drift-charts">
      <LineChartComponent
        title="Drift Rate Over Time"
        :chartData="driftRateChartData"
        :chartOptions="driftRateChartOptions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { GuidingSession } from '@/store/modules/PHD/PHD.types';
import { ASIAIRLog } from '@/store/modules/ASIAIR/ASIAIR.types';
import LineChartComponent from './LineChartComponent.vue';
import { analyzeDrift, detectBacklashEvents, type DriftAnalysis, type BacklashEvent } from '@/utilities/computations';

interface Props {
  guidingSession: GuidingSession;
  asiairLog?: ASIAIRLog;
  pixelScale: number;
}

const props = defineProps<Props>();

// Computed drift analysis
const driftAnalysis = computed((): DriftAnalysis | null => {
  if (!props.guidingSession?.guidingFrames || props.guidingSession.guidingFrames.length < 2) {
    return null;
  }

  return analyzeDrift(props.guidingSession.guidingFrames, props.pixelScale, []);
});

// Computed backlash events
const backlashEvents = computed((): BacklashEvent[] => {
  if (!props.guidingSession?.guidingFrames) {
    return [];
  }
  const events = detectBacklashEvents(props.guidingSession.guidingFrames, props.pixelScale);
  return events.map(event => ({
    ...event,
    timestamp: event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp)
  }));
});

// Chart data for drift rate over time
const driftRateChartData = computed(() => {
  if (!driftAnalysis.value) return { datasets: [] };

  const vectors = driftAnalysis.value.driftVectors;
  const labels = vectors.map(v => v.timestamp.toLocaleTimeString());
  const driftRates = vectors.map(v => v.driftRate);

  return {
    labels,
    datasets: [{
      label: 'Drift Rate (arcsec/min)',
      data: driftRates,
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.1)',
      borderWidth: 2,
      fill: false,
      pointRadius: 1,
      pointHoverRadius: 3
    }]
  };
});

const driftRateChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Drift Rate (arcsec/min)'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Time'
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
function formatDriftRate(rate: number): string {
  return rate.toFixed(2);
}

function formatDirection(degrees: number): string {
  return degrees.toFixed(0) + '°';
}

function getDirectionName(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function formatTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString();
}
</script>

<style scoped>
.drift-analysis-section {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.drift-header {
  margin-bottom: 1.5rem;
}

.drift-title {
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  color: var(--gray-800);
}

.drift-subtitle {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.drift-statistics {
  margin-bottom: 1.5rem;
}

.drift-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.drift-stat-card {
  background: var(--gray-50);
  border-radius: var(--border-radius);
  padding: 1rem;
  text-align: center;
  border: 1px solid var(--gray-200);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.125rem;
}

.stat-unit {
  font-size: 0.75rem;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.no-drift-data {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

.no-data-content h4 {
  margin: 1rem 0 0.5rem;
  color: var(--gray-700);
}

.backlash-section {
  background: var(--warning-light);
  border: 1px solid var(--warning-color);
  border-radius: var(--border-radius);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.backlash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.backlash-title {
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--gray-800);
}

.event-count {
  background: var(--warning-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.backlash-events {
  max-height: 200px;
  overflow-y: auto;
}

.backlash-event {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: var(--border-radius-sm);
  margin-bottom: 0.5rem;
  border: 1px solid var(--gray-200);
}

.event-time {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--gray-700);
  font-weight: 500;
}

.event-details {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.event-direction {
  background: var(--error-color);
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: var(--border-radius-sm);
  font-weight: 600;
  font-size: 0.75rem;
}

.event-magnitude {
  color: var(--gray-800);
  font-weight: 500;
}

.drift-charts {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .drift-charts {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .drift-stats-grid {
    grid-template-columns: 1fr;
  }

  .backlash-event {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .event-details {
    flex-wrap: wrap;
  }
}
</style>
