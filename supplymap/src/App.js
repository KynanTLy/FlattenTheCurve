// Imports
import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";


import "./App.scss";
// Mapbox css - needed to make tooltips work later in this article
import "mapbox-gl/dist/mapbox-gl.css";

// Data Import 
import * as municipality from './data/municipality.json'
import * as healthRegion from './data/healthregion.json'
import * as albertaCaseDataM from './data/AlbertaCOVIDbyMunicipality.json'

import * as municipalitytest from './data/municipality.json'

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

function mergeTwoJSON(){

  var returnObj = {"data":[]}
  var idMap = {};
  // Iterate over arguments
  for(var i = 0; i < municipality.data.length; i++) { 
    //
    for (var y = 0; y < albertaCaseDataM.default.length; y++){
      
      if (municipality.data[i].properties.LOCAL_NAME === albertaCaseDataM.default[y].local_geographic_area.toUpperCase()){
        //console.log(`"${municipality.data[i].properties.LOCAL_NAME}" and "${albertaCaseDataM.default[y].local_geographic_area.toUpperCase()}"`)
        idMap = municipality.data[i]
        idMap['properties'] = Object.assign(idMap['properties'],albertaCaseDataM.default[y])
        returnObj['data'].push(idMap)
        idMap = {}
      }
      
    }
  }
  //console.log(municipality.data.length)
  //console.log(returnObj['data'].length)
  return returnObj
}

function App() {
  const mapboxElRef = useRef(null); // DOM element to render map

  //console.log(JSON.stringify(albertaCaseDataM))
  console.log(mergeTwoJSON())

  const covidMapJSON = mergeTwoJSON()
 
  /*
  console.log("Start")
  municipalitytest.data.map((data) =>(
    data.properties.LOCAL_NAME === "HIGH PRAIRIE" ? 
      console.log(`Name: ${data.properties.LOCAL_NAME} Center: ${find_center_point(data.geometry.coordinates[0])}`) 
     : console.log("")
  
  ))
  console.log("End")
  */
  //const test = find_center_point(municipality.data[0].geometry.coordinates[0])
  //console.log(test)
  
  
  
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
        const recoverCase = e.features[0].properties.recovered
        const mortalityRate = isNaN(((e.features[0].properties.death_s / e.features[0].properties.cases) * 100).toFixed(2)) ? 0.00 : ((e.features[0].properties.death_s / e.features[0].properties.cases) * 100).toFixed(2)

        
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
        
        //console.log(JSON.parse(e.features[0].properties.center_point))
      }

      })//end Mouse Event 



    })//end map.on load
    
    // Add navigation controls to the top right of the canvas
    map.addControl(new mapboxgl.NavigationControl());
  }, []);

  return (
    <div className="App">
      <div className="mapContainer">
        {/* Assigned Mapbox container */}
        <div className="mapBox" ref={mapboxElRef} />
      </div>
      <div class='map-overlay' id='features'><h2>US population density</h2><div id='pd'><p>Hover over a state!</p></div></div>
      <div className="legend">
        <h4>Active Case</h4>
        <div><span style={{background: "ffffb2"}} ></span>1</div>
        <div><span style={{background: "#feb24c"}} ></span>5</div>
        <div><span style={{background: "#fc4e2a"}} ></span>50</div>
        <div><span style={{background: "#b10026"}} ></span>100</div>
      </div>
    </div>
  );
}


export default App;
