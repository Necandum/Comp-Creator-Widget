var Phase = (function () {
    let id = 0;

    function Phase({ name, parent,phaseType }) {
        let myId = ++id;
        let settings = new Map([
            [e.PRIORITY, 1], //int
            [e.TOTAL_GAME_SECONDS, 1800], //int
            [e.GAME_STAGES, [ //array of objects. playTime makes segment count as game time. player available marks whether player can be elsewhere. e.g halftime is not part of gametime, but players are not free. 
                { label: "Game", playTime: true, playerAvailable: false, endAtSecond: 1200 },
                { label: "Change-Over", playTime: false, playerAvailable: true, endAtSecond: 1800 }
            ]],
        ])
        let blocks = [];
        let divisions = [];
        let links = new Set();
        let objectionableLinks = new Set();
        let validity = {status:false,message:''};
        let thisPhase = this;
        let associatedDivFlesh;
        phaseType = (phaseType===e.ROUND_ROBIN || phaseType===e.TOURNAMENT) ? phaseType: e.ROUND_ROBIN;

        name = (name) ? name : `Phase ${myId}`;
        defineGetter({ obj: this, name: "name", func: () => (name) });
        defineGetter({ obj: this, name: "id", func: () => myId });
        defineGetter({ obj: this, name: "phase", func: () => this });
        defineGetter({ obj: this, name: "parent", func: () => parent });
        defineGetter({
            obj: this, name: "currentSettings", func: () => {
                let newMap = new Map(Array.from(settings))
                let newGameStages = deepCopyArrayOfObjects(newMap.get(e.GAME_STAGES));
                newMap.set(e.GAME_STAGES, newGameStages)
                return newMap;
            }
        });
        defineGetter({ obj: this, name: "allBlocksArray", func: () => Array.from(blocks) });
        defineGetter({ obj: this, name: "participatingDivisions", func: () => Array.from(divisions) });
        defineGetter({ obj: this, name: "allGamesInPhase", func: () => blocks.reduce((acc, cv) => { acc.push(...cv.allGamesArray); return acc }, []) });
        defineGetter({ obj: this, name: "outgoingLinks", func: () => Array.from(links.keys()).filter((cv) => cv.source === this) });
        defineGetter({ obj: this, name: "incomingLinks", func: () => getIncomingLinkRegistry().uniqueSeedArray});
        defineGetter({ obj: this, name: "nextSeedNumber", func: () => getIncomingLinkRegistry().seedReference.length});
        defineGetter({ obj: this, name: "validity", func: () => ({...validity}) });
        defineGetter({ obj: this, name: "phaseType", func: () => phaseType});
        defineGetter({ obj: this, name: "flesh", func: () => associatedDivFlesh });
        defineSetter({ obj: this, name: "flesh", func: (mainDiv) => associatedDivFlesh=mainDiv });

        function getIncomingLinkRegistry(){
            let allIncomingLinks = [];
            thisPhase.allGamesInPhase.forEach(iGame => allIncomingLinks.push(...iGame.incomingLinks));
            let seedRegistry = new SeedRegistry(allIncomingLinks).make();
            return seedRegistry
        }

        this.removeParent = function () {
            let tempParent = parent;
            parent = null;
            if (tempParent.allPhasesArray.indexOf(this) > -1) tempParent.removePhase(this)
        }
        this.deriveCorrectSeed = function(link){
            let seed
            let seedRegistry = getIncomingLinkRegistry();
            let seedRegistryResult = seedRegistry.registry.get(link.source)?.get(link.sourceRank);
            (seedRegistryResult) ? seed = seedRegistryResult.keys()[0]
                                 : seed = seedRegistry.seedReference.length;
            return seed
        }
        this.newBlock = function (newBlockName) {
            let newBlock = new Block({ parent: this, name: newBlockName })
            blocks.push(newBlock);
            return newBlock;
        }

        this.removeBlock = function (block) {
            if (!(block instanceof Block)) throw new Error("Not a block")
            let blockIndex = blocks.indexOf(block);
            if (blockIndex === -1) throw new Error("Phase does not contain this block")
            blocks.splice(blockIndex, 1);
            if (block.parent !== null) block.removeParent();
        }

        this.addDivision = function (division) {
            if (!(division instanceof Division)) throw new Error("Not a division");
        }

        this.removeDivision = function (division) {
            if (!(division instanceof Division)) throw new Error("Not a division");
        }
        this.checkAllDownstream= function checkAllDownstream(alreadyVisited = new Set()){
            this.outgoingLinks.forEach((outLink)=>{
                if(!alreadyVisited.has(outLink.target)){
                    alreadyVisited.add(outLink.target);
                    outLink.target.verifyLinks();
                    outLink.target.checkAllDownstream(alreadyVisited)
                }
            ;});
        }

        this.addLink = function addLink (link,doVerification=true) {
            if (!(link instanceof Link)) throw new Error("Only Links can be so added. ");
            if (link.source !== this && link.target !== this) throw new Error("Link does not relate to this game")
            links.add(link);
            if (doVerification) this.verifyLinks();
        }
        this.removeLink = function (link,alsoVerify=true) {
            if (!(link instanceof Link)) throw new Error("Only Links can be so removed. ");
            if (links.delete(link)) {
                link.deleteLink(this);
            }
            if(alsoVerify){
                this.verifyLinks()
            }
        }
        this.registerDistantObjection = function registerDistantObjection(badLink) {
            objectionableLinks.add(badLink);
            badLink.lodgeObjection(this);
        }
        this.liftDistantObjection = function liftDistantObjection(forgivenLink) {
            objectionableLinks.delete(forgivenLink);
            forgivenLink.revokeObjection(this)
        }
        this.checkAllDownstream= function checkAllDownstream(alreadyVisited = new Set()){
            this.outgoingLinks.forEach((outLink)=>{
                if(!alreadyVisited.has(outLink.target)){
                    alreadyVisited.add(outLink.target);
                    outLink.target.verifyLinks();
                    outLink.target?.checkAllDownstream?.(alreadyVisited)
                }
            ;});
        }
        this.checkAllUpstream = function checkAllUpstream(alreadyVisited = new Set()){
            this.incomingLinks.forEach((inLink)=>{
                if(!alreadyVisited.has(inLink.souce)){
                    alreadyVisited.add(inLink.source);
                    inLink.source.verifyLinks();
                    inLink.source?.checkAllUpstream?.(alreadyVisited)
                }
            ;});
        }
        this.verifyLinks = function () {
            let testValidity = { status: true, message: "", thisLink: true };
            let failValidity = (msg) => { testValidity.status = false; testValidity.thisLink = false; testValidity.message += `\n -${msg}`; };
            let resetLinkTest = () => testValidity.thisLink = true;
            let linkTest = () => testValidity.thisLink;
            let seedRegistry= getIncomingLinkRegistry();
            let sourceTrackBackResult = sourceTrackBack({incomingLinks:[...seedRegistry.uniqueSeedArray]});
            let outgoingLinkRegister = new Map();
            let maxPossibleTeams=0;
                sourceTrackBackResult.registry.forEach((value,unit)=>{if(unit instanceof Team) maxPossibleTeams++})
                maxPossibleTeams = Math.min(maxPossibleTeams,seedRegistry.uniqueSeedArray.length)
           
                this.outgoingLinks.forEach((outLink) => {
                resetLinkTest();
                if (!outgoingLinkRegister.has(outLink.target.phase)) outgoingLinkRegister.set(outLink.target.phase, {});
                if (outgoingLinkRegister.get(outLink.target.phase)[outLink.sourceRank]) {
                    outLink.lodgeObjection(this);
                    outgoingLinkRegister.get(outLink.target.phase)[outLink.sourceRank].lodgeObjection(this);
                    failValidity("Each Phase can only have one target per rank per Phase");
                }
                outgoingLinkRegister.get(outLink.target.phase)[outLink.sourceRank] = outLink;

                if (outLink.target.phase === this.phase) failValidity("Outgoing links cannot target a game within the orginating Phase");
                if(outLink.sourceRank > maxPossibleTeams) {
                    outLink.lodgeObjection(this);
                    failValidity("Outgoing link cannot refer to source rank greater than the possblie number of players.")
                }
                
                if (linkTest()) outLink.revokeObjection(this);
            });

            
            if(seedRegistry.noSeeds.length>0){
                failValidity("Incoming links that don't have seeds");
                seedRegistry.noSeeds.forEach(iLink=>iLink.lodgeObjection(this))
            }


            links.forEach((link) => {
                let linkObjectors = link.objectors
                if (linkObjectors.size > 0) {
                    for (objector of linkObjectors) {
                        if (objector !== this) failValidity(`${objector.name} objects to relationship between ${link.source.name} and ${link.target.name}`)
                    }
                }
            })

            
        if(phaseType===e.ROUND_ROBIN){
            let overlappingAncestorSources = sourceTrackBackResult.similarLinks;
                if (overlappingAncestorSources.size>0) {
                    failValidity("Potential for same team to play itself. The same source appears with the same rank twice in this Phase's past. ")
                }
                let unionSet = new Set([...objectionableLinks,...overlappingAncestorSources]);

                for(const link of unionSet){
                    if(!objectionableLinks.has(link) && overlappingAncestorSources.has(link)){
                        this.registerDistantObjection(link);
                    } else if (objectionableLinks.has(link) && !overlappingAncestorSources.has(link)){
                        this.liftDistantObjection(link);
                    }
                }
            }
            
            if (validity.status !== testValidity.status || validity.message !== testValidity.message) changeValidity(testValidity);
            return validity
        }

            function changeValidity(newValidity) {
                let outgoingNeedCheck = (newValidity.status === true && validity.status ===false)
                validity = newValidity;
                if(outgoingNeedCheck) thisPhase.checkAllDownstream();
                CodeObserver.Execution({ mark: thisPhase, currentFunction: changeValidity, currentObject: thisPhase })
            }

        this.changeDetail = function (detail, newValue) {
            switch (detail) {
                case e.NAME:
                    name = newValue;
                    break;
            }
        };

        this.changeSetting = function (setting, newValue) {
            switch (setting) {
                case e.PRIORITY:
                    if (typeof newValue !== "number") throw new Error("New value is not a number");
                    settings.set(setting, newValue)
                    break;
                case e.TOTAL_GAME_SECONDS:
                    if (typeof newValue !== "number") throw new Error("New value is not a number");
                    settings.set(setting, newValue)
                    break;
                case e.GAME_STAGES:
                    if (Array.isArray(newValue)) throw new Error("New value must be array");
                    newValue.forEach(element => {
                        if (typeof element !== "object") throw new Error("Must be an array of objects");
                        if (typeof element.label !== "string") throw new Error("Each object must contain a label which is a string");
                        if (typeof element.playTime !== "boolean") throw new Error("Each object must contain a playTime which is a boolean");
                        if (typeof element.playerAvailable !== "boolean") throw new Error("Each object must contain a playerAvailable which is a boolean");
                        if (typeof element.endAtSecond !== "number") throw new Error("Each object must contain a endAtSecond which is a number");
                    });
                    settings.set(setting, newValue);
                    break;
                case e.PHASE_TYPE:
                    if (newValue !== e.ROUND_ROBIN && newValue !== e.TOURNAMENT) throw new Error("Must be a round robin or tournament")
                    settings.set(setting, newValue);
                    break;
                default:
                    throw new Error("Not an existing setting");
            }
        }
        
    }

    Phase.prototype = {
    }
    Phase.prototype.constructor = Phase

    return Phase
})()