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
        let validity = new ValidityTracker(true);
        let ancestralLinksRegistrar = new AncestorRegistry(this);
        let seedList = new UniqueSeedList();
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
        defineGetter({ obj: this, name: "allGamesInPhase", func: () => blocks.reduce((acc, cv) => { acc.push(...cv.allGamesArray); return acc }, []) });
        defineGetter({ obj: this, name: "outgoingLinks", func: () => Array.from(links.keys()).filter((cv) => cv.source === this) });
        defineGetter({ obj: this, name: "incomingLinks", func: () => seedList.uniqueSeedArray});
        defineGetter({ obj: this, name: "allIncomingLinks", func: () => this.allBlocksArray.map((block)=>block.incomingLinks)});
        defineGetter({ obj: this, name: "ancestralLinks", func: () => ancestralLinksRegistrar.ancestralLinks});
        defineGetter({ obj: this, name: "nextSeedNumber", func: () => getIncomingLinkRegistry().seedReference.length});
        defineGetter({ obj: this, name: "validity", func: () => ({...validity}) });
        defineGetter({ obj: this, name: "phaseType", func: () => phaseType});
        defineGetter({ obj: this, name: "flesh", func: () => associatedDivFlesh });
        defineSetter({ obj: this, name: "flesh", func: (mainDiv) => associatedDivFlesh=mainDiv });

        this.deriveCorrectSeed = function(link){
            let seed = false;
            for(const protoLink of seedList.uniqueSeedArray){
                if(link.source===protoLink.source && link.sourceRank === protoLink.sourceRank){
                    seed = protoLink.seed;
                }
            }
            if(!seed){
                seed = (seedList.length===0) ? 1: seedList.length; //the first seed will be added at index 1, thus making the array length 2. The 0 index is never used by seeds
            }
            return seed
        }
        this.newBlock = function (newBlockName) {
            let newBlock = new Block({ parent: this, name: newBlockName })
            blocks.push(newBlock);
            return newBlock;
        }

        this.addLink = function addLink (link) {
            if (!(link instanceof Link)) throw new Error("Only Links can be so added.");
            if (link.target === this) Break("Links cannot target Phases directly",{link,this:this})
            links.add(link);
            Verification.queue(this);
        }
        this.addAncestralLink = function addAncestralLink(link,propagation=true){
            if(phaseType===e.TOURNAMENT) return true;

            Verification.queue(this);
            let isNewSeed = seedList.add(link)
            if(isNewSeed){
                if( ancestralLinksRegistrar.add(link) && propagation){
                    this.outgoingLinks.forEach(iLink =>iLink.target.addAncestralLink(link))
                    };
            }
            
        }
        this.removeLink = function (link) {
            if (!(link instanceof Link)) Break("Only Links can be so removed. ",{link});
            if (!link.forDeletion)  return link.deleteLink();
            Verification.queue(this);
            links.delete(link);
        }

        this.remakeAncestralRegister = function remakeAncestralRegister(){
            if(phaseType===e.TOURNAMENT) return true;

            Verification.queue(this)
            this.ancestralLinksRegistrar.wipe();
            this.seedList.wipe();
            for(const inLink of this.allIncomingLinks){
                    this.addAncestralLink(inLink,false)
            }
            if(ancestralLinksRegistrar.insideALoop) {
                return false;}
            else {
                this.outgoingLinks.forEach(iLink=>iLink.target.remakeAncestralRegister()) //only games
            }
            return true;
        }

        this.verifyLinks = function () {
            if(phaseType===e.TOURNAMENT) return true;

            let testValidity = new ValidityTracker(true);
            Verification.revokeAllObjections(this);
            let objections =  ancestralLinksRegistrar.objections
                if(objections.length>0){ 
                    testValidity.fail(Objection.SourceRankDuplication)
                    objections.forEach(objection=>objection.lodge())
                }

            let maxPossibleTeams=seedList.uniqueSeedArray.length-1; //array is 1 indexed
                
                this.outgoingLinks.forEach((outLink) => {

                if(outLink.sourceRank > maxPossibleTeams) {
                    new Objection(outLink.target,[outLink],Objection.NotEnoughTeams,this)
                    testValidity.fail(Objection.NotEnoughTeams)
                }
            });
            
            if (validity.status !== testValidity.status || validity.message !== testValidity.message) changeValidity(testValidity);
            return validity
        }

            function changeValidity(newValidity) {
                validity = newValidity;
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