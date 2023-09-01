var Block = (function () {
    let id = 0;
    function Block({ parent, name = null }) {
        let games = [];
        let myId = ++id;
        let validity = new ValidityTracker(true)
        let thisBlock=this;
        let ancestralLinksRegistrar = new AncestorRegistry(this)
        let associatedDivFlesh;
        
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
            CodeObserver.Execution({ mark: Game, currentFunction: this.newGame, currentObject: this });
            return game;
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
        
            if (validity.status !== testValidity.status || validity.message !== testValidity.message) changeValidity(testValidity);
            return validity
        }

        function changeValidity(newValidity) {
            validity = newValidity;
            CodeObserver.Execution({ mark: thisBlock, currentFunction: changeValidity, currentObject: thisBlock })
        }
    }

    Block.prototype = {
    }
    Block.prototype.constructor = Block

    return Block
})()