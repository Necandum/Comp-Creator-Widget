var AncestorRegistry = (function(){ 

    function AncestorRegistry(containingUnit,{selectedRegistrar}={}){
        this._containingUnit = containingUnit
        this._uniqueAncestorLinks = new Set();
        this._loopCreators = new Set();
        this._objections = [];
        this._registrar = (selectedRegistrar) ? new selectedRegistrar(containingUnit): new SourceRankRegistry(containingUnit);
    }   //importLink -> ancestor registry assess if it is new and it causes recursion. If its not new, that's weird, error. If no recursion, then each link in its ancestor registry
    //, assessed for newness and the new ones are passed to the registry maker. 

    AncestorRegistry.prototype={
        add(link){
            let sourceAncestorLinks = Array.from(link.source.ancestralLinks);
            sourceAncestorLinks.unshift(link);
            for(const ancestorLink of sourceAncestorLinks){
                if(ancestorLink.source === this._containingUnit || ancestorLink.source === this._containingUnit.phase){
                    this._loopCreators.add(ancestorLink);
                    this._objections.push( new Objection(link.source,Array.from(this._loopCreators),Objection.RecursiveLoop,this._containingUnit));
                    return false;
                }
                if(this._uniqueAdd(ancestorLink)){
                   this._registrar.add(ancestorLink);
                }
            }
            return true;
        },
        _uniqueAdd(link){
            if(this._uniqueAncestorLinks.has(link)){
                return false;
            }else{
                this._uniqueAncestorLinks.add(link);
                return true;
            }
        },
        wipe(){
            this._uniqueAncestorLinks = new Set();
            this._loopCreators = new Set();
            this._objections.forEach(objection => objection.revoke())
            this._objections =[];
            this._registrar.wipe();
        }
    }
    defineGetter({obj:AncestorRegistry.prototype,name:"objections",func:function(){return [...this._objections,...this._registrar.objections]}})
    defineGetter({obj:AncestorRegistry.prototype,name:"registry",func:function(){return this._registrar.registry}}) 
    defineGetter({obj:AncestorRegistry.prototype,name:"registryManager",func:function(){return this._registrar}}) 
    defineGetter({obj:AncestorRegistry.prototype,name:"ancestralLinks",func:function(){return new Set(this._uniqueAncestorLinks)}}) 
    defineGetter({obj:AncestorRegistry.prototype,name:"insideALoop",func:function() {return (this._loopCreators.size>0) ? true:false}}) 

    AncestorRegistry.prototype.constructor=AncestorRegistry

return AncestorRegistry
})()

var SourceRankRegistry = (function(){ 

    function SourceRankRegistry(containingUnit){
        this._objections = [];
        this._registry = new Map();
        this._containingUnit = containingUnit
    }

    SourceRankRegistry.prototype = {
        add(link){
            let newEntry = createEntryBySourceRank(this._registry,link);
            if (newEntry["sourceRankGroup"].length > 1){
               this._objections.push(new Objection(newEntry["source"],newEntry["sourceRankGroup"],Objection.SourceRankDuplication,this._containingUnit));
            }
        },
        wipe(){
            this._objections.forEach(objection => objection.revoke());
            this._objections=[];
            this._registry.clear();
        },
    }
    defineGetter({obj:SourceRankRegistry.prototype,name:"objections",func:function(){return [...this._objections]}})
    defineGetter({obj:SourceRankRegistry.prototype,name:"registry",func:function(){return this._registry}}) //change to provide copy in future. 

    SourceRankRegistry.prototype.constructor = SourceRankRegistry;

return SourceRankRegistry
})()

var UniqueSourceRankRegistry = (function(){ 

    function uniqueSourceRankRegistry(containingUnit){
        this._registry = new Map();
        this._uniqueSourceRankRegistry = new Set();
        this._containingUnit = containingUnit
    }

    uniqueSourceRankRegistry.prototype = {
        add(link){
            let newEntry = createEntryBySourceRank(this._registry,link);
            if (newEntry["sourceRankGroup"].length===1){
               this._uniqueSourceRankRegistry.add(link);    
            }
        },
        wipe(){
            this._registry.clear();
            this._uniqueSourceRankRegistry.clear()
        },
    }
    defineGetter({obj:uniqueSourceRankRegistry.prototype,name:"uniqueArray",func:function(){return new Set(this._uniqueSourceRankRegistry)}}) 
    defineGetter({obj:uniqueSourceRankRegistry.prototype,name:"objections",func:function(){return []}})
    uniqueSourceRankRegistry.prototype.constructor = uniqueSourceRankRegistry;

return uniqueSourceRankRegistry
})()




