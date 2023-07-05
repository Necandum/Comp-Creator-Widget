
var Game = (function () {
    let id = 0;
    function Game(parent) {

        let links = new Set();
        let validity = new ValidityTracker();
        let ancestralLinksRegistrar = new AncestorRegistry(this);
        let customGameStages = null;
        let myId = ++id;
        let thisGame = this;
        let associatedDivFlesh;
        defineGetter({ obj: this, name: "outgoingLinks", func: () => Array.from(links.keys()).filter((cv) => cv.source === this) });
        defineGetter({ obj: this, name: "incomingLinks", func: () => Array.from(links.keys()).filter((cv) => cv.target === this) });
        defineGetter({ obj: this, name: "ancestralLinks", func: () => ancestralLinksRegistrar.ancestralLinks });
        defineGetter({ obj: this, name: "block", func: () => parent });
        defineGetter({ obj: this, name: "phase", func: () => parent.parent });
        defineGetter({ obj: this, name: "gameOrder", func: () => parent.allGamesArray.indexOf(this)+1 });
        defineGetter({ obj: this, name: "id", func: () => myId });
        defineGetter({ obj: this, name: "name", func: () => `Game ${myId}` });
        defineGetter({ obj: this, name: "validity", func: () => ({ ...validity }) });
        defineGetter({
            obj: this, name: "gameStages", func: () => (customGameStages) ? customGameStages :
                this.phase.currentSettings.get(e.GAME_STAGES)
        });

        defineSetter({ obj: this, name: "flesh", func: (mainDiv) => associatedDivFlesh=mainDiv });
        defineGetter({ obj: this, name: "flesh", func: () => associatedDivFlesh });
      
        this.newIncomingLink = function ({ source, sourceRank }) {
            return new Link({ target: this, source, sourceRank });
        }
        this.newOutgoingLink = function ({ target, sourceRank }) {
            return new Link({ target, source: this, sourceRank });
        }
        this.addLink = function addLink (link) {
            if (!(link instanceof Link)) Break("Only Links can be so added. ",{link,this:this});
            if (link.source !== this && link.target !== this) Break("Link does not relate to this game",{link,this:this})
            Verification.queue(this);
            links.add(link);
            this.addAncestralLink(link);
            this.block.addAncestralLink(link);
            this.phase.addAncestralLink(link);
        }
        this.addAncestralLink = function addAncestralLink(link){
            Verification.queue(this);
            if( ancestralLinksRegistrar.add(link)){
                this.outgoingLinks.forEach(iLink =>iLink.target.addAncestralLink(link))
               };
        }
        this.removeLink = function removeLink(link) {
            if (!(link instanceof Link)) throw new Error("Only Links can be so removed. ");
            if (!link.forDeletion)  return link.deleteLink();
            links.delete(link);
            this.remakeAncestralRegister();
            Verification.queue(this);
        }

        this.remakeAncestralRegister = function remakeAncestralRegister(){
            Verification.queue(this)
            this.incomingLinks.forEach(iLink=>this.addAncestralLink(iLink));
        }
        
        this.verifyLinks = function () {
            let testValidity = { status: true, message: "", thisLink: true };
            let failValidity = (msg) => { testValidity.status = false; testValidity.thisLink = false; testValidity.message += `\n -${msg}`; };
            let resetLinkTest = () => testValidity.thisLink = true;
            let linkTest = () => testValidity.thisLink;

            if (this.incomingLinks.length !== 2) failValidity("Two and only two incoming links must exist")

            this.outgoingLinks.forEach((outLink) => {
                resetLinkTest();

                if (outLink.sourceRank > 2){ 
                    outLink.lodgeObjection(this);
                    failValidity("Only ranks 1 and 2 valid for Games");}

                    if(this.phase.phaseType===e.ROUND_ROBIN){
                        outLink.lodgeObjection(this);
                        failValidity("Games inside a round robin cannot be a source.")
                    }

                if (linkTest()) outLink.revokeObjection(this);
            });

            let incomingTeamRegister = new Set();
            this.incomingLinks.forEach((inLink) => {
                resetLinkTest()
                if(inLink.source instanceof Team){
                    (incomingTeamRegister.has(inLink.source)) ? failValidity("Team cannot play itself")
                                                                : incomingTeamRegister.add(inLink.source);
                }
                if(this.phase.phaseType===e.ROUND_ROBIN && inLink.source.phase===this.phase){
                    inLink.lodgeObjection(this);
                    failValidity("In a round robin, games cannot be dependant on outcome of other games in the same Phase.")
                }
                if (linkTest()) inLink.revokeObjection(this);
            });

            links.forEach((link) => {
                let linkObjectors = link.objectors
                if (linkObjectors.size > 0) {
                    for (objector of linkObjectors) {
                        if (objector !== this) failValidity(`${objector.name} objects to relationship between ${link.source.name} and ${link.target.name}`)
                    }
                }
            })

            
                let sourceTrackBackResults = sourceTrackBack(this)
                let overlappingAncestorSources = sourceTrackBackResults.similarLinks;
                if(sourceTrackBackResults.loopCreated) failValidity("A loop has been created")
                if (overlappingAncestorSources.size>0) {
                    failValidity("Potential for same team to play itself. The same source appears with the same rank twice in this Game's past. ")
                }
                let unionSet = new Set([...objectionableLinks,...overlappingAncestorSources]);

                for(const link of unionSet){
                    if(!objectionableLinks.has(link) && overlappingAncestorSources.has(link)){
                        this.registerDistantObjection(link);
                    } else if (objectionableLinks.has(link) && !overlappingAncestorSources.has(link)){
                        this.liftDistantObjection(link);
                    }
                }

            if (validity.status !== testValidity.status || validity.message !== testValidity.message) changeValidity(testValidity);
            return testValidity

        }

        function changeValidity(newValidity) {
            let outgoingNeedCheck = (newValidity.status === true && validity.status ===false)
            validity = newValidity;
            if(outgoingNeedCheck) {
                thisGame.checkAllDownstream();
                thisGame.checkAllUpstream();
                thisGame.phase.checkAllDownstream();
                thisGame.phase.checkAllUpstream();
            }
            CodeObserver.Execution({ mark: thisGame, currentFunction: changeValidity, currentObject: thisGame })
        }
    }
    
    return Game
})()