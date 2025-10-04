<template>
  <div class="uploader">
    <FileUploader />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FileUploader from '../components/File/FileUploader.vue';

export default defineComponent({
  name: 'Home',
  components: {
    FileUploader,
  },
});
</script>

<style scoped>
.uploader {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
