
var Competition = (function () {
    let id = 0;
    let allCompetitions = [];
    CodeObserver.register(Competition,e.CREATE);
    defineGetter({ obj: Competition, name: "allCompetitionsArray", func: () => Array.from(allCompetitions) });
    defineGetter({ obj: Competition, name: "current", func: () => allCompetitions[0]});

    function Competition({name}) {
        CodeObserver.register(this);
        let myId = ++id;
        let settings = new Map([])
        let phases = [];
        allCompetitions.push(this);
        this._terminalDistance = new Map();
        this._stageRecorder = new Map();
        this._pureStages = new Map();
        defineGetter({ obj: this, name: "name", func: () => name });
        defineGetter({ obj: this, name: "id", func: () => myId });
        defineGetter({ obj: this, name: "currentSettings", func: () => mapToObjectArray(settings, "setting", "value") });
        defineGetter({ obj: this, name: "allPhasesArray", func: () => Array.from(phases) });
        defineGetter({ obj: this, name: "allGamesArray", func: () => this.allPhasesArray.reduce((acc,cv)=>{acc.push(...cv.allGamesInPhase);return acc;},[]) });
       
        this.updateSettings = function(newSettings){
            if(newSettings.name) name = newSettings.name
            CodeObserver.Execution({mark:this,currentFunction:this.updateSettings,currentObject:this,keyword:e.EDIT})
        }
        this.newPhase = function (phaseName,phaseType) {
            let newPhase = new Phase({ name: phaseName, parent: this, phaseType });
            phases.push(newPhase)
            return newPhase;
        }

        this.removePhase = function (phase) {
            if (!(phase instanceof Phase)) throw new Error("Not a phase");
            let phaseIndex; 
            if ((phaseIndex = phases.indexOf(phase)) === -1) throw new Error("No such phase in this Competetion");
            phases.splice(phaseIndex);
            if (phase.parent !== null) phase.removeParent();
        }
        this.getChildCount=function(unit){
            return this._terminalDistance.get(unit).size-1;
        }
        this.getLargestTerminal=function (unit){
            let largest=0;
            this._terminalDistance.get(unit).forEach((terminalCount,game)=>{
                largest=Math.max(largest,terminalCount);
            })
            return largest;
        }
   
        this.refreshTerminalDistance = function(){
            console.time("Terminal Distance")
            let games = this.allGamesArray;
            this._terminalDistance = new Map();
            for(let i = games.length-1;i>=0;i--){
               if(games[i].outgoingLinks.length===0) this._propogateTerminalCount(games[i]);
            }
            console.timeEnd("Terminal Distance")
            return {terminalDistance:this._terminalDistance,stages:this._stageRecorder}
        }
        this._propogateTerminalCount = function(game){
            if(game instanceof Team) return;
            this._recordTerminalDistance(game,0,game);
            this._addToStage(game,0,game);
            let currentRecord = this._terminalDistance.get(game);
             for(const inLink of game.incomingLinks){
                currentRecord.forEach((terminalCount,terminalGame)=>{
                    this._recordTerminalDistance(inLink.source,terminalCount+1,terminalGame)
                    this._addToStage(inLink.source,terminalCount+1,terminalGame)
                })
                if(inLink.source instanceof Phase){
                    for(const phaseGame of inLink.source.allGamesInPhase){
                        currentRecord.forEach((terminalCount,terminalGame)=>{
                            this._recordTerminalDistance(phaseGame,terminalCount+1,terminalGame)
                        });
                        this._propogateTerminalCount(phaseGame);
                    }
                } else { 
                    this._propogateTerminalCount(inLink.source);
                }
             }
        }
        this._recordTerminalDistance =function(game,distance,terminalGame){
            if(!this._terminalDistance.has(game)) this._terminalDistance.set(game,new Map());
            distance = Math.max(distance,this._terminalDistance.get(game)?.get(terminalGame) ?? 0);
            this._terminalDistance.get(game).set(terminalGame,distance);
        }
        this._addToStage = function(game,distance,terminalGame){
            if(!this._stageRecorder.has(terminalGame)) this._stageRecorder.set(terminalGame,[]);
            let stageArray = this._stageRecorder.get(terminalGame)
            if(!stageArray[distance]) stageArray[distance]=new Set();
            stageArray[distance].add(game);
        }
        this._calculatePureStages = function(){
            for(const [game,draftStageArray]  of this._stageRecorder){
                let pureStageArray = [];
                this._pureStages.set(game,pureStageArray)
                for(const stage of draftStageArray){
                    let gameStage = new Set();
                    let phaseStages = [];
                    for(const unit of stage){
                        if(unit instanceof Team) continue;
                        if(unit instanceof Game) gameStage.add(game);
                        if(unit instanceof Phase){
                            for(const block of unit.allBlocksArray){
                                let blockStage= new Set();
                                for(const blockGame of block.allGamesArray){
                                    blockStage.add(blockGame);
                                }
                                phaseStages.push(blockStage);
                            }
                        }
                    }
                    if(phaseStages.length>0) {
                        gameStage = new Set([...gameStage,...phaseStages.at(-1)])
                        phaseStages.splice(-1,1);
                    }
                    pureStageArray.push(gameStage,...phaseStages);
                }
            }
        }
        CodeObserver.Creation({mark:Competition,newObject:this});
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
    return {similarLinks,registry,phaseRegistry,loopCreated};

    function innerSourceTrackBack(link) {
        let registryResult = registry.get(link.source)?.[link.sourceRank];
        let phaseRegistryResult = phaseRegistry.get(link.source.phase);
        
        for (const otherLink of registryResult ?? []) {
                similarLinks.add(otherLink);
                similarLinks.add(link);        
        }
        if(phaseRegistryResult && !(link.source instanceof phaseRegistryResult.sourceType)) {
            similarLinks.add(link);
            phaseRegistryResult.linkList.forEach(iLink => similarLinks.add(iLink));
        }
        registerLink(link);

        let nextLinks = link.source?.incomingLinks ?? [];
        for(const nextLink of nextLinks){
            if(nextLink.source === startUnitConfirmed || startingLinks.has(nextLink)){
                Alert(`You've created a loop`,{startingUnit,nextLink,nextLinks},false)
                loopCreated = true;
                //similarLinks.add(link)
                break;
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

