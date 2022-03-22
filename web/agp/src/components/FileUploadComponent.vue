<template>
  <div>
    <h2>{{ fileUploadContainerTitle }}</h2>
    <div class="sub-upload">
      <input
        type="file"
        ref="eventFileInput"
        accept="text/plain"
        name="upload"
        @change="onEventFilePicked"
      />
      <textarea v-model="fileText" disabled>
      </textarea>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'FileUpload',
  emits: ['fileUploaded'],
  props: {
    fileUploadContainerTitle: { type: String, required: true },
    logType: { type: String, required: true },
  },
  setup(props, { emit }) {
    const fileText = ref('');

    const onEventFilePicked = (event: Event) => {
      const { files } = event.target as HTMLInputElement;
      if (files == null) {
        return;
      }

      const fileReader: FileReader = new FileReader();
      fileReader.addEventListener('load', () => {
        fileText.value = fileReader.result as string;
        console.log(`[${props.logType}] Read text from file (first line): "${fileText.value.split('\n')[0]}"`);
        const textFile = { logType: props.logType, text: fileText.value };
        emit('fileUploaded', textFile);
      });

      const file: File = files[0];
      fileReader.readAsText(file);
    };

    return {
      fileText,
      onEventFilePicked,
    };
  },
});
</script>

<style scoped>
.sub-upload {
  display: grid;
}
textarea {
  min-height: 200px
}
</style>
