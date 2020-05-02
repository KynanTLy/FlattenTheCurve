// Imports
import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import Parser from 'html-react-parser'

import "./App.scss";
// Mapbox css - needed to make tooltips work later in this article
import "mapbox-gl/dist/mapbox-gl.css";

// Data Import 
import * as municipality from './data/municipality.json'
import * as healthRegion from './data/healthregion.json'
import * as albertaCaseDataM from './data/AlbertaCOVIDbyMunicipality.json'
import * as albertaCaseDataM2 from './data/AlbertaCOVIDCase.json'

import * as municipalitytest from './data/municipality.json'
import * as hospitalData from "./data/alberta-hospitals.json"

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN



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

function mergeAlbertaCases(){

  var returnObj = {"data":[]}
  var idMap = {};
  // Iterate over arguments
  for(var i = 0; i < municipality.data.length; i++) { 
    //
    for (var y = 0; y < albertaCaseDataM2.default.length; y++){
      
      if (municipality.data[i].properties.LOCAL_NAME === albertaCaseDataM2.default[y].local_geographic_area.toUpperCase()){
        //console.log(`"${municipality.data[i].properties.LOCAL_NAME}" and "${albertaCaseDataM.default[y].local_geographic_area.toUpperCase()}"`)
        idMap = municipality.data[i]
        idMap['properties'] = Object.assign(idMap['properties'],albertaCaseDataM2.default[y])
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

function App() {
  const mapboxElRef = useRef(null); // DOM element to render map

  const [selectedMunDetail, setselectedMunDetail] = useState('')


  const covidMapJSON = mergeAlbertaCases()


  // Legend Information
  
  var legendCaseRange = findLegendRange(covidMapJSON.data)
  var legendColourRange = ['#ffffb2','#feb24c','#fc4e2a','#fc4e2a','#b10026'] 
  var legendBuilder = '<h4>Active COVID Case</h4>'
  for (var i = 0; i < legendCaseRange.length; i++){
    legendBuilder = legendBuilder + `<div><span style="background-color:${legendColourRange[i]};"></span>${legendCaseRange[i]}</div>`
  }
  //console.log(legendBuilder)
  const legend = legendBuilder
  municipalitytest.data.map((data) => (
    data['properties'] = Object.assign(data['properties'],find_center_point(data.geometry.coordinates[0]))
  ))
  
  
  //console.log(municipalitytest.data[0])

  //console.log(municipality.data[0].geometry.coordinates)

  // Initialize our map
  useEffect(() => {
    // You can store the map instance with useRef too
    const map = new mapboxgl.Map({
      container: mapboxElRef.current,
      style: "mapbox://styles/kynantly/ck94r7t9m0e7b1iqpq4y20drq",
      center: new mapboxgl.LngLat.convert([-114.066666,51.049999]), // initial geo location
      zoom: 10 // initial zoom
    });

    // When map is loaded 
    map.once("load", function() {
      // Add our SOURCE
      // with id "points"
      map.addSource("municipality", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: municipality.data
        }
      })

      map.addSource("municipalityCOVID", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: covidMapJSON.data
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

      // Add our layer
      map.addLayer({
        id: "municipalityCOVID",
        source: "municipalityCOVID", // this should be the id of the source
        type: "fill",
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

      // Add Hover Effect
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });

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
              <p>Location: ${hoverMunID}</p>
              <p>Active: <b>${activeCase}</b></p>
              <p>Recovery  Rate: <b>${recoverCase}%</b></p>
              <p>Mortality Rate: <b>${mortalityRate}%</b></p>
              `)
       
        
        hospitalData.hospitals.forEach(function(marker) {

          // create a HTML element for each feature
          var el = document.createElement('div');
          el.className = 'marker';

          // make a marker for each feature and add to the map
          new mapboxgl.Marker(el)
            .setLngLat(marker.geometry.coordinates)
            .setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
              .setHTML(`<h3> ${marker.properties.NAME} </h3><p> ${marker.properties.maskAmount} </p>`))
            .addTo(map);
        
        
        
        
        });
        /*
        // Popup properties
        const popUpHTML = 
              `<p>Location: <b>${hoverMunID}</b></p>
              <p>Active: <b>${activeCase}</b></p>
              <p>Recovered: <b>${recoverCase}</b></p>
              <p>Mortality Rate: <b>${mortalityRate}%</b></p>`

        //const popLoc = map.LngLat.convert(e.features[0].properties.center_point.slice())
        popup
          .setLngLat(mapboxgl.LngLat.convert(JSON.parse(e.features[0].properties.center_point)))
          .setHTML(popUpHTML)
          .addTo(map);
        */
      }

      })//end Mouse Event 


      
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
        </div>
        <div className="legend">
          {Parser(legend)}
        </div>
      </div>
      <nav className="filter-group">
        <input type="checkbox" id="test" checked></input>
        <label for="test">First Test</label>

      </nav>
    </div>
  );
}


export default App;
