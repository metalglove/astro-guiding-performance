<template>
  <div class="temperature-chart-container">
    <div class="chart-header">
      <h3 class="chart-title">
        <span class="chart-icon">🌡️</span>
        Temperature Monitor
      </h3>
      <p class="chart-subtitle">
        Camera temperature during autofocus events
      </p>
    </div>

    <div v-if="!hasData" class="no-data-message">
      <div class="no-data-icon">🌡️</div>
      <h4>No Temperature Data</h4>
      <p>Temperature information is recorded during autofocus events in ASIAIR logs.</p>
    </div>

    <div v-else class="chart-wrapper">
      <div class="chart-container">
        <canvas
          ref="chartCanvas"
          class="chart-canvas"
        ></canvas>
      </div>

      <!-- Temperature Statistics -->
      <div class="temperature-stats">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">🌡️</span>
            <span class="stat-label">Average</span>
          </div>
          <div class="stat-value">{{ avgTemp }}°C</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">🔻</span>
            <span class="stat-label">Minimum</span>
          </div>
          <div class="stat-value">{{ minTemp }}°C</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">🔺</span>
            <span class="stat-label">Maximum</span>
          </div>
          <div class="stat-value">{{ maxTemp }}°C</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">📊</span>
            <span class="stat-label">Events</span>
          </div>
          <div class="stat-value">{{ eventCount }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watchEffect } from 'vue';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-moment';

Chart.register(...registerables);

interface AutoFocusEvent {
  startTime: Date | string;
  temperature: number;
  focusPosition: number;
}

interface Props {
  autoFocusEvents: AutoFocusEvent[];
}

const props = defineProps<Props>();
const chartCanvas = ref<HTMLCanvasElement | null>(null);

// Simple reactive data
const hasData = ref(false);
const avgTemp = ref('0.0');
const minTemp = ref('0.0');
const maxTemp = ref('0.0');
const eventCount = ref(0);

let chartInstance: Chart | null = null;

const processData = () => {
  if (!props.autoFocusEvents?.length) {
    hasData.value = false;
    avgTemp.value = '0.0';
    minTemp.value = '0.0';
    maxTemp.value = '0.0';
    eventCount.value = 0;
    return [];
  }

  const validEvents = props.autoFocusEvents.filter(event => {
    return typeof event.temperature === 'number' && 
           !isNaN(event.temperature) && 
           event.startTime != null;
  });

  if (validEvents.length === 0) {
    hasData.value = false;
    return [];
  }

  hasData.value = true;
  eventCount.value = validEvents.length;

  const temps = validEvents.map(e => e.temperature);
  const sum = temps.reduce((acc, temp) => acc + temp, 0);
  avgTemp.value = (sum / temps.length).toFixed(1);
  minTemp.value = Math.min(...temps).toFixed(1);
  maxTemp.value = Math.max(...temps).toFixed(1);

  return validEvents.map(event => {
    const date = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
    return {
      x: date.getTime(),
      y: event.temperature
    };
  }).sort((a, b) => a.x - b.x);
};

const createChart = () => {
  if (!chartCanvas.value) return;

  const chartData = processData();
  if (!hasData.value) {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  const ctx = chartCanvas.value.getContext('2d');
  if (!ctx) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  // Set fixed canvas size
  const container = chartCanvas.value.parentElement;
  if (container) {
    chartCanvas.value.width = container.clientWidth;
    chartCanvas.value.height = 300;
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Temperature (°C)',
        data: chartData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
        pointRadius: 4,
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (context) => {
              const date = new Date(context[0].parsed.x);
              return date.toLocaleString();
            },
            label: (context) => `Temperature: ${context.parsed.y.toFixed(1)}°C`
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'hour',
            displayFormats: { hour: 'HH:mm' }
          },
          title: { display: true, text: 'Time' }
        },
        y: {
          title: { display: true, text: 'Temperature (°C)' },
          ticks: {
            callback: (value) => `${value}°C`
          }
        }
      }
    }
  });
};

// Use watchEffect instead of watch for simpler reactivity
watchEffect(() => {
  if (props.autoFocusEvents) {
    createChart();
  }
});

onMounted(() => {
  createChart();
});

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});
</script>

<style scoped>
.temperature-chart-container {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  max-width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.chart-header {
  margin-bottom: 20px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.chart-icon {
  font-size: 24px;
}

.chart-subtitle {
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

.chart-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 100%;
}

.chart-container {
  width: 100%;
  height: 300px;
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.chart-canvas {
  display: block;
  width: 100% !important;
  height: 300px !important;
}

.temperature-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 12px;
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
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
}

@media (max-width: 768px) {
  .temperature-chart-container {
    padding: 16px;
  }
  
  .chart-canvas {
    height: 250px;
  }
  
  .temperature-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .temperature-stats {
    grid-template-columns: 1fr;
  }
}
</style>
