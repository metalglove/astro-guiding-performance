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
      @axes-changed="(axes) => selectedAxes = axes"
    />

    <!-- Statistics Dashboard -->
    <ChartStatistics
      :rmsStats="rmsStats"
      :maxError="maxError"
      :sessionDuration="sessionDuration"
      :dataPointsCount="dataPointsCount"
    />
      <div class="controls-grid">
        <div class="control-group">
          <label class="control-label">
            <span class="label-icon">📏</span>
            Scale
          </label>
          <div class="select-wrapper">
            <select v-model="selectedScale" @change="scaleChanged" class="control-select">
              <option v-for="option in selectScaleOptions" :key="option.id" :value="option.value">
                {{ option.value }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="control-group">
          <label class="control-label">
            <span class="label-icon">🎯</span>
            Axes
          </label>
          <div class="select-wrapper">
            <select v-model="selectedAxes" class="control-select">
              <option v-for="option in selectAxesOptions" :key="option.id" :value="option.value">
                {{ option.value.title }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="control-group">
          <label class="control-label">
            <span class="label-icon">📊</span>
            Data Density
          </label>
          <div class="density-info">
            <div class="density-stats">
              <span class="density-total">{{ scaledData?.length?.toLocaleString() || 0 }} total points</span>
              <span class="density-sampled" v-if="scaledData && scaledData.length > 1000">
                ({{ sampledData?.length?.toLocaleString() || 0 }} displayed)
              </span>
            </div>
            <div class="density-indicator">
              <div class="density-bar">
                <div 
                  class="density-fill" 
                  :class="getDensityClass()" 
                  :style="{ width: getDensityPercent() + '%' }"
                ></div>
              </div>
              <span class="density-label">{{ getDensityLabel() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="statistics-section">
      <div class="stats-grid">
        <div class="stat-card rms-card">
          <div class="stat-header">
            <span class="stat-icon">📊</span>
            <h3>RMS Error</h3>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ rmsStats.total.toFixed(3) }}"</div>
            <div class="stat-breakdown">
              <div class="stat-item">
                <span class="stat-label">{{ selectedAxes.xLabel }}:</span>
                <span class="stat-number">{{ rmsStats.x.toFixed(3) }}"</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">{{ selectedAxes.yLabel }}:</span>
                <span class="stat-number">{{ rmsStats.y.toFixed(3) }}"</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="stat-card max-error-card">
          <div class="stat-header">
            <span class="stat-icon">⚠️</span>
            <h3>Max Error</h3>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ maxError.toFixed(3) }}"</div>
            <div class="stat-description">Peak deviation</div>
          </div>
        </div>
        
        <div class="stat-card data-points-card">
          <div class="stat-header">
            <span class="stat-icon">🔢</span>
            <h3>Data Points</h3>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ dataPointsCount }}</div>
            <div class="stat-description">Total measurements</div>
          </div>
        </div>
        
        <div class="stat-card duration-card">
          <div class="stat-header">
            <span class="stat-icon">⏱️</span>
            <h3>Duration</h3>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ sessionDuration }}</div>
            <div class="stat-description">Recording time</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">
      <!-- Time Series Chart -->
      <div class="chart-card line-chart-card">
        <div class="chart-header">
          <h3 class="chart-title">
            <span class="chart-icon">📈</span>
            {{ selectedAxes.title }} Axes Over Time
          </h3>
          <div class="chart-actions">
            <button class="chart-action-btn" @click="downloadChart('line')" title="Download Chart">
              💾
            </button>
          </div>
        </div>
        <div class="chart-container">
          <LineChart ref="lineChartRef" :chartData="chartData" :options="chartDataOptions" />
        </div>
      </div>

      <!-- Scatter Plot Chart -->
      <div class="chart-card scatter-chart-card">
        <div class="chart-header">
          <h3 class="chart-title">
            <span class="chart-icon">⭐</span>
            {{ selectedAxes.title }} Scatter Plot
          </h3>
          <div class="chart-actions">
            <button class="chart-action-btn" @click="downloadChart('scatter')" title="Download Chart">
              💾
            </button>
            <button class="chart-action-btn" @click="resetZoom" title="Reset Zoom">
              🔍
            </button>
          </div>
        </div>
        <div class="chart-container scatter-container">
          <ScatterChart ref="scatterChartRef" :chartData="scatterChartData" :options="scatterChartDataOptions" />
        </div>
      </div>

      <!-- CDF Chart (when available) -->
      <div v-if="canShowMagic" class="chart-card cdf-chart-card">
        <div class="chart-header">
          <h3 class="chart-title">
            <span class="chart-icon">📊</span>
            Cumulative Distribution Function
          </h3>
          <div class="chart-actions">
            <button class="chart-action-btn" @click="downloadChart('cdf')" title="Download Chart">
              💾
            </button>
          </div>
        </div>
        <div class="chart-container">
          <LineChart ref="specialLineChartRef" :chartData="specialChartData" :options="specialChartDataOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, PropType, toRef } from 'vue';
