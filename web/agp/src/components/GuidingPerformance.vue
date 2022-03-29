<template>
  <div>
    <h1>Guiding Performance charts</h1>
    <div>
      <AutorunLogDetails :autorunLog="autorunLog" />
      <PHDLogDetails :phdLog="phdLog" @selectedGuidingSessionChanged="updateSelectedGuidingSession"/>
    </div>
    <br/>
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
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { LineChart, ScatterChart } from 'vue-chart-3';
import AutorunLogDetails from './AutorunLogDetails.vue';
import PHDLogDetails from './PHDLogDetails.vue';
import { AutorunLog } from '../utilities/AutorunLog';
import { GuidingSession, PHDLog } from '../utilities/PHDLog';

export default defineComponent({
  name: 'GuidingPerformance',
  props: {
    logs: Object,
  },
  components: {
    AutorunLogDetails,
    PHDLogDetails,
    LineChart,
    ScatterChart
  },
  setup(props, { emit }) {
    const logs: { AutorunLog: AutorunLog, PHDLog: PHDLog } = props.logs as { AutorunLog: AutorunLog, PHDLog: PHDLog };
    const selectedGuidingSession = ref(logs.PHDLog.guidingSessions[0]);

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
            datetime: a.datetime,
            x: a.RARawDistance,
            y: a.DECRawDistance,
            totalXY: 0
          } as LocalGuidingFrame;
        } else { // (selectedAxes.value === 'Camera') {
          return {
            datetime: a.datetime,
            x: a.dx,
            y: a.dy,
            totalXY: 0
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

    function scaleChanged() {
      if (selectedScale.value !== 'Arc-secs/pixel RMS (50 sec window)') {
        lineChartRef.value.chartInstance.hide(2);
      } else {
        lineChartRef.value.chartInstance.show(2);
      }
    }

    onMounted(() => {
      scaleChanged();
    });

    function updateSelectedGuidingSession(guidingSession: GuidingSession) {
      selectedGuidingSession.value = guidingSession;
    }

    const scatterChartData = computed(() => {
      const dataset = {
        datasets: [
          {
            label: `${selectedAxes.value.title}`,
            data: data.value,
            backgroundColor: ['blue'],
          }
        ],
      };
      return dataset;
    });

    const scatterChartDataOptions = computed(() => {
      const suggestedMaxX = Math.max(...data.value.map((x)=> x.x));
      const suggestedMaxY = Math.max(...data.value.map((x)=> x.y));
      const suggestedMinX = Math.min(...data.value.map((x)=> x.x));
      const suggestedMinY = Math.min(...data.value.map((x)=> x.y));
      const max = Math.max(suggestedMaxX, suggestedMaxY);
      const min = Math.min(suggestedMinX, suggestedMinY);
      const suggestion = Math.ceil(Math.max(Math.abs(min), max));

      return {
        responsive: true,
        aspectRatio: 1,
        plugins: {
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
            title: {
              display: true,
              text: 'Pixels',
              font: {
                size: 12
              }
            },
            max: suggestion,
            min: -suggestion,
            ticks: {
              stepSize: 0.1
            }
          },
          y: {
            title: {
              display: true,
              text: 'Pixels',
              font: {
                size: 12
              }
            },
            max: suggestion,
            min: -suggestion,
            ticks: {
              stepSize: 0.1
            }
          }
        }
      };
    });

    return {
      updateSelectedGuidingSession, lineChartRef, scaleChanged,
      autorunLog: logs.AutorunLog, phdLog: logs.PHDLog, selectedGuidingSession,
      selectedScale, selectScaleOptions, selectedAxes, selectAxesOptions,
      chartData, chartDataOptions, scatterChartData, scatterChartDataOptions,
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
