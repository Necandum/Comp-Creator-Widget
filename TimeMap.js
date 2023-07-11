function TimeMap() {
    let sortedByStart = [];
    let allItems = new Map();

    this.set = function addToTimeMap(newItem = {}, { startTime = 0, endTime = 0 } = {}) {
        if (startTime instanceof Date) startTime = parseInt(startTime.getTime());
        if (endTime instanceof Date)     endTime = parseInt(endTime.getTime());
        
        this.delete(newItem);

        let newIndex = 0;
        let newEntry = {item:newItem,startTime,endTime};
        for(newIndex;newIndex<sortedByStart.length;newIndex++){
            if(startTime<sortedByStart[newIndex].startTime) break;
        }
        sortedByStart.splice(newIndex,0,newEntry);
        allItems.set(newItem,newEntry);
        return this;
    };

    this.find = function findMatchingEntries(time){
        if(time instanceof Date) time = parseInt(time.getTime());
        let matchingPeriods ={entries:[],items:[]};
        for(entry of sortedByStart){
            if(entry.startTime>time) break
            if(entry.endTime>=time){
                 matchingPeriods.entries.push(entry);
                 matchingPeriods.items.push(entry.item);
            }
        }
        return (matchingPeriods.entries.length===0) ? false : matchingPeriods;
    }

    this.delete = function deleteFromeTimeMap(oldItem){
        if(!allItems.has(oldItem)) return false;

        let oldEntry = allItems.get(oldItem);
        let oldIndex = sortedByStart.indexOf(oldEntry);
         sortedByStart.splice(oldIndex,1);
         allItems.delete(oldItem);
         return true;
    }

    this.clear = function clearTimeMap(){
        allItems.clear();
        sortedByStart.length = 0;
    }
}
