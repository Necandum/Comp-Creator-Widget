var oLog={}
function getE(queryString){
    return document.querySelector(queryString);
}
function Break(msg,variablesObj){
    console.log("At time of error:",variablesObj);
    throw new Error(msg)
}

function Alert(msg,variableObj,trace=true){
   console.log("Alert! Non-ideal behaviour.",msg,variableObj);
   if(trace) console.trace();
   return null
}

function UserError(msg,variableObj){
    console.log("At time of user error:",variableObj);
    throw new Error(msg)
}
function parseHTML(string) {
    const template = document.createElement('template');
    string = string.replace(/\n/g, '');
    template.innerHTML = string.trim();
    return template.content;
}

function getDayName(day) {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    if (day >= 0 && day <= daysOfWeek.length - 1) {
      return daysOfWeek[day];
    } else {
      return "Invalid day";
    }
  }
  
function intToOrdinal(input){
    let int = parseInt(input);
    if(!Number.isInteger(int)) Break("Not an integer",{input,int});
        let s = ["th", "st", "nd", "rd"];
        let v = int%100;
        let string =  int + (s[(v-20)%10] || s[v] || s[0]);
    return string
}
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function deepCopyArrayOfObjects(arr){
    let newArr=[];
    arr.forEach(obj=>newArr.push({...obj}));
    return newArr;
}
function arrayFromHTMLCollection(htmlCollection) {
    let array = [];
    for (let i = 0; i < htmlCollection.length; i++) {
        array[i] = htmlCollection[i];
    }
    return array;
}
function mapToObjectArray(map,keyName="key",valueName="value"){
    return Array.from(map).map(el=>({[keyName]:el[0],[valueName]:el[1]}))
}

function getElementIndex(element){
    return [].indexOf.call(element.parentNode.children,element);
  }

function defineGetter({obj,name,func}){
    Object.defineProperty(obj,name,{
        configurable:true,
        enumerable:true,
        get: func
    })
}
function defineSetter({obj,name,func}){
    Object.defineProperty(obj,name,{
        configurable:true,
        enumerable:true,
        set: func
    })
}
let SortFn={
    numDescending: (a,b)=>b-a,
    numAscending: (a,b)=> a-b
};
Object.freeze(SortFn);
function defineComputedProperty({obj,name,getterFunc,setterFunc}){
    defineGetter({obj:obj,name:name,func:getterFunc});
    defineSetter({obj:obj,name:name,func:setterFunc});
}
  function Stopwatch(name){
    
    function start(){
        this.startTime=new Date().getTime();
        this.laps=[];
        console.log(`Stopwatch ${name} started`);
    }
    function stop(){
        this.totalTime = new Date().getTime() - this.startTime;
        console.log(`Stopwatch ${name} stopped`, readableTime(this.totalTime));
        this.laps.push({name:"End",totalTime:this.totalTime,split:readableTime(this.totalTime)});
    }
    function lap(lapName=`P ${this.laps.length+1}`){
        let lapTime = new Date().getTime()-this.startTime;
        this.laps.push({lapTime:lapTime,name:lapName,split:readableTime(lapTime)});
        console.log(`Stopwatch ${name} completed lap (${lapName}) in`,readableTime(lapTime));
    }
    function readableTime(ms){
        return `${Math.floor(ms/(1000*60))}m, ${Math.floor((ms%(1000*60))/1000)}s, ${ms%1000}ms `
    }
    return {
        name:name,
        startTime:0,
        totalTime:0,
        laps:[],
        start:start,
        stop:stop,
        lap:lap

    }
}

function downloadFile(file,name="Unnamed File"){
    const dataURL = URL.createObjectURL(file)
    const link = document.createElement('a');
          link.href= dataURL;
          link.setAttribute("download", name);
          link.click();
          console.log("Tried to download: ",name,file,dataURL);
  }