function createEntryBySourceRank(registry,link){
    if(!(registry instanceof Map) || !(link instanceof Link)) Break("registry must be a Map, link must be a Link",{registry,link});
    let newEntry = EntryCreator(["source","sourceRank"],Array)(registry,link);
       newEntry["cap"].push(link)
    return newEntry;
}

function createEntryBySourceRankSeed(registry,link){
    if(!(registry instanceof Map) || !(link instanceof Link)) Break("registry must be a Map, link must be a Link",{registry,link});
    let newEntry = EntryCreator(["source","sourceRank","seed"],Array)(registry,link);
        newEntry["cap"].push(link)
    return newEntry;
}

function EntryCreator(propList,capConstructor){
    return function makingEntry(baseMap,newItem){
        if(!(baseMap instanceof Map)) Break("baseMap must be a Map",{baseMap,newItem});

        let returnObj ={}
        let previousStep = baseMap;
        for(let i=0;i<(propList.length-1);i++){
            let prop = propList[i]
            if(!previousStep.has(newItem[prop])) previousStep.set(newItem[prop],new Map());
            previousStep = previousStep.get(newItem[prop]);
            returnObj[prop] = newItem[prop];
            returnObj[`${prop}Group`] = previousStep;
        }
        let finalProp = propList.at(-1);
        if(!previousStep.has(newItem[finalProp])) previousStep.set(newItem[finalProp], new capConstructor())
        returnObj[finalProp] = newItem[finalProp];
        returnObj[`${finalProp}Group`] = previousStep.get(newItem[finalProp]);
        returnObj["cap"] = returnObj[`${finalProp}Group`];
        return returnObj
    }
}


// Depreciated
// var UniqueSeedList = (function(){ 

//     function UniqueSeedList(containingUnit){
//         this._uniqueSeedArray =[];
//         this._objections = [];
//         this._containingUnit = containingUnit
//     }

//     UniqueSeedList.prototype={
//          add(link){
//             let linkShouldBeAddedToAncestorList = false;

//             if(!Number.isInteger(link.seed)) { // must have seed
//                 this._objections.push(new Objection(this._containingUnit,[link],Objection.MustHaveSeed,this._containingUnit))
//             }

//             if(!this._uniqueSeedArray[link.seed]){
//                 this._uniqueSeedArray[link.seed] = link;
//                 linkShouldBeAddedToAncestorList = true;
//             }

//             for(const protoLink of this._uniqueSeedArray){
//                 if(!protoLink) continue;
//                 if(link.source===protoLink.source && link.sourceRank=== protoLink.sourceRank && link.seed!==protoLink.seed){
//                     this._objections.push(new Objection(link.source,[link,protoLink],Objection.RedundantSeeds,this._containingUnit));
//                 }
//                 if(link.seed===protoLink.seed && (link.source !==protoLink.source || link.sourceRank !== protoLink.sourceRank )){
//                     this._objections.push(new Objection(link.source,[link,protoLink],Objection.OverLoadedSeed,this._containingUnit))
//                 }
//             }
//           return linkShouldBeAddedToAncestorList;
//         },
//         wipe(){
//             this._objections.forEach(objection => objection.revoke());
//             this._objections=[];
//             this._uniqueSeedArray =[];
//         }
//     }
//     defineGetter({obj:UniqueSeedList.prototype,name:"objections",func:function(){return [...this._objections]}})
//     defineGetter({obj:UniqueSeedList.prototype,name:"uniqueSeedArray",func:function() {return [...this._uniqueSeedArray]}}) 
//     UniqueSeedList.prototype.constructor=UniqueSeedList

// return UniqueSeedList
// })()