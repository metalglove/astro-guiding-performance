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
      <b>Mount</b><br/> {{ guidingSession.mount }} <br/>
      <b>Guiding camera</b><br/> {{ guidingSession.camera }}, Resolution: {{ guidingSession.cameraWidth }}x{{ guidingSession.cameraHeight }}, Pixel size: {{ guidingSession.cameraPixelSize }}um<br/>
      <b>Guiding scope</b><br/> Focal length: {{ guidingSession.focalLength }}mm <br/>
      <b>Guide camera settings</b><br/> Binning: {{ guidingSession.binning }}, Gain: {{ guidingSession.cameraGain }}, Exposure time: {{ guidingSession.exposureTime }}ms, Pixel scale: {{ guidingSession.pixelScale }}px <br/>
      <b>Guiding algorithms</b><br/> X: {{ guidingSession.xGuidingAlgorithm }}, Y: {{ guidingSession.yGuidingAlgorithm }} <br/>
      <b>Guide settings</b><br/> Backlash compensation: {{ guidingSession.backlashCompensation }}, X-rate: {{ guidingSession.xRate }}, Y-rate: {{ guidingSession.yRate }} <br/>
    </div>
    <select v-model="selectedScale">
       <option v-for="option in selectOptions" v-bind:key="option.id" v-bind:value="option.value">
        {{ option.value }}
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
import { GuidingSession, PHDLog } from '../utilities/PHDLog';
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

    const guidingSession: GuidingSession = logs.PHDLog.guidingSessions[6];
    console.log(guidingSession);

    const selectedScale = ref('pixels');
    const selectOptions = [
      {
        id: 0,
        value: 'pixels'
      },
      {
        id: 1,
        value: 'pixel/arc-secs'
      },
      {
        id: 2,
        value: 'pixel/arc-secs RMS (50 sec window)'
      }];

    const defaultOptions = computed(() => {
      return {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "TITLE",
            font: {
              size: 20
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
                return value + '\"';
              }
            }
          }
        },
      };
    });

    const mountAxesOptions = computed(() => {
      const mo = defaultOptions.value;
      mo.plugins.title.text = 'Mount Axes Chart';
      return mo;
    });
    const cameraAxesOptions = computed(() => {
      const mo = defaultOptions.value;
      mo.plugins.title.text = 'Camera Axes Chart';
      return mo;
    });

    interface LocalGuidingFrame {
      datetime: Date;
      dx: number;
      dy: number;
      ra: number;
      dec: number;
    }

    const scale = (x: LocalGuidingFrame[]) => {
      if (selectedScale.value === 'pixels') {
        return x;
      } else if (selectedScale.value === 'pixel/arc-secs') {
        return scaleToPixelScale(x);
      } else if (selectedScale.value === 'pixel/arc-secs RMS (50 sec window)') {
        let dataScaledToPixelScale = scaleToPixelScale(x);
        let newX: LocalGuidingFrame[] = [];
        const rmsWindow = 50 * 1000; // to milliseconds
        let lastFrameWindow: Date = dataScaledToPixelScale[0].datetime;

        let currentGuidingFrameWindow: LocalGuidingFrame = {
          datetime: lastFrameWindow,
          dx: 0,
          dy: 0,
          ra: 0,
          dec: 0
        };
        let counter = 0;

        for (let currentFrame of dataScaledToPixelScale) {
          counter += 1;
          if (currentFrame.datetime.valueOf() - lastFrameWindow.valueOf() >= rmsWindow) {
            currentGuidingFrameWindow.datetime = lastFrameWindow;
            currentGuidingFrameWindow.dx = Math.sqrt(currentGuidingFrameWindow.dx / counter);
            currentGuidingFrameWindow.dy = Math.sqrt(currentGuidingFrameWindow.dy / counter);
            currentGuidingFrameWindow.ra = Math.sqrt(currentGuidingFrameWindow.ra / counter);
            currentGuidingFrameWindow.dec = Math.sqrt(currentGuidingFrameWindow.dec / counter);
            newX = newX.concat(currentGuidingFrameWindow);

            lastFrameWindow = currentFrame.datetime;
            currentGuidingFrameWindow = {
              datetime: lastFrameWindow,
              dx: 0,
              dy: 0,
              ra: 0,
              dec: 0
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
          return {
            datetime: x.datetime,
            dx: x.dx*guidingSession.pixelScale,
            dy: x.dy*guidingSession.pixelScale,
            ra: x.ra*guidingSession.pixelScale,
            dec: x.dec*guidingSession.pixelScale
          };
        });
      }
    };

    const scaledData = computed(() => {
      // select the needed properties
      let data: LocalGuidingFrame[] = guidingSession.guidingFrames.map((x) => {
        return { datetime: x.datetime, dx: x.dx, dy: x.dy, ra: x.RARawDistance, dec: x.DECRawDistance } as LocalGuidingFrame;
        });
      return scale(data);
    });

    const cameraAxes = computed(() => ({
        labels: scaledData.value.map((d) => d.datetime.toLocaleTimeString()),
        datasets: [
          {
            data: scaledData.value.map((d) => d.dx),
            backgroundColor: ['blue'],
            label: 'dx',
          },
          {
            data: scaledData.value.map((d) => d.dy),
            backgroundColor: ['orange'],
            label: 'dy',
          },
        ],
      }));

    const mountAxes = computed(() => ({
      labels: scaledData.value.map((d) => d.datetime.toLocaleTimeString()),
      datasets: [
        {
          data: scaledData.value.map((d) => d.ra),
          backgroundColor: ['blue'],
          label: 'RA'
        },
        {
          data: scaledData.value.map((d) => d.dec),
          backgroundColor: ['orange'],
          label: 'DEC'
        },
      ],
    }));

    return { selectedScale, selectOptions, cameraAxes, mountAxes, mountAxesOptions, cameraAxesOptions };
  },
});
</script>

<style scoped>
</style>
