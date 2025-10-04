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
      :selectScaleOptions="selectScaleOptions"
      :dataPointsCount="dataPointsCount"
      :sampledPointsCount="sampledData.length"
      @scale-changed="scaleChanged"
    />

    <!-- Statistics Dashboard -->
    <ChartStatistics
      :rmsStats="rmsStats"
      :maxError="maxError"
      :sessionDuration="sessionDuration"
      :dataPointsCount="dataPointsCount"
      :pixelScale="sessionPixelScale"
      :selectedScale="selectedScale"
      :perfectDataPercentage="perfectDataPercentage"
      :goodDataPercentage="goodDataPercentage"
    />

    <!-- Frame Deletion Recommendations -->
    <FrameRecommendations
      :guidingSession="selectedGuidingSession"
      :asiairLog="asiairLog"
      :binning="selectedGuidingSession.binning || 1"
    />

    <!-- Charts Section -->
    <div class="charts-section">
      <!-- Time Series Chart -->
      <LineChartComponent
        title="Guiding Performance Over Time"
        :chartData="chartData"
        :chartOptions="chartDataOptions"
      />

      <!-- Scatter Plot -->
      <ScatterChartComponent
        title="RA vs Dec Error Distribution"
        :chartData="scatterChartData"
        :chartOptions="scatterChartDataOptions"
      />

      <!-- Special Chart (if available) -->
      <div v-if="canShowMagic" class="cdf-chart-section">
        <LineChartComponent
          title="Cumulative Distribution Function"
          :chartData="specialChartData"
          :chartOptions="specialChartDataOptions"
        />
        <div class="chart-note">
          <div class="note-content">
            <span class="note-icon">ℹ️</span>
            <div class="note-text">
              <strong>Data Filtering:</strong> This CDF chart focuses on errors &lt; 2″ for better visualization of relevant data points. 
              Larger outliers are included in the statistical calculations but not displayed in this chart to maintain readability 
              of the critical performance range.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, toRef } from 'vue';
import { GuidingSession, GuidingFrame } from '../store/modules/PHD/PHD.types';
import { useEquipmentStore, useASIAIRStore } from '../store';
import { EquipmentGetterTypes } from '../store/modules/Equipment/Equipment.getters';
import { ASIAIRGetterTypes } from '../store/modules/ASIAIR/ASIAIR.getters';
import ChartControls from './Charts/ChartControls.vue';
import ChartStatistics from './Charts/ChartStatistics.vue';
import LineChartComponent from './Charts/LineChartComponent.vue';
import ScatterChartComponent from './Charts/ScatterChartComponent.vue';
import FrameRecommendations from './FrameRecommendations.vue';
import { calculateRMSStats, calculateMaxError, calculateSessionDuration, sampleData } from '../utilities/computations';

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

// Equipment store for pixel scale and equipment calculations
const equipmentStore = useEquipmentStore();
const asiairStore = useASIAIRStore();

// Get pixel scale from active equipment profile
const activePixelScale = computed(() => {
  return equipmentStore.getters(EquipmentGetterTypes.ACTIVE_PIXEL_SCALE) ?? 0.970; // Default fallback for ASI 2600 MM Pro + 800mm
});

// Get ASIAIR log for actual exposure data
const asiairLog = computed(() => {
  return asiairStore.getters(ASIAIRGetterTypes.GET_ASIAIR_LOG);
});

// Refs
// Reactive data
const selectedScale = ref('Arc-secs/pixel');

// Scale options
const selectScaleOptions = [
  { id: 0, value: 'Pixels' },
  { id: 1, value: 'Arc-secs/pixel' },
  { id: 2, value: 'Arc-secs/pixel RMS (50 sec window)' }
];

// Computed properties for data processing
const sessionPixelScale = computed(() => {
  return selectedGuidingSession.value?.pixelScale || null;
});

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
  return sampleData(data, maxPoints);
});