import { LineChart, ScatterChart } from 'vue-chart-3';
import { GuidingSession } from '../store/modules/PHD/PHD.types';

export default defineComponent({
  name: 'PHDLogGuidingCharts',
  props: {
    selectedGuidingSession: {
      type: Object as PropType<GuidingSession>,
      required: true
    },
  },
  components: {
    LineChart,
    ScatterChart
  },
  setup(props, { emit }) {
    const selectedGuidingSession = toRef(props, 'selectedGuidingSession')

    const selectScaleOptions = [
      {
        id: 0,
        value: 'Pixels'
      },
      {
        id: 1,
        value: 'Arc-secs/pixel'
      },
      {
        id: 2,
        value: 'Arc-secs/pixel RMS (50 sec window)'
      }];
    const selectedScale = ref('Pixels');

    const selectAxesOptions = [
      {
        id: 0,
        value: {
          title: 'Mount',
          xLabel: 'RA',
          yLabel: 'DEC'
        }
      },
      {
        id: 1,
        value:  {
          title: 'Camera',
          xLabel: 'dx',
          yLabel: 'dy'
        }
      }];
    const selectedAxes = ref(selectAxesOptions[0].value);

    interface LocalGuidingFrame {
      datetime: Date;
      x: number;
      y: number;
      totalXY: number;
    }

    const scale = (x: LocalGuidingFrame[]) => {
      if (selectedScale.value === 'Pixels') {
        return x;
      } else if (selectedScale.value === 'Arc-secs/pixel') {
        return scaleToPixelScale(x);
      } else if (selectedScale.value === 'Arc-secs/pixel RMS (50 sec window)') {
        let dataScaledToPixelScale = scaleToPixelScale(x);
        let newX: LocalGuidingFrame[] = [];
        const rmsWindow = 50 * 1000; // to milliseconds
        let lastFrameWindow: Date = dataScaledToPixelScale[0].datetime;

        let currentGuidingFrameWindow: LocalGuidingFrame = {
          datetime: lastFrameWindow,
          x: 0,
          y: 0,
          totalXY: 0
        };
        let counter = 0;

        for (let currentFrame of dataScaledToPixelScale) {
          counter += 1;
          if (currentFrame.datetime.valueOf() - lastFrameWindow.valueOf() >= rmsWindow) {
            currentGuidingFrameWindow.datetime = lastFrameWindow;
            currentGuidingFrameWindow.x = Math.sqrt(currentGuidingFrameWindow.x / counter);
            currentGuidingFrameWindow.y = Math.sqrt(currentGuidingFrameWindow.y / counter);
            currentGuidingFrameWindow.totalXY = (currentGuidingFrameWindow.x + currentGuidingFrameWindow.y) / 2;
            newX = newX.concat(currentGuidingFrameWindow);

            lastFrameWindow = currentFrame.datetime;
            currentGuidingFrameWindow = {
              datetime: lastFrameWindow,
              x: 0,
              y: 0,
              totalXY: 0,
            };
            counter = 1;
          }
          currentGuidingFrameWindow.x += Math.pow(currentFrame.x, 2);
          currentGuidingFrameWindow.y += Math.pow(currentFrame.y, 2);
        }
        return newX;
      } else {
        return [];
      }

      function scaleToPixelScale(x: LocalGuidingFrame[]): LocalGuidingFrame[]  {
        return x.map((v) => {
          return {
            datetime: v.datetime,
            x: v.x * selectedGuidingSession.value.pixelScale,
            y: v.y * selectedGuidingSession.value.pixelScale,
            totalXY: v.totalXY
          };
        });
      }
    };

    const data = computed(() => {
      // Safety check - ensure selectedGuidingSession and guidingFrames exist
      if (!selectedGuidingSession.value || !selectedGuidingSession.value.guidingFrames) {
        console.warn('No guiding session or frames available');
        return [];
      }

      return selectedGuidingSession.value.guidingFrames.map((a) => {
        if (selectedAxes.value.title === 'Mount') {
          return {
            datetime: new Date(a.datetime),
            x: new Number(a.RARawDistance),
            y: new Number(a.DECRawDistance),
            totalXY: 0 // Math.sqrt(Math.pow(a.RARawDistance, 2) + Math.pow(a.DECRawDistance, 2)) / 2
          } as LocalGuidingFrame;
        } else { // (selectedAxes.value === 'Camera') {
          return {
            datetime: new Date(a.datetime),
            x: new Number(a.dx),
            y: new Number(a.dy),
            totalXY: 0 // Math.sqrt(Math.pow(a.dx, 2) + Math.pow(a.dy, 2)) / 2
          } as LocalGuidingFrame;
        }
      });
    });

    const scaledData = computed(() => {
      return scale(data.value);
    });

    // Data sampling for performance and readability
    const sampledData = computed(() => {
      const data = scaledData.value;
      
      if (!data || data.length === 0) {
        return [];
      }
      
      const maxPoints = 1000; // Maximum points to display for performance
      
      if (data.length <= maxPoints) {
        return data;
      }
      
      // Sample data intelligently - keep first, last, and evenly spaced points
      const step = Math.floor(data.length / maxPoints);
      const sampled = [];
      
      for (let i = 0; i < data.length; i += step) {
        sampled.push(data[i]);
      }
      
      // Always include the last point
      if (sampled.length > 0 && sampled[sampled.length - 1] !== data[data.length - 1]) {
        sampled.push(data[data.length - 1]);
      }
      
      return sampled;
    });

    const chartData = computed(() => {
      const data = sampledData.value;
      const dataset = {
        labels: data.map((d) => d.datetime.toLocaleTimeString()),
        datasets: [
          {
            data: data.map((d) => d.x),
            borderColor: 'var(--primary-color)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 1.5,
            pointRadius: 0, // Hide individual points for cleaner look
            pointHoverRadius: 4,
            pointBackgroundColor: 'var(--primary-color)',
            pointBorderColor: 'var(--white)',
            pointBorderWidth: 1,
            tension: 0.1,
            label: selectedScale.value !== 'Arc-secs/pixel RMS (50 sec window)' ? selectedAxes.value.xLabel : `${selectedAxes.value.xLabel} RMS`,
          },
          {
            data: data.map((d) => d.y),
            borderColor: 'var(--secondary-color)',
            backgroundColor: 'rgba(118, 75, 162, 0.1)',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointBackgroundColor: 'var(--secondary-color)',
            pointBorderColor: 'var(--white)',
            pointBorderWidth: 1,
            tension: 0.1,
            label: selectedScale.value !== 'Arc-secs/pixel RMS (50 sec window)' ? selectedAxes.value.yLabel : `${selectedAxes.value.yLabel} RMS`,
          },
          {
            data: data.map((d) => d.totalXY),
            borderColor: 'var(--success-color)',
            backgroundColor: 'rgba(72, 187, 120, 0.1)',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointBackgroundColor: 'var(--success-color)',
            pointBorderColor: 'var(--white)',
            pointBorderWidth: 1,
            tension: 0.1,
            label: 'Total RMS',
            hidden: selectedScale.value !== 'Arc-secs/pixel RMS (50 sec window)'
          }
        ],
      };
      return dataset;
    });

    const chartDataOptions = computed(() => {
      return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        elements: {
          line: {
            borderWidth: scaledData.value.length > 5000 ? 1 : 1.5
          },
          point: {
            radius: 0, // Always hide points for line charts with many data points
            hoverRadius: 4
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'var(--primary-color)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function(context: any) {
                const value = Number(context.parsed.y).toFixed(3);
                const unit = selectedScale.value !== 'Pixels' ? '"' : 'px';
                return `${context.dataset.label}: ${value}${unit}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time',
              font: {
                size: 14,
                weight: 'bold'
              },
              color: 'var(--gray-700)'
            },
            grid: {
              color: 'var(--gray-200)',
              drawBorder: false
            },
            ticks: {
              color: 'var(--gray-600)',
              font: {
                size: 11
              }
            }
          },
          y: {
            title: {
              display: true,
              text: selectedScale.value,
              font: {
                size: 14,
                weight: 'bold'
              },
              color: 'var(--gray-700)'
            },
            grid: {
              color: 'var(--gray-200)',
              drawBorder: false
            },
            ticks: {
              color: 'var(--gray-600)',
              font: {
                size: 11
              },
              callback: function(value: any, index: any, ticks: any) {
                const formattedValue = Number(value).toFixed(2);
                if (selectedScale.value !== 'Pixels')
                  return formattedValue + '"';
                else
                  return formattedValue;
              }
            }
          }
        },
      };
    });

    const lineChartRef = ref();
    const canShowMagic = ref(false);

    const specialData = ref();

    function scaleChanged() {
      if (selectedScale.value !== 'Arc-secs/pixel RMS (50 sec window)') {
        lineChartRef.value.chartInstance.hide(2);
        canShowMagic.value = false;
      } else {
        lineChartRef.value.chartInstance.show(2);

        function histogram(arr: number[], bins = 10) {
          const min = Math.min(...arr);
          const max = Math.max(...arr);

          const step = (max - min) / bins;

          const hist = Array.from({length: bins}, (_, index) => {
            return {
              boxStart: min + (index * step),
              boxEnd: min + (index * step) + step,
              values: [] as number[],
              count: 0
            };
          });

          for (let index = 0; index < arr.length; index += 1) {
            const value: number = arr[index];
            for (let box = 0; box < hist.length; box += 1) {
              const element = hist[box];
              if (value >= element.boxStart && value < element.boxEnd) {
                element.values.push(value);
                element.count += 1;
                break;
              }
            }
          }

          return hist;
        }

        const rms = scaledData.value.map(d => d.totalXY);
        rms.sort();

        const hist = histogram(rms, 25);
        const counts = hist.map(x => x.count);
        const cumulativeSum = (sum => (value: any) => sum += value)(0);
        const sum = counts.reduce((a, b) => a + b, 0)
        const pdf = counts.map((x) => x / sum);
        const cdf = pdf.map(cumulativeSum);
        const numbers = [];
        for (let index = 0; index < cdf.length; index += 1) {
          numbers.push({
            rms: hist[index].boxStart,
            cdf: cdf[index]
          });
        }
        specialData.value = numbers;
        canShowMagic.value = true;
      }
    }

    onMounted(() => {
      scaleChanged();
    });

    const scatterChartData = computed(() => {
      const data = scaledData.value;
      const maxScatterPoints = 2000; // More points for scatter plot as it's more informative
      
      let scatterData;
      if (data.length <= maxScatterPoints) {
        scatterData = data.map(d => ({x: d.x, y: d.y}));
      } else {
        // Intelligent sampling for scatter plot - preserve outliers and general distribution
        const step = Math.floor(data.length / maxScatterPoints);
        scatterData = [];
        
        for (let i = 0; i < data.length; i += step) {
          scatterData.push({x: data[i].x, y: data[i].y});
        }
      }
      
      const dataset = {
        datasets: [
          {
            label: `${selectedAxes.value.title} Error (${scatterData.length} points)`,
            data: scatterData,
            backgroundColor: 'rgba(102, 126, 234, 0.4)', // More transparent for overlapping points
            borderColor: 'rgba(102, 126, 234, 0.8)',
            borderWidth: 0.5,
            pointRadius: data.length > 1000 ? 1 : 2, // Smaller points for dense data
            pointHoverRadius: 4,
            pointHoverBackgroundColor: 'var(--primary-color)',
            pointHoverBorderColor: 'var(--white)',
            pointHoverBorderWidth: 2,
          }
        ],
      };
      return dataset;
    });

    const scatterChartDataOptions = computed(() => {
      const suggestedMaxX = Math.max(...scaledData.value.map((x)=> x.x));
      const suggestedMaxY = Math.max(...scaledData.value.map((x)=> x.y));
      const suggestedMinX = Math.min(...scaledData.value.map((x)=> x.x));
      const suggestedMinY = Math.min(...scaledData.value.map((x)=> x.y));
      const max = Math.max(suggestedMaxX, suggestedMaxY);
      const min = Math.min(suggestedMinX, suggestedMinY);
      const suggestion = Math.ceil(Math.max(Math.abs(min), max));

      return {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        animation: {
          duration: scaledData.value.length > 5000 ? 0 : 750 // Disable animation for very dense data
        },
        plugins: {
          zoom: {
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              mode: 'xy',
            },
            pan: {
              enabled: true,
              mode: 'xy',
            }
          },
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'var(--primary-color)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context: any) {
                const x = Number(context.parsed.x).toFixed(3);
                const y = Number(context.parsed.y).toFixed(3);
                const unit = selectedScale.value !== 'Pixels' ? '"' : 'px';
                return `X: ${x}${unit}, Y: ${y}${unit}`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: `${selectedAxes.value.xLabel} (${selectedScale.value})`,
              font: {
                size: 14,
                weight: 'bold'
              },
              color: 'var(--gray-700)'
            },
            max: suggestion,
            min: -suggestion,
            grid: {
              color: 'var(--gray-200)',
              drawBorder: false
            },
            ticks: {
              color: 'var(--gray-600)',
              font: {
                size: 11
              },
              callback: function(value: any, index: any, ticks: any) {
                const formattedValue = Number(value).toFixed(1);
                if (selectedScale.value !== 'Pixels')
                  return formattedValue + '"';
                else
                  return formattedValue;
              },
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: `${selectedAxes.value.yLabel} (${selectedScale.value})`,
              font: {
                size: 14,
                weight: 'bold'
              },
              color: 'var(--gray-700)'
            },
            max: suggestion,
            min: -suggestion,
            grid: {
              color: 'var(--gray-200)',
              drawBorder: false
            },
            ticks: {
              color: 'var(--gray-600)',
              font: {
                size: 11
              },
              callback: function(value: any, index: any, ticks: any) {
                const formattedValue = Number(value).toFixed(1);
                if (selectedScale.value !== 'Pixels')
                  return formattedValue + '"';
                else
                  return formattedValue;
              },
            }
          }
        }
      };
    });

    const specialChartDataOptions = computed(() => {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'var(--primary-color)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context: any) {
                const rms = Number(context.label).toFixed(3);
                const cdf = (Number(context.parsed.y) * 100).toFixed(1);
                return `${cdf}% of errors ≤ ${rms}"`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'RMS Error (Arc-seconds)',
              font: {
                size: 14,
                weight: 'bold'
              },
              color: 'var(--gray-700)'
            },
            grid: {
              color: 'var(--gray-200)',
              drawBorder: false
            },
            ticks: {
              color: 'var(--gray-600)',
              font: {
                size: 11
              }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Cumulative Probability',
              font: {
                size: 14,
                weight: 'bold'
              },
              color: 'var(--gray-700)'
            },
            max: 1,
            min: 0,
            grid: {
              color: 'var(--gray-200)',
              drawBorder: false
            },
            ticks: {
              color: 'var(--gray-600)',
              font: {
                size: 11
              },
              callback: function(value: any) {
                return (Number(value) * 100).toFixed(0) + '%';
              }
            }
          }
        },
      };
    });

    const specialChartData = computed(() => {
      const dataset = {
        labels: specialData.value.map((x: any) => Number(x.rms).toFixed(2) + '\"'),
        datasets: [
          {
            label: `CDF`,
            data: specialData.value.map((x: any) => x.cdf),
            backgroundColor: 'var(--primary-color)',
            borderColor: 'var(--primary-color)',
            borderWidth: 2,
            pointBackgroundColor: 'var(--primary-color)',
            pointRadius: 3,
            tension: 0.4,
          }
        ],
      };
      return dataset;
    });

    // Statistics calculations
    const rmsStats = computed(() => {
      if (!scaledData.value || scaledData.value.length === 0) {
        return { x: 0, y: 0, total: 0 };
      }
      
      const xValues = scaledData.value.map(d => d.x);
      const yValues = scaledData.value.map(d => d.y);
      
      const rmsX = Math.sqrt(xValues.reduce((sum, val) => sum + val * val, 0) / xValues.length);
      const rmsY = Math.sqrt(yValues.reduce((sum, val) => sum + val * val, 0) / yValues.length);
      const rmsTotal = Math.sqrt((rmsX * rmsX + rmsY * rmsY) / 2);
      
      return {
        x: rmsX,
        y: rmsY,
        total: rmsTotal
      };
    });

    const maxError = computed(() => {
      if (!scaledData.value || scaledData.value.length === 0) return 0;
      const allValues = [...scaledData.value.map(d => Math.abs(d.x)), ...scaledData.value.map(d => Math.abs(d.y))];
      return Math.max(...allValues);
    });

    const dataPointsCount = computed(() => scaledData.value?.length || 0);

    const sessionDuration = computed(() => {
      if (!scaledData.value || scaledData.value.length === 0) return '0m';
      const startTime = scaledData.value[0].datetime;
      const endTime = scaledData.value[scaledData.value.length - 1].datetime;
      const durationMs = endTime.getTime() - startTime.getTime();
      const minutes = Math.floor(durationMs / 60000);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
      }
      return `${minutes}m`;
    });

    // Chart references
    const scatterChartRef = ref();
    const specialLineChartRef = ref();

    // Chart actions
    const downloadChart = (chartType: string) => {
      let chartRef;
      let filename;
      
      switch (chartType) {
        case 'line':
          chartRef = lineChartRef.value;
          filename = 'guiding-timeseries.png';
          break;
        case 'scatter':
          chartRef = scatterChartRef.value;
          filename = 'guiding-scatter.png';
          break;
        case 'cdf':
          chartRef = specialLineChartRef.value;
          filename = 'guiding-cdf.png';
          break;
        default:
          return;
      }
      
      if (chartRef && chartRef.chartInstance) {
        const url = chartRef.chartInstance.toBase64Image();
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
      }
    };

    const resetZoom = () => {
      if (scatterChartRef.value && scatterChartRef.value.chartInstance) {
        scatterChartRef.value.chartInstance.resetZoom();
      }
    };

    // Data density helpers
    const getDensityClass = () => {
      const count = scaledData.value.length;
      if (count < 500) return 'density-low';
      if (count < 2000) return 'density-medium';
      if (count < 10000) return 'density-high';
      return 'density-extreme';
    };

    const getDensityPercent = () => {
      const count = scaledData.value.length;
      const maxExpected = 20000; // Reasonable maximum for visualization
      return Math.min((count / maxExpected) * 100, 100);
    };

    const getDensityLabel = () => {
      const count = scaledData.value.length;
      if (count < 500) return 'Low';
      if (count < 2000) return 'Medium';
      if (count < 10000) return 'High';
      return 'Very High';
    };

    return {
      lineChartRef, scatterChartRef, specialLineChartRef, scaleChanged,
      selectedScale, selectScaleOptions, selectedAxes, selectAxesOptions,
      chartData, chartDataOptions, scatterChartData, scatterChartDataOptions,
      specialChartData, specialChartDataOptions, canShowMagic,
      rmsStats, maxError, dataPointsCount, sessionDuration,
      downloadChart, resetZoom,
      sampledData, scaledData, getDensityClass, getDensityPercent, getDensityLabel,
    };
  },
});
</script>

