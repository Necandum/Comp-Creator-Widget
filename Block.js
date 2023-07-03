var Block = (function () {
    let id = 0;
    function Block({ parent, name = null }) {
        let games = [];
        let myId = ++id;
        let validity = {status:true,message:""}
        let thisBlock=this;
        let objectionableLinks=new Set();
        let associatedDivFlesh;
        
        defineGetter({ obj: this, name: "allGamesArray", func: () => Array.from(games) });
        defineGetter({ obj: this, name: "id", func: () => myId });
        defineGetter({ obj: this, name: "name", func: () => (name) ? name : `B${parent.allBlocksArray.indexOf(this) + 1}` });
        defineGetter({ obj: this, name: "parent", func: () => parent });
        defineGetter({ obj: this, name: "blockOrder", func: () => parent.allBlocksArray.indexOf(this) });
        defineGetter({ obj: this, name: "validity", func: () => ({...validity}) });
        defineGetter({ obj: this, name: "incomingLinks", func: () => {
            let allIncomingLinks =[]
            games.forEach(iGame=>allIncomingLinks.push(...iGame.incomingLinks));
            return allIncomingLinks;
        } });
        defineGetter({ obj: this, name: "flesh", func: () => associatedDivFlesh });
        defineSetter({ obj: this, name: "flesh", func: (mainDiv) => associatedDivFlesh=mainDiv });

        this.removeParent = function () {
            let tempParent = parent;
            parent = null;
            if (tempParent.allBlocksArray.indexOf(this) > -1) tempParent.removeBlock(this)
        }
        this.registerDistantObjection = function registerDistantObjection(badLink) {
            objectionableLinks.add(badLink);
            badLink.lodgeObjection(this);
        }
        this.liftDistantObjection = function liftDistantObjection(forgivenLink) {
            objectionableLinks.delete(forgivenLink);
            forgivenLink.revokeObjection(this)
        }

        this.addGame = function addGame(game) {
            if (!(game instanceof Game)) throw new Error("Not a game");
            if (game.parent !== null && game.parent !== this) throw new Error("Game already assigned to a different block");
            if (games.indexOf(game) < 0) games.push(game);
            game.addParent(this);
            CodeObserver.Execution({ mark: Game, currentFunction: this.addGame, currentObject: this });
            return game;
        }
        this.newGame = function newGame() {
            let game = new Game(this);
            games.push(game);
            CodeObserver.Execution({ mark: Game, currentFunction: this.newGame, currentObject: this });
            return game;
        }

        this.removeGame = function (game) {
            if (!(game instanceof Game)) throw new Error("Not a game");
            let gameIndex = games.indexOf(game);
            if (gameIndex < 0) throw new Error("Game not part of this block");
            games.splice(gameIndex, 1);
            if (game.parent !== null) game.removeParent();
        }

        this.verifyLinks=function verifyLinks(){
            let testValidity = { status: true, message: ""};
            let failValidity = (msg) => { testValidity.status = false; testValidity.thisLink = false; testValidity.message += `\n -${msg}`; };
            
            
            for(const iLink of this.incomingLinks){
                if(iLink.source.block === this){
                    iLink.lodgeObjection(this);
                    failValidity("Cannot target game in same block")
                }
            }

            if(testValidity.status===true){
                let sourceTrackBackResult = sourceTrackBack(this);
                let overlappingAncestorSources = sourceTrackBackResult.similarLinks;
                if (overlappingAncestorSources.size>0) {
                    
                    failValidity("Potential for same team to appear in this block")
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
            CodeObserver.Execution({ mark: thisBlock, currentFunction: changeValidity, currentObject: thisBlock })
        }
    }

    Block.prototype = {
    }
    Block.prototype.constructor = Block

    return Block
})()