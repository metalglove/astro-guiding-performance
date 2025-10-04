✅ make recommendation of frame to delete using timestamps
   - Created new FrameRecommendations component to analyze problematic frames
   - Identifies three types of problematic frames: large guiding errors, sudden position jumps, and low SNR frames
   - Dynamic thresholds based on pixel scale: 3 pixels for large errors, 2 pixels for jumps, SNR < 10
   - Shows detailed frame information with timestamps for easy identification in processing software
   - Export functionality to clipboard or text file for reference
   - Calculates potential improvement metrics and summary statistics
   - Integrated into PHD Log Guiding Charts for seamless workflow

✅ fix topbar with responsive design, hamburger menu?
   - Implemented hamburger menu for mobile devices (≤768px width)
   - Added slide-down mobile navigation with smooth animations
   - Interactive features: click hamburger, nav links, outside clicks, or Escape key to close
   - Responsive breakpoints for desktop, mobile, and small mobile devices
   - Added accessibility features with keyboard navigation and focus indicators

✅ update methodology if there were any changes
   - Added comprehensive "Data-Driven Frame Recommendations" section explaining ASIAIR log correlation
   - Updated equipment calibration section to emphasize imaging camera pixel scale importance
   - Added "Frame Recommendation Interpretation" guide with four impact categories
   - Enhanced limitations section to include cross-platform correlation considerations
   - Added visual styling and formatting for improved readability

✅ remove debugging statements 
   - Removed all development console.log statements from Vue components and services
   - Kept legitimate console.error statements for user-facing error handling
   - Preserved service worker console statements for standard PWA functionality
   - Cleaned up Equipment actions, file uploaders, chart components, and log readers
   - Maintained proper error logging for clipboard, download, and data loading failures

✅ validate whether the equipment functionality works updating and changing profiles etc
   - Equipment profiles can be created, updated, and switched between successfully
   - Profile management includes preset telescopes, cameras, and mounts
   - Equipment store properly manages active profile state and persistence
   - All calculations dynamically use active profile specifications
   - Profile creation from log data works correctly

✅ for the cdf, note that we filter the data points to only show relevant data points < 2" below the chart
   - Added informational note below the CDF chart explaining data filtering methodology
   - Note explains that the chart focuses on errors < 2" for better visualization
   - Clarifies that larger outliers are included in statistics but not displayed in the chart
   - Styled with blue information background and responsive design
   - Maintains scientific transparency about data presentation choices

✅ move theory based computations to functions in their own files to directly reference in documentation.
   - Created comprehensive computation modules in utilities/computations/
   - Astronomical computations: pixel scale, theoretical resolution, sampling ratio, field of view
   - Statistical computations: RMS calculations, percentile analysis, session duration, data sampling
   - Quality analysis: threshold calculations, frame quality assessment, improvement potential
   - Physics constants: arc-second conversion, Dawes coefficient, quality thresholds, Nyquist factor
   - Updated all components to use centralized computation functions instead of inline calculations
   - Functions now properly documented with references to astronomical standards and formulas

✅ constants (such as physiscs stuff) should be moved to a global file
   - Created utilities/constants/physics.ts with all physical and mathematical constants
   - Arc-second conversion factor (206,265), Dawes coefficient (4.56), quality thresholds
   - All hardcoded physics values now use centralized constants for consistency
   - Constants properly documented with references and usage context

✅ comprehensive issue checking and debugging after major refactoring
   - Resolved all TypeScript compilation errors across computation modules
   - Fixed import path issues and module resolution problems
   - Resolved Chart.js type assertion issues for borderDash properties
   - Cleaned up ESLint warnings and unused imports/variables
   - Validated application compiles and runs successfully at localhost:8080
   - All computation functions working correctly with proper type safety

✅ vertical bread crumbs on how far we are in the analysis (scrolling) - COMPLETE
   - Created AnalysisProgressBreadcrumbs component with dynamic scroll tracking
   - Fixed positioning on right side with collapsible interface
   - Detailed progress tracking through 7 analysis sections:
     1. Analysis Overview - Introduction and data summary
     2. Log Details - ASIAIR and PHD2 log information
     3. Chart Controls - Data filtering and scale options
     4. Performance Statistics - RMS errors and quality metrics
     5. Frame Recommendations - Problematic frame identification
     6. Guiding Charts - Time series, scatter, and CDF plots
     7. Environmental Data - Temperature and focus analysis
   - Shows completion status, active section, and overall progress percentage
   - Smooth scrolling navigation to sections when clicked
   - Responsive design adapts to mobile with bottom positioning
   - Real-time progress bars and visual indicators for section completion
   - Automatic progress calculation based on scroll position and viewport
   - Fixed bottom-of-page completion detection for final section
   - Enhanced performance analysis granularity for better user guidance
   - Fixed progress calculation bug preventing >100% progress values
   - Proper state management ensuring steps are either active OR completed
   - All functionality tested and working correctly at localhost:8080

✅ update packages - PARTIAL COMPLETE
   - Updated browserslist database to latest version (1.0.30001747)
   - Updated core-js to latest patch version (3.45.1)
   - Updated Vue ecosystem to stable versions: vue-router@4.5.1, vuex@4.1.0, vue-chart-3@3.1.8
   - Identified several packages requiring major version updates with potential breaking changes:
     * Chart.js: 3.7.1 → 4.5.0 (major version change)
     * TypeScript: 4.1.6 → 5.9.3 (major version change)
     * ESLint: 6.8.0 → 9.37.0 (major version change)
     * Vue CLI: 4.5.x → 5.0.9 (major version change)
   - Application currently running successfully with updated safe packages
   - Major version updates deferred to prevent breaking changes during active development
   - 128 security vulnerabilities detected, require careful evaluation for fixes

update readme images

update readme

## On Hold

fix temperature chart - waiting for latest version of ASIAIR logging to be checked out

✅ the auto focus events, the first event should pad the empty space because there is no change in position
   - Fixed AutofocusTimeline.vue to always show "Position Change" field for consistent layout
   - First event now shows "Initial Position" instead of being hidden
   - Added appropriate styling with initial-position class

✅ no more hard coded equipments, it should select it from the currently active profile.
   - Fixed PHDLogGuidingCharts.vue hardcoded pixel scale calculations
   - Fixed ChartStatistics.vue hardcoded telescope focal length and camera database
   - Added equipment profile auto-creation from example data logs
   - Added conditional rendering to hide equipment-dependent computations when no active profile
   - All calculations now use Equipment store dynamically

✅ double check whether all functions no longer use hardcoded values, only from profile
   - Verified all computation functions now use Equipment store
   - Only valid hardcoded values remaining are preset equipment data and mathematical constants (206.265)


update packages

update readme images

update readme