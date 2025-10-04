<template>
  <div class="analysis-progress" :class="{ 'collapsed': isCollapsed }">
    <div class="progress-header" @click="toggleCollapsed">
      <span class="progress-icon">📋</span>
      <span v-if="!isCollapsed" class="progress-title">Analysis Progress</span>
      <button class="collapse-toggle" :class="{ 'collapsed': isCollapsed }">
        <span class="toggle-icon">{{ isCollapsed ? '→' : '←' }}</span>
      </button>
    </div>
    
    <div v-show="!isCollapsed" class="progress-content">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ height: `${overallProgress}%` }"></div>
      </div>
      
      <div class="progress-steps">
        <div
          v-for="step in analysisSteps"
          :key="step.id"
          class="progress-step"
          :class="{
            'completed': step.completed,
            'active': step.active,
            'in-view': step.inView
          }"
          @click="scrollToSection(step.id)"
        >
          <div class="step-indicator">
            <span v-if="step.completed" class="step-check">✓</span>
            <span v-else-if="step.active" class="step-active">●</span>
            <span v-else class="step-number">{{ step.order }}</span>
          </div>
          
          <div class="step-content">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-description">{{ step.description }}</div>
            <div v-if="step.active && step.progress < 100" class="step-progress">
              <div class="step-progress-bar">
                <div 
                  class="step-progress-fill" 
                  :style="{ width: `${step.progress}%` }"
                ></div>
              </div>
              <span class="step-progress-text">{{ Math.round(step.progress) }}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="overall-progress">
        <div class="overall-progress-text">
          Overall Progress: {{ Math.round(overallProgress) }}%
        </div>
        <div class="completed-sections">
          {{ completedSteps.length }} of {{ analysisSteps.length }} sections completed
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  order: number;
  completed: boolean;
  active: boolean;
  inView: boolean;
  progress: number;
  element?: HTMLElement | null;
}

const isCollapsed = ref(false);
const currentScrollY = ref(0);

const analysisSteps = ref<AnalysisStep[]>([
  {
    id: 'analysis-header',
    title: 'Analysis Overview',
    description: 'Introduction and data summary',
    order: 1,
    completed: false,
    active: false,
    inView: false,
    progress: 0
  },
  {
    id: 'analysis-grid',
    title: 'Log Details',
    description: 'ASIAIR and PHD2 log information',
    order: 2,
    completed: false,
    active: false,
    inView: false,
    progress: 0
  },
  {
    id: 'chart-controls',
    title: 'Chart Controls',
    description: 'Data filtering and scale options',
    order: 3,
    completed: false,
    active: false,
    inView: false,
    progress: 0
  },
  {
    id: 'chart-statistics',
    title: 'Performance Statistics',
    description: 'RMS errors and quality metrics',
    order: 4,
    completed: false,
    active: false,
    inView: false,
    progress: 0
  },
  {
    id: 'frame-recommendations',
    title: 'Frame Recommendations',
    description: 'Problematic frame identification',
    order: 5,
    completed: false,
    active: false,
    inView: false,
    progress: 0
  },
  {
    id: 'guiding-charts',
    title: 'Guiding Charts',
    description: 'Time series, scatter, and CDF plots',
    order: 6,
    completed: false,
    active: false,
    inView: false,
    progress: 0
  },
  {
    id: 'additional-analysis',
    title: 'Environmental Data',
    description: 'Temperature and focus analysis',
    order: 7,
    completed: false,
    active: false,
    inView: false,
    progress: 0
  }
]);

const completedSteps = computed(() => 
  analysisSteps.value.filter(step => step.completed)
);

const overallProgress = computed(() => {
  const totalSteps = analysisSteps.value.length;
  const completedCount = completedSteps.value.length;
  const activeStep = analysisSteps.value.find(step => step.active && !step.completed);
  
  let progress = 0;
  
  if (activeStep && activeStep.progress > 0) {
    // Add completed steps + partial progress of active step
    progress = ((completedCount + (activeStep.progress / 100)) / totalSteps) * 100;
  } else {
    // Only count completed steps
    progress = (completedCount / totalSteps) * 100;
  }
  
  // Ensure progress never exceeds 100%
  return Math.min(progress, 100);
});

const toggleCollapsed = () => {
  isCollapsed.value = !isCollapsed.value;
};

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId) || document.querySelector(`.${sectionId}`);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start',
      inline: 'nearest'
    });
  }
};

