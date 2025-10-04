<template>
  <div class="autofocus-timeline-container">
    <div class="timeline-header">
      <h3 class="timeline-title">
        <span class="timeline-icon">🔍</span>
        Autofocus Events
      </h3>
      <p class="timeline-subtitle">
        Focus position changes and temperature correlation throughout the session
      </p>
    </div>

    <div v-if="!hasAutofocusData" class="no-data-message">
      <div class="no-data-icon">🔍</div>
      <h4>No Autofocus Data</h4>
      <p>Autofocus events are recorded in ASIAIR logs when automatic focusing is performed.</p>
    </div>

    <div v-else class="timeline-content">
      <!-- Focus Position Chart -->
      <div class="chart-section">
        <h4 class="section-title">Focus Position Over Time</h4>
        <div class="chart-wrapper">
          <canvas
            ref="focusChartCanvas"
            class="chart-canvas"
          ></canvas>
        </div>
      </div>

      <!-- Events Timeline -->
      <div class="events-section">
        <h4 class="section-title">Autofocus Events ({{ autoFocusEvents.length }})</h4>
        <div class="events-timeline">
          <div 
            v-for="(event, index) in autoFocusEvents" 
            :key="index"
            class="timeline-event"
          >
            <div class="event-marker">
              <div class="marker-dot"></div>
              <div v-if="index < autoFocusEvents.length - 1" class="marker-line"></div>
            </div>
            
            <div class="event-content">
              <div class="event-header">
                <div class="event-time">
                  {{ formatTime(event.startTime) }}
                </div>
                <div class="event-badge" :class="getEventBadgeClass(event)">
                  {{ getEventStatus(event) }}
                </div>
              </div>
              
              <div class="event-details">
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Focus Position:</span>
                    <span class="detail-value">{{ event.focusPosition > 0 ? event.focusPosition : 'Failed' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Temperature:</span>
                    <span class="detail-value">{{ event.temperature.toFixed(1) }}°C</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">V-Curve Points:</span>
                    <span class="detail-value">{{ event.vCurveMeasurements?.length || 0 }}</span>
                  </div>
                  <div v-if="event.focusPosition > 0" class="detail-item">
                    <span class="detail-label">Position Change:</span>
                    <span class="detail-value" :class="getPositionChangeClass(event, index)">
                      {{ getPositionChange(event, index) }}
                    </span>
                  </div>
                </div>
                
                <!-- V-Curve Quality Indicator -->
                <div v-if="event.vCurveMeasurements && event.vCurveMeasurements.length > 0" class="vcurve-quality">
                  <span class="quality-label">V-Curve Quality:</span>
                  <div class="quality-indicator" :class="getVCurveQualityClass(event)">
                    {{ getVCurveQuality(event) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon">📊</span>
              <span class="stat-label">Total Events</span>
            </div>
            <div class="stat-value">{{ autoFocusEvents.length }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon">✅</span>
              <span class="stat-label">Successful</span>
            </div>
            <div class="stat-value">{{ successfulEvents }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon">🎯</span>
              <span class="stat-label">Avg Focus Position</span>
            </div>
            <div class="stat-value">{{ averageFocusPosition.toFixed(0) }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon">📏</span>
              <span class="stat-label">Focus Range</span>
            </div>
            <div class="stat-value">{{ focusRange }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon">⏱️</span>
              <span class="stat-label">Frequency</span>
            </div>
            <div class="stat-value">{{ focusFrequency }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-moment';

Chart.register(...registerables);

interface AutoFocusEvent {
  startTime: Date;
  endTime: Date;
  focusPosition: number;
  temperature: number;
  vCurveMeasurements?: Array<{
    datetime: Date;
    starSize: number;
    eafPosition: number;
  }>;
}

interface Props {
  autoFocusEvents: AutoFocusEvent[];
}

const props = defineProps<Props>();

const focusChartCanvas = ref<HTMLCanvasElement | null>(null);
const focusChart = ref<Chart | null>(null);

// Computed properties
const hasAutofocusData = computed(() => {
  return props.autoFocusEvents && props.autoFocusEvents.length > 0;
});

const successfulEvents = computed(() => {
  return props.autoFocusEvents.filter(event => event.focusPosition > 0).length;
});

const averageFocusPosition = computed(() => {
  const successful = props.autoFocusEvents.filter(event => event.focusPosition > 0);
  if (successful.length === 0) return 0;
  const sum = successful.reduce((acc, event) => acc + event.focusPosition, 0);
  return sum / successful.length;
});

const focusRange = computed(() => {
  const positions = props.autoFocusEvents
    .filter(event => event.focusPosition > 0)
    .map(event => event.focusPosition);
  
  if (positions.length === 0) return 'N/A';
  
  const min = Math.min(...positions);
  const max = Math.max(...positions);
  return `${max - min}`;
});

const focusFrequency = computed(() => {
  if (props.autoFocusEvents.length < 2) return 'N/A';
  
  const firstEvent = props.autoFocusEvents[0];
  const lastEvent = props.autoFocusEvents[props.autoFocusEvents.length - 1];
  
  // Ensure dates are properly converted
  const firstTime = firstEvent.startTime instanceof Date ? firstEvent.startTime : new Date(firstEvent.startTime);
  const lastTime = lastEvent.startTime instanceof Date ? lastEvent.startTime : new Date(lastEvent.startTime);
  const totalHours = (lastTime.getTime() - firstTime.getTime()) / (1000 * 60 * 60);
  
  if (totalHours < 1) return `${props.autoFocusEvents.length} events`;
  
  const frequency = totalHours / props.autoFocusEvents.length;
  return `Every ${frequency.toFixed(1)}h`;
});

const focusChartData = computed(() => {
  return props.autoFocusEvents
    .filter(event => event.focusPosition > 0)
    .map(event => {
      // Ensure startTime is a proper Date object
      const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
      return {
        x: startTime.getTime(),
        y: event.focusPosition
      };
    })
    .sort((a, b) => a.x - b.x);
});

// Methods
const formatTime = (date: Date | string | number) => {
  // Ensure we have a proper Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

const getEventStatus = (event: AutoFocusEvent) => {
  return event.focusPosition > 0 ? 'Success' : 'Failed';
};

const getEventBadgeClass = (event: AutoFocusEvent) => {
  return event.focusPosition > 0 ? 'badge-success' : 'badge-error';
};

const getPositionChange = (event: AutoFocusEvent, index: number) => {
  if (index === 0) return 'Initial Position';
  if (event.focusPosition <= 0) return 'N/A';
  
  const previousEvent = props.autoFocusEvents[index - 1];
  if (previousEvent.focusPosition <= 0) return 'N/A';
  
  const change = event.focusPosition - previousEvent.focusPosition;
  return change > 0 ? `+${change}` : `${change}`;
};

const getPositionChangeClass = (event: AutoFocusEvent, index: number) => {
  if (index === 0) return 'initial-position';
  if (event.focusPosition <= 0) return '';
  
  const previousEvent = props.autoFocusEvents[index - 1];
  if (previousEvent.focusPosition <= 0) return '';
  
  const change = event.focusPosition - previousEvent.focusPosition;
  if (Math.abs(change) < 10) return 'minimal-change';
  return change > 0 ? 'positive-change' : 'negative-change';
};

const getVCurveQuality = (event: AutoFocusEvent) => {
  if (!event.vCurveMeasurements || event.vCurveMeasurements.length === 0) {
    return 'Unknown';
  }
  
  const measurements = event.vCurveMeasurements;
  if (measurements.length < 5) return 'Poor';
  if (measurements.length < 7) return 'Fair';
  if (measurements.length < 9) return 'Good';
  return 'Excellent';
};

const getVCurveQualityClass = (event: AutoFocusEvent) => {
  const quality = getVCurveQuality(event);
  switch (quality) {
    case 'Excellent': return 'quality-excellent';
    case 'Good': return 'quality-good';
    case 'Fair': return 'quality-fair';
    case 'Poor': return 'quality-poor';
    default: return 'quality-unknown';
  }
};

// Chart creation
const createFocusChart = () => {
  if (!focusChartCanvas.value || !hasAutofocusData.value) return;

  const ctx = focusChartCanvas.value.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart
  if (focusChart.value) {
    focusChart.value.destroy();
  }

  focusChart.value = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Focus Position',
        data: focusChartData.value,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.1,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 8,
        pointHoverRadius: 10,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#374151',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: function(context) {
              const date = new Date(context[0].parsed.x);
              return date.toLocaleString();
            },
            label: function(context) {
              return `Focus Position: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'hour',
            displayFormats: {
              hour: 'HH:mm'
            }
          },
          title: {
            display: true,
            text: 'Time',
            color: '#6b7280',
            font: {
              size: 12,
              weight: '500'
            }
          },
          grid: {
            color: 'rgba(229, 231, 235, 0.5)',
            drawBorder: false
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 11
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Focus Position',
            color: '#6b7280',
            font: {
              size: 12,
              weight: '500'
            }
          },
          grid: {
            color: 'rgba(229, 231, 235, 0.5)',
            drawBorder: false
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 11
            }
          }
        }
      }
    }
  });
};

// Watchers and lifecycle
watch(() => props.autoFocusEvents, () => {
  nextTick(() => {
    createFocusChart();
  });
});

onMounted(() => {
  createFocusChart();
});

// Cleanup
import { onBeforeUnmount } from 'vue';
onBeforeUnmount(() => {
  if (focusChart.value) {
    focusChart.value.destroy();
  }
});
</script>

<style scoped>
.autofocus-timeline-container {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  max-width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.timeline-header {
  margin-bottom: 20px;
}

.timeline-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.timeline-icon {
  font-size: 24px;
}

.timeline-subtitle {
  color: var(--text-muted);
  font-size: 14px;
  margin: 0;
}

.no-data-message {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.no-data-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-data-message h4 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.no-data-message p {
  font-size: 14px;
  margin: 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.chart-section {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 16px 0;
}

.chart-wrapper {
  height: 200px;
  max-width: 100%;
  flex-shrink: 0;
  overflow: hidden;
}

.chart-canvas {
  height: 100% !important;
  width: 100% !important;
  display: block;
}

.events-section {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

.events-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-event {
  display: flex;
  gap: 16px;
  position: relative;
}

.event-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary-color);
  border: 2px solid var(--card-bg);
  box-shadow: 0 0 0 2px var(--primary-color);
  flex-shrink: 0;
}

.marker-line {
  width: 2px;
  height: 100%;
  background: var(--border-color);
  margin-top: 8px;
  min-height: 60px;
}

.event-content {
  flex: 1;
  padding-bottom: 24px;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.event-time {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.event-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-success {
  background: rgba(72, 187, 120, 0.1);
  color: #38a169;
}

.badge-error {
  background: rgba(245, 101, 101, 0.1);
  color: #e53e3e;
}

.event-details {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.detail-label {
  color: var(--text-muted);
  font-weight: 500;
}

.detail-value {
  color: var(--text-color);
  font-weight: 600;
}

.positive-change {
  color: #38a169;
}

.negative-change {
  color: #e53e3e;
}

.minimal-change {
  color: var(--text-muted);
}

.initial-position {
  color: #6366f1;
  font-style: italic;
}

.vcurve-quality {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.quality-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}

.quality-indicator {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quality-excellent {
  background: rgba(72, 187, 120, 0.1);
  color: #38a169;
}

.quality-good {
  background: rgba(56, 178, 172, 0.1);
  color: #319795;
}

.quality-fair {
  background: rgba(237, 137, 54, 0.1);
  color: #d69e2e;
}

.quality-poor {
  background: rgba(245, 101, 101, 0.1);
  color: #e53e3e;
}

.quality-unknown {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.stats-section {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 8px;
}

.stat-icon {
  font-size: 16px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color);
}

@media (max-width: 768px) {
  .autofocus-timeline-container {
    padding: 16px;
  }
  
  .chart-section,
  .events-section,
  .stats-section {
    padding: 16px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .event-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
