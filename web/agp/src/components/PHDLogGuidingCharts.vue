<template>
  <div>
    Scale: <select v-model="selectedScale" @change="scaleChanged">
       <option v-for="option in selectScaleOptions" v-bind:key="option.id" v-bind:value="option.value">
        {{ option.value }}
      </option>
    </select>
    <br/>
    Axes: <select v-model="selectedAxes">
       <option v-for="option in selectAxesOptions" v-bind:key="option.id" v-bind:value="option.value">
        {{ option.value.title }}
      </option>
    </select>
    <LineChart ref="lineChartRef" :chartData="chartData" :options="chartDataOptions" />
    <ScatterChart class="scatterChart" :chartData="scatterChartData" :options="scatterChartDataOptions" />
    <LineChart v-if="canShowMagic" ref="specialLineChartRef" :chartData="specialChartData" :options="specialChartDataOptions" />
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

    const data = computed(() => selectedGuidingSession.value.guidingFrames.map((a) => {
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
      }));

    const scaledData = computed(() => {
      return scale(data.value);
    });

    const chartData = computed(() => {
      const dataset = {
        labels: scaledData.value.map((d) => d.datetime.toLocaleTimeString()),
        datasets: [
          {
            data: scaledData.value.map((d) => d.x),
            backgroundColor: ['blue'],
            label: selectedScale.value !== 'Arc-secs/pixel RMS (50 sec window)' ? selectedAxes.value.xLabel : `${selectedAxes.value.xLabel} RMS`,
          },
          {
            data: scaledData.value.map((d) => d.y),
            backgroundColor: ['orange'],
            label: selectedScale.value !== 'Arc-secs/pixel RMS (50 sec window)' ? selectedAxes.value.yLabel : `${selectedAxes.value.yLabel} RMS`,
          },
          {
            data: scaledData.value.map((d) => d.totalXY),
            backgroundColor: ['green'],
            label: 'Total RMS',
            hide: true
          }
        ],
      };
      return dataset;
    });

    const chartDataOptions = computed(() => {
      return {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${selectedAxes.value.title} Axes Chart`,
            font: {
              size: 20
            }
          },
          legend: {
            labels: {
              filter: function (legendItem: any, chartData: any) {
                return !(legendItem.datasetIndex === 2 && selectedScale.value !== 'Arc-secs/pixel RMS (50 sec window)');
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
                size: 12
              }
            },
          },
          y: {
            title: {
              display: true,
              text: selectedScale.value,
              font: {
                size: 12
              }
            },
            ticks: {
              callback: function(value: any, index: any, ticks: any) {
                if (selectedScale.value !== 'Pixels')
                  return Number(value).toFixed(2) + '\"';
                else
                  return Number(value).toFixed(2);
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
      const dataset = {
        datasets: [
          {
            label: `${selectedAxes.value.title}`,
            data: scaledData.value,
            backgroundColor: ['blue'],
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
        aspectRatio: 1,
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
          title: {
            display: true,
            text: `${selectedAxes.value.title} Scatter`,
            font: {
              size: 20
            }
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: selectedScale.value,
              font: {
                size: 12
              }
            },
            max: suggestion,
            min: -suggestion,
            ticks: {
              callback: function(value: any, index: any, ticks: any) {
                if (selectedScale.value !== 'Pixels')
                  return Number(value).toFixed(2) + '\"';
                else
                  return Number(value).toFixed(2);
              },
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: selectedScale.value,
              font: {
                size: 12
              }
            },
            max: suggestion,
            min: -suggestion,
            ticks: {
              callback: function(value: any, index: any, ticks: any) {
                if (selectedScale.value !== 'Pixels')
                  return Number(value).toFixed(2) + '\"';
                else
                  return Number(value).toFixed(2);
              },
            }
          }
        }
      };
    });

    const specialChartDataOptions = computed(() => {
      return {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `CDF`,
            font: {
              size: 20
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Arc-secs/pixel RMS (50 sec window)',
              font: {
                size: 12
              }
            },
          },
          y: {
            title: {
              display: true,
              text: 'CDF',
              font: {
                size: 12
              }
            },
            max: 1
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
            backgroundColor: ['blue'],
          }
        ],
      };
      return dataset;
    });

    return {
      lineChartRef, scaleChanged,
      selectedScale, selectScaleOptions, selectedAxes, selectAxesOptions,
      chartData, chartDataOptions, scatterChartData, scatterChartDataOptions,
      specialChartData, specialChartDataOptions, canShowMagic,
    };
  },
});
</script>

<style scoped>
.scatterChart {
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 600px;
  height: 600px;
}
</style>
