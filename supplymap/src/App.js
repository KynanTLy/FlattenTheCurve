// Imports
import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import Parser from 'html-react-parser'

import "./App.scss";
// Mapbox css - needed to make tooltips work later in this article
import "mapbox-gl/dist/mapbox-gl.css";

// Data Import 
import * as municipality from './data/municipality.json'
import * as albertaCaseDataM from './data/AlbertaCOVIDbyMunicipality.json'
import * as albertaCaseDataM2 from './data/AlbertaCOVIDCase.json'
import * as testing from './data/AlbertaCOVID-M-May6.json'

import * as hospitalData from "./data/alberta-hospitals.json"
import * as outbreakData from "./data/alberta-outbreak.json"

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN

const dataList = [
  albertaCaseDataM2,
  testing
]

const dates = [
  "April_29",
  "May_6"
]


function find_center_point(coordinatesList) {

  // Check for nested Coordinates and flatten them
  if (coordinatesList[0].length !== 2){
    coordinatesList = coordinatesList[0]
  }

  var first = coordinatesList[0] 
  //console.log(`First: ${first}`)


  var last = coordinatesList[coordinatesList.length - 1]
  if (first[0] != last[0] || first[1] != last[1]) coordinatesList.push(first);
  var twicearea =0
  var x = 0
  var y = 0 
  var numPoints = coordinatesList.length
  var p1, p2, f;
  //console.log(`${twicearea} ${x} ${y}`)
  for ( var i=0, j=numPoints-1 ; i<numPoints ; j=i++ ) {
     p1 = coordinatesList[i]; p2 = coordinatesList[j];
     //console.log(`p1: ${p1} p2: ${p2}`)
     f = (p1[1] - first[1]) * (p2[0] - first[0]) - (p2[1] - first[1]) * (p1[0] - first[0]);
     twicearea += f;
     x += (p1[0] + p2[0] - 2 * first[0]) * f;
     y += (p1[1] + p2[1] - 2 * first[1]) * f;
  }
  f = twicearea * 3;
  //console.log(`x: ${x} y: ${y} f: ${f}`)
  var returnJSON = {"center_point":[(x/f + first[0]), (y/f + first[1])]}
  //console.log((returnJSON['center_point']))
  return returnJSON
}

function mergeAlbertaCases(albertaCaseData){

  var returnObj = {"data":[]}
  var idMap = {};
  // Iterate over arguments
  for(var i = 0; i < municipality.data.length; i++) { 
    //
    for (var y = 0; y < albertaCaseData.default.length; y++){
      
      if (municipality.data[i].properties.LOCAL_NAME === albertaCaseData.default[y].local_geographic_area.toUpperCase()){
        //console.log(`"${municipality.data[i].properties.LOCAL_NAME}" and "${albertaCaseDataM.default[y].local_geographic_area.toUpperCase()}"`)
        idMap = municipality.data[i]
        idMap['properties'] = Object.assign(idMap['properties'],albertaCaseData.default[y])
        returnObj['data'].push(idMap)
        idMap = {}
      }
      
    }
  }
  //console.log(municipality.data.length)
  //console.log(returnObj['data'].length)
  return returnObj
}

function findLegendRange(data){
  //console.log(caseList.properties)
  var caseList = []
  data.map((region) => (caseList.push(region.properties.cases)))
  //console.log(`List: ${Math.max(...caseList)}`)
 
  
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
}

function legendBuild(CovidData){
  var legendCaseRange = findLegendRange(CovidData)
  var legendColourRange = ['#ffffb2','#feb24c','#fc4e2a','#fc4e2a','#b10026'] 
  var legendBuilder = '<h4>Active COVID Case</h4>'

  for (var i = 0; i < legendCaseRange.length; i++){
    legendBuilder = legendBuilder + `<div><span style="background-color:${legendColourRange[i]};"></span>${legendCaseRange[i]}</div>`
  }

  return legendBuilder
}

function filterBy(dates) {
  if (dates === 1){
    return mergeAlbertaCases(dataList[1])
  } else {
    return mergeAlbertaCases(dataList[0])
  }
}

function App() {
  // Map visualization reference
  const mapboxElRef = useRef(null); // DOM element to render map

  // Use States
  const [selectedMunDetail, setselectedMunDetail] = useState('')
  const [selectedLegDetail, setselectedLegDetail] = useState('')

  // Update location data with newest COVID data
  const covidMapJSON = mergeAlbertaCases(albertaCaseDataM2)

 

  // Legend Information
  /*
  var legendCaseRange = findLegendRange(covidMapJSON.data)
  var legendColourRange = ['#ffffb2','#feb24c','#fc4e2a','#fc4e2a','#b10026'] 
  var legendBuilder = '<h4>Active COVID Case</h4>'
  for (var i = 0; i < legendCaseRange.length; i++){
    legendBuilder = legendBuilder + `<div><span style="background-color:${legendColourRange[i]};"></span>${legendCaseRange[i]}</div>`
  }
 
  //console.log(legendBuilder)
  const legend = legendBuild(covidMapJSON.data)
  */

  municipality.data.map((data) => (
    data['properties'] = Object.assign(data['properties'],find_center_point(data.geometry.coordinates[0]))
  ))

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
      console.log(`initmap ${selectedLegDetail}`)
      // Add our SOURCE
      // with id "points"
      map.addSource("municipality", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: municipality.data
        }
      })
      // Add municipality Border
      map.addLayer({
        id: "municipalityBorder",
        source: "municipality", // this should be the id of the source
        type: "line",
        // paint properties
        paint: {
          'line-color' : '#2d03ff',
          'line-opacity': 0.7
        }
      })

      for (var i = 0; i < dataList.length; i++){
        var tempString = "AlbertaCOVID-" + dates[i]
        console.log(tempString)
        map.addSource(tempString, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: mergeAlbertaCases(dataList[i]).data
          }
        })
  
        map.addLayer({
          id: tempString,
          source: tempString, // this should be the id of the source
          type: "fill",
          'layout': {
            // make layer visible by default
            'visibility': 'none'
            },
          // paint properties
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
      
  
      }

      // Add our layer

      // Municipality Name
      let oldhoverMunID
      
      // Mouse move event
      map.on("mousemove", "municipalityCOVID", e => {

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
        
      }//end hover
      })//end Mouse Event 

      // List of Markers
      var hopsitalMarkerList = []
      var outbreakMarkerList = []

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
        }
        
      }) // end Hospital Marker

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
        }
        
      }) // end Outbreak Marker

      // Add Date slider
      var sliderFilter = document.getElementById("dataslider")

      sliderFilter.addEventListener('input', function(e) {
        var dateTarget = parseInt(e.target.value, 10);
        
        console.log(`Date: ${dateTarget}`)
        //console.log(legendBuild(filterBy(month).data))
        initMap = filterBy(dateTarget)

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
        console.log(initMap)
      })

    })//end map.on load
    
    
    // Add navigation controls to the top right of the canvas
   
    var nav = new mapboxgl.NavigationControl();
    map.addControl(nav, 'bottom-left');
  }, [])// End use effect

  //console.log(selectedMunDetail)
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
          <label id="filterDisplay"></label>
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
