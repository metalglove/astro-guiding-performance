<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <div class="chart-actions">
        <button @click="resetZoom" class="action-btn" title="Reset Zoom">
          <span class="btn-icon">🔍</span>
          Reset
        </button>
        <button @click="downloadChart" class="action-btn" title="Download Chart">
          <span class="btn-icon">📥</span>
          Download
        </button>
      </div>
    </div>
    
    <div class="chart-wrapper">
      <LineChart
        ref="chartRef"
        :chartData="chartData"
        :options="chartOptions"
        :plugins="[]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { LineChart } from 'vue-chart-3';

interface Props {
  title: string;
  chartData: any;
  chartOptions: any;
}

const props = defineProps<Props>();

const emit = defineEmits(['reset-zoom', 'download-chart']);

const chartRef = ref();

const resetZoom = () => {
  emit('reset-zoom');
  
  if (chartRef.value?.chartInstance) {
    chartRef.value.chartInstance.resetZoom();
  }
};

const downloadChart = () => {
  emit('download-chart');
  
  if (chartRef.value?.chartInstance) {
    try {
      const link = document.createElement('a');
      link.download = `${props.title.toLowerCase().replace(/\s+/g, '-')}-chart.png`;
      link.href = chartRef.value.chartInstance.toBase64Image();
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    }
  }
};
</script>

<style scoped>
.chart-container {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-color);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 14px;
}

.chart-wrapper {
  position: relative;
  height: 400px;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .chart-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .chart-wrapper {
    height: 300px;
  }
}
</style>