<style scoped>
.guiding-charts {
  padding: 0;
}

.charts-header {
  text-align: center;
  margin-bottom: 2rem;
}

.charts-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: 0.5rem;
}

.charts-icon {
  font-size: 2.5rem;
}

.charts-subtitle {
  font-size: 1.125rem;
  color: var(--gray-600);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.controls-section {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--gray-700);
  font-size: 0.875rem;
}

.label-icon {
  font-size: 1.1rem;
}

.select-wrapper {
  position: relative;
}

.control-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  background: var(--white);
  color: var(--gray-700);
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition);
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

.control-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.control-select:hover {
  border-color: var(--gray-400);
}

.density-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.density-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.density-total {
  font-weight: 600;
  color: var(--gray-800);
  font-size: 0.875rem;
}

.density-sampled {
  font-size: 0.75rem;
  color: var(--gray-600);
  font-style: italic;
}

.density-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.density-bar {
  flex: 1;
  height: 0.5rem;
  background: var(--gray-200);
  border-radius: 0.25rem;
  overflow: hidden;
}

.density-fill {
  height: 100%;
  border-radius: 0.25rem;
  transition: var(--transition);
}

.density-low {
  background: var(--success-color);
}

.density-medium {
  background: var(--warning-color);
}

.density-high {
  background: var(--error-color);
}

