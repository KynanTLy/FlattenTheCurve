// Imports
import React, { useState, useEffect } from 'react'
import ReactMapGL, { Marker, Popup, Layer, Source } from "react-map-gl"

// Import Data
import * as healthRegion from "./data/healthregion.geojson"
import * as municipality from "./data/municipality.geojson"
import * as hospitalData from "./data/alberta-hospitals.json"

import './App.css';

function App() {

  const [viewport, setViewport] = useState({
    latitude: 51.049999,
    longitude: -114.066666,
    width: '100vw',
    height: '100vh',
    zoom:10

  })

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

  // Polygon for Alberta Health Region
  // Starts at the bottom left corner and goes clockwise
  /*
  const data = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [ 
          [-110.006176,54.090360],
          [-111.758416,53.778692],
          [-116.617634,53.711649],
          [-117.601868,52.023164],
          [-119.956443,53.902110],
          [-119.999790,59.999877],
          [-110.075488,59.930155]
        ]
      ]
    }
  };
  const data2 = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [ 
          [-110.006176,54.090360],
          [-111.758416,53.778692],
          [-111.880153,52.752816],
          [-115.235622,52.791077],
          [-116.617634,53.711649],
          [-117.601868,52.023164],
          [-110.011397,51.505294]
        ]
      ]
    }
  };

  const data3 = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [ 
          [-111.758416,53.778692],
          [-111.880153,52.752816],
          [-115.235622,52.791077],
          [-116.617634,53.711649]
        ]
      ]
    }
  };

  const data4 = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [ 
          [-113.249968,51.758655],
          [-117.601868,52.023164],
          [-117.075262,50.748694],
          [-113.661996,50.534654]
        ]
      ]
    }
  }


  const data5 = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [           
          [-113.661996,50.534654],
          [-117.075262,50.748694],
          [-114.088555,49.022080],
          [-110.010139, 49.011415],
          [-110.011397,51.505294],
          [-113.249968,51.758655],
          [-113.661996,50.534654]
        ]
      ]
    }
  }
  */
  
  return <div>
    <ReactMapGL
      {...viewport}
      mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
      mapStyle="mapbox://styles/kynantly/ck94r7t9m0e7b1iqpq4y20drq"
      onViewportChange={viewport => {setViewport(viewport)}}
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

    <Source id="healthregion" type="geojson" data={healthRegion} />
    <Source id="municipality" type="geojson" data={municipality} />
    <Layer
        id="municipality"
        type="line"
        source="municipality"
        paint={{
          'line-color': '#2d03ff',
          'line-width': 1,
          'line-opacity': 0.8
        }}
      />

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
 <Source id="region" type="geojson" data={data} />
    <Source id="region2" type="geojson" data={data2} />
    <Source id="region3" type="geojson" data={data3} />
    <Source id="region4" type="geojson" data={data4} />
    <Source id="region5" type="geojson" data={data5} />
      <Layer
        id="region"
        type="fill"
        source="region"
        paint={{
          'fill-color': '#880000',
          'fill-opacity': 0.8
        }}
      />

      <Layer
        id="region2"
        type="fill"
        source="region2"
        paint={{
          'fill-color': '#3f2cd3',
          'fill-opacity': 0.8
        }}
      />

      <Layer
        id="region3"
        type="fill"
        source="region3"
        paint={{
          'fill-color': '#18e7d2',
          'fill-opacity': 0.8
        }}
      />

      <Layer
        id="region4"
        type="fill"
        source="region4"
        paint={{
          'fill-color': '#e916e4',
          'fill-opacity': 0.8
        }}
      />

      <Layer
        id="region5"
        type="fill"
        source="region5"
        paint={{
          'fill-color': '#6ee51a',
          'fill-opacity': 0.8
        }}
      />
*/

export default App;
