
var Game = (function () {
    let id = 0;
    function Game(parent) {

        let links = new Set();
        let validity = new ValidityTracker(false);
        let ancestralLinksRegistrar = new AncestorRegistry(this);
        let customGameStages = null;
        let myId = ++id;
        let thisGame = this;
        defineGetter({ obj: this, name: "outgoingLinks", func: () => Array.from(links.keys()).filter((cv) => cv.source === this) });
        defineGetter({ obj: this, name: "incomingLinks", func: () => Array.from(links.keys()).filter((cv) => cv.target === this) });
        defineGetter({ obj: this, name: "ancestralLinks", func: () => ancestralLinksRegistrar.ancestralLinks });
        defineGetter({ obj: this, name: "ancestralSources", func: () => new Set(ancestralLinksRegistrar.registry.keys()) });
        defineGetter({ obj: this, name: "block", func: () => parent });
        defineGetter({ obj: this, name: "phase", func: () => parent.parent });
        defineGetter({ obj: this, name: "gameOrder", func: () => parent.allGamesArray.indexOf(this)+1 });
        defineGetter({ obj: this, name: "id", func: () => myId });
        defineGetter({ obj: this, name: "name", func: () => `Game ${myId}` });
        defineGetter({ obj: this, name: "validity", func: () => validity.copy()});
        defineGetter({obj: this, name: "gameStages", func: () => (customGameStages) ? customGameStages :
                                                                                      this.phase.currentSettings.get(e.GAME_STAGES)
        });
        defineGetter({ obj: this, name: "length", func: () => parseInt(this.gameStages.at(-1).endAtMiliSecond)});

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
            if(link.target===this) this.addAncestralLink(link);
            return true
        }
        this.addAncestralLink = function addAncestralLink(link,propagation=true){
            Verification.queue(this);
            if( ancestralLinksRegistrar.add(link) && propagation){
                this.outgoingLinks.forEach(iLink =>iLink.target.addAncestralLink(link))
                this.block.addAncestralLink(link);
                this.phase.addAncestralLink(link);
               };
        }
        this.testForCollision= function testForCollision(game){
            return ancestralLinksRegistrar.test(game);
        }
        this.testLinkForCollision= function testLinkForCollision(link){
            return ancestralLinksRegistrar.testLink(link);
        }
        this.removeLink = function removeLink(link) {
            if (!(link instanceof Link)) Break("Only Links can be so removed. ",{link});
            if (!link.forDeletion)  return link.deleteLink();
            Verification.queue(this);
            links.delete(link);
            if(link.target===this) {
                this.remakeAncestralRegister(link);
            }
        }
        let countParentsThatWillCascade=false;
        this.remakeAncestralRegister = function remakeAncestralRegister(originatingLink){
            Verification.queue(this)
            if(countParentsThatWillCascade===false){
                countParentsThatWillCascade = 0;
                this.incomingLinks.forEach(inLink => {
                    if(inLink.source.ancestralLinks.has(originatingLink)) countParentsThatWillCascade++
                })
            } else {
                countParentsThatWillCascade--
            }
            if(countParentsThatWillCascade<=0){
                countParentsThatWillCascade=false;
                ancestralLinksRegistrar.wipe();
                this.incomingLinks.forEach(iLink=>this.addAncestralLink(iLink,false));
                if(ancestralLinksRegistrar.insideALoop) {
                    return false;
                }
                else {
                    PostponeMakingAncestralLinks.queue(this.block,this.phase);
                    this.outgoingLinks.forEach(iLink=>iLink.target.remakeAncestralRegister(originatingLink));
                }
                return true; 
           } 
        }
        
        this.verifyLinks = function () {
            let testValidity = new ValidityTracker(true);
            Verification.revokeAllObjections(this);
            let objections =  ancestralLinksRegistrar.objections
            if(objections.length>0){ 
                objections.forEach(objection=>{objection.lodge();testValidity.fail(objection.reason)})
            }

            if (this.incomingLinks.length !== 2) testValidity.fail(Objection.TwoTeamGame);

            this.outgoingLinks.forEach((outLink) => {
                if (outLink.sourceRank > 2){ 
                    new Objection(outLink.target,[outLink],Objection.GameOnlyTwoRanks,this)
                    testValidity.fail(Objection.GameOnlyTwoRanks);
                }
            });

            this.incomingLinks.forEach((inLink) => {
                
                if(inLink.source?.phase?.phaseType===e.ROUND_ROBIN && inLink.source instanceof Game){
                    new Objection(this,[inLink],Objection.RoundRobinGameAsSource,this)
                    testValidity.fail(Objection.RoundRobinGameAsSource)
                }
                if(inLink.source?.phase?.phaseType===e.TOURNAMENT && inLink.source instanceof Phase){
                    new Objection(this,[inLink],Objection.TournamentAsSource,this)
                    testValidity.fail(Objection.TournamentAsSource)
                }
            });

            if (validity.status !== testValidity.status || validity.message !== testValidity.message) changeValidity(testValidity);
            return testValidity
        }

        function changeValidity(newValidity) {
            validity = newValidity;
            CodeObserver.Execution({ mark: thisGame, currentFunction: changeValidity, currentObject: thisGame })
        }
    }
    
    return Game
})()