.density-extreme {
  background: linear-gradient(90deg, var(--error-color), var(--gray-800));
}

.density-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--gray-600);
  min-width: 4rem;
  text-align: right;
}

.statistics-section {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  transition: var(--transition);
  border-left: 4px solid var(--gray-300);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.rms-card {
  border-left-color: var(--primary-color);
}

.max-error-card {
  border-left-color: var(--warning-color);
}

.data-points-card {
  border-left-color: var(--success-color);
}

.duration-card {
  border-left-color: var(--secondary-color);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
}

.stat-content {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: 0.5rem;
}

.stat-breakdown {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--gray-600);
  font-weight: 500;
}

.stat-number {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.stat-description {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-top: 0.25rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.chart-card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: var(--transition);
}

.chart-card:hover {
  box-shadow: var(--shadow-md);
}

.line-chart-card {
  border-top: 4px solid var(--primary-color);
}

.scatter-chart-card {
  border-top: 4px solid var(--secondary-color);
}

.cdf-chart-card {
  border-top: 4px solid var(--accent-color);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
  background: var(--gray-50);
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

.chart-icon {
  font-size: 1.5rem;
}

.chart-actions {
  display: flex;
  gap: 0.5rem;
}

.chart-action-btn {
  background: none;
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  padding: 0.5rem;
  cursor: pointer;
  transition: var(--transition);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
}

.chart-action-btn:hover {
  background: var(--gray-100);
  border-color: var(--gray-400);
  transform: translateY(-1px);
}

.chart-container {
  padding: 1.5rem;
  position: relative;
  height: 400px;
}

.scatter-container {
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive design */
@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .controls-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .density-indicator {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }
  
  .density-label {
    text-align: center;
    min-width: auto;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }
  
  .stat-breakdown {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .chart-container {
    padding: 1rem;
    height: 300px;
  }
  
  .scatter-container {
    height: 400px;
  }
  
  .chart-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .charts-title {
    font-size: 1.75rem;
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .scatter-container {
    height: 300px;
  }
}
</style>
