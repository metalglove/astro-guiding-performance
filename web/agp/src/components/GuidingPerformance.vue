<template>
  <div>
    <h1>Guiding Performance charts</h1>
    <div>
      <h2>Autorun log details</h2>
      <b>Log date:</b><br/> {{ autorunLog.datetime }} <br/>
      <b>Autorun sessions:</b><br/> {{ autorunLog.autoruns.length }} <br/>
      <b>Targets:</b><br/>
      <div v-for="autorun in autorunLog.autoruns" v-bind:key="autorun.startTime">
        <pre> {{ planText(autorun) }} </pre>
      </div>
      <h2>PHD2 log details</h2>
      <b>Mount</b><br/> {{ selectedGuidingSession.mount }} <br/>
      <b>Guiding camera</b><br/> {{ selectedGuidingSession.camera }}, Resolution: {{ selectedGuidingSession.cameraWidth }}x{{ selectedGuidingSession.cameraHeight }}, Pixel size: {{ selectedGuidingSession.cameraPixelSize }}um<br/>
      <b>Guiding scope</b><br/> Focal length: {{ selectedGuidingSession.focalLength }}mm <br/>
      <b>Guide camera settings</b><br/> Binning: {{ selectedGuidingSession.binning }}, Gain: {{ selectedGuidingSession.cameraGain }}, Exposure time: {{ selectedGuidingSession.exposureTime }}ms, Pixel scale: {{ selectedGuidingSession.pixelScale }}px <br/>
      <b>Guiding algorithms</b><br/> X: {{ selectedGuidingSession.xGuidingAlgorithm }}, Y: {{ selectedGuidingSession.yGuidingAlgorithm }} <br/>
      <b>Guide settings</b><br/> Backlash compensation: {{ selectedGuidingSession.backlashCompensation }}, X-rate: {{ selectedGuidingSession.xRate }}, Y-rate: {{ selectedGuidingSession.yRate }} <br/>
    </div>
    <select v-model="selectedScale">
       <option v-for="option in selectOptions" v-bind:key="option.id" v-bind:value="option.value">
        {{ option.value }}
      </option>
    </select>
    <select v-model="selectedGuidingSession">
       <option v-for="guidingSession in guidingSessions" v-bind:key="guidingSession.startTime" v-bind:value="guidingSession">
        {{ guidingSession.startTime }}
      </option>
    </select>
    <LineChart :chartData="cameraAxes" :options="cameraAxesOptions" />
    <LineChart :chartData="mountAxes" :options="mountAxesOptions" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { LineChart } from 'vue-chart-3';
import { Autorun, AutorunLog, ExposureEvent } from '../utilities/AutorunLog';
import { PHDLog } from '../utilities/PHDLog';
import { groupBy } from '../utilities/helpers';

