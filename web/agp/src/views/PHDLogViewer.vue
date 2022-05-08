<template>
  <div>
    <PHDLogDetails :phdLog="phdLog" @selectedGuidingSessionChanged="updateSelectedGuidingSession"/>
    <br/>
    <PHDLogGuidingCharts :selectedGuidingSession="selectedGuidingSession" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import PHDLogDetails from '../components/PHDLogDetails.vue';
import PHDLogGuidingCharts from '../components/PHDLogGuidingCharts.vue';
import { GuidingSession, PHDLog } from '../store/modules/PHD/PHD.types';
import { usePHDStore } from '../store/';
import { PHDGetterTypes } from '../store/modules/PHD/PHD.getters';

export default defineComponent({
  name: 'PHDLogViewer',
  components: {
    PHDLogDetails,
    PHDLogGuidingCharts,
  },
  setup(props, { }) {
    const phdStore = usePHDStore();
    const phdLog: PHDLog = phdStore.getters(PHDGetterTypes.GET_PHD_LOG);

    const selectedGuidingSession = ref(phdLog.guidingSessions[0]);

    function updateSelectedGuidingSession(guidingSession: GuidingSession) {
      selectedGuidingSession.value = guidingSession;
    }

    return {
      phdLog, updateSelectedGuidingSession, selectedGuidingSession,
    };
  },
});
</script>

<style scoped>

</style>
