
var Competition = (function () {
    let id = 0;
    let allCompetitions = [];
    defineGetter({ obj: Competition, name: "allCompetitionsArray", func: () => Array.from(allCompetitions) });

    function Competition(name) {
        let myId = ++id;
        let settings = new Map([])
        let phases = [];
        let associatedDivFlesh;

        defineGetter({ obj: this, name: "name", func: () => name });
        defineGetter({ obj: this, name: "id", func: () => myId });
        defineGetter({ obj: this, name: "currentSettings", func: () => mapToObjectArray(settings, "setting", "value") });
        defineGetter({ obj: this, name: "allPhasesArray", func: () => Array.from(phases) });
        defineGetter({ obj: this, name: "allGamesArray", func: () => this.allPhasesArray.reduce((acc,cv)=>{acc.push(...cv.allGamesInPhase);return acc;},[]) });
        defineGetter({ obj: this, name: "flesh", func: () => associatedDivFlesh });
        defineSetter({ obj: this, name: "flesh", func: (mainDiv) => associatedDivFlesh=mainDiv });
        this.newPhase = function (phaseName,phaseType) {
            let newPhase = new Phase({ name: phaseName, parent: this, phaseType });
            phases.push(newPhase)
            CodeObserver.Execution({ mark: Phase, currentFunction: this.newPhase, currentObject: this });
            return newPhase;
        }

        this.removePhase = function (phase) {
            if (!(phase instanceof Phase)) throw new Error("Not a phase");
            let phaseIndex;
            if ((phaseIndex = phases.indexOf(phase)) === -1) throw new Error("No such phase in this Competetion");
            phases.splice(phaseIndex);
            if (phase.parent !== null) phase.removeParent();
        }

    }


    return Competition
})()



/**
     * @param {Game|Phase} startingUnit 
     * @returns {{similarLinks:Set,registry:Map}}
     */
function sourceTrackBack(startingUnit) {
    let registry = new Map();
    let phaseRegistry = new Map();
    let similarLinks = new Set();
    let visitedSources = new Set();
    let loopCreated = false
    let startUnitConfirmed = startingUnit?.incomingLinks[0]?.target
    let incomingLinks = startingUnit.incomingLinks;
    let startingLinks = new Set(incomingLinks)
    incomingLinks.forEach((startLink) => {innerSourceTrackBack(startLink)});
    return {similarLinks,registry,phaseRegistry};

    function innerSourceTrackBack(link) {
        
        let registryResult = registry.get(link.source)?.[link.sourceRank];
        let phaseRegistryResult = phaseRegistry.get(link.source.phase);
        
        for (const otherLink of registryResult ?? []) {
            // if (otherLink.target === link.target) { //the two link are the same, as target, source and sourceRank are all the same. 
                // continue;
            // } else {
                similarLinks.add(otherLink); //now that this is not visiting the same literal link twice, the if statement ^^this shouldn't be necessary
                similarLinks.add(link);        
            // }
        }
        if(phaseRegistryResult && !(link.source instanceof phaseRegistryResult.sourceType)) {
            similarLinks.add(link);
            phaseRegistryResult.linkList.forEach(iLink => similarLinks.add(iLink));
        }
        registerLink(link);

        let nextLinks = link.source?.incomingLinks ?? [];
        for(const nextLink of nextLinks){
            if(nextLink.source === startUnitConfirmed || startingLinks.has(nextLink)){
                Alert("You've created a loop",{startingUnit,link})
                loopCreated = true;
                similarLinks.add(link)
                continue;
            }
            if(!visitedSources.has(nextLink)){
                innerSourceTrackBack(nextLink)
            } 
        }
    }
    function registerLink(link) {
        visitedSources.add(link);
        if (!registry.has(link.source)) registry.set(link.source, {})
        let linkRegistration = registry.get(link.source);
        if (!linkRegistration[link.sourceRank]) linkRegistration[link.sourceRank] = [];
        let registryResult = linkRegistration[link.sourceRank];

        for (const otherLink of registryResult) {
            if (otherLink.target === link.target) return false //source, target, sourceRank are the same, so essentially the same link already present.  
        }

        registryResult.push(link)
        if(!phaseRegistry.has(link.source.phase)) phaseRegistry.set(link.source.phase,{sourceType:link.source.constructor,linkList:[link]})
        else phaseRegistry.get(link.source.phase).linkList.push(link);
        return true;
    }
}

