var AncestorRegistry = (function(){ 

    function AncestorRegistry(containingUnit){
        this._uniqueAncestorLinks = new Set();
        this._loopCreators = new Set();
        this._objections = [];
        this._registrar = (containingUnit instanceof Game) ? new SourceRankRegistry(containingUnit) : new SeedRegistry(containingUnit);

    }   //importLink -> ancestor registry assess if it is new and it causes recursion. If its not new, that's weird, error. If no recursion, then each link in its ancestor registry
    //, assessed for newness and the new ones are passed to the registry maker. 

    AncestorRegistry.prototype={
        add(link){
            let sourceAncestorLinks = Array.from(link.source.ancestralLinks);
            sourceAncestorLinks.unshift(link);
            for(const ancestorLink of sourceAncestorLinks){
                if(ancestorLink.source === containingUnit || ancestorLink.source === containingUnit.phase){
                    this._loopCreator.add(ancestorLink);
                    this._objections.push( new Objection(containingUnit,this._loopCreators,Objection.RecursiveLoop,containingUnit));
                    return false;
                }
                if(this._uniqueAdd(ancestorLink)){
                   this._registrar.add(link);
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
            this._registrar.wipe();
        }
    }
    defineGetter({obj:AncestorRegistry.prototype,name:"objections",func:()=>[...this._objections,...this._registrar.obections]})
    defineGetter({obj:AncestorRegistry.prototype,name:"registry",func:()=>this._registrar.registry}) 
    defineGetter({obj:AncestorRegistry.prototype,name:"ancestralLinks",func:()=>new Set(this._uniqueAncestorLinks)}) 

    AncestorRegistry.prototype.constructor=AncestorRegistry

return AncestorRegistry
})()

var SourceRankRegistry = (function(){ 

    function SourceRankRegistry(containingUnit){
        this._objections = [];
        this._registry = new Map();
    }

    SourceRankRegistry.prototype = {
        add(link){
            let newEntry = createEntryBySourceRank(this._registry,link);
            let newObjection = false;
            if (newEntry["rankGroup"].length > 1){
               newObjection = new Objection(newEntry["source"],newEntry["rankGroup"],Objection.SourceRankDuplication,containingUnit);
            }
            return newObjection;
        },
        wipe(){
            this._objections.forEach(objection => objection.revoke());
            this._objections=[];
            this._registry.clear();
        },
    }
    defineGetter({obj:SourceRankRegistry.prototype,name:"objections",func:()=>[...this._objections]})
    defineGetter({obj:SourceRankRegistry.prototype,name:"registry",func:()=>this._registry}) //change to provide copy in future. 

    SourceRankRegistry.prototype.constructor = SourceRankRegistry;

return SourceRankRegistry
})()

 
function createEntryBySourceRank(registry,link){
    if(!(registry instanceof Map) || !(link instanceof Link)) Break("registry must be a Map, link must be a Link",{registry,link});

    let newEntry = EntryCreator(["source","rank"],Array)(registry,link);
        newEntry["cap"].push(link);
    return newEntry;
}

function createEntryBySourceRankSeed(registry,link){
    if(!(registry instanceof Map) || !(link instanceof Link)) Break("registry must be a Map, link must be a Link",{registry,link});
   
    let newEntry = EntryCreator(["source","rank","seed"],Array)(registry,link);
        newEntry["cap"].push(link)
    return {newEntry}
}

function EntryCreator(propList,capConstructor){
    return function(baseMap,newItem){
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
        if(!previousStep.has(newItem[finalProp])) previousStep.set(newItem[finalProp], new capConstructor)
        returnObj[finalProp] = newItem[finalProp];
        returnObj[`${finalProp}Group`] = previousStep.get(newItem[finalProp]);
        returnObj["cap"] = returnObj[`${finalProp}Group`];
        return returnObj
    }
}
function createEntryBySourceRank(registry,link){
    if(!(registry instanceof Map) || !(link instanceof Link)) Break("registry must be a Map, link must be a Link",{registry,link});

    let newEntry = EntryCreator(["source","sourceRank"],Array)(registry,link);
        newEntry["cap"].push(link);
    return newEntry;
}
function SeedRegistry(linksArr =[]) {
    let registry = new Map();
    let seedReference = [];
    let noSeeds = new Set();
    let duplicateReference = new Set() //same source, different seeds
    let doublingUpOnSeed = new Set() // different sources, same seed
    let uniqueSeedArray =[];

    this.make = function makeSourceRegistryBySeed(){
    for(const link of linksArr){
       addLink(link);
    }
    uniqueSeedArray=[];
    seedReference.forEach((liArr)=>{
        if(liArr) uniqueSeedArray.push(liArr[0])
    });
        this.make =()=>({registry,seedReference,noSeeds,duplicateReference,doublingUpOnSeed,uniqueSeedArray})
        return  this.make();
    }

    function addLink(link){
       
        if(!Number.isInteger(link.seed)) { // must have seed
            noSeeds.add(link);
            return;
        }
        
        if (!registry.has(link.source)) registry.set(link.source, new Map())
        let linkRegistration = registry.get(link.source);
        if (!linkRegistration.has(link.sourceRank)) linkRegistration.set(link.sourceRank,new Map());
        let rankGroup = linkRegistration.get(link.sourceRank)

        if(!rankGroup.has(link.seed)) rankGroup.set(link.seed,{seedNumber:link.seed,linkList:[]})
        let seedGroup = rankGroup.get(link.seed);
        seedGroup.linkList.push(link)
        
        if(!seedReference[link.seed]) seedReference[link.seed] = [];
        seedReference[link.seed].push(link);

            let protoSeed = seedReference[link.seed][0]; //implies links from different sources have been assigned same seed
            if((link.source !== protoSeed.source) || (link.sourceRank !== protoSeed.sourceRank)){
                seedReference[link.seed].forEach(iLink=>doublingUpOnSeed.add(iLink));
            }
            if(rankGroup.size>1){ //implies two links with same source and rank, but different seeds
                for(const iSeedGroup of rankGroup.values()){
                    iSeedGroup.linkList.forEach((iLink)=>duplicateReference.add(iLink))
                }
            }
    }
}