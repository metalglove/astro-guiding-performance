<template>
  <div>
    <h2>PHD2 log details</h2>
    Select guiding session:
    <select v-model="selectedGuidingSession" @change="selectedGuidingSessionChange">
       <option v-for="guidingSession in phdLog.guidingSessions" v-bind:key="guidingSession.startTime" v-bind:value="guidingSession">
        {{ new Date(guidingSession.startTime).toLocaleString() + ' ' + timeDifference(guidingSession.startTime, guidingSession.endTime) }}
      </option>
    </select>
    <br/>
    <br/>
    <b>Mount</b><br/> {{ selectedGuidingSession.mount }} <br/>
    <b>Guiding camera</b><br/> {{ selectedGuidingSession.camera }}, Resolution: {{ selectedGuidingSession.cameraWidth }}x{{ selectedGuidingSession.cameraHeight }}, Pixel size: {{ selectedGuidingSession.cameraPixelSize }}um<br/>
    <b>Guiding scope</b><br/> Focal length: {{ selectedGuidingSession.focalLength }}mm <br/>
    <b>Guide camera settings</b><br/> Binning: {{ selectedGuidingSession.binning }}, Gain: {{ selectedGuidingSession.cameraGain }}, Exposure time: {{ selectedGuidingSession.exposureTime }}ms, Pixel scale: {{ selectedGuidingSession.pixelScale }}px <br/>
    <b>Guiding algorithms</b><br/> X: {{ selectedGuidingSession.xGuidingAlgorithm }}, Y: {{ selectedGuidingSession.yGuidingAlgorithm }} <br/>
    <b>Guide settings</b><br/> Backlash compensation: {{ selectedGuidingSession.backlashCompensation }}, X-rate: {{ selectedGuidingSession.xRate }}, Y-rate: {{ selectedGuidingSession.yRate }} <br/>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { PHDLog } from '../store/modules/PHD/PHD.types';

export default defineComponent({
  name: 'PHDLogDetails',
  props: {
    phdLog: {
      type: Object as PropType<PHDLog>,
      required: true
    },
  },
  components: {
  },
  emits: [
    'selectedGuidingSessionChanged'
  ],
  setup(props, { emit }) {
    const selectedGuidingSession = ref(props.phdLog.guidingSessions[0]);

    function selectedGuidingSessionChange() {
      emit('selectedGuidingSessionChanged', selectedGuidingSession.value);
    }

    function timeDifference(startTime: Date, endTime: Date) {
      let mills = Math.abs(new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
      const hours = Math.floor(mills / 3600) % 24;
      mills -= hours * 3600
      const minutes = Math.floor(mills / 60) % 60;
      mills -= minutes * 60;
      return `(${hours}h ${String(minutes).padStart(2, '0')}m)`;
    }

    return { timeDifference, selectedGuidingSessionChange, selectedGuidingSession };
  },
});
</script>

<style scoped>
</style>
