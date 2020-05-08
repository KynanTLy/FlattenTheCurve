// Imports libraries 
import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import Parser from 'html-react-parser'

// Imports scss and css files
import "./App.scss";
import "mapbox-gl/dist/mapbox-gl.css";

// Data Import location geographical data boundaries 
import * as localAreaBound from './data/localAreaBound.json'

// Data Import COVID data
import * as apr29CovidData from './data/AlbertaCOVID-M-April29.json'
import * as may6CovidData from './data/AlbertaCOVID-M-May6.json'

// Data Import filters data
import * as hospitalData from "./data/alberta-hospitals.json"
import * as outbreakData from "./data/alberta-outbreak.json"

// Requires your own access token to run
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN

// List of data / dates
// To be adapted later for API calls from AHS and would requires some cleaners function
const dataList = [
  apr29CovidData,
  may6CovidData
]

const dates = [
  "April_29",
  "May_6"
]

// Finds center of polygon
// @param list of coordinates  
function find_center_point(coordinatesList) {

  // Check for nested Coordinates and flatten them
  if (coordinatesList[0].length !== 2){
    coordinatesList = coordinatesList[0]
  }//end if 

  var first = coordinatesList[0] 
  var last = coordinatesList[coordinatesList.length - 1]

  // Ensure right hand rule
  if (first[0] !== last[0] || first[1] !== last[1]) coordinatesList.push(first)

  var twicearea =0
  var x = 0
  var y = 0 
  var numPoints = coordinatesList.length
  var p1, p2, f;
  
  for ( var i=0, j=numPoints-1 ; i<numPoints ; j=i++ ) {
     p1 = coordinatesList[i]; p2 = coordinatesList[j];
     f = (p1[1] - first[1]) * (p2[0] - first[0]) - (p2[1] - first[1]) * (p1[0] - first[0]);
     twicearea += f;
     x += (p1[0] + p2[0] - 2 * first[0]) * f;
     y += (p1[1] + p2[1] - 2 * first[1]) * f;
  }//end for

  f = twicearea * 3;
  
  var returnJSON = {"center_point":[(x/f + first[0]), (y/f + first[1])]}
  return returnJSON
}//end find_center_point function

// Merge JSON of local geographic with COVID data for visualization
// @param JSON of COVID data
function mergeAlbertaCases(albertaCaseData){

  var returnObj = {"data":[]}
  var idMap = {};

  // Iterate over arguments
  for(var i = 0; i < localAreaBound.data.length; i++) { 
    for (var y = 0; y < albertaCaseData.default.length; y++){
      
      if (localAreaBound.data[i].properties.LOCAL_NAME === albertaCaseData.default[y].local_geographic_area.toUpperCase()){
        //console.log(`"${municipality.data[i].properties.LOCAL_NAME}" and "${albertaCaseDataM.default[y].local_geographic_area.toUpperCase()}"`)
        idMap = localAreaBound.data[i]
        idMap['properties'] = Object.assign(idMap['properties'],albertaCaseData.default[y])
        returnObj['data'].push(idMap)
        idMap = {}
      }//end if
      
    }// end inner for loop
  }//end out for loop

  return returnObj
}//end mergeAlbertaCases function

// Adaptive legends that change with COVID data
// @param COIVD data
function findLegendRange(data){
  
  // Add all case data and divide them into 4 ranges
  var caseList = []

  data.map((region) => (caseList.push(region.properties.cases)))
  
  caseList.forEach(function(item, i) {
    caseList[i] = Math.ceil(item / 10) * 10;
  });

  caseList.sort(function(a, b){return a-b})
  caseList = [...new Set(caseList)]

  var minRange = caseList[0]
  var quartRange = caseList[Math.ceil((caseList.length-1)/4)]
  var halfRange = caseList[(Math.ceil((caseList.length-1)/2))]
  var quarter3Range = caseList[Math.ceil((caseList.length-1)/4)*3]
  var maxRange = Math.floor(caseList[caseList.length-1] / 50) * 50
  
  return [
    `${minRange}-${quartRange-1}`, 
    `${quartRange}-${halfRange-1}`,
    `${halfRange}-${quarter3Range-1}`,
    `${quarter3Range}-${maxRange-1}`,
    `${maxRange}+`
  ]
}//end findLegendRange function

// Build the HTML for the legend
// @param legend range data
function legendBuild(CovidData){

  var legendCaseRange = findLegendRange(CovidData)
  var legendColourRange = ['#ffffb2','#feb24c','#fc4e2a','#fc4e2a','#b10026'] 
  var legendBuilder = '<h4>Active COVID Case</h4>'

  for (var i = 0; i < legendCaseRange.length; i++){
    legendBuilder = legendBuilder + `<div><span style="background-color:${legendColourRange[i]};"></span>${legendCaseRange[i]}</div>`
  }//end for loop

  return legendBuilder
}//end legendBuild function