export default defineComponent({
  name: 'GuidingPerformance',
  props: {
    logs: Object,
  },
  components: {
    LineChart
  },
  setup(props, { emit }) {
    const logs: { AutorunLog: AutorunLog, PHDLog: PHDLog } = props.logs as { AutorunLog: AutorunLog, PHDLog: PHDLog };

    const selectedGuidingSession = ref(logs.PHDLog.guidingSessions[0]);

    console.log(selectedGuidingSession);

    const selectedScale = ref('pixels');
    const selectOptions = [
      {
        id: 0,
        value: 'pixels'
      },
      {
        id: 1,
        value: 'arc-secs/pixel '
      },
      {
        id: 2,
        value: 'arc-secs/pixel  RMS (50 sec window)'
      }];

    const defaultOptions = (title: string) => {
      return {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title,
            font: {
              size: 20
            }
          },
          legend: {
            labels: {
              filter: function (legendItem: any, chartData: any) {
                return !(legendItem.datasetIndex === 2 && selectedScale.value !== 'arc-secs/pixel  RMS (50 sec window)');
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
                if (selectedScale.value !== 'pixels')
                  return Number(value).toFixed(2) + '\"';
                else
                  return Number(value).toFixed(2);
              }
            }
          }
        },
      };
    };

    const mountAxesOptions = computed(() => {
      const mo = defaultOptions('Mount Axes Chart');
      // mo.plugins.title.text = ;
      return mo;
    });
    const cameraAxesOptions = computed(() => {
      const co = defaultOptions('Camera Axes Chart');
      // mo.plugins.title.text = ;
      return co;
    });

    interface LocalGuidingFrame {
      datetime: Date;
      dx: number;
      dy: number;
      totalXY: number;
      ra: number;
      dec: number;
      totalRADEC: number;
    }

    const scale = (x: LocalGuidingFrame[]) => {
      if (selectedScale.value === 'pixels') {
        return x;
      } else if (selectedScale.value === 'arc-secs/pixel ') {
        return scaleToPixelScale(x);
      } else if (selectedScale.value === 'arc-secs/pixel  RMS (50 sec window)') {
        let dataScaledToPixelScale = scaleToPixelScale(x);
        let newX: LocalGuidingFrame[] = [];
        const rmsWindow = 50 * 1000; // to milliseconds
        let lastFrameWindow: Date = dataScaledToPixelScale[0].datetime;

        let currentGuidingFrameWindow: LocalGuidingFrame = {
          datetime: lastFrameWindow,
          dx: 0,
          dy: 0,
          totalXY: 0,
          ra: 0,
          dec: 0,
          totalRADEC: 0
        };
        let counter = 0;

        for (let currentFrame of dataScaledToPixelScale) {
          counter += 1;
          if (currentFrame.datetime.valueOf() - lastFrameWindow.valueOf() >= rmsWindow) {
            currentGuidingFrameWindow.datetime = lastFrameWindow;
            currentGuidingFrameWindow.dx = Math.sqrt(currentGuidingFrameWindow.dx / counter);
            currentGuidingFrameWindow.dy = Math.sqrt(currentGuidingFrameWindow.dy / counter);
            currentGuidingFrameWindow.totalXY = (currentGuidingFrameWindow.dx + currentGuidingFrameWindow.dy) / 2;
            currentGuidingFrameWindow.ra = Math.sqrt(currentGuidingFrameWindow.ra / counter);
            currentGuidingFrameWindow.dec = Math.sqrt(currentGuidingFrameWindow.dec / counter);
            currentGuidingFrameWindow.totalRADEC = (currentGuidingFrameWindow.ra + currentGuidingFrameWindow.dec) / 2;
            newX = newX.concat(currentGuidingFrameWindow);

            lastFrameWindow = currentFrame.datetime;
            currentGuidingFrameWindow = {
              datetime: lastFrameWindow,
              dx: 0,
              dy: 0,
              totalXY: 0,
              ra: 0,
              dec: 0,
              totalRADEC: 0
            };
            counter = 1;
          }
          currentGuidingFrameWindow.dx += Math.pow(currentFrame.dx, 2);
          currentGuidingFrameWindow.dy += Math.pow(currentFrame.dy, 2);
          currentGuidingFrameWindow.ra += Math.pow(currentFrame.ra, 2);
          currentGuidingFrameWindow.dec += Math.pow(currentFrame.dec, 2);
        }
        return newX;
      } else {
        return [];
      }

      function scaleToPixelScale(x: LocalGuidingFrame[]): LocalGuidingFrame[]  {
        return x.map(x => {
          x.dx *= selectedGuidingSession.value.pixelScale;
          x.dy *= selectedGuidingSession.value.pixelScale;
          x.ra *= selectedGuidingSession.value.pixelScale;
          x.dec *= selectedGuidingSession.value.pixelScale;
          return x;
        });
      }
    };

    const scaledData = computed(() => {
      let data: LocalGuidingFrame[] = selectedGuidingSession.value.guidingFrames.map((x) => {
        return { datetime: x.datetime, dx: x.dx, dy: x.dy, ra: x.RARawDistance, dec: x.DECRawDistance } as LocalGuidingFrame;
        });
      return scale(data);
    });

    const cameraAxes = computed(() => {
     const dataset = {
        labels: scaledData.value.map((d) => d.datetime.toLocaleTimeString()),
        datasets: [
          {
            data: scaledData.value.map((d) => d.dx),
            backgroundColor: ['blue'],
            label: selectedScale.value !== 'arc-secs/pixel  RMS (50 sec window)' ? 'dx' : 'dx RMS',
          },
          {
            data: scaledData.value.map((d) => d.dy),
            backgroundColor: ['orange'],
            label: selectedScale.value !== 'arc-secs/pixel  RMS (50 sec window)' ? 'dy' : 'dy RMS',
          },
          {
            data: scaledData.value.map((d) => d.totalXY),
            backgroundColor: ['green'],
            label: 'Total RMS',
          }
        ],
      };
      return dataset;
    });

    const mountAxes = computed(() => {
     const dataset =  {
        labels: scaledData.value.map((d) => d.datetime.toLocaleTimeString()),
        datasets: [
          {
            data: scaledData.value.map((d) => d.ra),
            backgroundColor: ['blue'],
            label: selectedScale.value !== 'arc-secs/pixel  RMS (50 sec window)' ? 'RA' : 'RA RMS',
          },
          {
            data: scaledData.value.map((d) => d.dec),
            backgroundColor: ['orange'],
            label: selectedScale.value !== 'arc-secs/pixel RMS (50 sec window)' ? 'DEC' : 'DEC RMS',
          },
          {
            data: scaledData.value.map((d) => d.totalRADEC),
            backgroundColor: ['green'],
            label: 'Total RMS',
          }
        ],
      };
      return dataset;
    });

    const planText = (autorun: Autorun) => {
      let lights = autorun.exposureEvents.filter((exposure => exposure.type === "Light"));
      let biases = autorun.exposureEvents.filter((exposure => exposure.type === "Bias"));
      let darks = autorun.exposureEvents.filter((exposure => exposure.type === "Dark"));
      let flats = autorun.exposureEvents.filter((exposure => exposure.type === "Flat"));

      let text = 'Plan: \n';
      if (lights.length > 0) {
        text = `Plan ${autorun.plan}: \n`;
        groupBy(lights, (light: ExposureEvent) => light.integrationTime).forEach((grouped) => {
          text += `Light: ${ grouped.length }x ${grouped[0]?.integrationTime}`;
        });
      }
      if (biases.length > 0) {
        groupBy(biases, (bias: ExposureEvent) => bias.integrationTime).forEach((grouped) => {
          text += `Bias: ${ grouped.length }x ${grouped[0]?.integrationTime}`;
        });
      }
      if (darks.length > 0) {
        groupBy(darks, (dark: ExposureEvent) => dark.integrationTime).forEach((grouped) => {
          text += `Dark: ${ grouped.length }x ${grouped[0]?.integrationTime}`;
        });
      }
      if (flats.length > 0) {
        groupBy(flats, (flat: ExposureEvent) => flat.integrationTime).forEach((grouped) => {
          text += `Flat: ${ grouped.length }x ${grouped[0]?.integrationTime}`;
        });
      }
      return text;
    }

    return { guidingSessions: logs.PHDLog.guidingSessions, planText, autorunLog: logs.AutorunLog, selectedGuidingSession, selectedScale, selectOptions, cameraAxes, mountAxes, mountAxesOptions, cameraAxesOptions };
  },
});
</script>

<style scoped>
</style>
