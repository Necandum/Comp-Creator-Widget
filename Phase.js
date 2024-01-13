var Phase = (function () {
    let id = 0;
    CodeObserver.register(Phase,e.CREATE,e.DELETE);
    function Phase({ name, parent,phaseType }) {
        CodeObserver.register(this,e.VERIFICATION);
        let myId = ++id;
        let settings = new Map([
            [e.PRIORITY.description, 1], //int
            [e.GAME_STAGES.description, [ //array of objects. playTime makes segment count as game time. player available marks whether player can be elsewhere. e.g halftime is not part of gametime, but players are not free. 
                { label: "Game", playTime: true, playerAvailable: false, endAtMiliSecond: 20*60*1000 },
                { label: "Change-Over", playTime: false, playerAvailable: true, endAtMiliSecond: 30*60*1000 }
            ]],
            [e.SUPPORT_TEAMS.description,new Set()],
            [e.SUPPORT_SELECTION.description,e.PREDETERMINED] //e.PREDETERMINED or e.TOURNAMENT
        ])
        let blocks = [];
        let links = new Set();
        let validity = new ValidityTracker(true);
        let ancestralLinksRegistrar = new AncestorRegistry(this,{selectedRegistrar:UniqueSourceRankRegistry});
        let thisPhase = this;
        phaseType = (phaseType===e.ROUND_ROBIN || phaseType===e.TOURNAMENT) ? phaseType: e.ROUND_ROBIN;
        name = (name) ? name : `Phase ${myId}`;

        defineGetter({ obj: this, name: "name", func: () => (name) });
        defineGetter({ obj: this, name: "id", func: () => myId });
        defineGetter({ obj: this, name: "phase", func: () => this });
        defineGetter({ obj: this, name: "parent", func: () => parent });
        defineGetter({
            obj: this, name: "currentSettings", func: () => {
                let newMap = new Map(settings)
                let newGameStages = deepCopyArrayOfObjects(newMap.get(e.GAME_STAGES.description));
                newMap.set(e.GAME_STAGES.description, newGameStages)
                newMap.set(e.SUPPORT_TEAMS.description,new Set(newMap.get(e.SUPPORT_TEAMS.description)))
                return newMap;
            }
        });
        defineGetter({ obj: this, name: "allBlocksArray", func: () => Array.from(blocks) });
        defineGetter({ obj: this, name: "allGamesInPhase", func: () => blocks.reduce((acc, cv) => { acc.push(...cv.allGamesArray); return acc }, []) });
        defineGetter({ obj: this, name: "outgoingLinks", func: () => Array.from(links.keys()).filter((cv) => cv.source === this) });
        defineGetter({ obj: this, name: "allIncomingLinks", func: () => this.allBlocksArray.reduce((acc,block)=>{acc.push(...block.incomingLinks);return acc;},[])});
        defineGetter({ obj: this, name: "ancestralLinks", func: () => ancestralLinksRegistrar.registryManager.uniqueArray});
        defineGetter({ obj: this, name: "maxPossibleTeams", func: () => Array.from(this.ancestralLinks).filter(x=>x.source instanceof Team).length });
        defineGetter({ obj: this, name: "validity", func: () => validity.copy()});
        defineGetter({ obj: this, name: "phaseType", func: () => phaseType});

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
        this.removeBlock = function removeBlock(block){
            blocks.splice(blocks.indexOf(block),1);
            block.delete();
        }
        this.delete = function deletePhase(){
            console.log("deletphase")
            for(const block of [...blocks]){
                block.delete();
            }
            for(const link of [...links]){
                link.deleteLink();
            }
            this.delete=()=>null;
            this.remakeAncestralRegister = ()=>null;
            this.addAncestralLink = ()=>null;
            this.verifyLinks = ()=>null;
            this.parent.removePhase(this);
            parent=null;
            CodeObserver.Deletion({mark:Phase,deletedObject:this});
            CodeObserver.deregister(this);
        }
        this.addAncestralLink = function addAncestralLink(link,propagation=true){
            if(phaseType===e.TOURNAMENT) return true;
            if(link.source.phase===this) return true;
            Verification.queue(this);
                if(ancestralLinksRegistrar.add(link) && propagation){
                    this.outgoingLinks.forEach(iLink =>iLink.target.addAncestralLink(iLink)) //makes it re-add all the ancestral links of this phase, which is the unique list. 
                    };
        }
        this.removeLink = function (link) {
            if (!(link instanceof Link)) Break("Only Links can be so removed. ",{link});
            if (!link.forDeletion)  return link.deleteLink();
            Verification.queue(this);
            links.delete(link);
        }
        this.testLinkForCollision= function testLinkForCollision(link){
            return ancestralLinksRegistrar.testLink(link);
        }
        this.remakeAncestralRegister = function remakeAncestralRegister(originatingLink){
            if(phaseType===e.TOURNAMENT) return true;
            Verification.queue(this)
                ancestralLinksRegistrar.wipe();
                for(const inLink of this.allIncomingLinks){
                        this.addAncestralLink(inLink,false)
                }
                if(ancestralLinksRegistrar.insideALoop) {
                    return false;}
                else {
                    this.outgoingLinks.forEach(iLink=>iLink.target.remakeAncestralRegister(originatingLink)) //only games
                }
                return true;
        }

        this.verifyLinks = function () {
            if(phaseType===e.TOURNAMENT) return true;

            let testValidity = new ValidityTracker(true);
            Verification.revokeAllObjections(this);
            let objections =  [...ancestralLinksRegistrar.objections]
                if(objections.length>0){ 
                    objections.forEach(objection=>{objection.lodge();testValidity.fail(objection.reason)})
                }

            let maxPossibleTeams=this.maxPossibleTeams;
                this.outgoingLinks.forEach((outLink) => {
                if(outLink.sourceRank > maxPossibleTeams) {
                    new Objection(outLink.target,[outLink],Objection.NotEnoughTeams,this).lodge();
                    testValidity.fail(Objection.NotEnoughTeams)
                }
            });
            
            if (validity.status !== testValidity.status || validity.message !== testValidity.message) changeValidity(testValidity);
            return validity
        }

            function changeValidity(newValidity) {
                validity = newValidity;
                // CodeObserver.Execution({ mark: thisPhase, currentFunction: changeValidity, currentObject: thisPhase })
            }


        this.updateSettings = function (newSettings) {
                if(newSettings["name"]!==undefined){
                    let newValue = newSettings["name"]
                    name=newValue;
                }
                if(newSettings[e.PRIORITY.description]!==undefined){
                    let newValue = newSettings[e.PRIORITY.description];
                    if (typeof newValue !== "number") throw new Error("New value is not a number");
                    settings.set(e.PRIORITY.description, newValue)
                }
                if(newSettings[e.GAME_STAGES.description]!==undefined){
                    let newValue=newSettings[e.GAME_STAGES.description];
                    if (!Array.isArray(newValue)) Break("New value must be an array",{newValue,newSettings})
                    newValue.forEach(element => {
                        if (typeof element !== "object") throw new Error("Must be an array of objects");
                        if (typeof element.label !== "string") throw new Error("Each object must contain a label which is a string");
                        if (typeof element.playTime !== "boolean") throw new Error("Each object must contain a playTime which is a boolean");
                        if (typeof element.playerAvailable !== "boolean") throw new Error("Each object must contain a playerAvailable which is a boolean");
                        if (typeof element.endAtMiliSecond !== "number") throw new Error("Each object must contain a endAtMiliSecond which is a number");
                    });
                    settings.set(e.GAME_STAGES.description, newValue);
                    }
                if(newSettings[e.SUPPORT_TEAMS.description]!==undefined){
                    let newValue = newSettings[e.SUPPORT_TEAMS.description];
                    if(!(newValue instanceof Set)) Break("Support Teams must be a set",{newSettings});
                    settings.set(e.SUPPORT_TEAMS.description,newValue);
                }
                if(newSettings[e.SUPPORT_SELECTION.description]!==undefined){
                    let newValue=newSettings[e.SUPPORT_SELECTION.description];
                    if(newValue!==e.PREDETERMINED && newValue!==e.TOURNAMENT) Break("Must either be e.PREDETERMINED or e.TOURNAMENT",{newValue});
                    settings.set(e.SUPPORT_SELECTION.description,newValue);
                    }
                    CodeObserver.Execution({mark:this,currentFunction:this.updateSettings,currentObject:this,keyword:e.EDIT})
        }
        this.getSupportTeams = function(){
            let mixedSet = settings.get(e.SUPPORT_TEAMS.description);
            let finalSet = new Set();
            for(const teamOrDiv of mixedSet){
                    if(teamOrDiv instanceof Team){
                        finalSet.add(teamOrDiv)
                    }
                    if(teamOrDiv instanceof Division){
                        teamOrDiv.allTeams.forEach(team=>finalSet.add(team));
                    }
                }
                return finalSet;
        }
        CodeObserver.Creation({mark:Phase,newObject:this})
    }

    Phase.prototype = {
    }
    Phase.prototype.constructor = Phase

    return Phase
})()