// Chart data computations
const chartData = computed(() => {
  const data = sampledData.value;
  if (!data || data.length === 0) return { datasets: [] };

  const labels = data.map((d: ProcessedDataPoint) => new Date(d.timestamp).toLocaleTimeString());

  const datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    borderWidth: number;
    tension: number;
    pointRadius: number;
    pointHoverRadius?: number;
  }> = [
    {
      label: 'RA Error',
      data: data.map((d: ProcessedDataPoint) => d.x),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: data.length > 5000 ? 1 : 1.5,
      pointRadius: data.length > 1000 ? 0 : 2,
      tension: 0.1
    },
    {
      label: 'Dec Error',
      data: data.map((d: ProcessedDataPoint) => d.y),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: data.length > 5000 ? 1 : 1.5,
      pointRadius: data.length > 1000 ? 0 : 2,
      tension: 0.1
    }
  ];

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

  // Filter errors to focus on 0-2 range for better visualization
  const allErrors = data.map((d: ProcessedDataPoint) => d.totalXY).sort((a: number, b: number) => a - b);
  const maxRelevantError = Math.min(2.0, Math.max(...allErrors));
  const relevantErrors = allErrors.filter((error: number) => error <= maxRelevantError);

  const cdfData = relevantErrors.map((error: number) => ({
    x: error,
    y: (allErrors.findIndex((e: number) => e > error) === -1 ? allErrors.length : allErrors.findIndex((e: number) => e > error)) / allErrors.length * 100
  }));

  // Calculate thresholds using active equipment profile
  const pixelScale = activePixelScale.value; // arcsec/pixel from Equipment store
  const perfectThreshold = 0.5 * pixelScale; // 0.5 pixels tolerance
  const goodThreshold = 1.0 * pixelScale; // 1.0 pixels tolerance

  // Find percentages at thresholds
  const perfectPercentage = allErrors.filter((e: number) => e <= perfectThreshold).length / allErrors.length * 100;
  const goodPercentage = allErrors.filter((e: number) => e <= goodThreshold).length / allErrors.length * 100;

  const datasets: Array<{
    label: string;
    data: Array<{x: number; y: number}>;
    borderColor: string;
    backgroundColor: string;
    borderWidth: number;
    pointRadius: number;
    tension: number;
    fill: boolean;
  }> = [{
    label: 'Cumulative Distribution',
    data: cdfData,
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    pointRadius: 0,
    tension: 0,
    fill: true
  }];

  // Add threshold lines only if they're within the visible range
  if (perfectThreshold <= maxRelevantError) {
    datasets.push({
      label: `Perfect Threshold (${perfectThreshold.toFixed(3)}")`,
      data: [
        { x: perfectThreshold, y: 0 },
        { x: perfectThreshold, y: perfectPercentage }
      ],
      borderColor: '#dc2626',
      backgroundColor: '#dc2626',
      borderWidth: 2,
      borderDash: [5, 5] as number[],
      pointRadius: 0,
      tension: 0,
      fill: false
    } as any);
  }

  if (goodThreshold <= maxRelevantError) {
    datasets.push({
      label: `Good Threshold (${goodThreshold.toFixed(3)}")`,
      data: [
        { x: goodThreshold, y: 0 },
        { x: goodThreshold, y: goodPercentage }
      ],
      borderColor: '#16a34a',
      backgroundColor: '#16a34a',
      borderWidth: 2,
      borderDash: [5, 5] as number[],
      pointRadius: 0,
      tension: 0,
      fill: false
    } as any);
  }

  return { datasets };
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
      },
      min: 0,
      max: 2.0, // Focus on 0-2 error range for better visibility
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    },
    y: {
      title: {
        display: true,
        text: 'Cumulative Percentage (%)'
      },
      min: 0,
      max: 100,
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: 'var(--text-color)',
        usePointStyle: true,
        padding: 20
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1
    }
  }
}));

// Statistics computations
const rmsStats = computed(() => {
  const data = scaledData.value;
  return calculateRMSStats(data);
});

const maxError = computed(() => {
  const data = scaledData.value;
  return calculateMaxError(data);
});

const dataPointsCount = computed(() => scaledData.value?.length || 0);

// Perfect data: within 0.5 pixels (very tight tolerance)
const perfectDataPercentage = computed(() => {
  const data = scaledData.value;
  if (!data || data.length === 0) return 0;

  const pixelScale = activePixelScale.value; // arcsec/pixel from Equipment store
  const perfectThreshold = 0.5 * pixelScale; // 0.5 pixels tolerance

  const pointsWithinThreshold = data.filter((point: ProcessedDataPoint) =>
    point.totalXY <= perfectThreshold
  ).length;

  return (pointsWithinThreshold / data.length) * 100;
});

// Good data: within 1.0 pixels (practical tolerance)
const goodDataPercentage = computed(() => {
  const data = scaledData.value;
  if (!data || data.length === 0) return 0;

  const pixelScale = activePixelScale.value; // arcsec/pixel from Equipment store
  const goodThreshold = 1.0 * pixelScale; // 1.0 pixels tolerance

  const pointsWithinThreshold = data.filter((point: ProcessedDataPoint) =>
    point.totalXY <= goodThreshold
  ).length;

  return (pointsWithinThreshold / data.length) * 100;
});

const sessionDuration = computed(() => {
  const data = scaledData.value;
  if (!data || data.length < 2) return 0;
  
  const timestamps = data.map((d: ProcessedDataPoint) => d.timestamp);
  return calculateSessionDuration(timestamps);
});

const canShowMagic = computed(() => {
  // CDF only makes sense when viewing in arc-seconds, not pixels
  const isArcsecondScale = selectedScale.value === 'Arc-secs/pixel' || selectedScale.value === 'Arc-secs/pixel RMS (50 sec window)';
  return scaledData.value && scaledData.value.length > 10 && isArcsecondScale;
});

// Methods
const scaleChanged = (newScale: string) => {
  selectedScale.value = newScale;
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

.cdf-chart-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-note {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-top: -8px;
}

.note-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.note-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.note-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color);
}

.note-text strong {
  color: var(--primary-color);
  font-weight: 600;
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

  .chart-note {
    padding: 12px;
  }

  .note-content {
    flex-direction: column;
    gap: 8px;
  }

  .note-text {
    font-size: 13px;
  }
}
</style>
