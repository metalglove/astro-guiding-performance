# Code Review Issues

This document contains findings from a comprehensive code review of the Astro Guiding Performance application. Issues are categorized by severity and type.

## Table of Contents
- [Critical Issues](#critical-issues)
- [Code Quality Issues](#code-quality-issues)
- [Dependency Issues](#dependency-issues)
- [Architecture/Design Issues](#architecturedesign-issues)
- [Documentation Issues](#documentation-issues)

---

## Critical Issues

### 1. Logic Bug: Dropped Frames Added to Session
**File**: `/web/agp/src/services/PHDLogReader.ts:410-416`
**Severity**: HIGH
**Status**: Open

**Description**: When a guiding frame has `mount === 'DROP'`, the code creates a minimal GuidingFrame object but doesn't include a `continue` statement. This causes the dropped frame to fall through and potentially be added to the session's guidingFrames array.

**Current Code**:
```typescript
if (mount === 'DROP') {
  guidingFrame = {
    frame: parseInt(cells[0]),
    mount: mount,
    ErrorCode: cells[17]
  } as GuidingFrame;
  // MISSING continue statement here!
} else {
  // ... normal frame processing
}
// Falls through to line 440 which adds to guidingFrames
if (!isNaN(guidingFrame.frame)) {
  currentGuidingSession!.guidingFrames.push(guidingFrame);
}
```

**Impact**:
- Dropped frames are incorrectly included in analysis
- RMS statistics become inaccurate
- Frame count calculations are wrong
- Data integrity compromised

**Recommendation**: Add `continue` statement after creating the DROP frame object to skip to the next iteration.

**Fix**:
```typescript
if (mount === 'DROP') {
  guidingFrame = {
    frame: parseInt(cells[0]),
    mount: mount,
    ErrorCode: cells[17]
  } as GuidingFrame;
  continue; // ← Add this line
}
```

---

### 2. Comparison Operator: == Instead of ===
**Files**:
- `/web/agp/src/services/PHDLogReader.ts:15`
- `/web/agp/src/services/ASIAIRLogReader.ts:22`

**Severity**: MEDIUM
**Status**: Open

**Description**: Using loose equality (`==`) instead of strict equality (`===`) for numeric comparisons can lead to type coercion bugs.

**Current Code**:
```typescript
if (index == lines.length) {  // PHDLogReader.ts:15
  return false;
}

if (index == lines.length) {  // ASIAIRLogReader.ts:22
  return false;
}
```

**Impact**:
- Potential type coercion bugs if `index` or `lines.length` is unexpectedly not a number
- Fails TypeScript strict mode best practices
- May cause unexpected behavior with edge cases

**Recommendation**: Replace all `==` with `===` and all `!=` with `!==` throughout the codebase for type safety.

**Fix**:
```typescript
if (index === lines.length) {  // Use strict equality
  return false;
}
```

---

### 3. No Input Validation on Log Parsing
**Files**:
- `/web/agp/src/services/PHDLogReader.ts`
- `/web/agp/src/services/ASIAIRLogReader.ts`

**Severity**: HIGH
**Status**: Open

**Description**: User-uploaded log files are parsed without validation. Malformed files can cause:
- Uncaught exceptions that crash the parser
- Infinite loops in `while` statements (e.g., lines 39, 121, 322, 388 in PHDLogReader)
- Array index out of bounds errors
- Regular expression catastrophic backtracking

**Examples of Vulnerable Code**:
```typescript
// PHDLogReader.ts - Infinite loop risk
while (index < lines.length) {
  // No timeout mechanism, no iteration limit
  // Could loop forever if updateCurrentLine() has bugs
}

// No validation before regex execution
const match = re.exec(currentLine);
if (match === null) {
  throw new Error('Unable to parse...'); // Uncaught, crashes app
}
```

**Impact**:
- Application crash from malformed log files
- Browser tab freeze from infinite loops
- Poor user experience with no error recovery
- Potential security vulnerability (DoS via malicious log file)

**Recommendation**:
1. Wrap parsing in try-catch with graceful error handling
2. Add iteration limit counters to prevent infinite loops
3. Validate regex matches more defensively
4. Add timeout mechanisms for parsing operations
5. Display user-friendly error messages

**Fix Example**:
```typescript
public parseText(text: string): PHDLog {
  const MAX_ITERATIONS = 1000000; // Safety limit
  let iterationCount = 0;

  try {
    if (!text.startsWith('PHD2')) {
      throw new Error('Invalid PHD2 log text file.');
    }

    while (index < lines.length) {
      if (++iterationCount > MAX_ITERATIONS) {
        throw new Error('Parsing timeout: file too large or malformed');
      }
      // ... rest of parsing logic
    }
  } catch (error) {
    // Handle gracefully, show user-friendly message
    console.error('Failed to parse PHD2 log:', error);
    throw new Error(`Unable to parse log file: ${error.message}`);
  }
}
```

---

## Code Quality Issues

### 4. TypeScript `any` Type Usage
**Files**: Multiple Vue and TS files
**Severity**: MEDIUM
**Status**: Open

**Description**: Use of `any` type defeats TypeScript's type safety benefits.

**Locations**:
- `/web/agp/src/components/Charts/LineChartComponent.vue:34-35`
  ```typescript
  interface Props {
    title: string;
    chartData: any;      // ← Should be typed
    chartOptions: any;   // ← Should be typed
  }
  ```
- `/web/agp/src/components/Charts/ScatterChartComponent.vue:34-35` - Same issue
- `/web/agp/src/components/Charts/ChartStatistics.vue`
- `/web/agp/src/components/PHDLogGuidingCharts.vue`
- `/web/agp/src/store/index.ts` - Store type definitions
- `/web/agp/src/utilities/helpers.ts`
- `/web/agp/src/utilities/LocalStorageUtilities.ts`

**Impact**:
- Loss of type safety and autocomplete
- Potential runtime errors from type mismatches
- Harder to refactor code safely
- Defeats the purpose of using TypeScript

**Recommendation**: Define proper types using `@types/chart.js` or create interfaces for chart data structures.

**Fix Example**:
```typescript
import { ChartData, ChartOptions } from 'chart.js';

interface Props {
  title: string;
  chartData: ChartData<'line', number[], string>;
  chartOptions: ChartOptions<'line'>;
}
```

---

### 5. Incomplete TODO Comment
**File**: `/web/agp/src/services/ASIAIRLogReader.ts:160`
**Severity**: LOW
**Status**: Open

**Description**: TODO comment suggests refactoring but is incomplete.

**Current Code**:
```typescript
} else if (currentLine.startsWith('Exposure')) {
  // TODO: else if could also be regex instead of
  // startsWith using exposure and image as groups
  const re = /Exposure (.*) image (.*)\#/g;
```

**Impact**:
- Code maintenance confusion
- Unclear if refactoring is needed
- Technical debt

**Recommendation**: Either:
1. Implement the suggested regex approach if it provides benefits
2. Remove the TODO if current implementation is sufficient
3. Create a GitHub issue to track the refactoring task

---

### 6. Console Statements in Production Code
**Files**: Multiple components and utilities
**Severity**: LOW
**Status**: Open

**Description**: While most debug console.log statements were removed (per `todo.md:25`), several legitimate console.error statements remain. However, there's no structured logging or error reporting system.

**Found in**:
- `/web/agp/src/registerServiceWorker.ts` - Acceptable for PWA debugging
- `/web/agp/src/views/PHDLogViewer.vue:215` - Error handlers
- `/web/agp/src/components/File/FileUploader.vue:145, 172` - Error handlers
- `/web/agp/src/components/Charts/LineChartComponent.vue:62` - Error handlers
- `/web/agp/src/utilities/computations/test.ts` - Test file (acceptable)

**Impact**:
- No centralized logging
- Can't configure log levels (dev vs prod)
- No error aggregation or monitoring

**Recommendation**: Consider implementing a structured logging utility:
```typescript
// utilities/logger.ts
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

class Logger {
  private level: LogLevel = process.env.NODE_ENV === 'production'
    ? LogLevel.WARN
    : LogLevel.DEBUG;

  debug(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  error(message: string, error?: Error) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, error);
      // Could integrate with error reporting service (Sentry, etc.)
    }
  }

  private shouldLog(level: LogLevel): boolean {
    // Implement log level comparison
    return true;
  }
}

export const logger = new Logger();
```

---

### 7. Type Definition: GuidingFrame Discriminated Union
**File**: `/web/agp/src/store/modules/PHD/PHD.types.ts:1-21`
**Severity**: MEDIUM
**Status**: Open

**Description**: GuidingFrame interface doesn't use discriminated union for DROP vs MOUNT states, allowing invalid states (e.g., DROP frame with tracking data).

**Current Code**:
```typescript
interface GuidingFrame {
  frame: number;
  timeInMilliseconds: number;
  datetime: Date;
  mount: string; // "MOUNT" or "DROP"
  dx: number;
  dy: number;
  RARawDistance: number;
  // ... all other fields always present
}
```

**Problems**:
- DROP frames shouldn't have tracking data (dx, dy, RA/Dec errors)
- String type for `mount` allows invalid values
- No compile-time enforcement of valid states
- Consumer code must remember to check `mount` field

**Recommendation**: Use discriminated union:
```typescript
type DroppedFrame = {
  mount: 'DROP';
  frame: number;
  ErrorCode: string;
};

type TrackingFrame = {
  mount: 'MOUNT';
  frame: number;
  timeInMilliseconds: number;
  datetime: Date;
  dx: number;
  dy: number;
  RARawDistance: number;
  DECRawDistance: number;
  RAGuideDistance: number;
  DECGuideDistance: number;
  RADuration: number;
  RADirection: string;
  DECDuration: number;
  DECDirection: string;
  XStep: number;
  YStep: number;
  StarMass: number;
  SNR: number;
  ErrorCode: string;
};

type GuidingFrame = DroppedFrame | TrackingFrame;
```

**Benefits**:
- Type safety: Can't create invalid states
- Self-documenting code
- TypeScript narrows types after checking `mount` field
- Better IDE autocomplete

---

## Dependency Issues

### 8. Outdated Major Dependencies
**File**: `/web/agp/package.json`
**Severity**: MEDIUM
**Status**: Open

**Description**: Several major dependencies are outdated, missing bug fixes, performance improvements, and new features.

| Package | Current | Latest | Status | Notes |
|---------|---------|--------|--------|-------|
| vue | 3.2.31 | 3.4.x | 2 minor versions behind | Missing Composition API improvements, performance fixes |
| chart.js | 3.7.1 | 4.4.x | 1 major version behind | Breaking changes in 4.x, but improved performance |
| typescript | 4.1.5 | 5.3.x | 1 major version behind | Missing latest type features, better inference |
| moment.js | 2.30.1 | deprecated | Not maintained | Large bundle size (~70KB), use date-fns or native Intl |

**Impact**:
- Missing bug fixes and security patches
- Missing performance improvements
- Larger bundle size (especially moment.js)
- Can't use latest TypeScript features
- Technical debt accumulation

**Recommendations**:

1. **Vue 3.2.31 → 3.4.x** (Low risk)
   - Minimal breaking changes
   - Better Composition API types
   - Performance improvements
   - Action: Upgrade in package.json, test thoroughly

2. **Chart.js 3.7.1 → 4.x** (Medium risk)
   - Breaking changes in API
   - Better performance and tree-shaking
   - Consider: Stay on 3.x LTS if upgrade is too disruptive
   - Action: Evaluate migration effort vs benefits

3. **TypeScript 4.1.5 → 5.x** (Low risk)
   - Mostly backward compatible
   - Better type inference and error messages
   - Smaller emit size
   - Action: Upgrade, fix any new type errors

4. **moment.js → date-fns or native Intl** (Medium effort)
   - date-fns: ~15KB (modular), same API style
   - native Intl.DateTimeFormat: 0KB, built-in
   - Action: Gradually replace moment.js usage
   - Files using moment.js:
     - `/web/agp/src/components/Charts/LineChartComponent.vue`
     - Chart.js adapter

**Migration Priority**:
1. TypeScript 5.x (easy, high value)
2. Vue 3.4.x (easy, medium value)
3. Replace moment.js (medium effort, high value for bundle size)
4. Chart.js 4.x (hard, evaluate later)

---

### 9. Missing Development Dependencies
**File**: `/web/agp/package.json`
**Severity**: LOW
**Status**: Open

**Description**: No testing framework installed. The test file at `/web/agp/src/utilities/computations/test.ts` is just a console-based manual test script.

**Current Testing**:
- No automated tests
- No test runner
- No coverage reports
- Manual verification only

**Impact**:
- Regressions not caught early
- Refactoring is risky
- No confidence in changes
- Harder to onboard contributors

**Recommendation**: Add proper testing infrastructure:

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vue/test-utils": "^2.4.0",
    "@vitest/ui": "^1.0.0",
    "happy-dom": "^12.0.0"
  }
}
```

**Benefits**:
- Fast test execution (Vite-powered)
- Vue component testing support
- Visual test UI
- TypeScript support out of the box

**Priority Areas for Tests**:
1. **Critical computations** (already has manual test):
   - `/web/agp/src/utilities/computations/astronomical.ts`
   - `/web/agp/src/utilities/computations/statistics.ts`
   - `/web/agp/src/utilities/computations/quality.ts`

2. **Log parsers** (complex logic):
   - `/web/agp/src/services/PHDLogReader.ts`
   - `/web/agp/src/services/ASIAIRLogReader.ts`

3. **Store modules** (business logic):
   - PHD, ASIAIR, Equipment stores

4. **Complex components** (user-facing):
   - Chart components
   - File upload handling

---

## Architecture/Design Issues

### 10. No Error Boundaries
**Files**: Vue components (all)
**Severity**: MEDIUM
**Status**: Open

**Description**: Vue 3 components don't implement error boundaries. If a child component throws an error during rendering or in a lifecycle hook, it can crash the entire app.

**Current Behavior**:
- Error in child component → app white screen
- No fallback UI
- Poor user experience
- Difficult to debug in production

**Recommendation**: Implement error boundaries using Vue 3's `errorCaptured` hook and global error handler.

**Fix 1: Global Error Handler** (`main.ts`):
```typescript
const app = createApp(App);

// Global error handler for uncaught errors
app.config.errorHandler = (err, instance, info) => {
  console.error('[Global Error]', err, info);

  // Could send to error reporting service (Sentry, etc.)
  // reportError(err, { component: instance?.$options.name, info });

  // Show user-friendly error message
  // store.dispatch('showErrorNotification', err.message);
};

app.mount('#app');
```

**Fix 2: Error Boundary Component**:
```vue
<template>
  <div v-if="error" class="error-boundary">
    <h2>Something went wrong</h2>
    <p>{{ error.message }}</p>
    <button @click="reset">Try Again</button>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';

const error = ref<Error | null>(null);

onErrorCaptured((err: Error) => {
  error.value = err;
  console.error('[Error Boundary]', err);
  return false; // Prevent propagation
});

function reset() {
  error.value = null;
}
</script>
```

**Usage**:
```vue
<ErrorBoundary>
  <PHDLogGuidingCharts />
</ErrorBoundary>
```

---

### 11. No Loading States for Async Operations
**Files**: Multiple components
**Severity**: LOW
**Status**: Open

**Description**: Some async operations show loading indicators, but others don't provide visual feedback during processing.

**Current State**:
- ✅ Has loading: File upload (FileUploader.vue), example data loading
- ❌ No loading: Log parsing, chart rendering, equipment profile operations

**Impact**:
- User uncertainty during slow operations
- Appears frozen or unresponsive
- Poor perceived performance

**Recommendation**: Standardize loading state pattern across all async operations.

**Pattern**:
```typescript
const isLoading = ref(false);
const loadingMessage = ref('');

async function performAsyncOperation() {
  isLoading.value = true;
  loadingMessage.value = 'Processing log files...';

  try {
    await longRunningTask();
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
}
```

---

### 12. Accessibility Issues
**Files**: All Vue components
**Severity**: MEDIUM
**Status**: Open

**Description**: Missing accessibility features that prevent users with disabilities from using the application effectively.

**Issues Found**:

1. **No ARIA labels on interactive elements**
   - Buttons lack descriptive labels for screen readers
   - Icons without text alternatives
   - Custom controls not announced properly

2. **Chart visualizations lack screen reader descriptions**
   - No text alternatives for visual data
   - No data tables for screen reader users
   - Missing `role` and `aria-` attributes

3. **No keyboard navigation**
   - Timeline scrubbing requires mouse
   - Chart controls not keyboard accessible
   - No focus trap in modals (if any)

4. **Missing focus indicators**
   - Custom buttons don't show focus state
   - Unclear which element has focus
   - Tab order not logical

5. **No skip links**
   - Screen reader users must tab through entire navigation
   - No "skip to main content" link

**Recommendations**:

1. **Add ARIA labels**:
```vue
<button
  @click="play"
  aria-label="Play telescope tracking animation"
  :aria-pressed="isPlaying"
>
  <span aria-hidden="true">▶️</span>
</button>
```

2. **Provide chart text alternatives**:
```vue
<div role="img" aria-label="Guiding error over time chart">
  <canvas ref="chartCanvas" />
  <div class="sr-only">
    <!-- Screen reader only text description -->
    RMS error: {{ rmsTotal.toFixed(2) }} arcseconds.
    {{ percentPerfect.toFixed(1) }}% of frames within perfect threshold.
  </div>
</div>
```

3. **Add keyboard shortcuts**:
```typescript
onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

function handleKeydown(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlayPause();
  } else if (e.code === 'ArrowRight') {
    stepForward();
  } else if (e.code === 'ArrowLeft') {
    stepBackward();
  }
}
```

4. **Add focus indicators** (CSS):
```css
button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
```

5. **Add skip link** (App.vue):
```vue
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--primary-color);
  color: white;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
</style>
```

---

### 13. No Progressive Loading for Large Sessions
**Files**: Chart rendering components
**Severity**: LOW
**Status**: Open

**Description**: All frames are rendered at once. Sessions with 10,000+ frames may cause performance issues.

**Current Behavior**:
- Load entire dataset into Chart.js
- Can cause lag with very large sessions
- Browser may freeze during initial render

**Mitigation**: Already partially implemented via `sampleData` utility in `/web/agp/src/utilities/computations/statistics.ts:137`.

**Recommendation**:
1. Use `sampleData` consistently across all chart components
2. Add UI control to adjust sampling level
3. Show warning for very large datasets
4. Consider virtualization for table views

**Example**:
```typescript
import { sampleData } from '@/utilities/computations/statistics';

// In chart component
const MAX_CHART_POINTS = 5000;
const displayData = computed(() => {
  if (rawData.value.length > MAX_CHART_POINTS) {
    return sampleData(rawData.value, MAX_CHART_POINTS);
  }
  return rawData.value;
});
```

---

## Documentation Issues

### 14. Missing API Documentation
**Files**: Service classes, utility functions
**Severity**: LOW
**Status**: Open

**Description**: While some functions have JSDoc comments (especially in `astronomical.ts`), many don't document parameters, return values, or throw conditions.

**Well-Documented Example** (Good):
```typescript
/**
 * Calculate the pixel scale for a given camera and telescope combination
 *
 * Formula: Pixel Scale (″/px) = (Pixel Size μm × 206,265) / Focal Length mm
 *
 * @param pixelSizeUm - Camera pixel size in micrometers
 * @param focalLengthMm - Telescope focal length in millimeters
 * @param binning - Camera binning factor (default: 1)
 * @returns Pixel scale in arcseconds per pixel
 */
export function calculatePixelScale(
  pixelSizeUm: number,
  focalLengthMm: number,
  binning = 1
): number {
  // ...
}
```

**Poorly Documented Example** (Needs Improvement):
```typescript
// PHDLogReader.ts - No documentation
function parsePixelScaleLine() {
  const re = /Pixel scale = (.*) arc-sec\/px, Binning = (.*), Focal length = (.*) mm/g;
  const match = re.exec(currentLine);
  if (match === null) {
    throw new Error('Unable to parse Pixel line.');
  }
  // ...
}
```

**Recommendation**: Add comprehensive JSDoc comments to:
- Service classes (PHDLogReader, ASIAIRLogReader)
- Utility functions (especially helpers.ts, LocalStorageUtilities.ts)
- Store actions and getters
- Complex algorithms

**Template**:
```typescript
/**
 * Brief one-line description
 *
 * More detailed explanation if needed.
 * Can include multiple paragraphs.
 *
 * @param paramName - Description of parameter
 * @param optionalParam - Description (optional)
 * @returns Description of return value
 * @throws {ErrorType} Description of when error is thrown
 *
 * @example
 * ```typescript
 * const result = functionName(param1, param2);
 * ```
 */
```

---

### 15. No User-Facing Error Messages
**Files**: Error handling throughout
**Severity**: MEDIUM
**Status**: Open

**Description**: Errors thrown with technical messages that are confusing to users.

**Current Examples**:
```typescript
throw new Error('Unable to parse Pixel line.');
throw new Error('Unable to parse Guiding Begins line.');
throw new Error(`Unable to parse Autorun plan name (line: ${index}).`);
```

**Problems**:
- Technical jargon ("parse", "line", internal structure names)
- No guidance on how to fix the issue
- No context about what went wrong
- Scary for non-technical users

**Recommendation**: Create user-friendly error messages that:
1. Explain what went wrong in plain language
2. Suggest how to fix the issue
3. Provide links to documentation or examples

**Error Message Helper**:
```typescript
// utilities/errorMessages.ts
export class UserFriendlyError extends Error {
  constructor(
    public userMessage: string,
    public technicalDetails: string,
    public suggestions: string[]
  ) {
    super(userMessage);
    this.name = 'UserFriendlyError';
  }
}

export function createLogParsingError(
  fileName: string,
  lineNumber: number,
  technicalReason: string
): UserFriendlyError {
  return new UserFriendlyError(
    `Unable to read the log file "${fileName}".`,
    `Parse error at line ${lineNumber}: ${technicalReason}`,
    [
      'Make sure the file is a valid PHD2 guide log',
      'Try opening the file in a text editor to check for corruption',
      'Check if the log was generated by a compatible PHD2 version',
      'Visit our guide: https://example.com/troubleshooting'
    ]
  );
}
```

**Usage**:
```typescript
// In PHDLogReader.ts
if (match === null) {
  throw createLogParsingError(
    'guiding log',
    index,
    'Expected "Pixel scale" line but found different format'
  );
}
```

**Display in UI**:
```vue
<div v-if="error" class="error-message">
  <h3>{{ error.userMessage }}</h3>
  <details>
    <summary>Technical Details</summary>
    <code>{{ error.technicalDetails }}</code>
  </details>
  <div class="suggestions">
    <p>Try these solutions:</p>
    <ul>
      <li v-for="suggestion in error.suggestions" :key="suggestion">
        {{ suggestion }}
      </li>
    </ul>
  </div>
</div>
```

---

## Summary Statistics

**Total Issues**: 15

**By Severity**:
- 🔴 High: 3 (Critical bugs, security issues)
- 🟠 Medium: 7 (Code quality, architecture, usability)
- 🟡 Low: 5 (Documentation, minor improvements)

**By Category**:
- Critical: 3
- Code Quality: 4
- Dependencies: 2
- Architecture/Design: 4
- Documentation: 2

**Priority for Fixes**:
1. Issue #1 (Logic bug - dropped frames) - Quick fix, high impact
2. Issue #3 (Input validation) - Security and stability
3. Issue #12 (Accessibility) - User experience and legal compliance
4. Issue #8 (Outdated dependencies) - Technical debt
5. Issues #4, #7 (Type safety) - Code quality
6. Remaining issues - Nice to have

---

## How to Report New Issues

When adding new issues to this document:

1. Use the template above (Title, File, Severity, Status, Description, Impact, Recommendation)
2. Provide code examples when relevant
3. Suggest concrete fixes
4. Update the summary statistics
5. Link to related issues if applicable

## Contributing

Found an issue or have a fix? Please:
1. Check if it's already documented here
2. Create a GitHub issue if it's new
3. Submit a pull request with the fix
4. Update this document to mark the issue as resolved

---

*Last Updated*: 2026-01-06
*Reviewed By*: Claude Code (Automated Review)
