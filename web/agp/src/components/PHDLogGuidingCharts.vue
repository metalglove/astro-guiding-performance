<template>
  <div class="guiding-charts">
    <div class="charts-header">
      <h2 class="charts-title">
        <span class="charts-icon">📈</span>
        Guiding Performance Charts
      </h2>
      <p class="charts-subtitle">
        Analyze your telescope's guiding accuracy with interactive charts and statistics
      </p>
    </div>

    <!-- Chart Controls -->
    <ChartControls
      :selectedScale="selectedScale"
      :selectedAxes="selectedAxes"
      :selectScaleOptions="selectScaleOptions"
      :selectAxesOptions="selectAxesOptions"
      :dataPointsCount="dataPointsCount"
      :sampledPointsCount="sampledData.length"
      @scale-changed="scaleChanged"
      @axes-changed="handleAxesChanged"
    />

    <!-- Statistics Dashboard -->
    <ChartStatistics
      :rmsStats="rmsStats"
      :maxError="maxError"
      :sessionDuration="sessionDuration"
      :dataPointsCount="dataPointsCount"
    />

    <!-- Charts Section -->
    <div class="charts-section">
      <!-- Time Series Chart -->
      <LineChartComponent
        title="Guiding Performance Over Time"
        :chartData="chartData"
        :chartOptions="chartDataOptions"
        @reset-zoom="resetZoom"
        @download-chart="() => downloadChart('timeseries')"
      />

      <!-- Scatter Plot -->
      <ScatterChartComponent
        title="RA vs Dec Error Distribution"
        :chartData="scatterChartData"
        :chartOptions="scatterChartDataOptions"
        @reset-zoom="resetZoom"
        @download-chart="() => downloadChart('scatter')"
      />

      <!-- Special Chart (if available) -->
      <LineChartComponent
        v-if="canShowMagic"
        title="Cumulative Distribution Function"
        :chartData="specialChartData"
        :chartOptions="specialChartDataOptions"
        @reset-zoom="resetZoom"
        @download-chart="() => downloadChart('cdf')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, toRef } from 'vue';
import { GuidingSession, GuidingFrame } from '../store/modules/PHD/PHD.types';
import ChartControls from './Charts/ChartControls.vue';
import ChartStatistics from './Charts/ChartStatistics.vue';
import LineChartComponent from './Charts/LineChartComponent.vue';
import ScatterChartComponent from './Charts/ScatterChartComponent.vue';

interface ProcessedDataPoint {
  x: number;
  y: number;
  timestamp: Date;
  totalXY: number;
  index: number;
  frame: number;
}

interface Props {
  selectedGuidingSession: GuidingSession;
}

const props = defineProps<Props>();

const selectedGuidingSession = toRef(props, 'selectedGuidingSession');

// Refs
const lineChartRef = ref();
const scatterChartRef = ref();
const specialLineChartRef = ref();

// Reactive data
const selectedScale = ref('Arc-secs/pixel');
const selectedAxes = ref({ title: 'Both Axes', code: 0 });

// Scale options
const selectScaleOptions = [
  { id: 0, value: 'Pixels' },
  { id: 1, value: 'Arc-secs/pixel' },
  { id: 2, value: 'Arc-secs/pixel RMS (50 sec window)' }
];

// Axes options
const selectAxesOptions = [
  { id: 1, value: { title: 'Both Axes', code: 0 } },
  { id: 2, value: { title: 'RA Axis', code: 1 } },
  { id: 3, value: { title: 'Dec Axis', code: 2 } }
];

