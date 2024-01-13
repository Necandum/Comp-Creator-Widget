var Block = (function () {
    let id = 0;
    CodeObserver.register(Block,e.CREATE,e.DELETE);
    function Block({ parent, name = null }) {
        CodeObserver.register(this,e.VERIFICATION);

        let games = [];
        let myId = ++id;
        let validity = new ValidityTracker(true)
        let thisBlock=this;
        let ancestralLinksRegistrar = new AncestorRegistry(this)
        
        defineGetter({ obj: this, name: "allGamesArray", func: () => Array.from(games) });
        defineGetter({ obj: this, name: "id", func: () => myId });
        defineGetter({ obj: this, name: "name", func: () => (name) ? name : `B${parent.allBlocksArray.indexOf(this) + 1}` });
        defineGetter({ obj: this, name: "parent", func: () => parent });
        defineGetter({ obj: this, name: "phase", func: () => parent });
        defineGetter({ obj: this, name: "blockOrder", func: () => parent.allBlocksArray.indexOf(this)+1 });
        defineGetter({ obj: this, name: "validity", func: () => validity.copy()});
        defineGetter({ obj: this, name: "incomingLinks", func: () => {
            let allIncomingLinks =[]
            games.forEach(iGame=>allIncomingLinks.push(...iGame.incomingLinks));
            return allIncomingLinks;
        } });
        
        this.newGame = function newGame() {
            let game = new Game(this);
            games.push(game);
            return game;
        }
        this.removeGame = function removeGame(game){
            let gameIndex = games.indexOf(game);
            games.splice(gameIndex,1);
            game.delete();
        }
        this.delete = function deleteBlock(){
            for(const game of [...games]){
                game.delete();
            }
            this.delete=()=>null;
            this.remakeAncestralRegister = ()=>null;
            this.addAncestralLink = ()=>null;
            this.verifyLinks = ()=>null;
            this.phase.removeBlock(this);
            parent=null;
            CodeObserver.Deletion({mark:Block,deletedObject:this});
            CodeObserver.deregister(this);
        }
        this.addAncestralLink = function addAncestralLink(link){
            Verification.queue(this);
            ancestralLinksRegistrar.add(link);
        }
        this.remakeAncestralRegister = function remakeAncestralRegister(originatingLink){
            Verification.queue(this)
            ancestralLinksRegistrar.wipe();
            this.incomingLinks.forEach(iLink=>this.addAncestralLink(iLink));
            return true; 
        }
        this.hasIncomingLink= function hasIncomingLink(link){
           return ancestralLinksRegistrar.testLink(link);
        }
        this.verifyLinks=function verifyLinks(){
            let testValidity = new ValidityTracker(true);
            Verification.revokeAllObjections(this);
            let objections =  ancestralLinksRegistrar.objections
            if(objections.length>0){ 
                testValidity.fail(Objection.SourceRankDuplication)
                objections.forEach(objection=>objection.lodge())
            }

            this.incomingLinks.forEach(iLink=>{
                if(iLink.source?.block===thisBlock){
                    new Objection(iLink.target,[iLink],Objection.SourceSameBlock,thisBlock).lodge();
                    testValidity.fail(Objection.SourceSameBlock);
                }
            })
        
            if (validity.status !== testValidity.status || validity.message !== testValidity.message) changeValidity(testValidity);
            return validity
        }

        function changeValidity(newValidity) {
            validity = newValidity;
            CodeObserver.Execution({ mark: thisBlock, currentFunction: changeValidity, currentObject: thisBlock,keyword:e.VERIFICATION })
        }
        CodeObserver.Creation({mark:Block,newObject:this})
    }

    Block.prototype = {
    }
    Block.prototype.constructor = Block

    return Block
})()