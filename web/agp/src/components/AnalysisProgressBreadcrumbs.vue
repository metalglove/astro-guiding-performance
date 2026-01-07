<template>
  <div class="analysis-progress" :class="{ 'collapsed': isCollapsed }">
    <!-- Toggle Button -->
    <button @click="toggleCollapsed" class="collapse-toggle" aria-label="Toggle progress view">
      <span class="toggle-icon">{{ isCollapsed ? '▶' : '◀' }}</span>
    </button>

    <!-- Progress Header -->
    <div class="progress-header">
      <h3 class="progress-title">Analysis Progress</h3>
      <div class="progress-summary">
        {{ completedSteps.length }} of {{ analysisSteps.length }} sections completed
      </div>
    </div>

    <!-- Progress Steps -->
    <div class="progress-steps">
      <div
        v-for="step in analysisSteps"
        :key="step.id"
        :id="`breadcrumb-${step.id}`"
        class="progress-step"
        :class="{ 'completed': step.completed, 'active': step.active, 'in-view': step.inView }"
      >
        <div class="step-indicator">
          <div class="step-number">{{ step.order }}</div>
          <div v-if="step.completed" class="step-check">✓</div>
        </div>
        <div class="step-content">
          <div class="step-title">{{ step.title }}</div>
          <div class="step-description">{{ step.description }}</div>
          <div v-if="step.active" class="step-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: step.progress + '%' }"></div>
            </div>
            <div class="progress-text">{{ Math.round(step.progress) }}% complete</div>
          </div>
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
    id: 'drift-analysis',
    title: 'Drift Analysis',
    description: 'Drift patterns and stability metrics',
    order: 6,
    completed: false,
    active: false,
    inView: false,
    progress: 0
  },
  {
    id: 'guiding-charts',
    title: 'Guiding Charts',
    description: 'Time series, scatter, and CDF plots',
    order: 7,
    completed: false,
    active: false,
    inView: false,
    progress: 0
  },
  {
    id: 'additional-analysis',
    title: 'Environmental Data',
    description: 'Temperature and focus analysis',
    order: 8,
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
  
  if (completedCount === totalSteps) {
    return 100;
  }
  
  const baseProgress = (completedCount / totalSteps) * 100;
  const activeProgress = activeStep ? (activeStep.progress / totalSteps) : 0;
  
  return Math.min(100, baseProgress + activeProgress);
});

const activeStep = computed(() => 
  analysisSteps.value.find(step => step.active && !step.completed)
);

// Intersection Observer for scroll-based progress tracking
let observer: IntersectionObserver | null = null;

const initScrollTracking = () => {
  const stepElements = analysisSteps.value.map(step => 
    document.getElementById(step.id)
  ).filter(el => el !== null) as HTMLElement[];

  if (stepElements.length === 0) return;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const stepId = entry.target.id;
        const step = analysisSteps.value.find(s => s.id === stepId);
        
        if (step) {
          step.inView = entry.isIntersecting;
          
          if (entry.isIntersecting) {
            // Calculate progress based on element position in viewport
            const rect = entry.boundingClientRect;
            const windowHeight = window.innerHeight;
            const elementTop = rect.top;
            const elementHeight = rect.height;
            
            // Progress based on how much of the element is visible
            const visibleTop = Math.max(0, -elementTop);
            const visibleBottom = Math.min(windowHeight, elementTop + elementHeight);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            
            step.progress = (visibleHeight / elementHeight) * 100;
            
            // Mark as active if significantly visible
            if (step.progress > 30 && !step.completed) {
              step.active = true;
            }
            
            // Mark as completed when fully scrolled past
            if (elementTop + elementHeight < 0) {
              step.completed = true;
              step.active = false;
            }
          }
        }
      });

      // Update active step (only one should be active at a time)
      const visibleSteps = analysisSteps.value.filter(step => step.inView && !step.completed);
      if (visibleSteps.length > 0) {
        // Set the most visible step as active
        visibleSteps.forEach(step => step.active = false);
        const mostVisible = visibleSteps.reduce((prev, current) => 
          prev.progress > current.progress ? prev : current
        );
        mostVisible.active = true;
      }
    },
    {
      root: null,
      rootMargin: '-10% 0px -10% 0px',
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    }
  );

  stepElements.forEach(el => observer?.observe(el));
};

const toggleCollapsed = () => {
  isCollapsed.value = !isCollapsed.value;
};

onMounted(() => {
  initScrollTracking();
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.analysis-progress {
  position: fixed;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  width: 280px;
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 1rem;
  z-index: 1000;
  transition: all 0.3s ease;
  max-height: 80vh;
  overflow-y: auto;
}

.analysis-progress.collapsed {
  width: 60px;
  padding: 1rem 0.5rem;
}

.collapse-toggle {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--gray-600);
  padding: 0.25rem;
  border-radius: var(--border-radius-sm);
  transition: var(--transition);
}

.collapse-toggle:hover {
  background: var(--gray-100);
  color: var(--gray-800);
}

.toggle-icon {
  display: inline-block;
  transition: transform 0.3s ease;
}

.analysis-progress.collapsed .toggle-icon {
  transform: rotate(180deg);
}

.progress-header {
  margin-bottom: 1rem;
}

.analysis-progress.collapsed .progress-header {
  display: none;
}

.progress-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 0.25rem;
}

.progress-summary {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.analysis-progress.collapsed .progress-steps {
  display: none;
}

.progress-step {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  border: 2px solid var(--gray-200);
  background: var(--gray-50);
  transition: var(--transition);
}

.progress-step.completed {
  border-color: var(--success-color);
  background: var(--success-light);
}

.progress-step.active {
  border-color: var(--primary-color);
  background: var(--primary-light);
  box-shadow: var(--shadow);
}

.progress-step.in-view {
  border-color: var(--warning-color);
  background: var(--warning-light);
}

.step-indicator {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-600);
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.progress-step.completed .step-indicator {
  background: var(--success-color);
  color: var(--white);
}

.progress-step.active .step-indicator {
  background: var(--primary-color);
  color: var(--white);
}

.step-check {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--white);
  font-weight: bold;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-title {
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 0.125rem;
  font-size: 0.875rem;
}

.step-description {
  color: var(--gray-600);
  font-size: 0.75rem;
  line-height: 1.3;
  margin-bottom: 0.5rem;
}

.step-progress {
  margin-top: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--gray-600);
  text-align: right;
}

.analysis-progress.collapsed {
  right: -220px;
}

.analysis-progress.collapsed:hover {
  right: 1rem;
}

@media (max-width: 1024px) {
  .analysis-progress {
    position: static;
    top: auto;
    right: auto;
    transform: none;
    width: 100%;
    max-height: none;
    margin-bottom: 2rem;
    order: -1;
  }

  .analysis-progress.collapsed {
    right: auto;
    width: 100%;
  }

  .analysis-progress.collapsed:hover {
    right: auto;
  }

  .collapse-toggle {
    display: none;
  }

  .progress-steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  .progress-step {
    padding: 0.5rem;
  }

  .step-content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }

  .step-description {
    flex: 1;
    margin-bottom: auto;
  }
}

@media (max-width: 640px) {
  .progress-steps {
    grid-template-columns: 1fr;
  }

  .progress-step {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .step-indicator {
    margin-bottom: 0.5rem;
  }
}
</style>
