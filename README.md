# COVID-19 Hackathon April 10-May 18
Hosted by Alberta Innovate, Cybera, and the Pacific Institute for Mathematical Sciences.
This hackaton focuses on the use of data, data analysis, and data visualization to help
"flatten the curve" and economic recovery from COVID-19

# Try it out at https://kynantly.github.io/FlattenTheCurve/

# This Project: ABC (Alberta Brief on COVID) 
When looking at data the presentation matters. There is sometimes a disconnect between
looking at numbers on an excel page than looking at it on an interactive map. With that 
in mind, I went out and created a modular data visualization platform for both healthcare 
decision-makers and the general public to use. Hence this proof of concept project is 
meant to provide the viewers a brief on what is going on in Alberta and COVID, while still 
providing the tools for the viewer to dig deeper into data that may matter to them. 

It allows the viewer to scroll through different dates and see the number of active cases
of COVID. Also the users can turn different filters to add other information to 
the map such as hospital locations. It even allows viewers to search for a particular address
in case they would like to know more about that area. 

# Disclaimer:
Some of the data used in the project are placeholder and may not be 100% accurate or
a representation of official data presented by Alberta Health Services and other 
Canadian health organization. This project would require more verified data sources
to be used in an official capacity. (Data links can be found below)

# Features
The interactive map host a multitude of different features:
  1. Hover over a geographical region and view information about it such as number of active cases
  2. Modify the date to view COVID data from past to present
  3. Search for an address to focus the map on locations you care about
  4. Turn on the different filter to add to the map additional information such as hospital location

# Data Sources
  * Alberta GEOSON:        	http://www.ahw.gov.ab.ca/IHDA_Retrieval/ihdaGeographic.do#    
  * Alberta COVID Data:   	dataxch.ai (For April 29, May 6, May 7 data)
  * Hospital Icon:        	https://findicons.com/icon/80910/hospital
  * Alberta Hospital Location: 	https://en.wikipedia.org/wiki/List_of_hospitals_in_Alberta
  * Alberta Outbreak Location:    https://www.alberta.ca/covid-19-alberta-data.aspx#toc-3 (May 4)
    * Excluded some Calgary Zone location as they were not singular location listed
    * Excluded some South Zone location as they were not singular location listed

# Instruction to run the project:
  Run the REACT site locally:               npm start

