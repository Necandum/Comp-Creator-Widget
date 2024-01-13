
var Game = (function () {
    let id = 0;
    CodeObserver.register(Game,e.CREATE,e.DELETE);
    function Game(parent) {
        CodeObserver.register(this,e.VERIFICATION);
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
        defineGetter({ obj: this, name: "parent", func: () => parent });
        defineGetter({ obj: this, name: "block", func: () => parent });
        defineGetter({ obj: this, name: "phase", func: () => parent.parent });
        defineGetter({ obj: this, name: "gameOrder", func: () => parent.allGamesArray.indexOf(this)+1 });
        defineGetter({ obj: this, name: "id", func: () => myId });
        defineGetter({ obj: this, name: "name", func: () => `Game ${myId}` });
        defineGetter({ obj: this, name: "validity", func: () => validity.copy()});
        defineGetter({obj: this, name: "gameStages", func: () => (customGameStages) ? customGameStages :
                                                                                      this.phase.currentSettings.get(e.GAME_STAGES.description)
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
        this.delete = function deleteGame(){
            Verification.queue(this.block);
            Verification.queue(this.phase);
            Verification.activate();
            this.delete=()=>null;
            this.remakeAncestralRegister = ()=>null;
            this.addAncestralLink = ()=>null;
            this.addLink = ()=>null;
            this.verifyLinks = ()=>null;
            myId=null;
            for(const link of [...links]){
                this.removeLink(link);
            }
            this.block.removeGame(this);
            parent=null;
            CodeObserver.Deletion({mark:Game,deletedObject:this})
            CodeObserver.deregister(this);
        }
        let countParentsThatWillCascade=false;
        this.remakeAncestralRegister = function remakeAncestralRegister(originatingLink){
            Verification.queue(this)
            if(countParentsThatWillCascade===false){
                countParentsThatWillCascade = 0; //?? shouldn't it be -1??
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
                    PostponeMakingAncestralLinks.queue(this.block,this.phase);//activation happens inside link delete function, is delayed until the command propogates. 
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
                    new Objection(outLink.target,[outLink],Objection.GameOnlyTwoRanks,thisGame).lodge();
                    testValidity.fail(Objection.GameOnlyTwoRanks);
                }
            });

            this.incomingLinks.forEach((inLink) => {
                
                if(inLink.source?.phase?.phaseType===e.ROUND_ROBIN && inLink.source instanceof Game){
                    new Objection(thisGame,[inLink],Objection.RoundRobinGameAsSource,thisGame).lodge()
                    testValidity.fail(Objection.RoundRobinGameAsSource)
                }
                if(inLink.source?.phase?.phaseType===e.TOURNAMENT && inLink.source instanceof Phase){
                    new Objection(thisGame,[inLink],Objection.TournamentAsSource,thisGame).lodge();
                    testValidity.fail(Objection.TournamentAsSource)
                }
                if(inLink.source?.block === thisGame.block){
                    new Objection(thisGame,[inLink],Objection.OneBlockOneTeam,thisGame).lodge();
                    testValidity.fail(Objection.OneBlockOneTeam);
                }
            });

            if (validity.status !== testValidity.status || validity.message !== testValidity.message) changeValidity(testValidity);
            return testValidity
        }
        function changeValidity(newValidity) {
            validity = newValidity;
            CodeObserver.Execution({ mark: thisGame, currentFunction: changeValidity, currentObject: thisGame,keyword:e.VERIFICATION })
        }
        CodeObserver.Creation({mark:Game,newObject:this});
        Verification.queue(this);
        Verification.activate();
    }
    
    return Game
})()