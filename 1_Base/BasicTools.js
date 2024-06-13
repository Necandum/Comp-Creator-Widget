var oLog={}
function getE(queryString){
    return document.querySelector(queryString);
}
function newE(elementString){
    return document.createElement(elementString);
}
function Break(msg,variablesObj){
    console.log("At time of error:",variablesObj,{msg});
    throw new Error(msg)
}

function Alert(msg,variableObj,trace=true){
   console.log("Alert! Non-ideal behaviour.",msg,variableObj);
//    if(trace) 
   console.trace();
   return null
}
function IgnoreError(msg,err){
    console.log(`Ignoring error:${msg}`,{error:{err}});
}
function UserError(msg,variableObj){
    console.log("At time of user error:",variableObj,{msg:{msg}});
    throw new Error(msg)
}
function parseHTML(string) {
    // string = string.replace(/\n/g, '');
    string = string.replace(/(?<=>)(?<a>[^<]*?)\s*/gmi,"");
    const template = document.createElement('template');
    template.innerHTML = string.trim();
    return template.content;
}
function forceCSSReflow(){
   void document.body.offsetHeight;
}
function isSpaceBar(event){
    let clickEventTriggeredBySpaceBarProbably = false;
    if( event.offsetX===0 &&
        event.offsetY===0 &&
        event.pageX===0 &&
        event.pageY===0 &&
        event.movementX===0 &&
        event.movementY===0 &&
        event.button===0) clickEventTriggeredBySpaceBarProbably = true;
        return clickEventTriggeredBySpaceBarProbably;
}
function getDayName(dayIndex) {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    if (dayIndex >= 0 && dayIndex < daysOfWeek.length) {
      return daysOfWeek[dayIndex];
    } else {
      return "Invalid day";
    }
  }
function getMonthName(monthIndex){
    const months = ['Jan','Feb','Mar',"Apr",'May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    if (monthIndex >= 0 && monthIndex < months.length) {
        return months[monthIndex];
      } else {
        return "Invalid month";
      }
}
function getHumanDate(time,options){
    let date = new Date(time);
    return`${String(date.getDate()).padStart(2,"0")}-${getMonthName(date.getMonth())}`
}
function getHumanUTCTimeString(utcTime){
    let date = new Date(parseInt(utcTime));
    let hour = String(date.getUTCHours());
    let minute = String(date.getUTCMinutes()).padStart(2,"0");
    let timeString = `${hour}:${minute}`;
    return timeString;
}
  function getDayBoundary(time){
    let date= new Date(time);
    date.setHours(0,0,0,0)
    let dayStart = date.getTime()
    date.setHours(24,0,0,0)
    let dayEnd = date.getTime();
    return {dayStart,dayEnd};
}
  function getUTCDayBoundary(time){
    let date= new Date(time);
    date.setUTCHours(0,0,0,0)
    let dayStart = date.getTime()
    date.setUTCHours(24,0,0,0)
    let dayEnd = date.getTime();
    return {dayStart,dayEnd};
}
function getMsFromTimeString(string){
    let regex = /(?<hours>\d{2})[:](?<minutes>\d{2})(?:[:](?<seconds>\d{2})(?:[.](?<ms>\d{3}))?)?/gmi;
    let match = regex.exec(string);
    if(!match) return null;
    let ms =parseInt(match.groups.hours)*d.HOUR_MS + parseInt(match.groups.minutes)*d.MINUTE_MS;
    if(match.groups.seconds) ms += parseInt(match.groups.seconds)*d.SECOND_MS;
    if(match.groups.ms) ms+=parseInt(match.groups.ms);
    return ms;
}
function getTimeStringFromMs(ms){
    if(!ms) return "00:00:00.000";
    ms = parseInt(ms);
    let hours = Math.floor(ms/d.HOUR_MS);
    let minutes = Math.floor((ms % d.HOUR_MS)/d.MINUTE_MS);
    let seconds = Math.floor((ms % d.MINUTE_MS) / d.SECOND_MS);
    let milliseconds = Math.floor(ms % d.SECOND_MS);
    return `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}.${String(milliseconds).padStart(3,"0")}`;
}
function getUTCTimeFromDateString(dateString){
    let regex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/gmi;
    let match = regex.exec(dateString);
    return Date.UTC(parseInt(match.groups.year),parseInt(match.groups.month)-1,parseInt(match.groups.day),0,0,0,0);
}
function getDateStringFromUTCTime(time){
    let date = new Date(parseInt(time));
    let year = String(date.getUTCFullYear());
    let month = String(date.getUTCMonth()+1).padStart(2,"0");
    let day = String(date.getUTCDate()).padStart(2,"0");
    let dateString = `${year}-${month}-${day}`;
    return dateString;
}
function getUTCDateFromStrings(dateString,timeString){
    return new Date(`${dateString}T${timeString}Z`)
}
function universaliseLocalTime(localTime){
    let localDate = new Date(localTime);
    let utcTime = Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        localDate.getHours(),
        localDate.getMinutes(),
        localDate.getSeconds(),
        localDate.getMilliseconds()
    );
    return utcTime;
}
function getUTCDateFromTime(time){

}

function intToOrdinal(input){
    let int = parseInt(input);
    if(!Number.isInteger(int)) Break("Not an integer",{input,int});
        let s = ["th", "st", "nd", "rd"];
        let v = int%100;
        let string =  int + (s[(v-20)%10] || s[v] || s[0]);
    return string
}
function removeMultipleLines(string){
    let regex = /\s*[\r\n]{1,2}\s*/gm;
    let singleLineString = string.replace(regex,"");
    return singleLineString ;
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
function ensureArray(thing){
    return (Array.isArray(thing)) ? thing:[thing];
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
    numAscending: (a,b)=> a-b,
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