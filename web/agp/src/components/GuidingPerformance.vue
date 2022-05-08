<template>
  <div>
    <h1>Guiding Performance charts</h1>
    <div>
      <AutorunLogDetails :asiairLog="asiairLog" />
      <PHDLogDetails :phdLog="phdLog" @selectedGuidingSessionChanged="updateSelectedGuidingSession"/>
    </div>
    <br/>
    <PHDLogGuidingCharts :selectedGuidingSession="selectedGuidingSession" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import AutorunLogDetails from './ASIAIRLogDetails.vue';
import PHDLogDetails from './PHDLogDetails.vue';
import PHDLogGuidingCharts from './PHDLogGuidingCharts.vue';
import { ASIAIRLog } from '../store/modules/ASIAIR/ASIAIR.types';
import { GuidingSession, PHDLog } from '../store/modules/PHD/PHD.types';
import { PHDGetterTypes } from '../store/modules/PHD/PHD.getters';
import { useASIAIRStore, usePHDStore } from '../store';
import { ASIAIRGetterTypes } from '../store/modules/ASIAIR/ASIAIR.getters';

export default defineComponent({
  name: 'GuidingPerformance',
  components: {
    AutorunLogDetails,
    PHDLogDetails,
    PHDLogGuidingCharts,
  },
  setup(props, { emit }) {
    const phdStore = usePHDStore();
    const asiairStore = useASIAIRStore();
    const phdLog: PHDLog = phdStore.getters(PHDGetterTypes.GET_PHD_LOG);
    const asiairLog: ASIAIRLog = asiairStore.getters(ASIAIRGetterTypes.GET_ASIAIR_LOG);

    const selectedGuidingSession = ref(phdLog.guidingSessions[0]);

    function updateSelectedGuidingSession(guidingSession: GuidingSession) {
      selectedGuidingSession.value = guidingSession;
    }

    return {
      updateSelectedGuidingSession, selectedGuidingSession,
      asiairLog, phdLog,
    };
  },
});
</script>

<style scoped>

</style>
