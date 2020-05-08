// Imports
import React, { useState, useEffect, useRef } from 'react'
import ReactMapGL, { Marker, Popup, Layer, Source } from "react-map-gl"

// Import Helper Files
import Debugs from './consoleDebugs/geoJsonProperty'
import Mods from './helperFunction/stringMod'

// Import Data
import * as healthRegion from "./data/healthregion.geojson"
import * as hospitalData from "./data/alberta-hospitals.json"

// Test
import * as municipality from './data/municipality.geojson'

import './App.css';

export default function App() {

  const [viewport, setViewport] = useState({
    latitude: 51.049999,
    longitude: -114.066666,
    width: '100vw',
    height: '100vh',
    zoom:10,
  })
/*
  _onClick = event => {
    const feature = event.features && event.features[0];

    if (feature) {
      window.alert(`Clicked layer ${feature.layer.id}`); // eslint-disable-line no-alert
    }
  };
*/

  // Pressing Esc close popup
  useEffect(() => {
    const escListner = event => {
      if (event.key === "Escape"){
        setselectedHosp(null)
      }
    }
    window.addEventListener("keydown", escListner)
  
    // When the app is unmount close event listner
    return () => {
      window.removeEventListener("keydown", escListner)
    }
  
  }, [])

  // Use State
  const [selectedHosp, setselectedHosp] = useState(null)
  const [selectedMun, setselectMun] = useState(null)

  // References the REACT-mapbox-gl object
  const mapref = useRef()


  // Debug
  //Debug_LocalLabel(testingData.data)
  //Debugs.Debug_LayerID(municipality.data)
  //console.log(Mods.turnJsonToArray(municipality.data))
  
  const bounds = mapref.current ? mapref.current.getMap().getBounds().toArray() : null



  //console.log(bounds)

  return <div>
    <ReactMapGL
      {...viewport}
      maxZoom={12}
      mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
      mapStyle="mapbox://styles/kynantly/ck94r7t9m0e7b1iqpq4y20drq"
      onViewportChange={viewport => {setViewport(viewport)}}
      mousemove={(_,event) => {
        event.preventDefault()
      }}
      ref={mapref}
    >
      {hospitalData.hospitals.map((hospitals) => (
        <Marker 
          key={hospitals.properties.HOSPITALID} 
          latitude={hospitals.geometry.coordinates[1]}
          longitude={hospitals.geometry.coordinates[0]}
        >
          <button className="marker-btn" 
          onClick={(event) => {
            event.preventDefault()
            setselectedHosp(hospitals)
          }}>
            <img src="/Heart.png" alt="Health Facilities"/>
          </button>
          </Marker>
      ))}

      <Source id='municipality' key='municipality' type="geojson" data={municipality}>
      <Layer
          id = 'municipality'
          type = "fill"
          source = 'municipality'
          paint={{
            'fill-color' : '#2d03ff',
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              1,
              0.5
              ]
          }}        />
      </Source>
        
      ))}

     {selectedHosp ? (
       <Popup 
        latitude={selectedHosp.geometry.coordinates[1]} 
        longitude={selectedHosp.geometry.coordinates[0]}
        onClose={() => {setselectedHosp(null)}}>
         <div>
            <h2>{selectedHosp.properties.NAME}</h2>
         </div>
       </Popup>
     ) : null} 
    </ReactMapGL>
  </div>
}

/*
    <Source id="healthregion" type="geojson" data={healthRegion} />
    <Layer
        id="healthregion"
        type="line"
        source="healthregion"
        paint={{
          'line-color': '#880000',
          'line-width': 1,
          'line-opacity': 0.8
        }}
      />
*/