// Computed properties for data processing
const scaledData = computed(() => {
  // Safety check - ensure selectedGuidingSession and guidingFrames exist
  if (!selectedGuidingSession.value || !selectedGuidingSession.value.guidingFrames) {
    return [];
  }
  
  const session = selectedGuidingSession.value;
  const frames = session.guidingFrames;
  const pixelScale = session.pixelScale;
  
  return frames.map((frame: GuidingFrame, index: number): ProcessedDataPoint => {
    let x = frame.dx; // camera axes
    let y = frame.dy; // camera axes
    
    // Apply scaling based on selected scale
    if (selectedScale.value === 'Arc-secs/pixel' && pixelScale) {
      x = x * pixelScale;
      y = y * pixelScale;
    } else if (selectedScale.value === 'Arc-secs/pixel RMS (50 sec window)') {
      // Implement RMS windowing here if needed
      if (pixelScale) {
        x = x * pixelScale;
        y = y * pixelScale;
      }
    }
    
    return {
      x,
      y,
      timestamp: frame.datetime,
      totalXY: Math.sqrt(x * x + y * y),
      index,
      frame: frame.frame
    };
  });
});

// Sample data for performance
const sampledData = computed((): ProcessedDataPoint[] => {
  const data = scaledData.value;
  if (!data || data.length === 0) return [];
  
  const maxPoints = 2000;
  if (data.length <= maxPoints) return data;
  
  const step = Math.floor(data.length / maxPoints);
  const sampled: ProcessedDataPoint[] = [];
  
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }
  
  // Always include the last point
  if (sampled.length > 0 && sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }
  
  return sampled;
});

// Chart data computations
const chartData = computed(() => {
  const data = sampledData.value;
  if (!data || data.length === 0) return { datasets: [] };
  
  const labels = data.map((d: ProcessedDataPoint) => new Date(d.timestamp).toLocaleTimeString());
  
  let datasets: any[] = [];
  
  if (selectedAxes.value.code === 0 || selectedAxes.value.code === 1) {
    datasets.push({
      label: 'RA Error',
      data: data.map((d: ProcessedDataPoint) => d.x),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: data.length > 5000 ? 1 : 1.5,
      pointRadius: data.length > 1000 ? 0 : 2,
      tension: 0.1
    });
  }
  
  if (selectedAxes.value.code === 0 || selectedAxes.value.code === 2) {
    datasets.push({
      label: 'Dec Error',
      data: data.map((d: ProcessedDataPoint) => d.y),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: data.length > 5000 ? 1 : 1.5,
      pointRadius: data.length > 1000 ? 0 : 2,
      tension: 0.1
    });
  }
  
  return { labels, datasets };
});

const chartDataOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'Time'
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: `Error (${selectedScale.value})`
      }
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    zoom: {
      zoom: {
        wheel: { enabled: true },
        pinch: { enabled: true },
        mode: 'xy'
      },
      pan: {
        enabled: true,
        mode: 'xy'
      }
    }
  }
}));

// Scatter chart data
const scatterChartData = computed(() => {
  const data = sampledData.value;
  if (!data || data.length === 0) return { datasets: [] };
  
  return {
    datasets: [{
      label: 'RA vs Dec Error',
      data: data.map((d: ProcessedDataPoint) => ({ x: d.x, y: d.y })),
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderColor: '#6366f1',
      pointRadius: data.length > 5000 ? 1 : 3,
      pointHoverRadius: 5
    }]
  };
});

const scatterChartDataOptions = computed(() => {
  const data = scaledData.value;
  if (!data || data.length === 0) return {};
  
  const maxX = Math.max(...data.map((d: ProcessedDataPoint) => Math.abs(d.x)));
  const maxY = Math.max(...data.map((d: ProcessedDataPoint) => Math.abs(d.y)));
  const maxVal = Math.max(maxX, maxY);
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: `RA Error (${selectedScale.value})`
        },
        min: -maxVal * 1.1,
        max: maxVal * 1.1
      },
      y: {
        title: {
          display: true,
          text: `Dec Error (${selectedScale.value})`
        },
        min: -maxVal * 1.1,
        max: maxVal * 1.1
      }
    },
    plugins: {
      legend: {
        display: false
      },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'xy'
        },
        pan: {
          enabled: true,
          mode: 'xy'
        }
      }
    }
  };
});

