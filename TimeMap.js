function TimeMap() {
    let sortedByStart = [];
    let sortedByEnd=[]
    let allItems = new Map();

    this[Symbol.iterator]=function*(){
        for(let i = 0;i<sortedByStart.length;i++){
            yield sortedByStart[i].item
        }
    }
    defineGetter({obj:this,name:"length",func:()=>sortedByStart.length})
    this.set = function addToTimeMap(newItem = {}, { startTime = 0, endTime = 0 } = {}) {
        if (startTime instanceof Date) startTime = parseInt(startTime.getTime());
        if (endTime instanceof Date)     endTime = parseInt(endTime.getTime());
        if(startTime>endTime) {[endTime,startTime] = [startTime,endTime]; Alert("Start time less than end time.",{times:arguments[1]})}
        this.delete(newItem);
        let newEntry = {item:newItem,startTime,endTime};
        sortedByStart.push(newEntry);
        sortedByEnd.push(newEntry);
        TimeMap.sortByStart(sortedByStart);
        TimeMap.sortByEnd(sortedByEnd);
        allItems.set(newItem,newEntry);
        return this;
        // to-do: add binary search for completeness
    }
    this.indexOf = function getIndexForItem(item,sortingByStart = true){
        let entry = allItems.get(item)
        let sortingArray = (sortingByStart) ? sortedByStart: sortedByEnd;
        return (entry) ? sortingArray.indexOf(entry):false;
    }
    this.items = function getItems(){
        return Array.from(allItems.keys());
    }
    this.entries = function getEntries(sortingByStart = true){
        let sortingArray = (sortingByStart) ? sortedByStart: sortedByEnd;
        return sortingArray.map((entry,index)=>TimeMap.copyAddIndex(entry,index))
    }
    this.at=function getEntryByIndex(index,sortingByStart=true){
        let sortedArray = (sortingByStart) ? sortedByStart: sortedByEnd;
        return sortedArray.at(index);
    }
    this.findOverlap = function findMatchingEntries(time){
        if(time instanceof Date) time = parseInt(time.getTime());
        let findResult ={entries:[],items:[],match:false,nextEntries:false};
       
        let i;
        for(i=0;i<sortedByStart.length;i++){
            let entry=sortedByStart[i];
            if(entry.startTime>time) break
            if(entry.endTime>=time){
                 findResult.entries.push(TimeMap.copyAddIndex(entry,i));
                 findResult.items.push(entry.item);
                 findResult.match=true;
            }
        }
        if(findResult.match===false){
            for(i;i<sortedByStart.length;i++){
                let entry = sortedByStart[i];
                if(!findResult.nextEntries){
                    findResult.nextEntries=[TimeMap.copyAddIndex(entry,i)]
                } else if(entry.startTime===findResult.nextEntries[0].startTime){
                    nextEntries.push(TimeMap.copyAddIndex(entry,i));
                } else {
                    break
                }
            }
        }
        return  findResult;
    };

    this.findNext = function findNextEntry(time){
        if(time instanceof Date) time = parseInt(time.getTime());
        let matchingPeriods ={entries:[],items:[]};
            for(let i = 0;i<sortedByStart.length;i++){
                let entry = sortedByStart[i];
                if(entry.startTime>=time){ 
                matchingPeriods.entries.push(TimeMap.copyAddIndex(entry,i))
                matchingPeriods.items.push(entry.item)
                    if(sortedByStart[i+1]?.startTime===entry.startTime){
                        continue;
                    } else {
                        break;
                    }
                }
            }
        return (matchingPeriods.entries.length===0) ? false : matchingPeriods;
    }

    this.findPrevious = function findPrevious(time){
        if(time instanceof Date) time = parseInt(time.getTime());
        let matchingPeriods ={entries:[],items:[]};
        for(let i = sortedByEnd.length-1;i>=0;i--){
            let entry = sortedByEnd[i];
            if(entry.endTime<=time){ 
            matchingPeriods.entries.push(TimeMap.copyAddIndex(entry,i))
            matchingPeriods.items.push(entry.item)
                if(sortedByEnd[i-1]?.endTime===entry.endTime){
                    continue;
                } else {
                    break;
                }
            }
        }
        return (matchingPeriods.entries.length===0) ? false : matchingPeriods;
    }

    this.findGap = function findGap(time){
        let gap ={startTime:false,endTime:false,length:false,previousEntries:[],nextEntries:[]}
        let initialSearch = this.findOverlap(time);

        if(initialSearch.match){ //start inside entry/entries
            let lastFinishing =  TimeMap.sortByEnd(initialSearch.entries).at(-1); //last finishing entry of the ones which overlap initial time 
            gap.startTime = lastFinishing.endTime;
            for(let i = (lastFinishing.index+1);i<sortedByStart.length;i++){
                let entry = sortedByStart[i];
                if(entry.startTime<=gap.startTime && entry.endTime > gap.startTime){
                    gap.startTime=entry.endTime;
                } else if(entry.startTime>gap.startTime){
                    gap.endTime=entry.startTime;
                    break;
                }
            }
          if(gap.endTime)  gap.nextEntries = this.findNext(gap.endTime).entries;
            gap.previousEntries = this.findPrevious(gap.startTime).entries;
        } else { //start inside a gap already
            gap.nextEntries = initialSearch.nextEntries;
            gap.previousEntries = this.findPrevious(time).entries;
            gap.startTime = (gap.previousEntries.length===0) ? 0 : gap.previousEntries[0].endTime;
            gap.endTime = (gap.nextEntries.length===0) ? false : gap.nextEntries[0].startTime;
        }
        gap.length = (gap.endTime) ? gap.endTime-gap.startTime: Number.POSITIVE_INFINITY;
        return gap;
    }

    this.delete = function deleteFromeTimeMap(oldItem){ 
        if(!allItems.has(oldItem)) return false;

        let oldEntry = allItems.get(oldItem);
        let oldStartIndex = sortedByStart.indexOf(oldEntry);
            sortedByStart.splice(oldStartIndex,1);
        let oldEndIndex = sortedByEnd.indexOf(oldEntry)
            sortedByEnd.splice(oldEndIndex,1)
         allItems.delete(oldItem);
         return true;
    }

    this.clear = function clearTimeMap(){
        allItems.clear();
        sortedByStart.length = 0;
    }
}

TimeMap.sortByEnd = function sortTimeEntryArrayByEndTime(entryArray){
    entryArray.sort((a,b)=>a.endTime-b.endTime)
    return entryArray
}
TimeMap.sortByStart = function sortTimeEntryArrayByEndTime(entryArray){
    entryArray.sort((a,b)=>a.startTime-b.startTime)
    return entryArray
}
TimeMap.copyAddIndex = function copyTimeEntryAndAddIndex(entry,index){
    return {startTime:entry.startTime,endTime:entry.endTime,item:entry.item,index}
}