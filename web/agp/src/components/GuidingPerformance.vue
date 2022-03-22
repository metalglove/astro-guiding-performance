<template>
  <div>
    <h1>Guiding Performance charts</h1>
    <LineChart :chartData="cameraAxes" :options="cameraAxesOptions" />
    <LineChart :chartData="mountAxes" :options="mountAxesOptions" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { LineChart } from 'vue-chart-3';
import { AutorunLog } from '../utilities/AutorunLog';
import { GuidingSession, PHDLog } from '../utilities/PHDLog';

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

    const defaultOptions = (chartTitle: string) => {
      return {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: chartTitle,
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
              text: 'pixel/arc-secs',
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
    };

    const mountAxesOptions = ref(defaultOptions('Mount Axes Chart'));
    const cameraAxesOptions = ref(defaultOptions('Camera Axes Chart'));

    const cameraAxes = computed(() => ({
        labels: guidingSession.guidingFrames.map((d) => d.datetime.toLocaleTimeString()),
        datasets: [
          {
            data: guidingSession.guidingFrames.map((d) => d.dx * guidingSession.pixelScale),
            backgroundColor: ['blue'],
            label: 'dx',
          },
          {
            data: guidingSession.guidingFrames.map((d) => d.dy * guidingSession.pixelScale),
            backgroundColor: ['orange'],
            label: 'dy',
          },
        ],
      }));

    const mountAxes = computed(() => ({
      labels: guidingSession.guidingFrames.map((d) => d.datetime.toLocaleTimeString()),
      datasets: [
        {
          data: guidingSession.guidingFrames.map((d) => d.RARawDistance * guidingSession.pixelScale),
          backgroundColor: ['blue'],
          label: 'RA'
        },
        {
          data: guidingSession.guidingFrames.map((d) => d.DECRawDistance * guidingSession.pixelScale),
          backgroundColor: ['orange'],
          label: 'DEC'
        },
      ],
    }));

    return { cameraAxes, mountAxes, mountAxesOptions, cameraAxesOptions };
  },
});
</script>

<style scoped>
</style>
