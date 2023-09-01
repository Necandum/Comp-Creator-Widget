function searchMap({map,property=undefined,searchTerm="",excludeKey=false,excludeValue=false,searchFunc}){
    let allEntries = map.entries();
    let resultArray =[]
    for(let [key,value] of allEntries){
        if(!excludeKey) searchObject({property,searchTerm,obj:key,resultArray,searchFunc})
        if(!excludeValue) searchObject({property,searchTerm,obj:value,resultArray,searchFunc})
    }
    return resultArray
}

function searchArray({arr,property=undefined,searchTerm="",searchFunc}){
    let resultArray =[];
    for(el of arr){
        searchObject({property,searchTerm,searchFunc,obj:el,resultArray})
    }
    return resultArray;
}
function searchObject({property=undefined,searchTerm="",obj,resultArray=[],searchFunc}){
    if(typeof obj !=='object' || obj === null) return
    
    let searchResult = null;

    if(property===undefined){
        for(prop in obj){
            if((searchResult= searchPrimitive({value:obj[prop],searchTerm})) !== null){
                resultArray.push({obj,property:prop,searchResult})
                searchResult = null;
            }
        }
    }else{
        if(obj?.[property]) searchResult = searchPrimitive({value:obj[property],searchTerm})
        if(searchResult!==null) resultArray.push({obj,property,searchResult})
    }
    return resultArray
}

function searchPrimitive({value,searchTerm="",searchFunc=searchFunctionSimple}){
    let result = null;
    let searchScore;
    if((searchScore = searchFunc(value,searchTerm))!==null)  result = {searchTerm,searchScore,value,searchFunc};
    return result;
}

function searchFunctionSimple(value=null,searchTerm=""){
    if(typeof value ==="object" ||
       typeof value ==="function" ||
       typeof value ==="symbol" ||
       typeof value ==="undefined") return null

    value = String(value).toLowerCase();
    searchTerm = String(searchTerm).toLowerCase();

    return ((value.search(searchTerm) !== -1) ? true:null)
}