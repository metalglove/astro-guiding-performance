<template>
  <div>
    <h2>ASIAIR autorun log details</h2>
    <b>Log date:</b><br/> {{ asiairLog.datetime }} <br/>
    <b>Autorun sessions:</b><br/> {{ asiairLog.autoruns.length }} <br/>
    <b>Targets:</b><br/>
    <div v-for="autorun in asiairLog.autoruns" v-bind:key="autorun.startTime">
      <pre> {{ planText(autorun) }} </pre>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Autorun, ASIAIRLog, ExposureEvent } from '../store/modules/ASIAIR/ASIAIR.types';
import { groupBy } from '../utilities/helpers';

export default defineComponent({
  name: 'AutorunLogDetails',
  props: {
    asiairLog: {
      type: Object as PropType<ASIAIRLog>,
      required: true
    },
  },
  components: {
  },
  setup(props, { emit }) {

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

    return { planText };
  },
});
</script>

<style scoped>
</style>
