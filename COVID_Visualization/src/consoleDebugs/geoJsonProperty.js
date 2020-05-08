import React from 'react'
import stringMod from '../helperFunction/stringMod'

const Debug_LocalLabel = (geoData) => {
    
    console.log("Start")
    {geoData.map((data) => (
      console.log(data.properties.LocalLabel)
  
    ))}
    console.log("End")
}

const Debug_LayerID = (geoData) => {
  
  {geoData.map((data) => (
    console.log(`Data: ${data.properties.LocalLabel}`)
  ))}


  console.log("End")

}

export default {Debug_LocalLabel, Debug_LayerID}