// Special chart (CDF) data
const specialChartData = computed(() => {
  const data = scaledData.value;
  if (!data || data.length === 0) return { datasets: [] };
  
  const errors = data.map((d: ProcessedDataPoint) => d.totalXY).sort((a: number, b: number) => a - b);
  const cdfData = errors.map((error: number, index: number) => ({
    x: error,
    y: (index + 1) / errors.length * 100
  }));
  
  return {
    datasets: [{
      label: 'Cumulative Distribution',
      data: cdfData,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0
    }]
  };
});

const specialChartDataOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: 'linear',
      title: {
        display: true,
        text: `Total Error (${selectedScale.value})`
      }
    },
    y: {
      title: {
        display: true,
        text: 'Cumulative Percentage (%)'
      },
      min: 0,
      max: 100
    }
  },
  plugins: {
    legend: {
      display: false
    }
  }
}));

// Statistics computations
const rmsStats = computed(() => {
  const data = scaledData.value;
  if (!data || data.length === 0) {
    return { total: 0, ra: 0, dec: 0 };
  }
  
  const raValues = data.map((d: ProcessedDataPoint) => d.x);
  const decValues = data.map((d: ProcessedDataPoint) => d.y);
  const totalValues = data.map((d: ProcessedDataPoint) => d.totalXY);
  
  const raRms = Math.sqrt(raValues.reduce((sum: number, val: number) => sum + val * val, 0) / raValues.length);
  const decRms = Math.sqrt(decValues.reduce((sum: number, val: number) => sum + val * val, 0) / decValues.length);
  const totalRms = Math.sqrt(totalValues.reduce((sum: number, val: number) => sum + val * val, 0) / totalValues.length);
  
  return {
    total: totalRms,
    ra: raRms,
    dec: decRms
  };
});

const maxError = computed(() => {
  const data = scaledData.value;
  if (!data || data.length === 0) return 0;
  
  return Math.max(...data.map((d: ProcessedDataPoint) => d.totalXY));
});

const dataPointsCount = computed(() => scaledData.value?.length || 0);

const sessionDuration = computed(() => {
  const data = scaledData.value;
  if (!data || data.length < 2) return 0;
  
  const startTime = new Date(data[0].timestamp).getTime();
  const endTime = new Date(data[data.length - 1].timestamp).getTime();
  
  return (endTime - startTime) / 1000; // Convert to seconds
});

const canShowMagic = computed(() => {
  return scaledData.value && scaledData.value.length > 10;
});

// Methods
const scaleChanged = (newScale: string) => {
  selectedScale.value = newScale;
};

const handleAxesChanged = (axes: any) => {
  selectedAxes.value = axes;
};

const resetZoom = () => {
  // Reset zoom functionality
  [lineChartRef, scatterChartRef, specialLineChartRef].forEach(ref => {
    if (ref.value?.chart) {
      ref.value.chart.resetZoom();
    }
  });
};

const downloadChart = (type: string) => {
  let chartRef;
  let filename;
  
  switch (type) {
    case 'timeseries':
      chartRef = lineChartRef;
      filename = 'guiding-timeseries.png';
      break;
    case 'scatter':
      chartRef = scatterChartRef;
      filename = 'guiding-scatter.png';
      break;
    case 'cdf':
      chartRef = specialLineChartRef;
      filename = 'guiding-cdf.png';
      break;
    default:
      return;
  }
  
  if (chartRef.value?.chart) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = chartRef.value.chart.toBase64Image();
    link.click();
  }
};

onMounted(() => {
  // Component mounted logic if needed
});
</script>

<style scoped>
.guiding-charts {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.charts-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 24px 0;
}

.charts-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 32px;
  font-weight: 800;
  color: var(--text-color);
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.charts-icon {
  font-size: 36px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.charts-subtitle {
  font-size: 16px;
  color: var(--text-muted);
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.charts-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (max-width: 768px) {
  .guiding-charts {
    padding: 0 12px;
  }
  
  .charts-title {
    font-size: 24px;
    flex-direction: column;
    gap: 8px;
  }
  
  .charts-icon {
    font-size: 28px;
  }
  
  .charts-subtitle {
    font-size: 14px;
  }
}
</style>
