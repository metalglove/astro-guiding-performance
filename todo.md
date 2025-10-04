make recommendation of frame to delete

fix temperature chart

update readme

update methodology if there were any changes

remove debugging statements 

validate whether the equipment functionality works updating and changing profiles etc

for the cdf, note that we filter the data points to only show relevant data points < 2" below the chart

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

load default equipment from a json file? the store should not have them as constants

✅ double check whether all functions no longer use hardcoded values, only from profile
   - Verified all computation functions now use Equipment store
   - Only valid hardcoded values remaining are preset equipment data and mathematical constants (206.265)

update readme images

fix topbar with responsive design, hamburger menu?

update packages