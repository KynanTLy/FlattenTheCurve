

const removeWhiteSpace = (string) => {
    return string.replace(/\s+/g, '')
}

const turnJsonToArray = (inputData) => {
    
    return checkNoDup(inputData.map((data) => {return data.properties.HSA_CODE})) 
}

const checkNoDup = (array) => {
    console.log(`Array length: ${array.length}`)
    console.log(`Array Countent: ${array}`)
    return (new Set(array)).size !== array.length;
}

export default {removeWhiteSpace, turnJsonToArray}