// Returns the merge COVID data + boundary depending on the slider
// Currently basic for proof of concept to expanded later
// @param slider dates
function filterBy(dates) {

  if (dates === 1){
    return mergeAlbertaCases(dataList[1])
  } else {
    return mergeAlbertaCases(dataList[0])
  }
}//end filterBy function

// Main body of the application
function App() {

  // Map visualization reference
  const mapboxElRef = useRef(null); // DOM element to render map

  // Use States
  const [selectedMunDetail, setselectedMunDetail] = useState('')
  const [selectedLegDetail, setselectedLegDetail] = useState('')

  // Add center point to map data
  // To be used when adding a search feature to the map to center the screen
  /*
 localAreaBound.data.map((data) => (
    data['properties'] = Object.assign(data['properties'],find_center_point(data.geometry.coordinates[0]))
  ))
  */

  // Initialize our map
  useEffect(() => {

    var initMap = null
    // You can store the map instance with useRef too
    const map = new mapboxgl.Map({
      container: mapboxElRef.current,
      style: "mapbox://styles/kynantly/ck94r7t9m0e7b1iqpq4y20drq",
      center: new mapboxgl.LngLat.convert([-114.066666,51.049999]), // initial geo location
      zoom: 10 // initial zoom
    });
    
    // When map is loaded 
    map.once("load", function() {
      
      // Add Boundary Source
      map.addSource("municipality", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: localAreaBound.data
        }
      })

      // Add Boundary Layer
      map.addLayer({
        id: "municipalityBorder",
        source: "municipality", 
        type: "line",
        paint: {
          'line-color' : '#2d03ff',
          'line-opacity': 0.7
        }
      })

      // Add the sources for all the data
      for (var i = 0; i < dataList.length; i++){
        
        var tempString = "AlbertaCOVID-" + dates[i]
        
        map.addSource(tempString, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: mergeAlbertaCases(dataList[i]).data
          }
        })
  
        // Set default visibility to none
        map.addLayer({
          id: tempString,
          source: tempString, 
          type: "fill",
          'layout': {
            'visibility': 'none'
            },
          paint: {
            'fill-color' : [
              "interpolate",
              ["linear"],
              ["get", "active"],
              1, "#ffffb2",
              5, '#feb24c',
              50, '#fc4e2a',
              100, '#b10026'
            ],
            'fill-opacity': [
              "interpolate",
              ["linear"],
              ["get", "active"],
              0, 0,
              5, 0.2,
              50, 0.4,
              100, 0.7
            ]
          }
        })
      }//end for loop

      // Add hover event to display COVID data information
      // Municipality Name
      let oldhoverMunID

      // Mouse move event
      map.on("mousemove", "AlbertaCOVID-April_29", e => {
          // Get ID
        const hoverMunID = e.features[0].properties.local_geographic_area;
        
        // Prevent Repeats
        if (hoverMunID !== oldhoverMunID) {
          // Set new ID
          oldhoverMunID = hoverMunID;
        
          // Properties to display
          const activeCase  = e.features[0].properties.active
          const recoverCase = isNaN(((e.features[0].properties.recovered / e.features[0].properties.cases) * 100).toFixed(2)) ? 0.00 : ((e.features[0].properties.recovered / e.features[0].properties.cases) * 100).toFixed(2)
          const mortalityRate = isNaN(((e.features[0].properties.death_s / e.features[0].properties.cases) * 100).toFixed(2)) ? 0.00 : ((e.features[0].properties.death_s / e.features[0].properties.cases) * 100).toFixed(2)

          // Display to municipality detail screen
          setselectedMunDetail(`
                <p>Geographical Location: ${hoverMunID}</p>
                <p>Current Active Case: <b>${activeCase}</b></p>
                <p>Recovery Rate  (out of ${e.features[0].properties.cases}): <b>${recoverCase}%</b></p>
                <p>Mortality Rate (out of ${e.features[0].properties.cases}): <b>${mortalityRate}%</b></p>
                `)
        
        }//end if
      })//end Mouse Event April 29

      map.on("mousemove", "AlbertaCOVID-May_6", e => {
        // Get ID
      const hoverMunID = e.features[0].properties.local_geographic_area;
      
      // Prevent Repeats
      if (hoverMunID !== oldhoverMunID) {
        // Set new ID
        oldhoverMunID = hoverMunID;
      
        // Properties to display
        const activeCase  = e.features[0].properties.active
        const recoverCase = isNaN(((e.features[0].properties.recovered / e.features[0].properties.cases) * 100).toFixed(2)) ? 0.00 : ((e.features[0].properties.recovered / e.features[0].properties.cases) * 100).toFixed(2)
        const mortalityRate = isNaN(((e.features[0].properties.death_s / e.features[0].properties.cases) * 100).toFixed(2)) ? 0.00 : ((e.features[0].properties.death_s / e.features[0].properties.cases) * 100).toFixed(2)

        // Display to municipality detail screen
        setselectedMunDetail(`
              <p>Local Geographical Location: ${hoverMunID}</p>
              <p>Current Active Case: <b>${activeCase}</b></p>
              <p>Recovery Rate (out of ${e.features[0].properties.cases}): <b>${recoverCase}%</b></p>
              <p>Mortality Rate (out of ${e.features[0].properties.cases}): <b>${mortalityRate}%</b></p>
              `)
      
      }//end if
    })//end Mouse Event May 6

      // List of Markers for the filter to add to map
      var hopsitalMarkerList = []
      var outbreakMarkerList = []

      // Add Hospital Filter
      var hospitalFilter = document.getElementById("hospitalfilter")
      var hospitalToggle = false 

      hospitalFilter.addEventListener('change', function(e) {
        
        if (hospitalToggle === true){
          if (hopsitalMarkerList.length !== 0){
            for(var i = 0; i < hopsitalMarkerList.length; i++){
              hopsitalMarkerList[i].remove()
            }
            hopsitalMarkerList = []
          }
          hospitalToggle = false
        } else {
          hospitalData.hospitals.forEach(function(marker) {

            // create a HTML element for each feature
            var el = document.createElement('div')
            el.className = 'markerHospital'
            el.id = 'hospital'
    
            // make a marker for each feature and add to the map
            var tempMarker = new mapboxgl.Marker(el)
              .setLngLat(marker.geometry.coordinates)
              .setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
                .setHTML(`<h3> ${marker.properties.NAME} </h3><p> Relevant Information ${marker.properties.maskAmount} </p>`))
              .addTo(map)
              
            tempMarker.addTo(map)
            hopsitalMarkerList.push(tempMarker)
          })//end forEach hospital
          hospitalToggle = true
        }//end if
        
      }) // end Hospital Marker

      // Outbreak marker
      var OutbreakFilter = document.getElementById("outbreakfilter")
      var OutbreakToggle = false 

      OutbreakFilter.addEventListener('change', function(e) {
        
        if (OutbreakToggle === true){
          if (outbreakMarkerList.length !== 0){
            for(var i = 0; i < outbreakMarkerList.length; i++){
              outbreakMarkerList[i].remove()
            }
            outbreakMarkerList = []
          }
          OutbreakToggle = false
        } else {
          outbreakData.outbreak.forEach(function(marker) {

            // create a HTML element for each feature
            var el = document.createElement('div')
            el.className = 'markerOutbreak'
            el.id = 'outbreak'
    
            // make a marker for each feature and add to the map
            var tempMarker = new mapboxgl.Marker(el)
              .setLngLat(marker.geometry.coordinates)
              .setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
                .setHTML(`<h3> ${marker.properties.NAME} </h3><p> ${marker.properties.TYPEFACILITY} </p>`))
              .addTo(map)
              
            tempMarker.addTo(map)
            outbreakMarkerList.push(tempMarker)
          })//end forEach outbreak
          OutbreakToggle = true
        }// end if
        
      }) // end Outbreak Marker

      // Add Date slider
      var sliderFilter = document.getElementById("dataslider")

      // Add input change listener
      sliderFilter.addEventListener('input', function(e) {

        var dateTarget = parseInt(e.target.value, 10);

        document.getElementById('filterDate').textContent = dates[dateTarget].replace("_", " ");;

        initMap = filterBy(dateTarget)

        // Change the visibility of layers based on the slider value
        for (var i =0; i < dates.length; i++){
          var tempString = "AlbertaCOVID-" + dates[i]
          if (i === dateTarget){
            console.log(`This layer ${tempString} is visible`)
            map.setLayoutProperty(tempString,'visibility','visible');
          } else {
            console.log(`This layer ${tempString} is not`)
            map.setLayoutProperty(tempString,'visibility','none');
          }
        }
        setselectedLegDetail(legendBuild(filterBy(dateTarget).data))
 
      })// end slider filter

    })//end map.on load
    
    // Add navigation controls to the top right of the canvas
    var nav = new mapboxgl.NavigationControl();
    map.addControl(nav, 'bottom-left');

  }, [])// End use effect

  return (
    <div className="App">
      <div className="mapContainer">
        {/* Assigned Mapbox container */}
        <div className="mapBox" ref={mapboxElRef} />
      </div>
      <div className="information">
        <div className="map-overlay" id='features'>
          <h2>COVID Statistics</h2>
          {Parser(selectedMunDetail)}
        </div>
        <div className="map-overlay" id='features'>
          <label id="filterDate">Date Range</label>
          <input type="range" id="dataslider" min="0" max="1" step="1"></input>
        </div>
        <div className="legend">
          {Parser(selectedLegDetail)}
        </div>
      </div>
      <nav className="filter-group">
        <input type="checkbox" id="hospitalfilter"></input>
        <label htmlFor="hospitalfilter">Hospital</label>
        <input type="checkbox" id="outbreakfilter"></input>
        <label htmlFor="outbreakfilter">Outbreak</label>
      </nav>
    </div>
  );
}

export default App;