const updateProgress = () => {
  const viewportHeight = window.innerHeight;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const documentHeight = document.documentElement.scrollHeight;
  const isAtBottom = scrollTop + viewportHeight >= documentHeight - 10; // 10px tolerance
  
  currentScrollY.value = scrollTop;
  
  analysisSteps.value.forEach((step, index) => {
    // Try multiple selectors to find the element
    let element = document.getElementById(step.id);
    if (!element) {
      element = document.querySelector(`.${step.id}`);
    }
    // Fallback selectors for specific sections
    if (!element && step.id === 'charts-section') {
      element = document.querySelector('.charts-card');
    }
    if (!element && step.id === 'guiding-charts') {
      element = document.querySelector('.charts-section');
    }
    
    step.element = element;
    
    if (element) {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + scrollTop;
      const elementBottom = elementTop + rect.height;
      
      // Check if element is in view
      step.inView = rect.top < viewportHeight && rect.bottom > 0;
      
      // Special handling for the last section when at bottom of page
      const isLastSection = index === analysisSteps.value.length - 1;
      
      // Calculate progress through the section
      if (scrollTop >= elementTop && scrollTop <= elementBottom) {
        const progressThroughElement = (scrollTop - elementTop) / rect.height;
        step.progress = Math.min(Math.max(progressThroughElement * 100, 0), 100);
        
        // Mark as completed if we've scrolled past 80% of the element
        // OR if this is the last section and we're at the bottom of the page
        if (step.progress > 80 || (isLastSection && isAtBottom)) {
          step.completed = true;
          step.active = false; // Completed steps should not be active
          step.progress = 100;
        } else {
          step.active = true;
          step.completed = false;
        }
      } else if (scrollTop > elementBottom) {
        // Completely past this section
        step.completed = true;
        step.active = false;
        step.progress = 100;
      } else if (isLastSection && isAtBottom && scrollTop >= elementTop) {
        // Special case: last section when at bottom but haven't scrolled past it
        step.completed = true;
        step.active = false; // Even for last section, completed means not active
        step.progress = 100;
      } else {
        // Haven't reached this section yet
        step.active = false;
        step.progress = 0;
        if (scrollTop < elementTop) {
          step.completed = false;
        }
      }
    }
  });
  
  // Ensure only one active step at a time
  const activeSteps = analysisSteps.value.filter(step => step.active);
  if (activeSteps.length > 1) {
    // Keep the last active step (most recent), deactivate others
    for (let i = 0; i < activeSteps.length - 1; i++) {
      activeSteps[i].active = false;
    }
  }
};

const handleScroll = () => {
  requestAnimationFrame(updateProgress);
};

onMounted(() => {
  // Initial update after a short delay to ensure DOM is ready
  setTimeout(() => {
    updateProgress();
  }, 1000);
  
  // Add scroll listener
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Update periodically to catch dynamic content changes
  const interval = setInterval(updateProgress, 2000);
  
  onUnmounted(() => {
    clearInterval(interval);
  });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.analysis-progress {
  position: fixed;
  top: 50%;
  right: 2rem;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
  transition: all 0.3s ease;
  max-width: 320px;
  min-width: 280px;
}

.analysis-progress.collapsed {
  min-width: 60px;
  max-width: 60px;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.progress-icon {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.progress-title {
  font-weight: 600;
  color: var(--gray-800);
  flex-grow: 1;
}

.collapse-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: var(--gray-600);
}

.collapse-toggle:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--gray-800);
}

.toggle-icon {
  font-size: 1rem;
  font-weight: bold;
}

.progress-content {
  padding: 1rem;
}

.progress-bar {
  width: 4px;
  height: 280px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  position: relative;
  margin: 0 auto 1.5rem;
}

.progress-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, #667eea, #764ba2);
  border-radius: 2px;
  transition: height 0.5s ease;
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-step {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.progress-step:hover {
  background: rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.2);
}

.progress-step.active {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
}

.progress-step.completed {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
}

.progress-step.in-view {
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.step-indicator {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.1);
  color: var(--gray-600);
  transition: all 0.2s ease;
}

.progress-step.completed .step-indicator {
  background: #22c55e;
  color: white;
}

.progress-step.active .step-indicator {
  background: #667eea;
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.step-check {
  font-size: 1rem;
}

.step-active {
  font-size: 0.5rem;
}

.step-number {
  font-size: 0.75rem;
}

.step-content {
  flex-grow: 1;
  min-width: 0;
}

.step-title {
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.step-description {
  color: var(--gray-600);
  font-size: 0.75rem;
  line-height: 1.4;
}

.step-progress {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.step-progress-bar {
  flex-grow: 1;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.step-progress-fill {
  height: 100%;
  background: #667eea;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.step-progress-text {
  font-size: 0.625rem;
  color: var(--gray-600);
  font-weight: 600;
  min-width: 32px;
}

.overall-progress {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  text-align: center;
}

.overall-progress-text {
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.completed-sections {
  color: var(--gray-600);
  font-size: 0.75rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .analysis-progress {
    right: 1rem;
    max-width: 280px;
    min-width: 240px;
  }
  
  .analysis-progress.collapsed {
    min-width: 50px;
    max-width: 50px;
  }
}

@media (max-width: 768px) {
  .analysis-progress {
    position: fixed;
    top: auto;
    bottom: 2rem;
    right: 1rem;
    left: 1rem;
    transform: none;
    max-width: none;
    min-width: auto;
  }
  
  .analysis-progress.collapsed {
    left: auto;
    right: 1rem;
    min-width: 50px;
    max-width: 50px;
  }
  
  .progress-bar {
    height: 140px;
  }
  
  .progress-steps {
    gap: 0.75rem;
  }
  
  .progress-step {
    padding: 0.5rem;
  }
}

@media (max-width: 480px) {
  .analysis-progress {
    bottom: 1rem;
    right: 0.5rem;
    left: 0.5rem;
  }
  
  .progress-content {
    padding: 0.75rem;
  }
}

/* Print styles */
@media print {
  .analysis-progress {
    display: none;
  }
}
</style>
