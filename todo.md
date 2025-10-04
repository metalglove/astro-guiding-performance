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

remove debugging statements 

validate whether the equipment functionality works updating and changing profiles etc

✅ for the cdf, note that we filter the data points to only show relevant data points < 2" below the chart
   - Added informational note below the CDF chart explaining data filtering methodology
   - Note explains that the chart focuses on errors < 2" for better visualization
   - Clarifies that larger outliers are included in statistics but not displayed in the chart
   - Styled with blue information background and responsive design
   - Maintains scientific transparency about data presentation choices

move theory based computations to functions in their own files to directly reference in documentation.

constants (such as physiscs stuff) should be moved to a global file 

vertical bread crumbs on how far we are in the analysis (scrolling)

update packages

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

move theory based computations to functions in their own files to directly reference in documentation.

constants (such as physiscs stuff) should be moved to a global file 

✅ double check whether all functions no longer use hardcoded values, only from profile
   - Verified all computation functions now use Equipment store
   - Only valid hardcoded values remaining are preset equipment data and mathematical constants (206.265)


update packages

update readme images

update readme