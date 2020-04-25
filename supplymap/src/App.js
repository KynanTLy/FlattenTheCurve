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

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN

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
          'fill-color' : '#880000',
          'fill-opacity': [
            "interpolate",
            ["linear"],
            ["get", "cases"],
            1, 0.2,
            50, 0.4,
            100, 0.7
          ]
        }
      })

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
    </div>
  );
}

export default App;
