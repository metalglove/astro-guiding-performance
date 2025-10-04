<template>
  <div class="file-upload-container">
    <div class="upload-header">
      <h2 class="upload-title">
        <span class="upload-icon">{{ icon }}</span>
        {{ fileUploadContainerTitle }}
      </h2>
      <p class="upload-description">{{ description }}</p>
    </div>
    
    <div 
      class="upload-area"
      :class="{ 'drag-over': isDragOver, 'file-uploaded': fileText }"
      @drop="onDrop"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @click="triggerFileInput"
    >
      <input
        type="file"
        ref="fileInput"
        accept="text/plain"
        name="upload"
        @change="onEventFilePicked"
        class="hidden-input"
      />
      
      <div v-if="!fileText" class="upload-prompt">
        <div class="upload-icon-large">📤</div>
        <p class="upload-text">
          <strong>Click to browse</strong> or drag and drop your file here
        </p>
        <p class="upload-hint">Supports .txt files only</p>
      </div>
      
      <div v-else class="upload-success">
        <div class="success-icon">✅</div>
        <p class="success-text">File uploaded successfully!</p>
        <button @click.stop="clearFile" class="clear-button">
          <span>✕</span>
          Clear file
        </button>
      </div>
    </div>
    
    <div v-if="fileText" class="file-preview">
      <div class="preview-header">
        <h3>File Preview</h3>
        <span class="file-size">{{ formatFileSize(fileText.length) }}</span>
      </div>
      <div class="preview-content">
        <textarea 
          v-model="filePreview" 
          readonly 
          class="preview-textarea"
          placeholder="File content will appear here..."
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  name: 'FileUpload',
  emits: ['fileUploaded'],
  props: {
    fileUploadContainerTitle: { type: String, required: true },
    logType: { type: String, required: true },
    icon: { type: String, default: '📄' },
    description: { type: String, default: '' },
  },
  setup(props, { emit }) {
    const fileText = ref('');
    const isDragOver = ref(false);
    const fileInput = ref<HTMLInputElement>();

    const filePreview = computed(() => {
      if (!fileText.value) return '';
      const lines = fileText.value.split('\n');
      return lines.slice(0, 10).join('\n') + (lines.length > 10 ? '\n... (truncated)' : '');
    });

    const processFile = (file: File) => {
      const fileReader: FileReader = new FileReader();
      fileReader.addEventListener('load', () => {
        fileText.value = fileReader.result as string;
        console.log(`[${props.logType}] Read text from file (first line): "${fileText.value.split('\n')[0]}"`);
        const textFile = { logType: props.logType, text: fileText.value };
        emit('fileUploaded', textFile);
      });
      fileReader.readAsText(file);
    };

    const onEventFilePicked = (event: Event) => {
      const { files } = event.target as HTMLInputElement;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    };

    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      isDragOver.value = false;
      
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          processFile(file);
        } else {
          alert('Please upload a text file (.txt)');
        }
      }
    };

    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      isDragOver.value = true;
    };

    const onDragLeave = () => {
      isDragOver.value = false;
    };

    const triggerFileInput = () => {
      if (!fileText.value) {
        fileInput.value?.click();
      }
    };

    const clearFile = () => {
      fileText.value = '';
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    };

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return {
      fileText,
      filePreview,
      isDragOver,
      fileInput,
      onEventFilePicked,
      onDrop,
      onDragOver,
      onDragLeave,
      triggerFileInput,
      clearFile,
      formatFileSize,
    };
  },
});
</script>

<style scoped>
.file-upload-container {
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.upload-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.upload-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 0.5rem;
}

.upload-icon {
  font-size: 1.5rem;
}

.upload-description {
  color: var(--gray-600);
  font-size: 0.875rem;
  line-height: 1.4;
}

.upload-area {
  border: 2px dashed var(--gray-300);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: var(--transition);
  background: var(--gray-50);
  position: relative;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background: rgba(102, 126, 234, 0.05);
}

.upload-area.drag-over {
  border-color: var(--primary-color);
  background: rgba(102, 126, 234, 0.1);
  transform: scale(1.02);
}

.upload-area.file-uploaded {
  border-color: var(--success-color);
  background: rgba(72, 187, 120, 0.05);
  cursor: default;
}

.hidden-input {
  display: none;
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon-large {
  font-size: 3rem;
  opacity: 0.6;
}

.upload-text {
  color: var(--gray-700);
  font-size: 1rem;
  margin: 0;
}

.upload-text strong {
  color: var(--primary-color);
}

.upload-hint {
  color: var(--gray-500);
  font-size: 0.875rem;
  margin: 0;
}

.upload-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.success-icon {
  font-size: 3rem;
}

.success-text {
  color: var(--success-color);
  font-weight: 600;
  margin: 0;
}

.clear-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px solid var(--gray-300);
  color: var(--gray-600);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
  font-size: 0.875rem;
}

.clear-button:hover {
  background: var(--gray-100);
  border-color: var(--gray-400);
  color: var(--gray-700);
}

.file-preview {
  margin-top: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.preview-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0;
}

.file-size {
  background: var(--gray-100);
  color: var(--gray-600);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius);
  font-size: 0.75rem;
  font-weight: 500;
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-textarea {
  width: 100%;
  min-height: 200px;
  max-height: 300px;
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  background: var(--gray-50);
  color: var(--gray-700);
  resize: vertical;
}

.preview-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

@media (max-width: 768px) {
  .file-upload-container {
    padding: 1rem;
  }
  
  .upload-area {
    padding: 1.5rem;
    min-height: 150px;
  }
  
  .upload-icon-large {
    font-size: 2.5rem;
  }
  
  .preview-textarea {
    min-height: 150px;
    font-size: 0.7rem;
  }
}
</style>
