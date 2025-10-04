make recommendation of frame to delete

fix temperature chart

update readme

update methodology if there were any changes

remove debugging statements 

validate whether the equipment functionality works updating and changing profiles etc

for the cdf, note that we filter the data points to only show relevant data points < 2" below the chart

no more hard coded equipments, it should select it from the currently active profile.

move theory based computations to functions in their own files to directly reference in documentation.

constants (such as physiscs stuff) should be moved to a global file 

load default equipment from a json file? the store should not have them as constants

double check whether all functions no longer use hardcoded values, only from profile

add equipmentstore to the root store

update readme images